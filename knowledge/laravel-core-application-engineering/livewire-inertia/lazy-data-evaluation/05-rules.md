## Rule: Lazy Only Above-Cost Computations

Use lazy props only for computations that take longer than 200ms and are not needed for the initial page paint.

---

## Category

Performance

---

## Rule

Before marking a prop as lazy, measure its computation time with Laravel Debugbar or a microtime log. Only defer props whose computation exceeds 200ms and whose data is not visible above the fold. Never lazy trivial props that take under 5ms to compute.

---

## Reason

Lazy props trade an initial computation cost for an additional HTTP round trip (50-200ms). For cheap computations, the round trip costs more than the saved computation time, resulting in slower perceived load. Profiling ensures lazy props are used only where they provide a net benefit.

---

## Bad Example

```php
return Inertia::render('Dashboard', [
    'user' => Auth::user(), // eager — fast, always needed
    'title' => Inertia::lazy(fn() => 'Dashboard'), // lazy — trivial string, no benefit
]);
```

---

## Good Example

```php
return Inertia::render('Dashboard', [
    'user' => Auth::user(), // eager — fast, needed for header
    'stats' => Inertia::lazy(fn() => $this->computeExpensiveStats()), // >200ms, deferred
]);
```

---

## Exceptions

If a prop's computation is cheap (<5ms) but its dataset is large (>100KB JSON), lazy loading to reduce initial payload size is valid. Document the payload-size rationale.

---

## Consequences Of Violation

Performance risks: slower page load from unnecessary round trip. User experience: flash of loading state for instant data.

---

## Rule: Always Handle Lazy Prop Loading States

Every component that renders a lazy prop must gracefully render when that prop is `null` or `undefined`.

---

## Category

Reliability

---

## Rule

In any page component that uses a lazy-deferred prop, include a loading state (skeleton, spinner, placeholder) that renders when the prop has not been loaded yet. Never assume the prop is present on initial render.

---

## Reason

Lazy props are excluded from the initial JSON payload entirely — they do not appear in the response at all, not even as `null`. The component mounts without the prop. If the code accesses `props.stats.length` without a guard, it throws a runtime error because `props.stats` is `undefined`.

---

## Bad Example

```jsx
function StatsCard({ stats }) {
    return <div>{stats.totalUsers}</div>; // Crash: stats is undefined on mount
}
```

---

## Good Example

```jsx
function StatsCard({ stats }) {
    if (!stats) return <Skeleton className="h-32" />;
    return <div>{stats.totalUsers}</div>;
}
```

---

## Exceptions

If a lazy prop is explicitly prefetched in the parent component's `useEffect` before rendering the child that uses it, the child may assume the prop exists. The prefetching component must still have a loading state.

---

## Consequences Of Violation

Runtime errors: `Cannot read properties of undefined` crashes the page. UX: blank sections where lazy props are expected.

---

## Rule: Keep Lazy Props One Level Deep

Never nest a lazy prop inside another lazy prop — limit deferral to one level.

---

## Category

Design

---

## Rule

Do not pass `Inertia::lazy()` as a value inside a closure that is itself `Inertia::lazy()`. Keep lazy props as top-level keys in the prop array. If a parent key is lazy, all its children are resolved eagerly when the parent is loaded.

---

## Reason

Inertia's prop resolver evaluates lazy values in a single pass. A nested lazy value inside an outer lazy value is never automatically resolved — the inner closure is returned as-is and never invoked by the client. The inner data is permanently unavailable unless explicitly requested in a separate partial reload.

---

## Bad Example

```php
return Inertia::render('Dashboard', [
    'stats' => Inertia::lazy(fn() => [
        'chartData' => Inertia::lazy(fn() => $this->buildChart()), // Never resolved
    ]),
]);
```

---

## Good Example

```php
return Inertia::render('Dashboard', [
    'stats' => Inertia::lazy(fn() => [
        'chartData' => $this->buildChart(), // Eager inside lazy — correct
    ]),
]);
```

---

## Exceptions

None. Nested lazy values are never resolved by Inertia's current prop resolution algorithm.

---

## Consequences Of Violation

Reliability risks: nested lazy data never appears on the client. Debugging difficulty: hard to identify why a prop is permanently missing.

