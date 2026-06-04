# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Lazy Data Evaluation |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Lazy data evaluation in Inertia defers the computation of expensive props until a subsequent client-side request. Instead of computing all props during the initial page render, the server wraps expensive computations in closures. These closures are only invoked when the client explicitly requests them (via a partial reload or lazy prop resolution). The engineering value is improved initial page load performance by deferring non-critical, expensive operations (report generation, aggregated queries, external API calls) until they're actually needed.

---

## Core Concepts

- **Closure-based props**: Passing a closure instead of a computed value defers evaluation — `'stats' => fn() => $this->computeExpensiveStats()`
- **`Inertia::lazy(fn())` helper**: Explicit alternative to closures — communicates intent that the prop is intentionally deferred
- **`LazyValue` class**: Internal Inertia class wrapping a closure — stored without invocation during initial pass
- **Resolution on partial reload**: Lazy props are computed only when the client requests them via `router.reload({only: ['prop']})`
- **Single-pass resolution**: Inertia v3 resolves all props in a single recursive pass — lazy props are simply not invoked
- **Exclusion from initial payload**: Lazy props are omitted from the initial JSON response (not even present as null)

---

## When To Use

- Expensive computations taking >100ms (DB aggregations, external API calls, report generation)
- Data below the fold or hidden behind user interaction (modals, accordions, tabs)
- Non-critical data not needed for initial page paint
- Dashboard widgets where only some sections need immediate data
- Heavy data that would push the initial payload size beyond acceptable limits

## When NOT To Use

- Critical data needed for initial render (auth user, page title, navigation)
- Small computations where the closure overhead outweighs the benefit
- Data that will be requested on every page load anyway (adds unnecessary round trip)
- SEO-critical content (lazy props are unavailable during SSR)

---

## Best Practices

- **Use lazy props for >200ms computations** that are not above the fold — measure with Laravel Debugbar first
- **Always provide a loading state** (skeleton, spinner) for components that render lazy props — the component mounts without them
- **Combine lazy props with partial reloads** — `router.reload({only: ['stats']})` triggers the lazy computation
- **Use `Inertia::lazy()` for team readability** — it makes deferral intent unambiguous vs plain closures
- **Prefer prefetching lazy props after initial render** — use `useEffect`/`onMounted` to trigger the partial reload after page is interactive
- **Document lazy props clearly in the controller** so other developers know the data is deferred

---

## Architecture Guidelines

- Lazy props are excluded from the initial JSON payload — they do NOT appear in the response at all
- SSR does NOT evaluate lazy props — they remain deferred on the client after hydration
- Lazy prop resolution only happens via partial reload with matching `X-Inertia-Partial-Data` header
- The `PropsResolver` class walks the prop array tree: primitives → included, closures → deferred, arrays → recursed
- `LazyValue` instances are stored without invocation — they are callable via `__invoke()`
- A lazy prop that is never requested remains `undefined`/`null` indefinitely on the client

---

## Performance

Lazy props provide most benefit when the computation takes >100ms and the data is not needed for first paint. The tradeoff is an additional HTTP round trip (50-200ms) and a flash of empty/loading content. Multiple lazy props on the same page cause multiple partial reloads — each is a separate round trip. Batch related lazy props into a single partial reload to minimize round trips. Use the following measurement pattern to identify candidates:

```php
'stats' => Inertia::lazy(function () {
    $start = microtime(true);
    $result = $this->computeStats();
    Log::debug('Lazy stats: ' . (microtime(true) - $start) . 's');
    return $result;
});
```

---

## Security

- Lazy props are computed server-side in the same request context — authorization, middleware, and guards apply
- The client decides WHEN to request lazy props but not WHICH ones (the server controls what closures exist)
- Lazy prop closures have access to the full request context — ensure they respect authorization checks
- If a lazy computation fails, the partial reload returns 500 — handle with `onError` callback

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Lazy prop always requested | Client code immediately requests the lazy prop on mount | Added round trip with no benefit, same total time | Profile first; only defer if actually improves perceived load |
| No loading state for lazy prop | Component renders assuming prop exists | Runtime error accessing undefined/null | Handle null/undefined gracefully with loading states |
| Nesting lazy props | `Inertia::lazy(fn() => ['x' => Inertia::lazy(...)])` | Inner lazy never resolved | Keep lazy props shallow — one level of deferral |
| Lazy prop with SSR | Expecting lazy data in server-rendered HTML | SSR output has placeholder values | Always guard lazy-rendering components for SSR |
| Stale lazy value | Lazy prop fetched once, never updated | User sees outdated data | Re-fetch after mutations with `router.reload({only: ['prop']})` |

---

## Anti-Patterns

- **Over-lazification**: Making every prop lazy — the number of round trips grows linearly, and the cumulative latency exceeds the saved computation time
- **Lazy for trivial data**: Deferring props that take <5ms to compute — the network round trip costs more than the computation
- **Lazy props in critical path**: Deferring data needed for above-the-fold rendering — users see loading states on mount
- **No cache for repeated lazy fetches**: Same lazy prop re-computed on every partial reload — use server-side caching (Cache::remember) for idempotent expensive operations

---

## Examples

### Lazy Prop with Progressive Enhancement

```php
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Dashboard', [
            'user' => Auth::user(),
            'stats' => Inertia::lazy(fn() => $this->computeExpensiveStats()),
            'chartData' => Inertia::lazy(fn() => $this->buildChartData()),
        ]);
    }
}
```

### Client-Side Lazy Fetch

```jsx
function StatsSection() {
    const { props } = usePage();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!props.stats && !loaded) {
            router.reload({
                only: ['stats'],
                onSuccess: () => setLoaded(true),
            });
        }
    }, []);

    if (!props.stats) return <Skeleton />;
    return <StatsDisplay data={props.stats} />;
}
```

### Conditional Lazy with Partial Guard

```php
'stats' => fn() => $request->inertiaPartial('stats')
    ? $this->computeStats()
    : Inertia::lazy(fn() => $this->computeStats()),
```

---

## Related Topics

- Server Props — the full prop pipeline
- Partial Reloads — how lazy props are fetched
- Shared Data — shared data is always eager
- Form Handling — form submissions and lazy refetch
- SSR Configuration — SSR does not evaluate lazy props
- Livewire Lazy Loading — analogous pattern in Livewire

---

## AI Agent Notes

- Inertia v3 `PropsResolver` does recursive single-pass resolution
- `Inertia::lazy()` wraps a closure in a `LazyValue` object
- Lazy props are excluded from the initial JSON payload — they don't appear at all
- SSR does NOT evaluate lazy props — they remain deferred on the client
- Lazy prop resolution only happens via partial reload with matching `X-Inertia-Partial-Data` header
- Use `$request->inertiaPartial('key')` to check if a specific prop is being requested in the partial reload

---

## Verification

- Lazy props are used only for computations exceeding 100ms or not needed for initial paint
- All components rendering lazy props have loading state handling (skeleton/spinner)
- Lazy props are fetched via `router.reload()` after component mount or user interaction
- Lazy props are not used for SSR-critical or SEO-critical data
- No deeply nested lazy props exist — max one level of deferral
