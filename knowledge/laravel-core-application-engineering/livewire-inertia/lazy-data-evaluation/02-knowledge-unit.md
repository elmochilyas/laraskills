# Inertia Lazy Data Evaluation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Lazy Data Evaluation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Lazy data evaluation in Inertia defers the computation of expensive props until a subsequent client-side request. Instead of computing all props during the initial page render, the server wraps expensive computations in closures. These closures are only invoked when the client explicitly requests them (via a partial reload or lazy prop resolution).

The engineering value is improved initial page load performance by deferring non-critical, expensive operations (report generation, aggregated queries, external API calls) until they're actually needed on screen.

---

## Core Concepts

### Closure-based Props

Instead of passing a computed value, pass a closure:

```php
class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'user' => Auth::user(), // computed eagerly
            'stats' => fn() => $this->computeExpensiveStats(), // deferred
            'report' => new LazyValue(fn() => $this->generateReport()),
        ]);
    }
}
```

### Inertia::lazy() Helper

```php
use Inertia\Inertia;

'chartData' => Inertia::lazy(fn() => $this->buildChartData()),
```

This is equivalent to a closure, but explicitly communicates intent: "this prop is intentionally deferred."

### Resolution on Partial Reload

When the client triggers a partial reload requesting the lazy prop:

```jsx
router.reload({ only: ['stats'] });
```

Inertia's server evaluates the closure and returns the computed value. The client merges it into the page's props.

---

## Mental Models

### The Deferred Function Call

Think of lazy props as function declarations (not invocations). The closure is a recipe that says "to compute this value, call this function." The recipe is passed to Inertia, but the function is only called when the client explicitly asks for the result.

### The Two-Phase Render

- Phase 1 (Initial): Render the page shell with eager props. Lazy props are placeholders (null/undefined).
- Phase 2 (On Demand): Client requests specific lazy props. Server evaluates closures. Client re-renders with computed values.

---

## Internal Mechanics

### Prop Resolution Pipeline

Inertia's `PropsResolver` processes the prop array:

1. Eager values (non-closure, non-LazyValue) are resolved immediately
2. Closures and `LazyValue` instances are stored without invocation
3. The response JSON omits lazy props — they are NOT serialized
4. On partial reload (X-Inertia-Partial-Data header), only the requested closures are invoked
5. The evaluated result is merged into the existing page props

### Single-Pass Resolution

Inertia v3 resolves all props in a single recursive pass. The `PropsResolver` class walks the prop array tree:

- Primitive values → included directly
- Closures → stored as deferred
- Nested arrays → recursed into
- `LazyValue` instances → stored as deferred

There is no separate "resolve deferred props later" mechanism — deferral is achieved by simply not invoking the closure during the initial pass.

### LazyValue Under the Hood

```php
namespace Inertia;

class LazyValue
{
    public function __construct(
        private readonly \Closure $callback
    ) {}

    public function __invoke(): mixed
    {
        return ($this->callback)();
    }
}
```

The `Inertia::lazy()` method instantiates a `LazyValue` wrapping the closure. The response builder checks for `LazyValue` and Closure instances to determine deferral.

---

## Patterns

### Conditional Lazy with Partial Guard

```php
'stats' => fn() => $request->inertiaPartial('stats')
    ? $this->computeStats()
    : Inertia::lazy(fn() => $this->computeStats()),
```

### Progressive Enhancement

Start with lazy, request when section becomes visible:

