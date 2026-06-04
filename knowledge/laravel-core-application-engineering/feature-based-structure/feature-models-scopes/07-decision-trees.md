# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Feature Flags
**Generated:** 2026-06-03

---

# Decision Inventory

* Feature-Specific Model vs Shared app/Models/ Placement
* Trait-Based Relationship Extension vs Direct Relationship on Shared Model
* Feature-Specific Global Scope vs Query Scope vs Repository

---

# Architecture-Level Decision Trees

---

## Decision 1: Feature-Specific Model vs Shared app/Models/ Placement

---

## Decision Context

Whether to place a model inside a feature directory (`App\Features\Billing\Models\Invoice`) or in the top-level `App\Models` directory.

---

## Decision Criteria

* Whether the model is owned by one feature or shared across 3+ features
* Whether the model represents a core domain concept or a feature-specific entity
* Whether the model has relationships that span multiple features
* Whether the model is expected to be used by external packages or API consumers

---

## Decision Tree

Is the model owned by a single feature (only that feature creates, updates, deletes it)?
↓
YES → Is the model used by 3+ features for read access?
    YES → Place in `App\Models\` — shared read access across features
    NO → Place in the feature's `Models/` directory — `App\Features\Billing\Models\Invoice`
NO → Is the model a shared core entity (User, Team, Organization)?
    YES → Place in `App\Models\` — shared entity designed for application-wide access
    NO → Does the model have relationships with models from 3+ features?
        YES → Consider `App\Models\` — multiple relationship directions suggest shared status
        NO → Place in the feature's `Models/` directory

---

## Rationale

Model placement communicates ownership. `App\Features\Billing\Models\Invoice` explicitly says "the Billing feature owns this." `App\Models\User` says "this is shared." The threshold for moving a feature-specific model to shared status is 3+ features accessing it — at that point, the model is no longer feature-specific.

---

## Recommended Default

**Default:** Place models in the feature that owns them. Elevate to `App\Models\` only when 3+ features need access.
**Reason:** Feature-owned models prevent the god-model problem and make ownership unambiguous. The 3-feature threshold prevents premature shared status.

---

## Risks Of Wrong Choice

* Feature model in `App\Models\`: Ownership ambiguity — who owns the Invoice model?
* Shared model in feature: Other features import from a foreign feature directory — coupling
* Feature model with 5 consumers in feature directory: Every consumer imports from billing namespace — artificial coupling
* No `App\Models\` at all: User model must live in one feature — every other feature imports from it

---

## Related Rules

* Namespace Tells Ownership
* Trait-Based Relationship Extension

---

## Related Skills

* Add A Feature-Specific Model

---

---

## Decision 2: Trait-Based Relationship Extension vs Direct Relationship on Shared Model

---

## Decision Context

Whether to add feature-specific relationships to a shared model (like User) via a trait or add the relationship directly on the model.

---

## Decision Criteria

* Whether the relationship is specific to one feature (billing-only, subscription-only)
* Whether the shared model (User) is already large with many feature relationships
* Whether the trait approach would create naming conflicts between features
* Whether the relationship is loaded eagerly (always needed) or lazily (feature-specific)

---

## Decision Tree

Is the relationship specific to a single feature (billing.invoices, subscriptions.plan)?
↓
YES → Does the shared model already have 5+ feature-specific relationship traits?
    YES → Is there a risk of method naming collisions between traits?
        YES → Consider a repository/query service instead of trait — separate data access from model
        NO → Use trait — keeps the shared model lean, each feature declares its own relationships
    NO → Use trait — clean separation, model stays focused on core concerns
NO → Is the relationship a core concept (User has Posts, User has Profile)?
    YES → Add directly to the shared model — core relationship, not feature-specific
    NO → Is the relationship needed on every page load (always loaded)?
        YES → Add directly to the model — eager loading is simpler with direct relationship
        NO → Use trait — load only when the feature is active

---

## Rationale

Traits provide a way to extend shared models with feature-specific relationships without bloating the model file. Each feature declares its relationships independently. The direct relationship is appropriate for core, always-loaded relationships. Traits risk naming collisions when multiple features define methods with the same name.

---

## Recommended Default

**Default:** Use traits for feature-specific relationships on shared models. Add relationships directly for core model concerns.
**Reason:** Traits keep the shared model manageable as features grow. Each feature owns its relationship code. The tradeoff is naming collision risk, which is mitigated by feature-prefixed method names.

---

## Risks Of Wrong Choice

* Direct relationship for feature-specific: Model grows with 20+ feature relationships — god model
* Trait for core relationship: Extra indirection for a fundamental relationship (User has Posts)
* Naming collision: Two features define `invoices()` on User — PHP fatal error
* Trait without prefix: Same method name as a future Laravel core update — breaking change

---

## Related Rules

* Trait-Based Relationship Extension
* Namespace Tells Ownership

---

## Related Skills

* Add A Feature-Specific Model

---

---

## Decision 3: Feature-Specific Global Scope vs Query Scope vs Repository

---

## Decision Context

How to apply a feature-specific filter or constraint to a model — via a global scope, a local query scope, or a repository/query service.

---

## Decision Criteria

* Whether the filter should always apply (every query) or selectively
* Whether the filter is owned by one feature or shared
* Whether the filter is simple (where clause) or complex (multiple joins, aggregations)
* Whether the filter needs to be testable in isolation

---

## Decision Tree

Should the filter apply to EVERY query for this model, always, without exception?
↓
YES → Use a global scope — `boot()` in the model service provider or a dedicated scope class
NO → Is the filter specific to a single feature's queries?
    YES → Is the filter simple (1-2 where clauses)?
        YES → Use a local query scope on the model — `$query->active()->paid()`
        NO → Is the filter complex (multiple joins, subqueries, aggregations)?
            YES → Use a dedicated query service or repository — separates complex query logic from the model
            NO → Use a local query scope
    NO → Is the filter used across 2+ features?
        ↓
        YES → Add directly to the model as a local scope — shared concern
        NO → Use a local query scope on the model

---

## Rationale

Global scopes apply automatically to every query — use sparingly. Local query scopes provide convenient, discoverable query methods. Repositories or query services are for complex queries that don't belong on the model. Feature-specific filters should be co-located with the feature via local scopes or query services.

---

## Recommended Default

**Default:** Use local query scopes for feature-specific filters. Use global scopes only for universally required constraints. Use query services for complex multi-table queries.
**Reason:** Local scopes are simple, discoverable, and co-located with the model. Global scopes are implicit and can cause unexpected behavior. Query services separate complex query logic from model definition.

---

## Risks Of Wrong Choice

* Global scope for feature-specific filter: All queries unexpectedly filtered — wrong results for other features
* Local scope for always-applied filter: Developers must remember to call `->active()` — easy to forget
* No scope at all: Filter logic duplicated in every query — inconsistent
* Repository for simple filter: Over-engineering — a single `where()` doesn't need a class

---

## Related Rules

* Feature-Specific Global Scopes
* Query Scope Encapsulation

---

## Related Skills

* Add A Feature-Specific Model
