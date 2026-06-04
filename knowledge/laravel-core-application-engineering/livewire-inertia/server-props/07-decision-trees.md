# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Server Props
**Generated:** 2026-06-03

---

# Decision Inventory

* Direct Model Pass vs Explicit Serialization for Eloquent Models
* Eager Props vs Lazy Props for Expensive Data
* Controller-Side Prop Shaping vs API Resource Classes

---

# Architecture-Level Decision Trees

---

## Decision 1: Direct Model Pass vs Explicit Serialization for Eloquent Models

---

## Decision Context

Whether to pass Eloquent model instances directly to `Inertia::render()` or serialize them explicitly via `toArray()`, API Resources, or manual arrays.

---

## Decision Criteria

* Whether the model has hidden attributes (`$hidden`) that must never leak
* Whether the model has appended attributes that should be included
* Whether the client needs all model attributes or a subset
* Whether the model has eager-loaded relationships

---

## Decision Tree

Does the model have attributes that must never reach the client (password, token, PII)?
↓
YES → Always serialize explicitly — `$model->toArray()` respects `$hidden`, but explicit is safer
NO → Does the client need all model attributes or a subset?
    Subset → Serialize explicitly with `$model->only(['id', 'name'])` or API Resource
    All → Does the model have appended attributes (`$appends`) that should be included?
        YES → Use API Resource — fine control over serialization
        NO → Can use `$model->toArray()` — safe if `$hidden` covers all sensitive fields
NO → Does the model have eager-loaded relationships?
    YES → Use API Resource — control shape of nested relationships
    NO → `$model->toArray()` — sufficient for simple model pass-through

---

## Rationale

Passing raw Eloquent models to `Inertia::render()` serializes ALL attributes — including those marked `$hidden` under certain conditions (accessors, appends). Explicit serialization ensures only intended data reaches the client. API Resources provide the most control over the serialization shape.

---

## Recommended Default

**Default:** Always serialize Eloquent models explicitly. Use `$model->toArray()` for simple cases, API Resources for complex shapes with relationships.
**Reason:** Security — raw model serialization can leak hidden attributes. Explicit serialization documents exactly what data reaches the client.

---

## Risks Of Wrong Choice

* Raw model passed: Password field leaks in page source — security incident
* `toArray()` for complex shape: Nested relationships included even when not needed — payload bloat
* No serialization convention: Inconsistent prop shapes — some controllers return full model, others return arrays
* Forgetting to serialize: Hidden attribute leaks via accessor that returns it — `$hidden` bypassed

---

## Related Rules

* Always Serialize Eloquent Models

---

## Related Skills

* Set Up Typed Server Props with Secure Serialization

---

---

## Decision 2: Eager Props vs Lazy Props for Expensive Data

---

## Decision Context

Whether to compute and send a prop eagerly during the initial page render or defer it using Inertia's lazy prop mechanism.

---

## Decision Criteria

* Computation time of the prop (threshold: >200ms)
* Whether the prop data is needed for the initial page paint
* Whether the prop is below the fold or behind user interaction
* Whether the prop data is needed for SEO (SSR compatibility)

---

## Decision Tree

Is the prop needed for the initial page paint (above the fold, layout-dependent)?
↓
YES → Use eager prop — must be available immediately for correct rendering
NO → Does the computation take >200ms?
    YES → Use lazy prop — `Inertia::lazy(fn() => expensiveComputation())`
    NO → Does the prop require an additional database or API query?
        YES → Use lazy prop — defer non-critical queries
        NO → Use eager prop — cheap computation, no reason to defer
NO → Is the prop needed for SEO (SSR)?
    YES → Use eager prop — lazy props are unavailable during SSR
    NO → Is the prop behind user interaction (modal, tab, accordion)?
        YES → Use lazy prop — load on demand
        NO → Use eager prop — default

---

## Rationale

Lazy props defer expensive computation to a subsequent request, improving initial page load time. The tradeoff is an additional HTTP round trip. Only defer props that are expensive (>200ms) OR not needed for the initial paint. Deferring cheap props actually worsens perceived performance due to the round trip overhead.

---

## Recommended Default

**Default:** Eager props for all props needed for initial render. Lazy props for expensive computations (>200ms) not needed for initial paint or behind user interaction.
**Reason:** The 200ms threshold ensures lazy usage provides a net benefit. Below 200ms, the round trip cost exceeds the computation cost.

---

## Risks Of Wrong Choice

* Lazy for cheap prop: Round trip costs more than computation — slower perceived load
* Eager for expensive prop: Initial page load blocked by 2-second computation — poor UX
* Lazy for SSR: Prop missing from server-rendered HTML — SEO content missing
* Lazy for above-the-fold: User sees placeholder for critical content — jarring layout shift

---

## Related Rules

* Lazy Only Above-Cost Computations

---

## Related Skills

* Defer Expensive Data with Lazy Props

---

---

## Decision 3: Controller-Side Prop Shaping vs API Resource Classes

---

## Decision Context

Whether to shape prop data directly in the controller (manual arrays, `only()`) or use dedicated API Resource classes.

---

## Decision Criteria

* Whether the same prop shape is used across multiple controllers
* Whether the prop shape is complex (nested relationships, conditional fields)
* Whether the prop shape follows existing API Resource conventions
* Whether the prop shape needs to be tested independently

---

## Decision Tree

Is the same prop shape used in 2+ controllers?
↓
YES → Use API Resource class — single source of truth for serialization
NO → Is the prop shape complex (nested relationships, computed fields, conditional inclusion)?
    YES → Use API Resource — dedicated class manages complexity
    NO → Is there already an API Resource class for this model?
        YES → Use the existing Resource — consistency, reuse
        NO → Controller-side shaping — `$model->only(['id', 'name'])` for simple cases
NO → Does the prop shape include computed fields that are not model attributes?
    YES → Use API Resource — `$this->merge(['computed' => ...])` in the Resource class
    NO → Controller-side shaping — simple enough to manage in the controller

---

## Rationale

API Resources centralize serialization logic and ensure consistent prop shapes across all endpoints. Controller-side prop shaping is simpler for one-off, simple prop shapes. The threshold for extraction to a Resource is reuse across 2+ controllers or complexity requiring conditional inclusion and computed fields.

---

## Recommended Default

**Default:** API Resource classes for any model serialized in more than one controller. Controller-side arrays for one-off, simple prop shapes.
**Reason:** API Resources ensure consistent prop shapes and are independently testable. They also bridge to API endpoints if the same data needs to be served as JSON API.

---

## Risks Of Wrong Choice

* Controller-side for reused shape: Duplicate `->only([...])` in 3 controllers — drift when one changes
* API Resource for single use: File overhead — `UserResource` used by exactly one controller
* No Resource with computed fields: Computed logic duplicated across controllers
* Resource used for non-prop context: Resource coupled to Inertia — can't be used for API without modification

---

## Related Rules

* Always Serialize Eloquent Models

---

## Related Skills

* Set Up Typed Server Props with Secure Serialization
