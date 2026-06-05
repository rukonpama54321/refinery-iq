// Chat streaming endpoint — RAG-augmented (Architecture §5.1, §7).
//
// Flow:
//  1. Resolve the authenticated user + their permitted departments.
//  2. If Elasticsearch is available: hybrid-retrieve the top-K chunks that are
//     within the user's RBAC scope.
//  3. Inject retrieved passages as context into the Groq system prompt.
//  4. Stream the answer. Citations + model are sent up-front in x-chat-meta.
//
// Degradation tiers:
//  • No ES / no GEMINI_API_KEY → BM25-only or no retrieval (still uses Groq).
//  • No GROQ_API_KEY → canned keyword-matched demo answer.
//  • No keys at all → canned answer, no citations.
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { matchAnswer, type ChatMessage } from "@/lib/chat/demo";
import type { CitationData } from "@/components/ui";
import { retrieve, isEsAvailable } from "@/lib/rag/retrieve";
import type { RetrievedChunk } from "@/lib/rag/retrieve";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  messages: ChatMessage[];
  dept?: string;
}

function metaHeader(model: string, citations: CitationData[]): string {
  return Buffer.from(JSON.stringify({ model, citations }), "utf-8").toString("base64");
}

function chunksToCitations(chunks: RetrievedChunk[]): CitationData[] {
  // Deduplicate by title+location; keep top 4.
  const seen = new Set<string>();
  const out: CitationData[] = [];
  for (const c of chunks) {
    const key = `${c.title}|${c.location}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ doc: c.title, page: c.location, restricted: c.sensitivity === "confidential" });
    }
    if (out.length >= 4) break;
  }
  return out;
}

function buildSystemPrompt(dept: string, chunks: RetrievedChunk[]): string {
  const base =
    `You are NumaligarhRefineryIQ, an operations-intelligence assistant for Numaligarh Refinery Ltd. ` +
    `Answer questions about refinery units, procedures, equipment tags, and safety with precise, ` +
    `technically grounded responses. Department context: ${dept}. ` +
    `Be concise; use short paragraphs and numbered steps for procedures. ` +
    `Always cite the document and page/section your answer draws from (e.g. "[HCU Demo Manual, p.12]"). ` +
    `If no relevant source is found in the context below, say so plainly — do not fabricate facts.`;

  if (chunks.length === 0) return base;

  const ctx = chunks
    .map((c, i) => `[${i + 1}] ${c.title} (${c.location}):\n${c.text}`)
    .join("\n\n---\n\n");

  return `${base}\n\n## Retrieved document passages\n\n${ctx}`;
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const dept = body.dept?.trim() || "All departments";

  if (!lastUser?.content.trim()) {
    return new Response("No question provided", { status: 400 });
  }

  // ---- resolve permitted departments from the session ----
  let permittedDepts: string[] | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("app_users")
        .select("role, home_dept")
        .eq("id", user.id)
        .single();
      if (profile) {
        if (profile.role === "admin" || profile.role === "manager") {
          permittedDepts = ["process_engineering","maintenance_reliability","hse","operations","lab_quality","hr"];
        } else {
          const { data: grants } = await supabase
            .from("user_department_access")
            .select("department")
            .eq("user_id", user.id);
          permittedDepts = Array.from(new Set([
            profile.home_dept,
            ...(grants ?? []).map((g: { department: string }) => g.department),
          ]));
        }
      }
    }
  } catch {
    // Supabase not configured or session invalid — continue without RBAC filter.
  }

  // Default to all depts (pre-auth dev mode or session resolving issue).
  const allowedDepts = permittedDepts ?? [
    "process_engineering","maintenance_reliability","hse","operations","lab_quality","hr",
  ];

  // ---- RAG retrieval ----
  let chunks: RetrievedChunk[] = [];
  let esUp = false;
  try {
    esUp = await isEsAvailable();
    if (esUp) {
      chunks = await retrieve(lastUser.content, {
        departments: allowedDepts,
        topK: 5,
        textOnly: !process.env.GEMINI_API_KEY,
      });
    }
  } catch (e) {
    console.warn("[rag] retrieval failed:", (e as Error).message);
  }

  const citations = chunksToCitations(chunks);
  const encoder = new TextEncoder();

  // ---- Real Groq path ----
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const modelId = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
    const groq = createGroq({ apiKey: groqKey });
    const system = buildSystemPrompt(dept, chunks);

    const result = streamText({
      model: groq(modelId),
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const delta of result.textStream) {
            controller.enqueue(encoder.encode(delta));
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`\n\n_(stream error: ${(err as Error).message})_`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "x-chat-meta": metaHeader("Llama 3.3 70B", citations),
        "x-rag-chunks": String(chunks.length),
      },
    });
  }

  // ---- Canned fallback (no Groq key) ----
  const answer = matchAnswer(lastUser.content);
  const words = answer.text.split(" ");
  const fallbackCitations = citations.length > 0 ? citations : answer.citations;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let i = 0;
      await new Promise((r) => setTimeout(r, 650));
      while (i < words.length) {
        const step = Math.random() > 0.5 ? 2 : 3;
        const slice = words.slice(i, i + step).join(" ");
        controller.enqueue(encoder.encode(slice + (i + step < words.length ? " " : "")));
        i += step;
        await new Promise((r) => setTimeout(r, 45));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "x-chat-meta": metaHeader(answer.model, fallbackCitations),
    },
  });
}
