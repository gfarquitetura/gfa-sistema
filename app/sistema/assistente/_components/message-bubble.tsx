'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ConversationMessage, MessageSource } from '@/lib/types/database'

// ── Sources list ──────────────────────────────────────────────────────

function SourcesList({ sources }: { sources: MessageSource[] }) {
  if (sources.length === 0) return null
  return (
    <div className="mt-3 pt-3 border-t border-zinc-700/50">
      <p className="text-[0.6rem] uppercase tracking-widest text-zinc-600 mb-1.5">Fontes</p>
      <div className="flex flex-col gap-1.5">
        {sources.map((s, i) => (
          <div key={i} className="flex items-start gap-1.5 text-xs">
            <span className="text-zinc-700 mt-0.5 shrink-0">·</span>
            <span>
              <span className="text-zinc-400">{s.source}</span>
              {s.section && (
                <span className="text-zinc-600"> — {s.section}</span>
              )}
              <span className="text-zinc-700 ml-1.5">
                {Math.round(s.similarity * 100)}% relevância
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Markdown renderer for assistant messages ──────────────────────────

function MarkdownContent({ content }: { content: string }) {
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
          <a
            href={href}
            className="text-red-400 underline underline-offset-2 hover:text-red-300 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
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
          return isBlock ? (
            <code className="font-mono text-zinc-300">{children}</code>
          ) : (
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

// ── Typing indicator ──────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex gap-1 items-center h-5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

// ── Public components ─────────────────────────────────────────────────

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
        <MarkdownContent content={message.content} />
        <SourcesList sources={sources} />
      </div>
    </div>
  )
}

/** Rendered while the assistant response is still streaming. */
export function StreamingBubble({
  content,
  sources,
}: {
  content: string
  sources: MessageSource[]
}) {
  return (
    <div className="flex justify-start mb-5">
      <div className="max-w-[85%] bg-zinc-800/60 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-zinc-300">
        {content ? <MarkdownContent content={content} /> : <TypingDots />}
        <SourcesList sources={sources} />
      </div>
    </div>
  )
}
