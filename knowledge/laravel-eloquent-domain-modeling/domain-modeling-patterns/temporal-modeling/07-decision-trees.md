# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Temporal Modeling
**Generated:** 2026-06-03

---

# Decision Inventory

* Versioning approach (SCD Type 2 vs event sourcing vs snapshots)
* Temporal query scope design
* Versioning trigger mechanism

---

# Architecture-Level Decision Trees

---

## Versioning Approach Selection

---

## Decision Context

Choosing between Slowly Changing Dimension Type 2, event sourcing, or snapshot versioning for tracking model state over time.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Do you need to query past states directly via SQL (point-in-time queries)?
↓
YES → SCD Type 2 (valid_from/valid_to columns) — directly queryable
NO → Do you need an audit trail of every change with reasons?
    YES → Event sourcing — full event history with context
    NO → Snapshot versioning — periodic full state snapshots
NO → Regulatory requirements demand immutable change history?
    YES → Event sourcing — append-only event log
    NO → SCD Type 2 — simpler, directly queryable

---

## Rationale

SCD Type 2 is simplest for point-in-time queries but duplicates rows on each change. Event sourcing provides full auditability but requires event replay to reconstruct state. Snapshots are a middle ground.

---

## Recommended Default

**Default:** SCD Type 2 (valid_from/valid_to)
**Reason:** Directly queryable, no event replay needed, works with standard Laravel patterns.

---

## Risks Of Wrong Choice

SCD Type 2 table growth on frequently changed records. Event sourcing complexity for simple temporal tracking. Snapshots losing granularity between snapshot intervals.

---

## Related Rules

* Choose temporal approach by requirements
* Index temporal columns for performance

---

## Related Skills

* Implement Temporal Versioning on a Model

---

## Temporal Query Scope Design

---

## Decision Context

Designing query scopes for point-in-time temporal queries.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Does the query need to return state at a specific point in time?
↓
YES → Use `valid_from <= point_in_time AND (valid_to IS NULL OR valid_to > point_in_time)`
NO → Does the query need only the current state?
    YES → `WHERE valid_to IS NULL` — simplest, fastest
    NO → Consider if temporal modeling is needed at all

---

## Rationale

The standard SCD Type 2 query pattern is well-established and efficient when indexed. A dedicated `scopeAsOf()` makes intent clear and centralizes the query logic.

---

## Recommended Default

**Default:** `scopeAsOf(Builder $query, Carbon $pointInTime)` for temporal queries
**Reason:** Encapsulates the temporal query logic in a reusable, testable scope.

---

## Risks Of Wrong Choice

Missing indexes on temporal columns causes full-table scans. Complex temporal queries without proper scoping scatter the temporal logic across the codebase.

---

## Related Rules

* Add point-in-time query scopes
* Index temporal columns for performance

---

## Related Skills

* Implement Temporal Versioning on a Model

---

## Versioning Trigger Mechanism

---

## Decision Context

Deciding when to create a new version — on every save or only on meaningful state changes.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Does every attribute change need to be versioned?
↓
YES → Hook into model events (`saved`) — fires on every persist
NO → Is versioning needed only for specific business-significant changes?
    YES → Call versioning explicitly from domain methods — intentional versioning
    NO → Evaluate if temporal versioning is needed at all

---

## Rationale

Automatic versioning on every save captures everything but creates many versions for irrelevant changes (likes count, view count). Intentional versioning from domain methods captures only business-significant transitions.

---

## Recommended Default

**Default:** Intentional versioning from domain methods
**Reason:** Fewer versions, clearer intent, and no version bloat from incidental saves.

---

## Risks Of Wrong Choice

Automatic versioning on every save floods the version table with noise (counter updates, touch calls). Missing version triggers when versioning is manual can lead to gaps in the audit trail.

---

## Related Rules

* Version on meaningful state changes

---

## Related Skills

* Implement Temporal Versioning on a Model
