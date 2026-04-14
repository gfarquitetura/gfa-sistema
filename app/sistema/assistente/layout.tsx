/**
 * Nested layout for the full-screen chat route.
 * Overrides the default overflow-auto from SistemaLayout so the
 * messages panel handles its own scrolling (sticky input at bottom).
 */
export default function AssistanteRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      {children}
    </div>
  )
}
