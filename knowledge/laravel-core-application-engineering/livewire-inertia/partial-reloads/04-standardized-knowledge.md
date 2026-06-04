# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Partial Reloads |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Inertia partial reloads allow the client to re-fetch only specific props from the server without a full page navigation or page component swap. The server re-executes the matched route's controller/handler but returns only the requested props as JSON. The page component re-renders with the updated props in-place. The engineering value is selective data refreshing that preserves client-side state, scroll position, and avoids unnecessary computation for unchanged props.

---

## Core Concepts

- **`router.reload({only: ['stats']})`**: Client-side method to trigger a partial reload requesting only specified props
- **`preserveScroll: true`**: Prevents scroll reset on partial reload (default is reset)
- **`preserveState: true`**: Preserves component state (form inputs, open modals) during the reload
- **`X-Inertia-Partial-Data` header**: Server receives comma-separated list of requested prop names
- **`X-Inertia-Partial-Component` header**: Server validates the component matches; discards on mismatch
- **Server-side conditional evaluation**: Use `$request->inertiaPartial('key')` to gate expensive computations
- **Full reload (no `only`)**: `router.reload()` without `only` re-fetches all page props

---

## When To Use

- Refreshing stale data without navigating away (dashboard widgets, feed data)
- Polling for updates at regular intervals (30s refresh)
- After form mutation — refresh a list or stats after a successful submission
- Re-fetching lazy props that were deferred on initial page load
- Updating a specific section of the page without affecting other sections

## When NOT To Use

- Initial page data fetching (use server props via `Inertia::render()`)
- Real-time data that needs instant updates (use WebSockets/SSE)
- Data that should trigger a full page navigation (URL change, different route)
- Cross-page data fetching (partial reloads only work on the current page component)

---

## Best Practices

- **Always pair `preserveScroll: true` and `preserveState: true`** when refreshing non-navigation data — prevents jarring UX
- **Use closure props + `$request->inertiaPartial()`** to avoid wasted computation for props not being reloaded
- **Debounce rapid partial reloads** (polling, scroll-based refresh) to avoid request storms
- **Validate `X-Inertia-Partial-Component` matches expected component** to prevent stale partials from corrupting the wrong page
- **Handle error states** in `onError` callback — the page stays in its current state with stale data
- **Combine lazy props with partial reload guards** — lazy by default, eager when explicitly requested

---

## Architecture Guidelines

- Partial reloads still boot the full Laravel framework, run middleware, and re-execute the controller
- Server always re-executes the controller from scratch — there's no server-side caching of partial responses
- The `X-Inertia-Partial-Component` header must match the current page — mismatched responses are discarded
- Partial reloads do NOT reset component state (form inputs, scroll, modals) because the page stays mounted
- On partial reload, only the requested props are returned — existing props remain unchanged
- Shared data is NOT re-included in partial responses unless explicitly requested in the `only` array

---

## Performance

Partial reloads offer client-side performance benefits (no full re-render) but server-side costs are the same as a full request (framework boot, middleware, controller execution). The savings are in serialization and transfer — only requested props are JSON-encoded and sent. For expensive controllers, partial reloads should be paired with conditional computation using `$request->inertiaPartial()` to skip non-requested prop generation. Server CPU cost per partial reload is roughly equal to a full page load minus prop serialization.

---

## Security

- Partial reloads execute the same controller code with the same middleware — authorization applies identically
- The `X-Inertia-Partial-Component` header is client-provided — server validates it matches, but don't trust it for authorization
- Sensitive data excluded from the initial page response is also excluded from partial reloads
- Partial reloads don't bypass any security checks that run during normal page loads

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Omitting `preserveScroll` | Not passing `preserveScroll: true` | Page scrolls to top on every partial reload | Always set `preserveScroll: true` for in-page refreshes |
| No lazy passthrough in server | Prop closure doesn't check `inertiaPartial()` | Expensive prop computed on every page load | Use `fn() => $request->inertiaPartial('key') ? compute() : Inertia::lazy(fn() => compute())` |
| Partial reload on wrong page | User navigates before response arrives | Response discarded, but `onSuccess` may fire | Gate side effects by checking current component |
| Forgetting `preserveState` | Not setting `preserveState: true` | Form inputs and component state reset | Set `preserveState: true` for non-navigation reloads |
| Over-polling | Rapid partial reloads without debounce | Request storms, server overload | Debounce to minimum 3-5s intervals |

---

## Anti-Patterns

- **Partial reload as data fetching on mount**: Using partial reload instead of passing data as initial props — defeats the purpose of server-driven props
- **Reloading everything when only one prop is needed**: Omitting `only` key reloads all props — wasteful if you only need one
- **No fallback for failed reloads**: Not handling `onError` — user sees stale data with no feedback
- **Partial reload for navigation**: Using `router.reload()` when you should use `router.visit()` — partial reloads don't change the URL

---

## Examples

### Polling for Live Updates

```jsx
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
}
```

### Server-Side Partial Guard

```php
return Inertia::render('Dashboard', [
    'user' => Auth::user(),
    'stats' => fn() => $request->inertiaPartial('stats')
        ? $this->computeStats()
        : Inertia::lazy(fn() => $this->computeStats()),
    'feed' => fn() => $request->inertiaPartial('feed')
        ? $this->getFeed()
        : Inertia::lazy(fn() => $this->getFeed()),
]);
```

---

## Related Topics

- Server Props — understanding the full prop pipeline
- Shared Data — partial reloads can exclude shared data
- Lazy Data Evaluation — lazy vs eager prop resolution
- Form Handling — combining form submissions with partial reloads
- Livewire Loading States — analogous pattern in Livewire

---

## AI Agent Notes

- Partial reloads use `X-Inertia-Partial-Data` and `X-Inertia-Partial-Component` headers
- Inertia v3 supports the `only` key on `router.reload()`
- Partial reloads work with all Inertia adapters (React, Vue, Svelte)
- The server always re-executes the full controller — no partial caching in Inertia core
- Use `$request->inertiaPartial('key')` convenience method in Laravel to check headers

---

## Verification

- `preserveScroll: true` is set on all in-page partial reloads
- `preserveState: true` is set when component state should be preserved
- Server-side prop closures use `$request->inertiaPartial()` to gate expensive computations
- Error handling (`onError`) is implemented for all partial reload calls
- Polling intervals are debounced to appropriate durations
