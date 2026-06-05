// Chat streaming endpoint.
//
// - With GROQ_API_KEY set: streams a real answer from Groq (Llama 3.3 70B) via
//   the Vercel AI SDK. RAG/citations land in a later phase, so no sources yet.
// - Without keys: streams a keyword-matched canned answer (with citations) so
//   the chat screen is fully demoable before any provider keys exist.
//
// The body streams plain UTF-8 text. Answer metadata (model label + citations)
// is sent up-front in a base64-encoded `x-chat-meta` header, which the client
// reads before consuming the stream.
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { matchAnswer, type ChatMessage } from "@/lib/chat/demo";
import type { CitationData } from "@/components/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  messages: ChatMessage[];
  dept?: string;
}

function metaHeader(model: string, citations: CitationData[]): string {
  const json = JSON.stringify({ model, citations });
  return Buffer.from(json, "utf-8").toString("base64");
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const dept = body.dept?.trim() || "All departments";

  if (!lastUser || !lastUser.content.trim()) {
    return new Response("No question provided", { status: 400 });
  }

  const encoder = new TextEncoder();
  const groqKey = process.env.GROQ_API_KEY;

  // ---- Real provider path (Groq) ----
  if (groqKey) {
    const modelId = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
    const groq = createGroq({ apiKey: groqKey });

    const system =
      `You are NumaligarhRefineryIQ, an operations-intelligence assistant for Numaligarh Refinery Ltd. ` +
      `Answer questions about refinery units, procedures, equipment tags, and safety with precise, ` +
      `technically grounded responses. Department context: ${dept}. ` +
      `Be concise; use short paragraphs and numbered steps for procedures. ` +
      `If you are unsure or the information would require a controlled document you cannot see, say so plainly.`;

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
        "x-chat-meta": metaHeader("Llama 3.3 70B", []),
      },
    });
  }

  // ---- Canned fallback (no keys) ----
  const answer = matchAnswer(lastUser.content);
  const words = answer.text.split(" ");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let i = 0;
      // brief "thinking" pause before the first token
      await new Promise((r) => setTimeout(r, 650));
      while (i < words.length) {
        const step = Math.random() > 0.5 ? 2 : 3;
        const slice = words.slice(i, i + step).join(" ");
        const trailing = i + step < words.length ? " " : "";
        controller.enqueue(encoder.encode(slice + trailing));
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
      "x-chat-meta": metaHeader(answer.model, answer.citations),
    },
  });
}
