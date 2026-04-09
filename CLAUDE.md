@AGENTS.md
## Supabase TypeScript Rules

- Every table in `lib/types/database.ts` must have `Relationships: []` and `Update` must never be `never` (use `Record<string, never>` for append-only tables).
- Never use join selects like `.select('*, related_table(col)')` with manual types — they return `never`. Always fetch related records in a separate query.
- Status/enum columns used in `.eq()` filters need `as const` arrays and a type guard before passing to Supabase.

## Data & Formatting

- All monetary values are stored as integer cents (bigint). Never store floats. Use `parseBRLtoCents` / `formatBRL` / `centsToInputValue` from `lib/projects/format.ts`.
- CPF, CNPJ, phone, and CEP are stored as digits-only strings. Formatting is UI-only.
- All dates are stored as ISO strings (UTC). Display with `formatDateBR` (DD/MM/YYYY). Timezone: America/Sao_Paulo.

## Architecture Patterns

- Server Components for all data fetching. Client Components only for interactivity (`'use client'`).
- All user-initiated mutations go through Server Actions in `app/actions/`. Always call `logAudit()` after significant state changes.
- Filterable lists use URL search params (bookmarkable, server-side). Never store filter state in React state for list pages.
- `params` and `searchParams` in Next.js 16 App Router are Promises — always await them.

## UI / Language

- All UI text in Portuguese (pt-BR). All code (variables, functions, comments) in English.
- Logo/brand name is always "GFA Projetos" — never "GF Projetos" or "GF Arquitetura".
- Role-based visibility: check `hasPermission(profile.role, 'permission:action')` before rendering management UI.

## Workflow

- Before creating a new file, check if an existing one can be extended.
- After any mutation Server Action, always call `logAudit()` — no exceptions.
- Run `npx tsc --noEmit` mentally before suggesting code; fix type errors before presenting.

## What NOT to do

- Never use `.select('*, related_table(col)')` with manual DB types — always separate queries.
- Never store monetary values as floats — always integer cents via `parseBRLtoCents`.
- Never put filter state in React state for list pages — use URL search params.
- Never use `useEffect` for data that can be fetched server-side.
- Never use event handlers (`onChange`, `onClick`, etc.) or `window`/`document` in Server Components — extract to a `'use client'` component. For URL-driven filters, use `useRouter` + `useSearchParams`.