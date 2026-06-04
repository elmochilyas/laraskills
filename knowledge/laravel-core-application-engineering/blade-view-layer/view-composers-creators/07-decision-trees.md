# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** View Composers and Creators
**Generated:** 2026-06-03

---

# Decision Inventory

* View Composer vs Controller Data Delivery
* View Composer vs @inject
* Wildcard vs Scoped Composer Registration

---

# Architecture-Level Decision Trees

---

## Decision 1: View Composer vs Controller Data Delivery

---

## Decision Context

Whether to provide data to a view via a view composer (automatic, global) or by passing it explicitly from the controller.

---

## Decision Criteria

* Number of controller actions / views that need the data
* Whether the data source changes between views
* Whether the data is truly global or page-specific

---

## Decision Tree

Is the data needed by exactly one controller action?
↓
YES → Controller data — pass explicitly in `return view('page', compact('data'))`
NO → Is the data needed by 2-5 related views?
    YES → View composer scoped to those specific views
    NO → Is the data needed by 6+ views or all views?
        YES → Is the data truly global (current user, app name, locale)?
            YES → Wildcard view composer `View::composer('*', ...)` is appropriate
            NO → Scope the composer to specific view names/namespaces
NO → Does the same controller action pass this data manually to multiple views?
    YES → View composer (eliminates duplication)
    NO → Controller data is simpler

---

## Rationale

Controller data is explicit, testable, and visible in the method signature. View composers are automatic but create hidden data flow. For data used across many views, composers eliminate duplication. For single-action data, the controller is the right place.

---

## Recommended Default

**Default:** Controller data for single-action data; view composer for data shared across 3+ views
**Reason:** Controller data is explicit and testable. Composers eliminate repetition for shared data but add indirection.

---

## Risks Of Wrong Choice

* Composer for single-action data: Hidden data flow, confusing to debug
* Controller data for global data: Repeated in every action, easy to forget
* Composer with controller-overlapping names: Silent data override

---

## Related Rules

* Centralize All Composer Registration in a Dedicated ViewServiceProvider (05-rules.md)
* Prevent Silent Data Override Between Composers and Controllers (05-rules.md)

---

## Related Skills

* Skill: Implement View Composers for Shared Data

---

## Decision 2: View Composer vs @inject

---

## Decision Context

Whether to provide shared view data via a view composer (automatic data injection per view registration) or via `@inject` (manual service resolution in the template).

---

## Decision Criteria

* Whether the data is needed by multiple views or a single template
* Whether the data source may change (requiring template updates)
* Whether the data needs caching or transformation before display

---

## Decision Tree

Is the data needed by 3+ different views?
↓
YES → View composer — registered once, consistent across all matching views
NO → Is the data used in exactly one template?
    YES → `@inject` — simpler than creating a dedicated composer class
    NO → 2 views — either pattern works; prefer composer for future-proofing
NO → Does the data need caching, transformation, or combination of multiple sources?
    YES → View composer — composer class can contain caching and transformation logic
    NO → Simple read from a singleton service?
        YES → `@inject` — direct service access
        NO → View composer
NO → Could the service interface change in the future?
    YES → View composer (change one composer, not every template using @inject)
    NO → @inject

---

## Rationale

A view composer is registered once and applies to all matching views automatically. `@inject` must be added to every template individually. For data needed across many views, composers provide a single registration point. For one-off service access, `@inject` avoids creating a dedicated composer class.

---

## Recommended Default

**Default:** View composer for data shared across 3+ views; @inject for one-off service access in a single template
**Reason:** Composers centralize registration and provide caching/transformation capabilities. @inject is simpler for single-template usage.

---

## Risks Of Wrong Choice

* @inject across 5+ templates: Inconsistent application, high maintenance
* Composer for single template: Overhead of creating a class for one usage
* @inject with uncached query: Query runs on every render, no caching layer

---

## Related Rules

* Prefer View Composers Over `@inject` for Shared Data (view-composers-creators/05-rules.md)
* Use `@inject` Only for Non-Entity, Read-Only Services (service-injection/05-rules.md)

---

## Related Skills

* Skill: Implement View Composers for Shared Data
* Skill: Use @inject for Non-Entity Read-Only Services

---

## Decision 3: Wildcard vs Scoped Composer Registration

---

## Decision Context

Whether to register a composer with wildcard (`*` — all views) or scope it to specific view names/namespaces.

---

## Decision Criteria

* How many views actually need the data
* How expensive the data retrieval is
* Whether the data is truly universal (all views) or section-specific

---

## Decision Tree

Is the data needed by EVERY single view in the application (current user, app name, locale)?
↓
YES → Wildcard `View::composer('*', ...)` — but cache expensive queries
NO → Does the data need caching or DB queries?
    YES → Avoid wildcard — scope to specific views or namespaces
    NO → Is the data needed by more than 50% of views?
        YES → Wildcard may be acceptable for lightweight data (no queries)
        NO → Scoped composer — don't compute data that most views don't use
NO → Do multiple views share the same need (e.g., all admin views)?
    YES → Namespace-scoped composer: `View::composer('admin.*', ...)`
NO → Is the data needed by a handful of specific views?
    YES → View-specific composer: `View::composer(['view1', 'view2'], ...)`
    NO → Don't use a composer — pass data from controller

---

## Rationale

Wildcard composers run on EVERY view render — including partials, components, and emails. Computing data that only 20% of views use wastes resources on the other 80%. Scoped composers run only when the matching view renders, eliminating unnecessary overhead.

---

## Recommended Default

**Default:** Scoped composers for section-specific or view-specific data; wildcard only for truly universal data with cached queries
**Reason:** Unnecessary computation in wildcard composers multiplies across all renders. Scoping eliminates overhead for unrelated views.

---

## Risks Of Wrong Choice

* Wildcard with DB query: Query runs 50 times per page on partials
* Wildcard for admin-only data: Data computed on public pages unnecessarily
* Too-narrow scoping: Composer forgotten for a view that needs the data
* Multiple wildcard composers: Each runs on every render, cumulative overhead

---

## Related Rules

* Avoid Wildcard Composers for Global Data That Most Views Do Not Use (05-rules.md)
* Cache Expensive Queries in Wildcard Composers (05-rules.md)

---

## Related Skills

* Skill: Implement View Composers for Shared Data
