# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Lazy Data Evaluation
**Generated:** 2026-06-03

---

# Decision Inventory

* Lazy Prop vs Eager Prop for Expensive Computations
* Inertia::lazy() Helper vs Closure Prop
* Lazy Prop vs Partial Reload for On-Demand Data

---

# Architecture-Level Decision Trees

---

## Decision 1: Lazy Prop vs Eager Prop for Expensive Computations

---

## Decision Context

Whether to use `Inertia::lazy()` (deferring computation to a subsequent request) or eager evaluation for expensive prop computations.

---

## Decision Criteria

* Computation time of the prop (threshold: >200ms)
* Whether the prop data is needed for the initial page paint
* Whether the prop is below the fold or behind user interaction
* Whether SEO requires the data (SSR compatibility)

---

## Decision Tree

Is the prop needed for the initial page paint (above the fold, critical for layout)?
↓
YES → Use eager prop — must be available for initial render
NO → Does the computation take >200ms?
    YES → Is the prop behind user interaction (modal, tab, accordion)?
        YES → Use lazy prop — load on demand when user interacts
        NO → Is the prop below the fold (not visible on initial load)?
            YES → Use lazy prop — defer until needed
            NO → Use lazy prop — 200ms+ savings on initial load
    NO → Is the computation between 5ms and 200ms?
        YES → Use eager prop — round trip cost exceeds computation savings
        NO → (<5ms) Use eager prop — trivial computation, no benefit to deferring

---

## Rationale

Lazy props improve initial page load by deferring expensive computation. The 200ms threshold ensures the round trip cost is justified. Props needed for SEO must be eager (lazy props are unavailable during SSR). Props behind user interaction or below the fold are ideal lazy candidates regardless of computation cost.

---

## Recommended Default

**Default:** Eager for props under 200ms or needed for initial paint/SEO. Lazy for props over 200ms that are not needed immediately.
**Reason:** The 200ms threshold balances the tradeoff between initial load savings and round trip cost. Below 200ms, the additional HTTP request costs more than the computation saved.

---

## Risks Of Wrong Choice

* Lazy for cheap prop: Additional round trip for 5ms computation — slower perceived load
* Eager for expensive prop: Initial page load blocked by 2-second computation — high TTFB
* Lazy for SEO-required prop: Prop missing from SSR — search engine sees incomplete content
* Lazy without trigger mechanism: Prop deferred but never requested — user never sees the data

---

## Related Rules

* Lazy Only Above-Cost Computations

---

## Related Skills

* Defer Expensive Data with Lazy Props

---

---

## Decision 2: Inertia::lazy() Helper vs Closure Prop

---

## Decision Context

Whether to mark a prop as lazy using the explicit `Inertia::lazy(fn())` helper or a plain closure `fn() => ...`.

---

## Decision Criteria

* Whether the lazy intent should be self-documenting
* Whether the codebase uses the explicit helper consistently
* Whether the closure is the only way to defer or the helper is available
* Whether the team has a preference for explicitness

---

## Decision Tree

Is the team standard on using `Inertia::lazy()` for deferred props?
↓
YES → Use `Inertia::lazy(fn() => ...)` — consistent, self-documenting
NO → Does the application target Inertia v3 (where both work identically)?
    YES → Use either — both produce the same `LazyValue` instance
    NO → Does the team prefer explicit markers for deferred behavior?
        YES → Use `Inertia::lazy()` — clearly communicates intent
        NO → Use plain closure — simpler, fewer characters

---

## Rationale

`Inertia::lazy()` and plain closures produce the same behavior in Inertia v3. `Inertia::lazy()` is more explicit about the intent to defer. Plain closures are more concise. Consistency within the codebase matters more than which syntax is chosen.

---

## Recommended Default

**Default:** Use `Inertia::lazy()` — the explicit helper makes the lazy intent clear to future readers.
**Reason:** `Inertia::lazy()` serves as documentation that the prop is intentionally deferred. Without it, a new developer might not realize a closure delays execution. The explicitness is worth the extra characters.

---

## Risks Of Wrong Choice

* Plain closure mistaken for computed prop: "Is this a deferred prop or a computed transform?" — ambiguity
* `Inertia::lazy()` with no actual benefit: Wrapping a 1ms computation in `lazy()` — unnecessary
* Inconsistent usage: Some props use `lazy()`, others use closures — confusing
* `lazy()` on Inertia v2: Not supported — use closures for v2 compatibility

---

## Related Rules

* Inertia::lazy() for Explicit Lazy Intent

---

## Related Skills

* Defer Expensive Data with Lazy Props

---

---

## Decision 3: Lazy Prop vs Partial Reload for On-Demand Data

---

## Decision Context

Whether to load on-demand data via a lazy prop (deferred initial load, fetched automatically when needed) or a partial reload (triggered programmatically via `router.reload`).

---

## Decision Criteria

* Whether the data should load automatically when visible (Intersection Observer)
* Whether the data should be loaded programmatically (button click, after action)
* Whether the data should be included in the initial response or fetched separately
* Whether the data needs a user-triggered refresh pattern

---

## Decision Tree

Should the data load automatically when the component becomes visible (lazy loading)?
↓
YES → Use lazy prop — automatically fetched when the component renders
NO → Should the data be loaded programmatically (on button click, after form success)?
    YES → Use partial reload — `router.reload({ only: ['data'] })` on user action
    NO → Should the data be refreshed periodically (polling)?
        YES → Use partial reload — `router.reload()` in setInterval
        NO → Should the data be fetched only once, not on initial page load?
            YES → Use lazy prop — fetched once, then available like normal props
            NO → Use eager prop — data needed on initial load

---

## Rationale

Lazy props integrate with Inertia's automatic lazy resolution — they're fetched when the page component mounts and become available as normal props. Partial reloads provide programmatic control over when and which props to refresh. Lazy props are best for "load on mount, then stay" scenarios. Partial reloads are best for "refresh when user clicks" scenarios.

---

## Recommended Default

**Default:** Lazy props for "defer initial load" scenarios (below-fold sections, tabs). Partial reloads for "refresh on demand" scenarios (dashboard refresh button, post-action updates).
**Reason:** Lazy props are simpler for one-time deferred loading. Partial reloads are more flexible for repeated or programmatic refreshes.

---

## Risks Of Wrong Choice

* Partial reload for one-time defer: Must manually trigger on mount — more code than lazy prop
* Lazy prop for refresh scenario: Can't re-trigger lazy prop resolution — data goes stale
* Both mechanisms for same data: Two ways to load the same prop — conflicting, wasteful
* No loading states: User clicks refresh — no feedback that data is loading

---

## Related Rules

* Lazy for Deferred Initial Load, Partial Reload for Refresh

---

## Related Skills

* Defer Expensive Data with Lazy Props
* Implement Partial Reloads with Performance Optimizations
