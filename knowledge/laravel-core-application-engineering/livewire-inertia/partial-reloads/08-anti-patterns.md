# Inertia Partial Reloads — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Partial Reloads |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Missing preserveScroll and preserveState
2. No inertiasPartial Guard on Expensive Server Props
3. Partial Reload Without Only Key (Over-Reloading)
4. Over-Polling Without Debounce
5. Using Partial Reload for Page Navigation

---

## Repository-Wide Anti-Patterns

- **No error handling on partial reload**: Failed reloads leave stale data with no user feedback.
- **Partial reload as initial data fetch**: Using partial reload instead of passing data as initial props defeats server-driven props.
- **Lazy passthrough without inertiasPartial**: Expensive prop computed on every page load even when not requested.
- **Cross-page partial reload**: Calling router.reload() after the user has navigated to a different page.

---

## Anti-Pattern 1: Missing preserveScroll and preserveState

### Category

UX

### Description

Calling `router.reload()` without setting `preserveScroll: true` and `preserveState: true`, causing the page to scroll to the top and reset component state during in-page data refreshes.

### Why It Happens

Developers may not know these options exist or may not realize that Inertia defaults to resetting scroll and state on every reload. The default behavior is designed for full navigations, not in-page refreshes.

### Warning Signs

- Page scrolls to top on every partial reload
- Form inputs are cleared after a data refresh
- Open dropdowns, accordions, or modals close during refresh
- Users complain about "jumping" page behavior

### Why Harmful

Without `preserveScroll: true`, the browser scrolls to the top of the page on every partial reload, creating a jarring UX. Without `preserveState: true`, any component state (form inputs, open dropdowns, accordion toggles) is discarded. The user loses their place and their input.

### Consequences

- Jarring scroll-to-top on every data refresh
- Lost user input in forms during background refreshes
- Collapsed UI elements that were open
- Users perceive the application as unstable

### Alternative

Always set `preserveScroll: true` and `preserveState: true` on every non-navigation partial reload. Omit only when the reload should intentionally reset the page state.

### Refactoring Strategy

1. Search all `router.reload()` calls in the codebase
2. Add `preserveScroll: true` and `preserveState: true` to each
3. For any reload that should intentionally reset state, document the reason explicitly

### Detection Checklist

- [ ] Every `router.reload()` call has `preserveScroll: true`
- [ ] Every `router.reload()` call has `preserveState: true`
- [ ] No scroll-to-top behavior during in-page refreshes
- [ ] Form inputs and component state survive partial reloads

### Related Rules

- Always Preserve Scroll and State (05-rules.md)

### Related Skills

- Implement Partial Reloads with Performance Optimizations (06-skills.md)

### Related Decision Trees

- Inertia Partial Reload vs Full Page Navigation (07-decision-trees.md)

---

## Anti-Pattern 2: No inertiasPartial Guard on Expensive Server Props

### Category

Performance

### Description

Failing to use `$request->inertiaPartial('key')` in expensive prop closures, causing the expensive computation to run on every request regardless of whether the prop was requested.

### Why It Happens

Developers may not realize that the server re-executes the full controller on every partial reload, including all prop closures. Without explicit guards, every closure runs on every request.

### Warning Signs

- Partial reloads are as slow as full page loads
- Expensive database queries run on every polling interval even for unrelated prop refreshes
- Server CPU usage is high even when only lightweight props are being refreshed

### Why Harmful

When a partial reload requests only `['stats']`, the server still executes the full controller, including all prop closures. Without `inertiaPartial` guards, expensive props like charts, feeds, and aggregations are computed on every request even when they are not requested. This wastes CPU and database resources.

### Consequences

- Expensive computations on every request, not just when needed
- High database load from unnecessary queries
- Slow partial reloads that negate the performance benefit
- Poor scalability — server does more work than necessary

### Alternative

Wrap every expensive prop computation in a check for the partial reload header. Compute the expensive value only when the client explicitly requests it. Return a lazy value otherwise.

### Refactoring Strategy

1. Identify expensive prop closures in controllers
2. Add `$request->inertiaPartial('key')` guards: compute when requested, return lazy otherwise
3. For cheap props (<5ms), skip the guard as the complexity is not justified

### Detection Checklist

- [ ] All expensive prop closures use `$request->inertiaPartial()` guards
- [ ] Partial reloads are noticeably faster than full page loads
- [ ] Server CPU and DB load is proportional to the number of requested props
- [ ] Cheap props (<5ms) do not have guards (unnecessary complexity)

### Related Rules

- Gate Expensive Props with inertiasPartial (05-rules.md)

### Related Skills

- Implement Partial Reloads with Performance Optimizations (06-skills.md)

### Related Decision Trees

- Partial Reload Only Requested Props vs Full Prop Refresh (07-decision-trees.md)

---

## Anti-Pattern 3: Partial Reload Without Only Key (Over-Reloading)

### Category

Performance

### Description

Calling `router.reload()` without specifying the `only` array, causing ALL page props to be re-fetched when only a subset is needed.

### Why It Happens

Developers call `router.reload()` thinking it refreshes the current page. Without the `only` parameter, it does — but it refreshes every prop, which is usually unnecessary.

### Warning Signs

- `router.reload()` calls without the `only` key
- Same data sent repeatedly across partial reloads
- Response payload for partial reload is the same size as a full page load

### Why Harmful

A partial reload without `only` re-fetches ALL page props, including shared data, static content, and other unchanged data. This negates the performance benefit of partial reloads — the full controller runs, full JSON is serialized, and full response is transferred. Only the component re-render is optimized.

