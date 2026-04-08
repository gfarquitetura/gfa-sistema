export default function ProjetosLoading() {
  return (
    <div className="p-8">
      <div className="h-7 w-28 bg-zinc-800 rounded animate-pulse mb-2" />
      <div className="h-4 w-44 bg-zinc-800 rounded animate-pulse mb-8" />
      <div className="h-10 w-full bg-zinc-800/50 rounded animate-pulse mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 w-full bg-zinc-800/30 rounded animate-pulse mb-2" />
      ))}
    </div>
  )
}