---

## Rule: Batch Lazy Prop Fetches

When a page has multiple lazy props, fetch them together in a single `router.reload()` call.

---

## Category

Performance

---

## Rule

Combine all lazy props that are fetched at the same time (e.g., on mount) into one `router.reload({ only: ['stats', 'chartData', 'feed'] })` call. Do not trigger separate reloads for each lazy prop.

---

## Reason

Each `router.reload()` call is an independent HTTP round trip. If a page has five lazy props and they are each fetched in a separate call, the page makes five additional requests — adding 250-1000ms of cumulative latency. Batching them into one request adds a single round trip regardless of the number of props.

---

## Bad Example

```jsx
useEffect(() => { router.reload({ only: ['stats'] }); }, []);
useEffect(() => { router.reload({ only: ['chartData'] }); }, []);
useEffect(() => { router.reload({ only: ['feed'] }); }, []);
```

---

## Good Example

```jsx
useEffect(() => {
    router.reload({ only: ['stats', 'chartData', 'feed'] });
}, []);
```

---

## Exceptions

If some lazy props should load at different times (e.g., stats on mount, chart on tab switch), separate the calls. Each batch should contain the props needed at that specific trigger point.

---

## Consequences Of Violation

Performance risks: unnecessary HTTP round trips, slower page interactivity.

---

## Rule: Cache Repeated Lazy Computations

Cache the result of a lazy computation using Laravel's cache so that repeated fetches (e.g., polling) do not recompute from scratch.

---

## Category

Performance

---

## Rule

Wrap the body of a lazy closure with `Cache::remember()` when the computation is idempotent and the data can be stale for a defined period. Set an appropriate TTL based on how fresh the data needs to be.

---

## Reason

Every partial reload that requests a lazy prop re-executes the closure from scratch. For expensive database aggregations or external API calls, this means the server repeats the same work on every 30-second poll interval. Caching reduces server load and response time for repeated lazy fetches.

---

## Bad Example

```php
'stats' => Inertia::lazy(fn() => [
    'totalRevenue' => Order::sum('total'), // Re-queries DB every 30s
]),
```

---

## Good Example

```php
'stats' => Inertia::lazy(fn() => [
    'totalRevenue' => Cache::remember('dashboard.revenue', 60, fn() =>
        Order::sum('total')
    ),
]),
```

---

## Exceptions

Do not cache lazy computations that must always return fresh data (e.g., user-specific counters, real-time notifications). For those, optimize the query instead.

---

## Consequences Of Violation

Performance risks: repeated expensive computations on every poll interval. Scalability risks: database load increases with number of concurrent users polling.

---

## Rule: Never Lazy Above-the-Fold Data

All props needed for the initial visible content (above the fold) must be eager — never deferred.

---

## Category

Performance

---

## Rule

Identify the content visible without scrolling (above the fold) and pass those props eagerly via `Inertia::render()`. Defer only props for content below the fold, hidden behind interactions, or in secondary panels.

---

## Reason

Lazy props are absent on initial render. If above-the-fold content depends on a lazy prop, the user sees a loading skeleton or blank space in the main viewing area. This degrades perceived performance and gives the impression that the page is slow, even if the total load time is lower.

---

## Bad Example

```php
// All props lazy — page title and header are missing on mount
return Inertia::render('Dashboard', [
    'title' => Inertia::lazy(fn() => 'Dashboard'), // Above fold — should be eager
    'user' => Inertia::lazy(fn() => Auth::user()), // Above fold — should be eager
    'stats' => Inertia::lazy(fn() => $this->expensiveStats()), // Below fold — OK
]);
```

---

## Good Example

```php
return Inertia::render('Dashboard', [
    'title' => 'Dashboard', // Eager — above the fold
    'user' => Auth::user(), // Eager — needed for header
    'stats' => Inertia::lazy(fn() => $this->expensiveStats()), // Lazy — below fold
]);
```

---

## Exceptions

If the entire page is below the fold (e.g., a page that requires scrolling to see any content), all props may be lazy. This is extremely rare.

---

## Consequences Of Violation

UX risks: loading states visible to user immediately on page load. Performance perception: page feels slower despite faster technical metrics.