```jsx
import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';

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

### Deferred Nested Props

```php
return Inertia::render('Reports', [
    'meta' => ['title' => 'Reports'], // eager
    'charts' => Inertia::lazy(fn() => [
        'revenue' => $this->revenueChart(),
        'users' => $this->userChart(),
    ]),
]);
```

---

## Architectural Decisions

### Eager vs Lazy Props

| Concern | Eager | Lazy |
|---|---|---|
| Initial render speed | Slower (all computed) | Faster (deferred) |
| Time-to-interactive | Delayed by computation | Available immediately |
| Client complexity | Simple (props available) | Need loading states |
| Server load | Predictable (all at once) | Bursty (on demand) |
| Use case | Critical data | Non-critical, expensive |

### Lazy Value vs Closure

| Approach | Syntax | Semantics |
|---|---|---|
| Closure | `'key' => fn() => ...` | Implicit lazy |
| `Inertia::lazy()` | `Inertia::lazy(fn() => ...)` | Explicit lazy (documented intent) |
| `new LazyValue(...)` | `new LazyValue(fn() => ...)` | Framework internal |

Prefer `Inertia::lazy()` for team readability — it makes the intent unambiguous.

---

## Tradeoffs

| Concern | Lazy Props | Eager Props |
|---|---|---|
| Frontend complexity | Requires loading states | No loading states |
| Caching | No automatic caching of lazy results | Can cache eager results |
| SEO / SSR | Lazy props unavailable on first render | All props available |
| Error handling | Lazy request may fail independently | All or nothing |
| Network requests | Additional round trip for lazy data | Single request |

---

## Performance Considerations

Lazy props provide the most benefit when:
- The computation takes >100ms (DB aggregation, external API, file processing)
- The data is below the fold or hidden behind a user interaction
- The data is not needed for initial page paint

The tradeoff is an additional HTTP round trip and flash of empty content. Balance the number of lazy props against the user-perceived latency of multiple partial reloads.

### Measurement Pattern

```php
'stats' => Inertia::lazy(function () use ($request) {
    $start = microtime(true);
    $result = $this->computeStats();
    Log::debug('Lazy stats computed in ' . (microtime(true) - $start) . 's');
    return $result;
}),
```

---

## Production Considerations

- Use lazy props for >200ms computations that are not above the fold
- Always provide a loading state (Skeleton, spinner) for lazy props
- Combine lazy props with partial reloads for precise control over when data is fetched
- Avoid deeply nesting lazy props — the resolution pipeline does a single pass, but multiple lazy requests cause multiple round trips
- Document lazy props clearly in the controller so other developers know the data is deferred
- Consider prefetching lazy props after initial render using `router.reload()` in a `useEffect`/`onMounted` hook

---

## Common Mistakes

### Lazy Prop That's Always Requested

If every page load immediately requests the lazy prop, there's no benefit. You've added a round trip for no reason. Profile to ensure lazy props actually reduce initial render time.

### Mixing Eager and Lazy in the Same Component

A component that renders from both eager and lazy props must handle the null state for the lazy prop:

```jsx
// Bad — assumes stats is always present
function Dashboard({ user, stats }) { ... }

// Good — handles lazy null
function Dashboard({ user, stats }) {
    const data = stats ?? [];
    // ...
}
```

### Server-Side Lazy in SSR

When using Inertia SSR (server-side rendering for initial page), lazy props are still deferred. The SSR response will NOT include lazy values. Ensure the JS bundle handles the missing props gracefully on hydration. This may cause a flash of missing content.

---

## Failure Modes

### Lazy Prop Never Fetched

A lazy prop is declared on the server but the client never triggers a partial reload for it. The prop remains `undefined`/`null` indefinitely. The component must handle this gracefully — don't crash on missing data.

### Stale Lazy Value After Mutation

A lazy prop fetched 5 minutes ago reflects stale data. There's no automatic cache invalidation for lazy values. The client must explicitly re-fetch after mutations using `router.reload({only: ['prop']})`.

### Partial Reload Returns Error for Lazy Prop

The lazy computation throws an exception. Inertia returns a 500. The lazy prop remains null. The component transitions from "loading" to "error" state. Handle this with `onError` in the partial reload call.

---

## Ecosystem Usage

Lazy data evaluation works within Inertia's server-side prop pipeline and is compatible with partial reloads, SSR, and TypeScript integration. The `Inertia::lazy()` helper and `LazyValue` class are part of the inertia-laravel package. Ecosystem tools like Laravel Debugbar can help identify expensive props suitable for lazy evaluation.

## Related Knowledge Units

- **Server Props** (this workspace) — the full prop pipeline
- **Partial Reloads** (this workspace) — how lazy props are fetched
- **Shared Data** (this workspace) — shared data is always eager
- **Form Handling** (this workspace) — form submissions and lazy refetch
- **Performance Patterns** (this workspace) — optimizing initial page load
- **Livewire Lazy Loading** (this workspace) — analogous pattern in Livewire

---

## Research Notes

- Inertia v3 `PropsResolver` does recursive single-pass resolution
- `Inertia::lazy()` wraps a closure in a `LazyValue` object
- Lazy props are excluded from the initial JSON payload — they do NOT even appear as `null`
- SSR does NOT evaluate lazy props — they remain deferred on the client
- Lazy prop resolution only happens via partial reload with matching `X-Inertia-Partial-Data` header
