# Inertia Page Components — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Page Components
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Inertia Laravel adapter installed (`inertia-laravel`)
- [ ] Client-side adapter installed (`@inertiajs/react`, `@inertiajs/vue3`, or `@inertiajs/svelte`)
- [ ] `createInertiaApp` configured with page resolution
- [ ] Blade layout exists with `@inertia` directive or `<div id="app">`

## Implementation Checklist
- [ ] Every `Inertia::render()` call has a corresponding page component file
- [ ] Page component files are organized under `resources/js/Pages/` matching route structure
- [ ] TypeScript interfaces exist for all page props
- [ ] Persistent layouts use the `.layout` property pattern (React) or `<Layout>` wrapper
- [ ] `Head` component is used for page title and meta tags
- [ ] Error pages are created for 403, 404, and 500 status codes
- [ ] Page components are kept focused on layout and data display
- [ ] Reusable UI is extracted into separate components
- [ ] Loading state uses `usePage().processing` for navigation progress

## Verification Checklist
- [ ] Initial page load returns full HTML with embedded JSON
- [ ] Subsequent navigations return JSON only (no full page reload)
- [ ] Page component path matches `Inertia::render()` path exactly
- [ ] Layout persists across navigations (not re-mounted)
- [ ] Props are treated as read-only on the client
- [ ] `import.meta.glob` is used for code-splitting page components

## Security Checklist
- [ ] Sensitive data (passwords, tokens, internal IDs) never passed as props
- [ ] Server validation remains the source of truth
- [ ] Authorization checks in controllers still apply
- [ ] `X-Inertia` header protocol is not relied on for security
- [ ] Error pages don't leak stack traces or sensitive info

## Performance Checklist
- [ ] Initial bundle size is optimized (code-splitting via `import.meta.glob`)
- [ ] Page components are lazy-loaded for routes not needed on first paint
- [ ] JS framework bundle size is considered (React ~120KB, Vue ~80KB, Svelte ~30KB)
- [ ] No large inline component files (>200 lines split into sub-components)

## Production Readiness Checklist
- [ ] Error pages render correctly for 403, 404, 500 status codes
- [ ] Navigation shows loading indication (no jarring blank screen)
- [ ] Browser-only code is guarded with `typeof` checks or `useEffect`
- [ ] SSR hydration mismatches are resolved
- [ ] All `Inertia::render()` paths have corresponding component files

## Common Mistakes to Avoid
- [ ] Copying server props to local state — creates synchronization drift
- [ ] Using client-side routers (React Router, Vue Router) — breaks Inertia's model
- [ ] Fat page components (500+ lines) — extract into sub-components and hooks
- [ ] Missing layout persistence — layout state resets on every navigation
- [ ] No loading indication — transitions feel sluggish
- [ ] Missing component file for `Inertia::render()` path
- [ ] Mutating props directly — breaks immutable data flow
