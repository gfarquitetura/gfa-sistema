/**
 * Thin client for the Aireponado API.
 * All AI work (embedding, RAG, GPT) is delegated to this service.
 */

const BASE_URL = process.env.AIREPONADO_API_URL!
const API_KEY  = process.env.AIREPONADO_API_KEY!

function headers(extra?: Record<string, string>) {
  return {
    Authorization:  `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────

export type ChatRequest = {
  message:          string
  conversation_id?: string   // aireponado conversation UUID (null on first message)
  user_id:          string
  user_name:        string
}

/**
 * Sends a message to aireponado and returns the raw SSE Response.
 * The caller is responsible for reading the stream.
 */
export function chatStream(body: ChatRequest): Promise<Response> {
  return fetch(`${BASE_URL}/api/chat`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(body),
  })
}

// ── Documents ─────────────────────────────────────────────────────────────

export type DocumentSource = {
  source:      string
  chunk_count: number
  indexed_at:  string
}

export async function listDocuments(): Promise<DocumentSource[]> {
  const res = await fetch(`${BASE_URL}/api/documents`, { headers: headers() })
  if (!res.ok) throw new Error(`aireponado listDocuments: ${res.status}`)
  return res.json()
}

export async function getUploadUrl(
  filename: string
): Promise<{ upload_url: string; storage_path: string }> {
  const res = await fetch(`${BASE_URL}/api/documents/upload-url`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({ filename }),
  })
  if (!res.ok) throw new Error(`aireponado getUploadUrl: ${res.status}`)
  return res.json()
}

export async function ingestDocument(
  storagePath: string,
  sourceName:  string
): Promise<{ source: string; chunk_count: number }> {
  const res = await fetch(`${BASE_URL}/api/documents`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify({ storagePath, sourceName }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `aireponado ingestDocument: ${res.status}`)
  }
  return res.json()
}

export async function deleteDocument(source: string): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/documents?source=${encodeURIComponent(source)}`,
    { method: 'DELETE', headers: headers() }
  )
  if (!res.ok && res.status !== 204) {
    throw new Error(`aireponado deleteDocument: ${res.status}`)
  }
}