### Consequences

- Unnecessary serialization and transfer of unchanged props
- Bandwidth waste — same data sent repeatedly
- No performance benefit over a full page navigation
- Server does unnecessary work for every reload

### Alternative

Explicitly list the props that need refreshing in the `only` array. Omit `only` only when every prop on the page genuinely needs re-fetching.

### Refactoring Strategy

1. Search for `router.reload()` calls without `only`
2. Determine which props actually need refreshing at each trigger point
3. Add the `only` array with the specific props needed
4. For the rare case where all props need refresh, add a comment explaining why

### Detection Checklist

- [ ] Every `router.reload()` call specifies an `only` array
- [ ] Response payload size is proportional to the number of requested props
- [ ] No unchanged props are transferred on partial reload
- [ ] Full reloads (no `only`) are explicitly documented with rationale

### Related Rules

- Specify only Key to Avoid Over-Reloading (05-rules.md)

### Related Skills

- Implement Partial Reloads with Performance Optimizations (06-skills.md)

### Related Decision Trees

- Partial Reload Only Requested Props vs Full Prop Refresh (07-decision-trees.md)

---

## Anti-Pattern 4: Over-Polling Without Debounce

### Category

Performance

### Description

Polling with `router.reload()` at sub-second intervals or without debouncing, causing request storms that overwhelm the server.

### Why It Happens

Developers want "real-time" updates and set aggressive polling intervals (500ms-1000ms). They may not understand the cost of each request — every poll boots the full Laravel framework, runs middleware, and executes the controller.

### Warning Signs

- Polling interval set to less than 3000ms
- Multiple `router.reload()` calls in quick succession from user-triggered events (scroll, resize)
- Server CPU spikes correlated with active users on pages with polling
- Request queue backup during peak usage

### Why Harmful

Rapid partial reloads (sub-second intervals) create request storms that overwhelm the server. Each request boots the full Laravel framework, runs middleware, and executes the controller. Even lightweight controllers become expensive at 10+ requests per second.

### Consequences

- Server overload from excessive requests
- Request queue backs up, affecting all users
- Application becomes unresponsive under load
- Mobile battery drain from frequent network requests
- Wasted bandwidth from redundant data fetches

### Alternative

Set polling intervals to a minimum of 3000ms (preferably 10000-30000ms). Debounce user-triggered rapid reloads. For sub-second real-time updates, use WebSockets or Server-Sent Events.

### Refactoring Strategy

1. Identify all polling intervals in the codebase
2. Increase intervals to minimum 3000ms (preferably 30000ms)
3. Add debouncing for user-triggered reloads (search-as-you-type, scroll-based)
4. For features needing sub-second updates, evaluate WebSocket/SSE migration
5. Add cleanup (`clearInterval`) in component unmount to prevent orphaned polling

### Detection Checklist

- [ ] All polling intervals are >= 3000ms
- [ ] User-triggered reloads are debounced
- [ ] Polling is cleaned up on component unmount
- [ ] Server load from polling is within acceptable limits
- [ ] No polling interval below 1000ms exists

### Related Rules

- Debounce Rapid Reloads (05-rules.md)

### Related Skills

- Implement Partial Reloads with Performance Optimizations (06-skills.md)

### Related Decision Trees

- Polling with Partial Reload vs WebSocket for Live Data (07-decision-trees.md)

---

## Anti-Pattern 5: Using Partial Reload for Page Navigation

### Category

Framework Usage

### Description

Using `router.reload()` to navigate to a different page or section instead of `router.visit()`, creating an inconsistent URL/content state.

### Why It Happens

Developers may use `router.reload()` as a "refresh the page" mechanism and not distinguish between refreshing data on the current page and navigating to a new page. The API surface of `reload()` and `visit()` is similar, so the wrong choice is easy to make.

### Warning Signs

- URL shows one page, content shows another
- Browser back/forward buttons don't work as expected
- `router.reload()` used after form submission to show the result page
- Reload triggered with `only` array that changes the entire page content

### Why Harmful

`router.reload()` does not change the URL, does not trigger a full page component swap, and does not run a new controller — it re-executes the current controller and re-renders the existing page component. Using it for navigation creates an inconsistent URL state (the URL shows page A, but the content is from page B). Browser history is broken.

### Consequences

- URL/content mismatch — URL shows dashboard, content shows settings
- Browser back/forward navigation broken
- Page component not swapped — stale event listeners and state persist
- Cannot share or bookmark the URL — it shows the wrong page

### Alternative

Use `router.visit()` for page navigation (changes URL, swaps component). Use `router.reload()` exclusively for re-fetching props on the current page without changing the URL.

### Refactoring Strategy

1. Search for `router.reload()` calls that change the URL or content entirely
2. Replace each with `router.visit()` targeting the correct route
3. For post-form navigation, use the redirect response from the server (Inertia handles it)
4. Verify that URLs match page content after all navigations

### Detection Checklist

- [ ] All page navigations use `router.visit()`, Inertia `<Link>`, or server redirect
- [ ] `router.reload()` is used only for in-page data refresh
- [ ] URL always matches the displayed page content
- [ ] Browser back/forward works correctly for all navigations

### Related Rules

- Do Not Use Partial Reloads for Navigation (05-rules.md)

### Related Skills

- Implement Partial Reloads with Performance Optimizations (06-skills.md)

### Related Decision Trees

- Inertia Partial Reload vs Full Page Navigation (07-decision-trees.md)
