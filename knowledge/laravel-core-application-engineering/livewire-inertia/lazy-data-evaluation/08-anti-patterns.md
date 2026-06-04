# Inertia Lazy Data Evaluation — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Lazy Data Evaluation |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Over-Lazification — Making Every Prop Lazy
2. No Loading State for Lazy Props
3. Nested Lazy Props
4. Lazy Props for Above-the-Fold Data
5. No Cache for Repeated Lazy Fetches

---

## Repository-Wide Anti-Patterns

- **Lazy prop always requested on mount**: Triggers a partial reload immediately, negating the benefit of deferral.
- **Stale lazy value after mutation**: Lazy prop fetched once and never refreshed after data changes.
- **Lazy for SEO-critical content**: Lazy props are unavailable during SSR, so search engines see incomplete content.
- **No batch fetching**: Multiple lazy props fetched individually instead of in one `router.reload()` call.

---

## Anti-Pattern 1: Over-Lazification — Making Every Prop Lazy

### Category

Performance

### Description

Applying `Inertia::lazy()` to every prop returned by a controller, including trivial computations and above-the-fold data, without profiling the actual cost of each computation.

### Why It Happens

Developers hear "lazy is good for performance" and apply it indiscriminately. Without profiling, there is no way to distinguish between expensive computations (which benefit from deferral) and cheap ones (which are harmed by the extra round trip).

### Warning Signs

- Every prop in an `Inertia::render()` call is wrapped in `Inertia::lazy()`
- Props that compute in under 5ms (string concatenations, simple property access) are deferred
- Multiple lazy props cause multiple sequential partial reloads on page mount
- Page feels slower after adding lazy props than before

### Why Harmful

Lazy props trade an initial computation cost for an additional HTTP round trip (50-200ms). For cheap computations, the round trip costs more than the saved computation time. Over-lazification multiplies round trips, making the page feel slower than if all props were eager.

### Consequences

- Slower perceived load time due to multiple round trips
- Flash of loading states for data that could have been instant
- More server requests per page view
- Increased complexity with no performance benefit

### Alternative

Profile each prop's computation time with Laravel Debugbar or microtime. Only defer props exceeding 200ms that are not needed for initial paint. Keep all cheap props eager.

### Refactoring Strategy

1. Profile every lazy prop's computation time
2. Remove `Inertia::lazy()` from any prop under 5ms
3. For props between 5-200ms, evaluate whether the round trip cost is justified by payload size reduction
4. Batch remaining lazy props into a single `router.reload()` call

### Detection Checklist

- [ ] Lazy props are used only for computations exceeding 200ms
- [ ] No lazy prop wraps a trivial operation (string, simple accessor, constant)
- [ ] All lazy props batched into minimal number of `router.reload()` calls
- [ ] Page load time improved (not worsened) after adding lazy props

### Related Rules

- Lazy Only Above-Cost Computations (05-rules.md)

### Related Skills

- Defer Expensive Data with Lazy Props (06-skills.md)

### Related Decision Trees

- Lazy Prop vs Eager Prop for Expensive Computations (07-decision-trees.md)

---

## Anti-Pattern 2: No Loading State for Lazy Props

### Category

Reliability

### Description

Rendering a page component that accesses a lazy prop without guarding against `undefined`/`null`, causing runtime errors when the component mounts before the lazy prop is fetched.

### Why It Happens

Lazy props are excluded from the initial JSON payload entirely — they do not appear in the response at all, not even as `null`. Developers may not realize the prop is absent on mount, especially if they test with fast networks where the partial reload completes before the component renders.

### Warning Signs

- `Cannot read properties of undefined` or `TypeError: props.X is undefined` errors on page load
- Components that render blank or crash sections where lazy props are used
- Errors that disappear after a page reload (partial reload completes before error shows)

### Why Harmful

A missing loading state means the component crashes on mount. The user sees a blank section or a full-page error instead of a graceful loading placeholder. The error is intermittent — it reproduces only on slow networks or first visits.

### Consequences

- Runtime errors that crash sections of the page
- Blank content areas where lazy data is expected
- Frustrating user experience with inconsistent rendering
- Hard-to-reproduce bugs that depend on network timing

### Alternative

Always provide a loading state (skeleton, spinner, placeholder) that renders when the lazy prop is `undefined` or `null`. Use conditional rendering to display the loading state until the prop is available.

### Refactoring Strategy

1. Identify all components that access lazy props
2. Add a guard check: `if (!props.lazyData) return <Skeleton />`
3. Fetch the lazy prop via `router.reload()` in `useEffect`/`onMounted`
4. Test on slow network throttling (3G) to verify loading states appear

### Detection Checklist

- [ ] Every component rendering a lazy prop has a loading state
- [ ] Loading states are visible on slow network (3G throttling)
- [ ] No runtime errors from accessing undefined lazy props
- [ ] Skeleton/spinner dimensions match the eventual content to reduce layout shift

### Related Rules

- Always Handle Lazy Prop Loading States (05-rules.md)

### Related Skills

- Defer Expensive Data with Lazy Props (06-skills.md)

### Related Decision Trees

- Lazy Prop vs Partial Reload for On-Demand Data (07-decision-trees.md)

---

## Anti-Pattern 3: Nested Lazy Props

### Category

Design

### Description

Passing `Inertia::lazy()` as a value inside a closure that is itself `Inertia::lazy()`, creating nested deferred values that are never automatically resolved.

### Why It Happens

Developers may structure props hierarchically (e.g., a `stats` object containing sub-objects) and apply lazy to both the parent and children, assuming Inertia will recursively resolve all levels.

### Warning Signs

- Lazy props that are always `undefined` on the client even after a partial reload
- Nested data that never appears in the browser regardless of how many times the page refreshes
- `Inertia::lazy()` calls nested inside other `Inertia::lazy()` closures

