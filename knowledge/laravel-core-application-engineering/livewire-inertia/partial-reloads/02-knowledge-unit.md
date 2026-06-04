# Inertia Partial Reloads

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia Partial Reloads
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Inertia partial reloads allow the client to re-fetch only specific props from the server without a full page navigation or page component swap. The server re-executes the matched route's controller/handler but returns only the requested props as JSON. The page component re-renders with the updated props in-place.

The engineering value is selective data refreshing that preserves client-side state, scroll position, and avoids unnecessary computation for props that haven't changed. This is the Inertia equivalent of Livewire's `$refresh()` or a targeted AJAX call — but integrated into Inertia's prop pipeline rather than a separate API endpoint.

---

## Core Concepts

### Triggering a Partial Reload

Use `router.reload()` with an `only` key specifying which props to re-fetch:

```jsx
import { router } from '@inertiajs/react';

function RefreshButton() {
    const refreshStats = () => {
        router.reload({
            only: ['stats', 'recentActivity'],
            preserveScroll: true,
            preserveState: true,
        });
    };

    return <button onClick={refreshStats}>Refresh Stats</button>;
}
```

### Server-Side Handling

The server receives an `X-Inertia-Partial-Data` header with a comma-separated list of prop names. The controller must conditionally compute only those props:

```php
class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'user' => fn() => Auth::user(), // always evaluated
            'stats' => fn() => $request->inertiaPartial('stats')
                ? $this->computeStats()
                : Inertia::lazy(fn() => $this->computeStats()),
            'recentActivity' => fn() => $request->inertiaPartial('recentActivity')
                ? $this->getRecentActivity()
                : Inertia::lazy(fn() => $this->getRecentActivity()),
            'notifications' => fn() => NotificationService::unread(),
        ]);
    }
}
```

### Partial Reload vs Lazy Evaluation

| Concern | Partial Reload | Lazy Prop |
|---|---|---|
| Trigger | `router.reload({only: [...]})` | Not rendered on first visit |
| Server evaluates | On demand | On first non-partial request |
| Client navigation | Re-fetches existing prop | Fetches initially missing prop |
| Use case | Refresh stale data | Defer expensive computation |

---

## Mental Models

### The Selective Refetch

Think of partial reloads as `git checkout -- path/to/file` — you're telling the server "only update these specific keys, leave everything else untouched." The page re-renders with merged props: old props stay, requested props are overwritten.

### The Server as a Query Engine

The server is a query engine with selective column retrieval. Instead of `SELECT *`, partial reloads are `SELECT stats, recentActivity FROM dashboard`. The server only computes what you ask for.

---

## Internal Mechanics

### Request/Response Flow

1. Client calls `router.reload({only: ['stats']})`
2. Inertia sends `X-Inertia: true` + `X-Inertia-Partial-Data: stats` + `X-Inertia-Partial-Component: Dashboard`
3. Laravel Inertia middleware detects partial headers, creates a new request to the same route
4. The controller re-executes from scratch
5. Inertia response builder filters the prop array, returning only requested props
6. Client receives JSON `{component: "Dashboard", props: {stats: {...}}}`
7. Inertia client merges the partial response into the existing page's props
8. React/Vue re-renders the component with the updated props

### Partial Component Validation

The `X-Inertia-Partial-Component` header must match the current page component name. If there's a mismatch (e.g., the user navigated away between request and response), the partial response is discarded and the client performs a full navigation instead.

### Reset Behaviour

Partial reloads do NOT reset component state (form inputs, scroll position, open modals) because the page component stays mounted. This is the default and expected behaviour.

---

## Patterns

### Auto-Refresh with Polling

```jsx
import { useEffect } from 'react';
import { router } from '@inertiajs/react';

function LiveFeed({ initialFeed }) {
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['feed'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return <Feed items={initialFeed} />;
}
```

### Refresh After Mutation

```jsx
function CreatePost() {
    const submit = (e) => {
        e.preventDefault();
        router.post('/posts', data, {
            onSuccess: () => {
                router.reload({
                    only: ['posts'],
                    preserveScroll: true,
                });
            },
        });
    };
    // ...
}
```

### Conditional Partial Based on User Action

```jsx
function toggleSidebar() {
    router.reload({
        only: ['sidebar'],
        preserveState: true,
    });
}

function refreshAll() {
    router.reload(); // omitting 'only' reloads everything
}
```

### Inertia-aware Partial Handler

```php
class UserController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Users/Index', [
            'users' => User::paginate(20),
            'roles' => fn() => $request->inertiaPartial('roles')
                ? Role::all()
                : Inertia::lazy(fn() => Role::all()),
        ]);
    }
}
```

