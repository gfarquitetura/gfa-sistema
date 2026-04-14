export type DocChunk = {
  content:    string
  section:    string
  pageNumber: number
}

// ── Size targets ───────────────────────────────────────────────────────────
const MAX_CHUNK_CHARS  = 2000   // upper bound before sub-splitting
const MIN_CHUNK_CHARS  = 120    // fragments smaller than this are merged with the next
const OVERLAP_CHARS    = 200    // overlap when sub-splitting oversized sections

// ── Structural split pattern ───────────────────────────────────────────────
// Matches hard boundaries in Brazilian legal/technical documents:
//   Art. 5º  |  Art. 5.  |  Artigo 5
//   § 1º  |  § 1.
//   CAPÍTULO I / II / III ...  |  SEÇÃO  |  SUBSEÇÃO
//   ABNT section headings: "4.2.1 Title" at start of line
const STRUCTURAL_SPLIT_RE = /(?=\n(?:Art\.?\s+\d|Artigo\s+\d|§\s*\d|CAPÍTULO|SEÇÃO|SUBSEÇÃO|Seção|Cap[íi]tulo|\d+\.\d+[\d.]*\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]))/m

// ── Heading detection for section metadata ─────────────────────────────────
const HEADING_RE = /^(?:(Art\.?\s+\d[\dº.]*[^\n]{0,80})|(§\s*\d[\dº.]*[^\n]{0,80})|(CAPÍTULO\s+[IVXLCDM]+[^\n]{0,60})|(SEÇÃO\s+[IVXLCDM0-9]+[^\n]{0,60})|(SUBSEÇÃO\s+[^\n]{0,60})|(\d[\d.]+\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n]{4,70}))/m

/**
 * Splits plain text into chunks that respect structural boundaries
 * found in Brazilian legal and technical documents (ABNT norms, municipal
 * laws, ANVISA RDC, etc.).
 *
 * Strategy:
 *  1. Normalise whitespace.
 *  2. Split on structural markers (Art., §, CAPÍTULO, ABNT sections).
 *  3. Merge fragments that are too small into the next segment.
 *  4. Sub-split segments that are too large using paragraph breaks + overlap.
 *  5. Attach section heading metadata to each chunk.
 */
export function chunkText(text: string): DocChunk[] {
  // 1. Normalise
  const normalised = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // 2. Structural split
  const rawSegments = normalised.split(STRUCTURAL_SPLIT_RE).filter((s) => s.trim().length > 0)

  // 3. Merge tiny fragments into the following segment
  const segments: string[] = []
  let buffer = ''
  for (const seg of rawSegments) {
    buffer += (buffer ? '\n\n' : '') + seg.trim()
    if (buffer.length >= MIN_CHUNK_CHARS) {
      segments.push(buffer)
      buffer = ''
    }
  }
  if (buffer.length > 0) {
    if (segments.length > 0) {
      segments[segments.length - 1] += '\n\n' + buffer
    } else {
      segments.push(buffer)
    }
  }

  // 4. Sub-split oversized segments and build final chunks
  const chunks: DocChunk[] = []
  let charOffset = 0   // used for rough page estimate

  for (const seg of segments) {
    if (seg.length <= MAX_CHUNK_CHARS) {
      pushChunk(seg, charOffset, chunks)
    } else {
      // Sub-split on paragraph boundaries with overlap
      let pos = 0
      while (pos < seg.length) {
        let end = pos + MAX_CHUNK_CHARS

        if (end < seg.length) {
          const breakAt = seg.lastIndexOf('\n\n', end)
          if (breakAt > pos + MAX_CHUNK_CHARS / 2) {
            end = breakAt
          } else {
            // Try single newline
            const nl = seg.lastIndexOf('\n', end)
            if (nl > pos + MAX_CHUNK_CHARS / 2) end = nl
          }
        }

        const slice = seg.slice(pos, end).trim()
        if (slice.length >= MIN_CHUNK_CHARS) {
          pushChunk(slice, charOffset + pos, chunks)
        }

        pos = end - OVERLAP_CHARS
      }
    }

    charOffset += seg.length
  }

  return chunks
}

function pushChunk(content: string, charOffset: number, out: DocChunk[]) {
  const headingMatch = content.match(HEADING_RE)
  // Pick the first non-undefined capture group
  const section = headingMatch
    ? (headingMatch.slice(1).find((g) => g !== undefined) ?? '').trim()
    : ''

  // Rough page estimate: ~3 000 chars per page
  const pageNumber = Math.floor(charOffset / 3000) + 1

  out.push({ content, section, pageNumber })
}
