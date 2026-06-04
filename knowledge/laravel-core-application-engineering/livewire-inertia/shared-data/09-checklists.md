# Inertia Shared Data — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Shared Data
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] `HandleInertiaRequests` middleware is registered in web middleware group
- [ ] `Inertia::share()` is available via Inertia facade
- [ ] Client-side `usePage().props` is accessible in components

## Implementation Checklist
- [ ] Shared data is limited to auth, flash, and app config (or equivalent minimal set)
- [ ] All shared data uses closures (not direct values) for request-dependent data
- [ ] Auth user data uses `->only()` to limit exposed fields
- [ ] A dedicated `SharedDataTest` exists and passes
- [ ] TypeScript module augmentation exists for shared data types
- [ ] `HandleInertiaRequests` middleware is used for shared data (centralized)
- [ ] Shared data is kept minimal — only data needed on EVERY page
- [ ] Expensive operations are NOT in shared data closures (move to lazy page props)

## Verification Checklist
- [ ] Shared data merges with page-specific props (page-specific wins)
- [ ] `Inertia::share()` can be called multiple times — subsequent calls merge
- [ ] Direct values passed to `Inertia::share()` are evaluated at call time (not lazily)
- [ ] Closures receive the request as a parameter: `fn(Request $request) => [...]`
- [ ] Shared data runs on EVERY Inertia request, including partial reloads
- [ ] Auth user data is not shared if `Auth::user()` is `null` at boot (use closure)

## Security Checklist
- [ ] Shared data is visible in EVERY page response — no sensitive data included
- [ ] `Auth::user()` is serialized with `->only()` — never passed directly
- [ ] `password`, `remember_token`, internal IDs are excluded from shared auth
- [ ] Authorization checks inside closures limit data exposure
- [ ] Shared data closures don't throw exceptions (would crash entire page)

## Performance Checklist
- [ ] Shared data is minimal — only what UI needs on every page
- [ ] No DB queries or API calls in shared data closures
- [ ] Typical shared data adds <1KB and <0.5ms to response
- [ ] Expensive-but-global data uses lazy page props instead
- [ ] No 50+ shared keys ("someone might need it")

## Production Readiness Checklist
- [ ] TypeScript module augmentation is maintained and accurate
- [ ] Flash messages are properly scoped and cleared after display
- [ ] Feature-specific data is passed per-page, not via shared data
- [ ] No mutations to shared data at runtime mid-request
- [ ] A single `SharedDataTest` validates all global props

## Common Mistakes to Avoid
- [ ] Direct value at boot — `Auth::user()` is null at boot in service providers
- [ ] Sharing full user model — exposes `password`, `remember_token`
- [ ] Over-sharing — adding every global value to shared data
- [ ] Mutating shared data in controllers — unpredictable behavior
- [ ] Expensive shared closures — DB queries in shared data on every request
- [ ] Nested closures in shared data — not resolved by prop pipeline
- [ ] No TypeScript types for shared data — `any` defeats the purpose
