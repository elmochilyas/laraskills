# Skill: Implement Partial Reloads with Performance Optimizations

## Purpose

Use Inertia's `router.reload()` to refresh specific page props in-place, with scroll/state preservation, performance guards, and error handling.

## When To Use

- Refreshing stale data without navigating away (dashboard widgets, feed data)
- Polling for updates at regular intervals (30s refresh)
- After form mutation — refresh a list or stats after successful submission
- Re-fetching lazy props that were deferred on initial page load

## When NOT To Use

- Initial page data fetching (use server props)
- Real-time data needing instant updates (use WebSockets/SSE)
- Navigation to a different page (use `router.visit()`)

## Prerequisites

- `@inertiajs/react`, `@inertiajs/vue3`, or `@inertiajs/svelte` installed
- Controller endpoint that returns the page's props

## Inputs

- List of prop keys to refresh (`only` array)
- Trigger mechanism (polling interval, user action, form success callback)
- Error handling strategy

## Workflow

1. Identify which props need periodic or event-driven refreshing
2. On the server, wrap expensive prop computations in closures with `$request->inertiaPartial()` guards:
   ```php
   'stats' => fn() => $request->inertiaPartial('stats')
       ? $this->computeStats()
       : Inertia::lazy(fn() => $this->computeStats()),
   ```
3. On the client, call `router.reload()` with `only`, `preserveScroll`, and `preserveState`:
   ```jsx
   router.reload({
       only: ['stats'],
       preserveScroll: true,
       preserveState: true,
   });
   ```
4. Add an `onError` callback to handle failures gracefully
5. For polling, use `setInterval` with minimum 3000ms interval and cleanup on unmount
6. Debounce rapid user-triggered reloads (e.g., search-as-you-type)
7. Always specify the `only` array — never reload all props when only a subset is needed

## Validation Checklist

- [ ] `preserveScroll: true` set on all in-page partial reloads
- [ ] `preserveState: true` set when component state should be preserved
- [ ] Server-side prop closures use `$request->inertiaPartial()` to gate expensive computations
- [ ] `onError` callback implemented for all partial reload calls
- [ ] Polling intervals set to minimum 3 seconds
- [ ] `only` array always specified (never omit unless full reload is intentional)
- [ ] `router.reload()` not used for navigation (use `router.visit()` instead)

## Common Failures

- Omitting `preserveScroll` — page scrolls to top on every reload (jarring UX)
- No `inertiaPartial` guard on server — expensive prop computed on every request
- Partial reload on wrong page — user navigated before response arrived, response discarded
- Omitting `preserveState` — form inputs and component state reset during reload
- Over-polling without debounce — request storms overwhelm the server

## Decision Points

- Use `only` array to request specific props. If only one prop changed, don't reload everything
- Use WebSockets instead of partial reloads for sub-second real-time updates
- If the partial reload is background data warming with no user-facing dependency, errors can be logged silently

## Performance Considerations

Partial reloads boot the full Laravel framework and re-execute the controller. Savings are in serialization and transfer — only requested props are encoded. Use `$request->inertiaPartial()` to skip non-requested prop computation. Minimum 3-second polling interval to prevent server overload.

## Security Considerations

Partial reloads execute the same controller code with the same middleware — authorization applies identically. The `X-Inertia-Partial-Component` header is client-provided — server validates it but don't trust it for authorization.

## Related Rules

- Always Preserve Scroll and State (05-rules.md)
- Gate Expensive Props with inertiasPartial (05-rules.md)
- Debounce Rapid Reloads (05-rules.md)
- Handle Partial Reload Errors (05-rules.md)
- Specify only Key to Avoid Over-Reloading (05-rules.md)
- Do Not Use Partial Reloads for Navigation (05-rules.md)

## Related Skills

- Defer Expensive Data with Lazy Props (inertia/lazy-data-evaluation)
- Implement a Secure Inertia Form with Validation (inertia/form-handling)
- Set Up Typed Server Props with Secure Serialization (inertia/server-props)

## Success Criteria

- In-page data refreshes without full navigation — URL unchanged, page doesn't remount
- Scroll position and component state preserved during reload
- Expensive server computations gated behind `inertiaPartial` — not wasted on every request
- Failed reloads show user-friendly error messages
- Rapid polling doesn't overwhelm the server (debounced to appropriate interval)
