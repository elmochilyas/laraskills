## Rule: Always Preserve Scroll and State

Pass `preserveScroll: true` and `preserveState: true` on every non-navigation partial reload.

---

## Category

UX

---

## Rule

Whenever calling `router.reload()` for in-page data refresh (not navigation), set both `preserveScroll: true` and `preserveState: true`. Do not rely on defaults.

---

## Reason

Without `preserveScroll: true`, the browser scrolls to the top of the page on every partial reload, creating a jarring UX. Without `preserveState: true`, any component state (form inputs, open dropdowns, accordion toggles) is discarded. Setting both ensures the reload is invisible to the user — data updates without any visual disruption.

---

## Bad Example

```jsx
router.reload({ only: ['feed'] });
// Scrolls to top, resets form inputs
```

---

## Good Example

```jsx
router.reload({
    only: ['feed'],
    preserveScroll: true,
    preserveState: true,
});
```

---

## Exceptions

When a partial reload should intentionally reset the page state (e.g., after a mutation that invalidates form data), omit `preserveState: true`. Always include `preserveScroll: true` unless the user should be scrolled to the top.

---

## Consequences Of Violation

UX risks: jarring scroll-to-top, lost user input. User frustration: form data disappears during refresh.

---

## Rule: Gate Expensive Props with inertiasPartial

Use `$request->inertiaPartial('key')` in prop closures to avoid computing props that are not being reloaded.

---

## Category

Performance

---

## Rule

Wrap every expensive prop computation in a check for the partial reload header. Compute the expensive value only when the client explicitly requests it. Return a lazy value otherwise.

---

## Reason

When a partial reload requests only `['stats']`, the server still executes the full controller, including all prop closures. Without `inertiaPartial` guards, expensive props like charts, feeds, and aggregations are computed on every request even when they are not requested. This wastes CPU and DB resources.

---

## Bad Example

```php
return Inertia::render('Dashboard', [
    'user' => Auth::user(),
    'stats' => fn() => $this->computeStats(), // Computed on every request
]);
```

---

## Good Example

```php
return Inertia::render('Dashboard', [
    'user' => Auth::user(),
    'stats' => fn() => $request->inertiaPartial('stats')
        ? $this->computeStats()
        : Inertia::lazy(fn() => $this->computeStats()),
]);
```

---

## Exceptions

For cheap props (<5ms computation), the `inertiaPartial` guard adds unnecessary complexity. Only guard props whose computation is measurably expensive.

---

## Consequences Of Violation

Performance risks: expensive computations on every request, not just when needed. Scalability risks: CPU and database resources wasted.

---

## Rule: Debounce Rapid Reloads

Debounce polling-based partial reloads to a minimum 3-second interval.

---

## Category

Performance

---

## Rule

When using `setInterval` or `setTimeout` for polling with `router.reload()`, set the interval to no less than 3000ms. Clear the interval when the component unmounts. Implement debouncing for user-triggered rapid reloads.

---

## Reason

Rapid partial reloads (sub-second intervals) create request storms that overwhelm the server. Each request boots the full Laravel framework, runs middleware, and executes the controller. Even lightweight controllers become expensive at 10+ requests per second. A 3-second minimum interval balances freshness with server load.

---

## Bad Example

```jsx
useEffect(() => {
    const interval = setInterval(() => {
        router.reload({ only: ['feed'] });
    }, 500); // 2 requests per second — excessive
    return () => clearInterval(interval);
}, []);
```

---

## Good Example

```jsx
useEffect(() => {
    const interval = setInterval(() => {
        router.reload({ only: ['feed'], preserveScroll: true });
    }, 30000); // Every 30 seconds — reasonable
    return () => clearInterval(interval);
}, []);
```

---

## Exceptions

Real-time features (chat, notifications) that genuinely need sub-second updates should use WebSockets or Server-Sent Events instead of partial reload polling. Partial reloads are not designed for real-time data.

---

## Consequences Of Violation

Performance risks: server overload from excessive requests. Scalability risks: request queue backs up, affecting all users.

---

## Rule: Handle Partial Reload Errors

Always provide an `onError` callback for partial reloads to handle failure gracefully.

---

## Category

Reliability

---

## Rule

Pass an `onError` callback to every `router.reload()` call. Use it to show a user-facing error message, retry, or log the failure. Never assume a partial reload will succeed.

---

## Reason

A failed partial reload (network error, server error, timeout) leaves the page in its current state with stale data. Without `onError`, the user has no indication that the refresh failed — they see old data and assume it is current. This can lead to decisions based on stale information.

---

## Bad Example

```jsx
router.reload({ only: ['stats'] });
// Silent failure — user sees stale data with no indication
```

---

## Good Example

```jsx
router.reload({
    only: ['stats'],
    onError: () => setShowError(true),
});
// Fallback: show error toast, stale data still visible
```

---

## Exceptions

If a partial reload is purely background data warming (no user-facing component depends on the result), the error can be logged silently without user notification.

---

## Consequences Of Violation

Reliability risks: stale data shown without user awareness. UX: no feedback when data refresh fails.

---

## Rule: Specify only Key to Avoid Over-Reloading

Always pass the `only` array when only specific props need refreshing. Never omit `only` unless the full set of props is required.

---

## Category

Performance

---

## Rule

Explicitly list the props that need refreshing in the `only` array. Do not call `router.reload()` without an `only` key unless every prop on the page genuinely needs re-fetching.

---

## Reason

A partial reload without `only` re-fetches ALL page props, including shared data, static content, and other unchanged data. This negates the performance benefit of partial reloads — the full controller runs, full JSON is serialized, and full response is transferred. Only the component re-render is optimized.

---

## Bad Example

```jsx
// Reloads everything — wasteful
router.reload({ preserveScroll: true });
```

---

## Good Example

```jsx
// Reloads only the changed prop
router.reload({
    only: ['stats'],
    preserveScroll: true,
});
```

---

## Exceptions

When a page's entire data set changes (e.g., switching between tabs that load completely different data), a full reload without `only` may be appropriate.

---

## Consequences Of Violation

Performance risks: unnecessary serialization and transfer of unchanged props. Bandwidth waste: same data sent repeatedly.

---

## Rule: Do Not Use Partial Reloads for Navigation

Use `router.visit()` for page navigation and `router.reload()` for in-page data refresh. Never mix the two.

---

## Category

Framework Usage

---

## Rule

Use `router.reload()` exclusively for re-fetching props on the current page without changing the URL. Use `router.visit()`, `router.post()`, or Inertia links for navigation to a different page.

---

## Reason

`router.reload()` does not change the URL, does not trigger a full page component swap, and does not run a new controller — it re-executes the current controller and re-renders the existing page component. Using it for navigation creates an inconsistent URL state (the URL shows page A, but the content is from page B).

---

## Bad Example

```jsx
// Partial reload that should be a navigation
router.reload({ only: ['settings'] });
// URL still shows /dashboard, content shows settings
```

---

## Good Example

```jsx
// Navigation
router.visit('/settings');

// In-page data refresh
router.reload({ only: ['feed'], preserveScroll: true });
```

---

## Exceptions

None. The two methods serve fundamentally different purposes and must not be substituted.

---

## Consequences Of Violation

Reliability risks: URL/content mismatch, browser back/forward broken. UX: confusing navigation behavior.