---

## Architectural Decisions

### Partial Reload vs Dedicated API Endpoint

| Concern | Partial Reload | Dedicated API | 
|---|---|---|
| Route count | One route (reused) | Two routes (page + API) |
| Auth logic | Reuses controller middleware | Must duplicate or share |
| Response shape | Inertia JSON (wrapped) | Arbitrary JSON |
| Client code | One `router.reload` call | Fetch + setState |
| Caching | Same as page response | Separate cache config |

Prefer partial reload when the data is a subset of the page's existing props. Prefer a dedicated API when the endpoint is consumed by multiple clients (mobile, third-party).

### Full Reload vs Partial Reload

| Concern | `router.reload()` (no `only`) | `router.reload({only: [...]})` |
|---|---|---|
| Props returned | All | Requested subset |
| Server load | Full computation | Selective computation |
| Client re-render | All props updated | Only requested props |
| Use case | Stale entire page | Stale specific section |

---

## Tradeoffs

| Concern | Partial Reload | Separate API Call |
|---|---|---|
| Coupling | Tied to page component props | Independent of page |
| Server overhead | Full controller boot (middleware, etc.) | Full request lifecycle |
| Client complexity | Simple (`router.reload`) | State management needed |
| Testability | Via Inertia testing helpers | Standard API tests |
| Reusability | Page-specific only | Any client |

---

## Performance Considerations

Partial reloads still boot the framework, run middleware, and re-execute the controller. They're not "partial" on the server side — only in what data is serialized and returned. For expensive operations, pair partial reloads with closure-based lazy props so that the partial header gates the computation:

---

## Production Considerations

- Always pair `preserveScroll: true` and `preserveState: true` when refreshing non-navigation data
- Use `preserveState: false` when you want to reset form state after a mutation
- Use closure props + `$request->inertiaPartial()` to avoid wasted computation
- Validate that `X-Inertia-Partial-Component` on the server side matches the expected component to prevent stale partials from corrupting the wrong page
- Consider debouncing rapid partial reloads (e.g., polling) to avoid request storms

---

## Common Mistakes

### Omitting `preserveScroll`

Without `preserveScroll: true`, the page scrolls to top on every partial reload — disorienting for users mid-page.

### Forgetting Lazy Passthrough

```php
// Bad — always computes stats, even on full page load
'stats' => fn() => $request->inertiaPartial('stats') ? $this->computeStats() : null,

// Good — lazy on full load, eager on partial
'stats' => fn() => $request->inertiaPartial('stats')
    ? $this->computeStats()
    : Inertia::lazy(fn() => $this->computeStats()),
```

### Partial Reload on Different Page

If the user navigates away before the partial response returns, Inertia discards the response. Ensure your UI handles this gracefully (the response may fire callbacks on a now-unmounted component).

---

## Failure Modes

### Stale Partial Response

A partial request fires, user navigates to a different page, the response arrives. Inertia checks `X-Inertia-Partial-Component` against the current page — discards on mismatch. No corruption, but the `onSuccess` callback may still fire. Gate side effects in callbacks:

```jsx
router.reload({
    only: ['feed'],
    onSuccess: (page) => {
        if (page.component === 'Dashboard') {
            // safe to proceed
        }
    },
});
```

### 500 During Partial Reload

The server returns an error. Inertia treats this as a failed request. The page component is NOT unmounted (it stays in its current state). The `onError` callback fires. No data corruption, but the user sees stale data with no visual feedback unless you handle it.

---

## Ecosystem Usage

Partial reloads are part of Inertia's core protocol and work across all adapters (React, Vue, Svelte). They pair naturally with lazy data evaluation to minimize server computation. The `X-Inertia-Partial-Data` and `X-Inertia-Partial-Component` headers are part of the Inertia HTTP protocol shared by the server and client packages.

## Related Knowledge Units

- **Server Props** (this workspace) — understanding the full prop pipeline
- **Shared Data** (this workspace) — partial reloads can exclude shared data
- **Lazy Data Evaluation** (this workspace) — lazy vs eager prop resolution
- **Form Handling** (this workspace) — combining form submissions with partial reloads
- **Livewire Loading States** (this workspace) — analogous pattern in Livewire

---

## Research Notes

- Partial reloads use `X-Inertia-Partial-Data` and `X-Inertia-Partial-Component` headers
- Inertia v3 still supports the `only` key on `router.reload()`
- Partial reloads work with all Inertia adapters (React, Vue, Svelte)
- The server always re-executes the full controller — there is no server-side caching of partial responses in Inertia core
