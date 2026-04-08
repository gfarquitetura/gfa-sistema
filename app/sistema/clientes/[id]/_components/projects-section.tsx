// Phase 3 stub — replace with a real projects query once the projects table exists.
// The interface of this component (clientId prop) will not change.

interface ProjectsSectionProps {
  clientId: string
}

export function ProjectsSection({ clientId: _ }: ProjectsSectionProps) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Projetos</h2>
      <p className="text-sm text-zinc-600">
        Nenhum projeto vinculado ainda.{' '}
        <span className="text-zinc-700 text-xs">(fase 3)</span>
      </p>
    </section>
  )
}
