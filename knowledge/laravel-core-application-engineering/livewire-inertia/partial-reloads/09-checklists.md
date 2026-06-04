# Inertia Partial Reloads — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Partial Reloads
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Inertia v3+ installed (supports `only` key on `router.reload()`)
- [ ] Server-side controllers use closure props for conditional evaluation
- [ ] Client-side component architecture supports in-place re-rendering

## Implementation Checklist
- [ ] `preserveScroll: true` is set on all in-page partial reloads
- [ ] `preserveState: true` is set when component state should be preserved
- [ ] Server-side prop closures use `$request->inertiaPartial()` to gate expensive computations
- [ ] Error handling (`onError`) is implemented for all partial reload calls
- [ ] Polling intervals are debounced to appropriate durations (minimum 3-5s)
- [ ] `router.reload()` specifies `only` key to avoid re-fetching all props
- [ ] Combined lazy props with partial reload guards for optimal performance

## Verification Checklist
- [ ] `X-Inertia-Partial-Data` header contains correct comma-separated prop names
- [ ] `X-Inertia-Partial-Component` header matches the current component
- [ ] Only requested props are returned in the response
- [ ] Existing props remain unchanged after partial reload
- [ ] Shared data is NOT re-included unless explicitly requested
- [ ] Partial reloads work across Inertia adapters (React, Vue, Svelte)

## Security Checklist
- [ ] Same middleware and authorization apply to partial reloads as full requests
- [ ] `X-Inertia-Partial-Component` header is validated but not trusted for authorization
- [ ] Sensitive data excluded from initial response is also excluded from partial reloads
- [ ] No bypass of security checks via partial reload

## Performance Checklist
- [ ] Server-side conditional computation avoids wasted work for non-requested props
- [ ] Partial reloads are not used as data fetching on mount (defeats server-driven props)
- [ ] Polling intervals are optimized to prevent request storms
- [ ] Debounce is applied for rapid partial reloads (scroll-based, polling)
- [ ] `only` key is always specified to limit response payload

## Production Readiness Checklist
- [ ] Failed partial reloads have fallback (stale data with user feedback)
- [ ] Partial reload does not trigger when user has navigated away
- [ ] `onSuccess` side effects are gated by checking current component
- [ ] Loading indication shown during partial reload for UX
- [ ] Partial reloads don't reset form inputs or modals (preserveState)

## Common Mistakes to Avoid
- [ ] Omitting `preserveScroll: true` — page scrolls to top on every reload
- [ ] No lazy passthrough in server — expensive prop computed on every page load
- [ ] Partial reload on wrong page — response discarded but `onSuccess` may fire
- [ ] Forgetting `preserveState: true` — form inputs reset on reload
- [ ] Over-polling without debounce — server overload
- [ ] Reloading everything when only one prop is needed
- [ ] Using `router.reload()` for navigation (doesn't change URL)
