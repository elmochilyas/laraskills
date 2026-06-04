# Skill: Defer Expensive Data with Lazy Props

## Purpose

Use `Inertia::lazy()` and closure-based props to defer expensive computations (>200ms) from the initial page render, fetching them on demand via partial reloads.

## When To Use

- Expensive database aggregations, external API calls, or report generation
- Data below the fold or hidden behind user interaction (modals, tabs, accordions)
- Non-critical data not needed for initial page paint

## When NOT To Use

- Critical data needed for initial render (auth user, page title, navigation)
- Cheap computations where the round-trip cost exceeds computation time
- Data that will be requested on every page load anyway
- SEO-critical content (lazy props are unavailable during SSR)

## Prerequisites

- Inertia v3 installed
- Identification of expensive prop computations (measure with Laravel Debugbar)
- Partial reload mechanism available on the client

## Inputs

- List of expensive prop keys with measured computation times
- Loading state designs (skeletons, spinners)
- Trigger strategy (on mount, on interaction, below-fold visibility)

## Workflow

1. Profile the page's current prop computation time using Laravel Debugbar to identify expensive props (>200ms)
2. Wrap expensive computations in `Inertia::lazy()` closures:
   ```php
   'stats' => Inertia::lazy(fn() => $this->computeExpensiveStats()),
   ```
3. Keep above-the-fold props eager — only defer below-the-fold or non-critical data
4. On the client, add loading states for all lazy props (skeleton, spinner, placeholder)
5. Trigger lazy prop fetching after mount using `router.reload({ only: ['stats', 'chartData'] })` — batch multiple lazy props into a single call
6. Cache repeated lazy computations with `Cache::remember()` for idempotent expensive operations
7. Re-fetch lazy props after mutations that would change their data

## Validation Checklist

- [ ] Lazy props used only for computations exceeding 200ms or not needed for initial paint
- [ ] All components rendering lazy props have loading state handling (skeleton/spinner)
- [ ] Lazy props fetched via `router.reload()` after component mount or user interaction
- [ ] Multiple lazy props batched into a single `router.reload()` call
- [ ] Lazy props not used for SSR-critical or SEO-critical data
- [ ] No deeply nested lazy props (max one level of deferral)
- [ ] Repeated lazy computations cached with `Cache::remember()`
- [ ] Above-the-fold data is eager (never deferred)

## Common Failures

- Lazy prop always requested on mount — added round trip with no benefit
- No loading state for lazy prop — runtime error accessing undefined/null
- Nesting lazy props (`Inertia::lazy(fn() => ['x' => Inertia::lazy(...)])`) — inner lazy never resolved
- Stale lazy value — lazy prop fetched once, never updated after mutations
- Over-lazification — making every prop lazy, multiplying round trips

## Decision Points

- Use `Inertia::lazy()` for team readability (intent is explicit) vs plain closures (more concise)
- Batch all lazy props fetched at the same trigger point into one `router.reload()` call
- If a lazy computation is idempotent and can be stale for a defined period, add caching

## Performance Considerations

Lazy props trade initial computation cost for an additional HTTP round trip (50-200ms). They provide most benefit when computation >200ms and data not needed for first paint. Batch related lazy props to minimize round trips. Cache repeated computations for polling scenarios.

## Security Considerations

Lazy props are computed server-side in the same request context — authorization, middleware, and guards apply. The server controls what closures exist (the client decides when to request them). If a lazy computation fails, handle with `onError`.

## Related Rules

- Lazy Only Above-Cost Computations (05-rules.md)
- Always Handle Lazy Prop Loading States (05-rules.md)
- Keep Lazy Props One Level Deep (05-rules.md)
- Batch Lazy Prop Fetches (05-rules.md)
- Cache Repeated Lazy Computations (05-rules.md)
- Never Lazy Above-the-Fold Data (05-rules.md)

## Related Skills

- Implement Partial Reloads with Performance Optimizations (inertia/partial-reloads)
- Set Up Typed Server Props with Secure Serialization (inertia/server-props)
- Defer Expensive Components with Lazy Loading (livewire/lazy-loading)

## Success Criteria

- Initial page load time reduced by deferring non-critical expensive computations
- Loading states visible during lazy prop fetch (skeletons, spinners)
- Lazy props successfully fetched and rendered on demand
- No runtime errors from missing lazy props
- Repeated lazy fetches are cached where appropriate
- Above-the-fold content loads immediately without lazy deferral
