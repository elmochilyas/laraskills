# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Partial Reloads
**Generated:** 2026-06-03

---

# Decision Inventory

* Inertia Partial Reload vs Full Page Navigation
* Partial Reload Only Requested Props vs Full Prop Refresh
* Polling with Partial Reload vs WebSocket for Live Data

---

# Architecture-Level Decision Trees

---

## Decision 1: Inertia Partial Reload vs Full Page Navigation

---

## Decision Context

Whether to use a partial reload (`router.reload()`) to refresh data on the current page or navigate to the same page via `router.visit()` (full page re-render).

---

## Decision Criteria

* Whether the page should re-render the component or just update props in-place
* Whether client-side state (form inputs, scroll position, open modals) should be preserved
* Whether the current page component should remount
* Whether all props need refreshing or only specific subsets

---

## Decision Tree

Does the user need to stay on the same page with updated data?
↓
YES → Should existing client-side state be preserved (form inputs, scroll, modals)?
    YES → Use `router.reload()` — preserves state, updates props in-place
    NO → Use `router.visit()` current URL — full page re-render, state reset
NO → Does the update need only a subset of props (not all)?
    YES → Use `router.reload({ only: ['specificProp'] })` — only requested props
    NO → Use `router.reload()` — full prop refresh without page navigation
NO → Is the user navigating to a different page?
    YES → Use `router.visit()` — that's page navigation, not data refresh
    NO → Use `router.reload()` — in-page data refresh

---

## Rationale

`router.reload()` re-fetches props from the server without changing the page component. It preserves client-side state (scroll, form inputs, open elements). `router.visit()` re-renders the page from scratch, losing client state. Use `reload()` when the user is already on the correct page and just needs fresh data.

---

## Recommended Default

**Default:** Use `router.reload()` with `preserveScroll: true` and `preserveState: true` for in-page data refreshes. Use `router.visit()` for actual page navigation.
**Reason:** `reload()` provides a seamless data refresh experience — no flicker, no state loss. `visit()` is for navigation, not refresh.

---

## Risks Of Wrong Choice

* `router.visit()` for data refresh: Page remounts, scroll resets, form inputs cleared — jarring UX
* `router.reload()` without preserve: Scroll resets to top, state lost — still disruptive
* `reload()` for different page: Reloads current page instead of navigating — broken navigation
* No visual feedback during reload: User doesn't know data is refreshing — perceived lag

---

## Related Rules

* Always Preserve Scroll and State

---

## Related Skills

* Implement Partial Reloads with Performance Optimizations

---

---

## Decision 2: Partial Reload Only Requested Props vs Full Prop Refresh

---

## Decision Context

Whether to use `router.reload({ only: [...] })` to request only specific props or `router.reload()` without `only` to refresh all page props.

---

## Decision Criteria

* Whether the page has expensive props that should be skipped on refresh
* Whether the refresh needs to update specific data or everything
* Whether server-side expensive computations should be gated with `$request->inertiaPartial()`
* Whether the component's other props are fresh enough

---

## Decision Tree

Does the page have expensive props (>200ms computation) that don't need refreshing?
↓
YES → Use `router.reload({ only: ['cheapProp'] })` — skip expensive props
NO → Does the refresh need to update a specific widget or section only?
    YES → Use `router.reload({ only: ['widgetData'] })` — target specific props
    NO → Does the server use `$request->inertiaPartial()` to gate expensive computations?
        YES → Partial reload with `only` — server skips unrequested expensive calculations
        NO → Use `router.reload()` with no `only` — refresh all props (only if all are cheap or need refresh)

---

## Rationale

Requesting only needed props reduces server computation and response payload size. The server should use `$request->inertiaPartial('propName')` to conditionally skip expensive computations when they're not requested. Without the `only` parameter, all props are re-computed and sent.

---

## Recommended Default

**Default:** Use `router.reload({ only: [specificProps] })` targeting specific data. Use full reload only when all props are cheap and need refreshing.
**Reason:** Partial reloads with `only` minimize server work and response size. Full reloads regenerate all props unnecessarily.

---

## Risks Of Wrong Choice

* Full reload with expensive props: 2-second computation runs on every reload — slow
* Partial reload without `only`: Server still computes all props but sends only requested ones — no perf gain
* Missing `only` that includes lazy prop: Lazy prop not requested — never loads
* Server doesn't gate expensive props: All props computed regardless of `only` — wasted computation

---

## Related Rules

* Use only for Partial Reloads

---

## Related Skills

* Implement Partial Reloads with Performance Optimizations

---

---

## Decision 3: Polling with Partial Reload vs WebSocket for Live Data

---

## Decision Context

Whether to use polling (repeated `router.reload()` at intervals) or WebSockets/SSE for real-time data updates.

---

## Decision Criteria

* Required update latency (seconds vs milliseconds)
* Whether the data changes frequently (every few seconds) or infrequently (every few minutes)
* Whether the application already has WebSocket infrastructure
* Whether battery/compute efficiency matters (mobile clients)

---

## Decision Tree

Is less than 1-second update latency required?
↓
YES → Use WebSocket/SSE — polling at this interval creates excessive server load
NO → Can the data tolerate 10-60 second update latency?
    YES → Does the data change frequently (every few seconds)?
        YES → Use WebSocket/SSE — polling would generate too many requests
        NO → Use polling with `router.reload()` — simple, works without additional infrastructure
    NO → Use WebSocket/SSE — polling can't meet the latency requirement
NO → Is WebSocket infrastructure already in place for other features?
    YES → Use WebSocket — consistent technology choice
    NO → Use polling with partial reload — no additional infrastructure, sufficient for infrequent updates

---

## Rationale

Polling with `router.reload()` is simple and requires no additional infrastructure. It's appropriate for non-critical data that updates every 30-60 seconds (dashboard stats, notification counts). WebSockets are necessary for sub-second latency, frequent updates, or data that changes multiple times per second.

---

## Recommended Default

**Default:** Polling with `router.reload()` at 30-second intervals for non-critical live data. WebSocket/SSE for critical real-time data requiring sub-second updates.
**Reason:** Polling is simple, requires no infrastructure, and is sufficient for most "live data" use cases (dashboards, monitoring). WebSocket infrastructure adds significant complexity.

---

## Risks Of Wrong Choice

* Polling at 1-second intervals: 60 requests/minute per client — server load, mobile battery drain
* WebSocket for 30-second updates: Infrastructure overkill — polling would work fine
* Polling with no backoff: Dashboard tab left open overnight — requests continue indefinitely
* No error handling on poll failure: Reload fails silently — data stays stale, no retry

---

## Related Rules

* Polling for Non-Critical Live Data

---

## Related Skills

* Implement Partial Reloads with Performance Optimizations
