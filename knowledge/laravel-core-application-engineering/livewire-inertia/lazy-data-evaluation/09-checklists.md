# Inertia Lazy Data Evaluation — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Lazy Data Evaluation
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Inertia v3+ is installed (`LazyValue` support)
- [ ] Component architecture supports loading states (skeleton/spinner)
- [ ] Profiling tools available (Laravel Debugbar) to identify expensive computations
- [ ] Partial reload mechanism is set up on the client

## Implementation Checklist
- [ ] Expensive props (>100ms) use `Inertia::lazy(fn())` wrapper
- [ ] `Inertia::lazy()` is used instead of raw closures for team readability
- [ ] Client-side component handles `undefined`/`null` for lazy props gracefully
- [ ] Loading state (skeleton/spinner) is shown while lazy prop is loading
- [ ] `router.reload({only: ['propName']})` is triggered after mount or user interaction
- [ ] Lazy props are not nested — max one level of deferral
- [ ] `preserveScroll: true` and `preserveState: true` are set on partial reloads
- [ ] Lazy props are documented clearly in the controller

## Verification Checklist
- [ ] Lazy props are excluded from initial JSON payload (not even as `null`)
- [ ] Lazy props are resolved only on partial reload with `X-Inertia-Partial-Data` header
- [ ] SSR output does NOT contain lazy prop data
- [ ] Component renders correctly without the lazy prop during initial load
- [ ] Partial reload triggers the lazy computation server-side
- [ ] Multiple lazy props use batched partial reloads (not separate requests)

## Security Checklist
- [ ] Lazy prop closures have access to full request context — authorization is enforced
- [ ] Server controls what closures exist — client only chooses WHEN to request
- [ ] Failed lazy computations return 500 — handled with `onError` callback
- [ ] No sensitive data leaked through lazy prop placeholders

## Performance Checklist
- [ ] Lazy props are used only for computations >100ms or non-critical data
- [ ] Above-the-fold content is NOT deferred as lazy props
- [ ] Related lazy props are batched into a single partial reload
- [ ] Server-side caching (`Cache::remember`) is used for idempotent expensive operations
- [ ] No over-lazification — network round trip cost justified by saved computation time
- [ ] Lazy props are not used for SEO-critical data

## Production Readiness Checklist
- [ ] Loading states are tested on slow network
- [ ] Client prefetches lazy props after initial render (not on mount for critical data)
- [ ] Stale lazy values are re-fetched after data mutations
- [ ] Error states are handled when lazy computation fails
- [ ] Performance improvement is measured (before/after with Debugbar)

## Common Mistakes to Avoid
- [ ] Lazy prop always requested immediately — adds round trip with no benefit
- [ ] No loading state for lazy prop — runtime error accessing undefined/null
- [ ] Nesting lazy props — inner lazy never resolves
- [ ] Expecting lazy data in SSR output
- [ ] Stale lazy values not re-fetched after mutations
- [ ] Making every prop lazy — cumulative latency exceeds saved computation time
- [ ] Lazy props for trivial data (<5ms computation)