### Why Harmful

Inertia's prop resolver evaluates lazy values in a single pass. A nested lazy value inside an outer lazy value is never automatically resolved — the inner closure is returned as-is and never invoked by the client. The inner data is permanently unavailable unless explicitly requested in a separate partial reload.

### Consequences

- Nested data permanently missing — never appears on the client
- Hard to debug — it's not obvious why a nested prop is always undefined
- Developers may add more reload logic to compensate, increasing complexity

### Alternative

Keep lazy props as top-level keys in the prop array. If a parent key is lazy, resolve all its children eagerly within the closure. Never nest `Inertia::lazy()` inside another `Inertia::lazy()`.

### Refactoring Strategy

1. Search for nested `Inertia::lazy()` patterns: `Inertia::lazy(fn() => ['x' => Inertia::lazy(...)])`
2. Move inner lazy props to top-level keys in the prop array
3. If the grouping is required for the client interface, resolve all data eagerly inside the outer lazy closure
4. Test that all nested data appears after a single partial reload

### Detection Checklist

- [ ] No `Inertia::lazy()` appears inside another `Inertia::lazy()` closure
- [ ] All lazy props are top-level keys in the prop array
- [ ] No nested data is permanently missing on the client
- [ ] A single partial reload resolves all required lazy props

### Related Rules

- Keep Lazy Props One Level Deep (05-rules.md)

### Related Skills

- Defer Expensive Data with Lazy Props (06-skills.md)

### Related Decision Trees

- Inertia::lazy() Helper vs Closure Prop (07-decision-trees.md)

---

## Anti-Pattern 4: Lazy Props for Above-the-Fold Data

### Category

Performance / UX

### Description

Deferring props that are needed for the initial visible content (above the fold), causing users to see loading states in the main viewing area on page load.

### Why It Happens

Developers apply lazy to all expensive computations without considering which data is needed for the initial visual render. A prop may be expensive, but if it controls the page title, header user info, or main content area, it must be eager.

### Warning Signs

- Loading skeletons or spinners visible in the main content area on initial page load
- Page title or header user name appears after a delay
- Above-the-fold content flashes from loading state to content

### Why Harmful

Lazy props are absent on initial render. If above-the-fold content depends on a lazy prop, the user sees a loading skeleton or blank space in the main viewing area. This degrades perceived performance and gives the impression that the page is slow, even if the total load time is lower.

### Consequences

- Users see loading states immediately on page load — poor first impression
- Perceived performance is worse despite better technical metrics
- Layout shift when loading states are replaced by content
- Accessibility issues — screen readers announce loading states

### Alternative

Identify content visible without scrolling (above the fold) and pass those props eagerly. Defer only props for content below the fold, hidden behind interactions, or in secondary panels.

### Refactoring Strategy

1. Identify all props that affect above-the-fold rendering
2. Move them from `Inertia::lazy()` to eager props
3. For any above-the-fold prop that is truly expensive (>1s), explore server-side caching or query optimization instead of deferral
4. Verify that above-the-fold content renders immediately on initial page load

### Detection Checklist

- [ ] Above-the-fold content renders immediately on page load
- [ ] No loading states visible in the main content area on initial render
- [ ] Page title, header, and primary content are eager props
- [ ] Lazy props are limited to below-fold, modal, tab, or secondary panel content

### Related Rules

- Never Lazy Above-the-Fold Data (05-rules.md)

### Related Skills

- Defer Expensive Data with Lazy Props (06-skills.md)

### Related Decision Trees

- Lazy Prop vs Eager Prop for Expensive Computations (07-decision-trees.md)

---

## Anti-Pattern 5: No Cache for Repeated Lazy Fetches

### Category

Performance

### Description

Re-computing an expensive lazy prop from scratch on every partial reload instead of caching the result for a defined period.

### Why It Happens

Lazy props feel like one-time operations — developers assume they will be fetched once and never again. In practice, lazy props are re-fetched on every partial reload, which may happen frequently due to polling, tab switching, or user interactions.

### Warning Signs

- Same lazy prop re-computed on every 30-second poll interval
- Database query load increases linearly with the number of users polling
- Lazy prop response times are consistently slow on every fetch

### Why Harmful

Every partial reload that requests a lazy prop re-executes the closure from scratch. For expensive database aggregations or external API calls, the server repeats the same work on every poll interval. This increases database load, response time, and server costs without providing fresher data.

### Consequences

- High database load from repeated aggregations
- Slow response times for partial reloads
- Poor scalability — server load grows with concurrent users
- No benefit from repeating the same expensive computation

### Alternative

Wrap the body of a lazy closure with `Cache::remember()` when the computation is idempotent and the data can be stale for a defined period. Set an appropriate TTL based on how fresh the data needs to be.

### Refactoring Strategy

1. Identify lazy props that are fetched repeatedly (polling, tab switches)
2. Wrap expensive computations in `Cache::remember('key', $ttl, fn() => ...)`
3. Set TTL based on acceptable staleness (e.g., 60s for dashboard stats)
4. For real-time data, optimize the query rather than caching

### Detection Checklist

- [ ] Repeatedly fetched lazy computations use `Cache::remember()`
- [ ] Cache TTL is appropriate for the data freshness requirement
- [ ] Cache key is namespaced per user if data is user-specific
- [ ] Cache is invalidated when underlying data changes (model events, webhooks)

### Related Rules

- Cache Repeated Lazy Computations (05-rules.md)

### Related Skills

- Defer Expensive Data with Lazy Props (06-skills.md)

### Related Decision Trees

- Lazy Prop vs Partial Reload for On-Demand Data (07-decision-trees.md)
