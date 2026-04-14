'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useRef, useState } from 'react'
import type { ConversationMessage, MessageSource } from '@/lib/types/database'

// ── Citation popover ──────────────────────────────────────────────────────
// Rendered when the LLM outputs `[Source › Section]` (inline code) in the answer.

function findChunk(label: string, chunks: MessageSource[]): MessageSource | null {
  // label looks like: [DODF 043 › Art. 28]  or  [NBR 9050 › 4.2.1]
  const inner   = label.replace(/^\[|\]$/g, '')
  const parts   = inner.split('›').map((s) => s.trim())
  const section = parts[parts.length - 1]
  const source  = parts[0]

  // 1. Match by section text (most precise)
  const bySection = chunks.find(
    (c) => c.section && c.section.toLowerCase().includes(section.toLowerCase())
  )
  if (bySection) return bySection

  // 2. Match by source name fragment
  const bySource = chunks.find(
    (c) => c.source.toLowerCase().includes(source.toLowerCase())
  )
  return bySource ?? null
}

function CitationButton({
  label,
  chunks,
}: {
  label:  string
  chunks: MessageSource[]
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLSpanElement>(null)
  const chunk           = findChunk(label, chunks)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // No chunk content available — render as plain styled text
  if (!chunk?.content) {
    return (
      <strong className="font-semibold text-zinc-300 text-xs">{label}</strong>
    )
  }

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.65rem] font-medium transition-colors cursor-pointer"
        style={{
          background: open ? '#3D0A0A' : '#2a1010',
          color:      '#F87171',
          border:     '1px solid #6B1A1A',
        }}
        title="Ver trecho original"
      >
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-2.5 h-2.5 opacity-60" aria-hidden="true">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <span
          className="absolute z-50 left-0 mt-1 w-80 max-w-[90vw] rounded-xl shadow-2xl overflow-hidden"
          style={{ top: '100%', background: '#18181b', border: '1px solid #3f3f46' }}
        >
          {/* Popover header */}
          <span className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/60"
            style={{ background: '#27272a' }}>
            <span className="text-[0.6rem] uppercase tracking-widest text-zinc-500">Trecho original</span>
            <span className="text-[0.65rem] text-zinc-400 truncate ml-2 max-w-56">
              {chunk.source.replace(/^.*[\\/]/, '')}
              {chunk.section && <span className="text-zinc-600"> › {chunk.section}</span>}
            </span>
          </span>
          {/* Content */}
          <span className="block px-3 py-2.5 text-[0.7rem] text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
            {chunk.content}
          </span>
        </span>
      )}
    </span>
  )
}

// ── Sources list (bottom panel) ───────────────────────────────────────────

type GroupedSource = {
  source:     string
  similarity: number
  sections:   string[]
  chunks:     MessageSource[]
}

function groupSources(sources: MessageSource[]): GroupedSource[] {
  const map = new Map<string, GroupedSource>()
  for (const s of sources) {
    const existing = map.get(s.source)
    if (!existing) {
      map.set(s.source, {
        source:     s.source,
        similarity: s.similarity,
        sections:   s.section ? [s.section] : [],
        chunks:     [s],
      })
    } else {
      if (s.similarity > existing.similarity) existing.similarity = s.similarity
      if (s.section && !existing.sections.includes(s.section)) existing.sections.push(s.section)
      existing.chunks.push(s)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.similarity - a.similarity)
}

function SourceItem({ group }: { group: GroupedSource }) {
  const [open, setOpen]           = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const displayName               = group.source.replace(/^.*[\\/]/, '')

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setActiveIdx(null) }}
        className="flex items-start gap-1.5 w-full text-left cursor-pointer group"
      >
        <span className="text-zinc-600 mt-0.5 shrink-0"
          style={{ display: 'inline-block', transition: 'transform 150ms', transform: open ? 'rotate(90deg)' : 'none' }}>›</span>
        <span className="flex-1 min-w-0">
          <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors break-all">{displayName}</span>
          <span className="text-zinc-600 ml-1.5">{Math.round(group.similarity * 100)}% relevância</span>
          {group.sections.length > 0 && (
            <span className="block text-zinc-600 mt-0.5">{group.sections.join(' · ')}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="mt-2 ml-3 space-y-1.5">
          {group.chunks.map((chunk, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                className="flex items-center gap-1.5 text-[0.65rem] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <span className="text-zinc-700">{activeIdx === i ? '▾' : '▸'}</span>
                {chunk.section
                  ? <span className="text-zinc-400">{chunk.section}</span>
                  : <span className="text-zinc-600">Trecho {i + 1}</span>}
                <span className="text-zinc-700">— {Math.round(chunk.similarity * 100)}%</span>
              </button>

              {activeIdx === i && chunk.content && (
                <div className="mt-1.5 ml-3 px-3 py-2.5 bg-zinc-900/80 border border-zinc-700/50 rounded-lg text-[0.7rem] text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {chunk.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SourcesList({ sources }: { sources: MessageSource[] }) {
  if (sources.length === 0) return null
  const groups = groupSources(sources)
  return (
    <div className="mt-3 pt-3 border-t border-zinc-700/50">
      <p className="text-[0.6rem] uppercase tracking-widest text-zinc-600 mb-2">Fontes</p>
      <div className="flex flex-col gap-2.5">
        {groups.map((g) => <SourceItem key={g.source} group={g} />)}
      </div>
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────

function MarkdownContent({ content, chunks }: { content: string; chunks: MessageSource[] }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-100">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-400">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed text-zinc-300">{children}</li>
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-semibold text-zinc-100 mt-4 mb-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold text-zinc-100 mt-3 mb-1.5 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-zinc-200 mt-2 mb-1 first:mt-0">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-600 pl-3 italic text-zinc-400 my-2">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors"
            target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        pre: ({ children }) => (
          <pre className="bg-zinc-900 rounded-lg p-3 my-2 overflow-x-auto text-sm leading-relaxed">
            {children}
          </pre>
        ),
        code: ({ children, className }) => {
          const isBlock = Boolean(className)
          if (isBlock) {
            return <code className="font-mono text-zinc-300">{children}</code>
          }
          const text = String(children)
          // Citation pattern: `[Source › Section]` — instructed in system prompt
          if (text.startsWith('[') && text.endsWith(']') && chunks.length > 0) {
            return <CitationButton label={text} chunks={chunks} />
          }
          return (
            <code className="bg-zinc-900 rounded px-1.5 py-0.5 text-xs font-mono text-red-300">
              {children}
            </code>
          )
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-700 px-3 py-1.5 text-left font-medium text-zinc-200 bg-zinc-800/60">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-700 px-3 py-1.5 text-zinc-300">{children}</td>
        ),
        hr: () => <hr className="border-zinc-700 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex gap-1 items-center h-5">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
          style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  )
}

// ── Public components ─────────────────────────────────────────────────────

export function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser  = message.role === 'user'
  const sources = (message.sources ?? []) as MessageSource[]

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[75%] bg-zinc-700 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-5">
      <div className="max-w-[85%] bg-zinc-800/60 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-300">
        <MarkdownContent content={message.content} chunks={sources} />
        <SourcesList sources={sources} />
      </div>
    </div>
  )
}

export function StreamingBubble({ content, sources }: { content: string; sources: MessageSource[] }) {
  return (
    <div className="flex justify-start mb-5">
      <div className="max-w-[85%] bg-zinc-800/60 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-300">
        {content ? <MarkdownContent content={content} chunks={sources} /> : <TypingDots />}
        <SourcesList sources={sources} />
      </div>
    </div>
  )
}
