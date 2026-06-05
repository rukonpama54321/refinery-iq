// Structure-aware text chunking (Architecture §7).
// Target: ~600 tokens (~2400 chars) with ~100-token overlap (~400 chars).
// Splits on double-newlines first (paragraphs), then falls back to sentence
// boundaries, then hard-splits. Each chunk records its location (page / heading).

const CHUNK_SIZE = 2400;   // chars ≈ 600 tokens
const OVERLAP    = 400;    // chars ≈ 100 tokens
const MIN_CHUNK  = 80;     // chars — discard tiny trailing fragments

export interface TextChunk {
  text: string;
  location: string;  // e.g. "p.3" or "Section: Startup Procedure"
}

/** Split raw extracted PDF text into overlapping chunks with location labels. */
export function chunkText(raw: string, docTitle: string): TextChunk[] {
  // Normalise whitespace but keep paragraph breaks.
  const text = raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // Try to detect page breaks (common in pdf-parse output as "page N" lines or form-feeds).
  const pages = splitPages(text);

  const chunks: TextChunk[] = [];

  for (const { pageNum, content } of pages) {
    const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    let buf = "";
    let heading = "";

    const flush = () => {
      const t = buf.trim();
      if (t.length >= MIN_CHUNK) {
        chunks.push({ text: t, location: `p.${pageNum}${heading ? ` — ${heading}` : ""}` });
      }
      // carry overlap
      buf = t.slice(-OVERLAP);
    };

    for (const para of paragraphs) {
      // Heuristic: short all-caps or title-case lines are headings.
      if (para.length < 120 && /^[A-Z0-9 :/-]{4,}$/.test(para)) {
        heading = para.slice(0, 80);
      }

      if (buf.length + para.length + 2 > CHUNK_SIZE) {
        flush();
      }
      buf += (buf ? "\n\n" : "") + para;
    }
    if (buf.trim().length >= MIN_CHUNK) flush();
  }

  return chunks;
}

interface PageSlice { pageNum: number; content: string; }

function splitPages(text: string): PageSlice[] {
  // pdf-parse often embeds "\f" (form-feed) between pages, or "Page N" markers.
  const ffParts = text.split(/\f/);
  if (ffParts.length > 1) {
    return ffParts.map((c, i) => ({ pageNum: i + 1, content: c.trim() })).filter((p) => p.content);
  }

  // Fallback: no page markers — treat as one big page and split by chunk size.
  if (text.length <= CHUNK_SIZE * 2) {
    return [{ pageNum: 1, content: text }];
  }

  // Rough page-size split (~3000 chars / page as a heuristic).
  const PAGE = 3000;
  const pages: PageSlice[] = [];
  let start = 0;
  let pageNum = 1;
  while (start < text.length) {
    pages.push({ pageNum, content: text.slice(start, start + PAGE) });
    start += PAGE;
    pageNum++;
  }
  return pages;
}
