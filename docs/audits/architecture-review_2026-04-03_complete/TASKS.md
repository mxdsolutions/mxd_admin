# Tasks — Architecture Review 2026-04-03

## Phase 1: Critical (Security & Consistency)

- [ ] **T1** Enable Supabase RLS on all tenant-scoped tables (C1)
- [ ] **T2** Standardize API response shape to `{ items, total }` / `{ item }` (C2)
- [ ] **T3** Update SWR hooks and consumers for new response shape (C2)

## Phase 2: High (Scalability & Duplication)

- [ ] **T4** Replace `catch (err: any)` with typed error handling + structured logging (H1)
- [ ] **T5** Create PostgreSQL view/function for stats aggregation (H2)
- [ ] **T6** Add server-side filtering params to list API routes (H3)
- [ ] **T7** Extract `useKanbanPage<T>` hook or `KanbanPageTemplate` (H4)
- [ ] **T8** Extract shared side sheet logic (`useUsers` hook, base component) (H5)

## Phase 3: Medium (Quality & Patterns)

- [ ] **T9** Replace modal `fetch()` calls with SWR hooks (M1)
- [ ] **T10** Remove `any` types from SWR mutate callbacks and modal props (M2)
- [ ] **T11** Add SWR hooks for line items (quote, job, opportunity) (M3)
- [ ] **T12** Split `xero-sync.ts` into contacts + invoices modules (M4)
- [ ] **T13** Add React error boundaries to DashboardShell and side sheets (M5)
- [ ] **T14** Refactor middleware into composable functions (M6)

## Phase 4: Low (Polish & Documentation)

- [ ] **T15** Replace README.md with project summary (L1)
- [ ] **T16** Create DATABASE.md with schema reference (L2)
- [ ] **T17** Add missing CLAUDE.md sections: server actions, middleware, forms, testing, env vars (L3)
- [ ] **T18** Add JSDoc to modal and sheet components (L4)
- [ ] **T19** Define route constants file (L5)
- [ ] **T20** Lazy-load heavy dependencies with `next/dynamic` (L7)
