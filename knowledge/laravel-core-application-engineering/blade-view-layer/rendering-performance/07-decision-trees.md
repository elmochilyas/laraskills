# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Rendering Performance
**Generated:** 2026-06-03

---

# Decision Inventory

* Data Preparation Location (Controller vs View Model vs Template)
* Caching Strategy for View Partials
* View Composition Depth

---

# Architecture-Level Decision Trees

---

## Decision 1: Data Preparation Location (Controller vs View Model vs Template)

---

## Decision Context

Where to perform data preparation (queries, formatting, computations) before template rendering — in the controller, in a view model, or directly in the template.

---

## Decision Criteria

* Whether the data comes from database queries (N+1 risk)
* Whether the data needs formatting (currency, dates, status badges)
* Whether the data is for a single view or multiple views
* Whether the data is expensive to compute

---

## Decision Tree

Does the data involve database queries (Eloquent relationships, raw SQL)?
↓
YES → Controller (eager load with `with()` or `load()`) — NEVER in template
NO → Does the data need complex formatting (currency, dates, conditional CSS classes)?
    YES → Is the formatting needed in the loop (multiple items)?
        YES → View model — pre-compute in constructor, pay cost once per item
        NO → Single item view (show page)?
            YES → View model for consistency, or helper function for simple formatting
NO → Is the data from cached sources (config, settings, navigation)?
    YES → View composer or cached service — not in controller or template
NO → Is the data trivial (simple variable interpolation like `$user->name`)?
    YES → Controller → Template directly — no view model needed

---

## Rationale

Database queries in templates cause N+1 problems and are invisible to profiling. Formatting in loops multiplies cost by collection size. View models pre-compute display values once per item. Simple interpolation needs no special treatment.

---

## Recommended Default

**Default:** Controller for eager loading queries; view model for formatting and computed values; template for display only
**Reason:** ~95% of rendering time is data preparation. Eager loading in controller eliminates N+1. View models pre-compute formatting once per item, not per render.

---

## Risks Of Wrong Choice

* Queries in template: N+1, invisible to profiling, untestable
* Formatting in `@foreach`: Cost multiplies by collection size on every render
* View model for simple interpolation: Unnecessary class ceremony
* All in controller for shared data: Repeated across actions, DRY violation

---

## Related Rules

* Eager Load All View Data Before Calling `view()` (05-rules.md)
* Never Write Database Queries Inside `@php` Blocks (05-rules.md)
* Pre-Compute Formatted Values in View Models (05-rules.md)

---

## Related Skills

* Skill: Profile and Optimize Slow View Rendering

---

## Decision 2: Caching Strategy for View Partials

---

## Decision Context

Whether to cache the rendered HTML output of a view partial (sidebar, navigation, footer) to avoid redundant rendering.

---

## Decision Criteria

* How frequently the partial's data changes
* How expensive the partial is to render (queries, computation)
* Whether the partial appears on many pages
* Whether the partial content is user-specific

---

## Decision Tree

Does the partial appear on 50%+ of all pages (sidebar, navigation, footer)?
↓
NO → Caching likely not worth the complexity — let it render fresh each time
YES → Does the partial contain user-specific data (unread notifications, personalized recommendations)?
    YES → Cache per-user with user-specific key: `cache()->remember("sidebar.{$user->id}", ...)`
    NO → Is the partial's data expensive to render (database queries, API calls)?
        YES → Does the data change frequently (<5 minutes)?
            YES → Short TTL (60-300 seconds) or don't cache — stale data risk
            NO → Cache with long TTL (3600+ seconds):
                `cache()->remember('sidebar_html', 3600, fn() => view('sidebar', [...])->render())`
NO → Is the partial data static and rarely changed?
    YES → Cache indefinitely with cache invalidation on data change
    NO → Don't cache — overhead of cache management exceeds rendering cost

---

## Rationale

A sidebar with dynamic navigation that queries the database on every page render wastes resources when the sidebar content changes infrequently. Caching the rendered HTML eliminates the query cost and rendering cost on every request. The caching ROI is proportional to page traffic.

---

## Recommended Default

**Default:** Cache rendered HTML for expensive, rarely-changing partials (sidebars, navigation, footers) with 3600s TTL
**Reason:** These partials appear on every page but change infrequently. Caching eliminates database queries on every request.

---

## Risks Of Wrong Choice

* No caching for expensive partial: Query runs on every page view across all pages
* Global caching for user-specific data: Users see wrong notification counts
* Too-short TTL: Cache misses frequently, negating benefits
* Too-long TTL: Stale navigation persists after content update

---

## Related Rules

* Cache Rendered Partials for Expensive, Rarely-Changing Sections (05-rules.md)

---

## Related Skills

* Skill: Profile and Optimize Slow View Rendering

---

## Decision 3: View Composition Depth

---

## Decision Context

How many levels of view inheritance, includes, and component nesting to allow before performance degrades.

---

## Decision Criteria

* Number of `@extends` / `@include` / component nesting levels
* Whether each level adds meaningful abstraction
* Whether the composition is standard or a design system

---

## Decision Tree

How many levels of view composition (extends + includes + components) exist on a single page?
↓
1-3 levels → Acceptable — no performance concern
4 levels → Evaluate: Does each level add meaningful separation?
    YES → 4 levels may be acceptable but optimize data flow (eager load upstream)
    NO → Flatten: combine levels or refactor to reduce depth
5+ levels → Refactor required — performance overhead is measurable (0.5-2ms per page)
    1. Combine deep inheritance chains into flatter compositions
    2. Move data preparation upstream so deep components don't add queries
    3. Consider if the deep nesting is from a design system (exception)

---

## Rationale

Each level of `@include`, `@extends`, or component composition adds method call overhead, file resolution, and scope management. Beyond 3 levels, the cumulative overhead becomes measurable. Flatter compositions are faster and easier to maintain.

---

## Recommended Default

**Default:** Maximum 3 levels of view composition depth. Flatten deeper structures.
**Reason:** 3 levels provide sufficient organizational abstraction without measurable performance overhead. Beyond 3, the complexity and rendering cost grow disproportionately.

---

## Risks Of Wrong Choice

* 5+ levels: 0.5-2ms overhead per page, hard to debug, easy to trace
* 0 levels (everything in one file): Poor separation of concerns, no reuse
* Deep design system nesting: Complex composition for small UI changes

---

## Related Rules

* Limit View Composition Depth to 3 Levels (05-rules.md)

---

## Related Skills

* Skill: Profile and Optimize Slow View Rendering
