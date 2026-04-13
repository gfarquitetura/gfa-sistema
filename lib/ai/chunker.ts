export type DocChunk = {
  content: string
  section: string
  pageNumber: number
}

const CHUNK_CHARS   = 1600  // ≈ 400 tokens  (1 token ≈ 4 chars)
const OVERLAP_CHARS = 200   // ≈  50 tokens overlap between chunks

/**
 * Splits plain text into overlapping chunks, trying to break on
 * paragraph boundaries. Detects section headings for metadata.
 */
export function chunkText(text: string): DocChunk[] {
  // Normalise line endings and collapse 3+ blank lines into 2
  const normalised = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const chunks: DocChunk[] = []
  let pos = 0

  while (pos < normalised.length) {
    let end = pos + CHUNK_CHARS

    // Prefer breaking on a paragraph boundary (\n\n) within the window
    if (end < normalised.length) {
      const breakAt = normalised.lastIndexOf('\n\n', end)
      if (breakAt > pos + CHUNK_CHARS / 2) end = breakAt
    }

    const slice = normalised.slice(pos, end).trim()

    if (slice.length > 80) {
      // Detect a section heading at the start of the chunk
      // Matches patterns like "4.2.1 Rampas" or "Artigo 5º — Recuos"
      const headingMatch = slice.match(
        /^(\d[\d.]*\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^\n]{4,70}|Artigo\s+\d[^\n]{4,60})/m
      )

      // Rough page estimate: assume ~3 000 chars per page
      const pageNumber = Math.floor(pos / 3000) + 1

      chunks.push({
        content:    slice,
        section:    headingMatch?.[1]?.trim() ?? '',
        pageNumber,
      })
    }

    pos = end - OVERLAP_CHARS
  }

  return chunks
}
