# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Conditional Aggregate Inclusion
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Aggregate Inclusion Strategy

---

### Decision Context

Determining whether to include computed aggregate values (counts, sums, averages) in resource responses conditionally or unconditionally, and how to gate their inclusion.

---

### Decision Criteria

* performance
* architectural
* security

---

### Decision Tree

Is the aggregate value expensive to compute (adds a subquery)?
├── YES → Should every consumer of this endpoint always need this aggregate?
│   ├── YES → Include unconditionally with `whenCounted()` or `whenAggregated()`
│   └── NO → Use conditional inclusion via `whenAggregated()` gated by controller load
└── NO → Is the aggregate computed from an already-loaded relationship?
    ├── YES → Use direct attribute access or `whenCounted()` with relation loaded check
    └── NO → Consider a separate `/stats` endpoint instead of per-resource aggregate

Does the aggregate expose sensitive business metrics (revenue, user counts)?
├── YES → Gate with authorization: load aggregate only for authorized users
└── NO → Include based on performance considerations only

---

### Rationale

Each `withCount()`/`withSum()` adds a correlated subquery. Making aggregates conditional via `whenAggregated()` ensures they only appear when explicitly loaded by the controller, preventing runaway query costs and exposing aggregates only to authorized consumers.

---

### Recommended Default

**Default:** Always use `whenAggregated()` or `whenCounted()` for every aggregate field
**Reason:** Conditional inclusion prevents N+1 queries from unloaded aggregates and documents that the field is optional.

---

### Risks Of Wrong Choice

Unconditional aggregate access (`$this->posts_count` without `whenCounted()`) causes missing-attribute errors or lazy subqueries. Over-conditionalization adds unnecessary complexity for always-needed fields.

---

### Related Rules

* Always Gate Aggregate Fields with `whenAggregated()` or `whenCounted()`
* Provide Default Values for Nullable Aggregates

---

### Related Skills

* Conditionally Include Aggregate Data in Resource Responses
* Sparse Fieldset Design

---

---

## Aggregate Loading Layer Separation

---

### Decision Context

Deciding whether aggregate loading belongs in the controller layer or the resource layer, and how to maintain the separation.

---

### Decision Criteria

* code organization
* maintainability
* performance

---

### Decision Tree

Does the aggregate loading happen inside the resource's `toArray()` method?
├── YES → Move `withCount()`/`withSum()` calls to the controller or query scope
│   ├── Are there multiple controller actions using the same resource?
│   │   ├── YES → Load aggregates per action based on that action's needs
│   │   └── NO → Load aggregates in the single controller action
│   └── Did the aggregate display depend on a custom alias?
│       ├── YES → Use the exact same alias in both loading and `whenAggregated()`
│       └── NO → Use default naming convention for automatic matching
└── NO → Is every controller action that uses this resource loading the aggregate?
    ├── YES → Verify alias naming consistency
    └── NO → Add `whenAggregated()` for fields loaded in some paths but not others

---

### Rationale

Resources should decide presentation, not loading. Loading aggregates inside resources bypasses the controller's query optimization and makes loading decisions non-deterministic. The controller knows exactly which aggregates are needed for a given request.

---

### Recommended Default

**Default:** Controller loads aggregates via `withCount()`; resource displays via `whenAggregated()`
**Reason:** Clear layer separation enables query optimization at the controller level and presentation decisions at the resource level.

---

### Risks Of Wrong Choice

Loading in the resource layer creates N+1 query patterns and makes query optimization impossible. Mismatched aliases between loading and display silently omit aggregate fields.

---

### Related Rules

* Load Aggregates in Controllers Only
* Match Aggregate Aliases Exactly Between Loading and Display

---

### Related Skills

* Resource Controller Dependency Injection
* Eloquent Query Scopes

---

---

## Aggregate vs Separate Stats Endpoint

---

### Decision Context

Choosing between embedding per-resource aggregates in the main resource response and providing a dedicated `/stats` endpoint for aggregate data.

---

### Decision Criteria

* performance
* architectural
* maintainability

---

### Decision Tree

Does the endpoint return a list of resources with per-item aggregates?
├── YES → Are there more than 5 aggregate fields per resource?
│   ├── YES → Consider a separate `/stats` endpoint or aggregated collection
│   └── NO → Is the number of records large (>1000) with aggregates per row?
│       ├── YES → Use a separate `/stats` endpoint to avoid multiply-subquery cost
│       └── NO → Include aggregates conditionally in the main response
└── NO → Is this a single-resource endpoint with many aggregates?
    ├── YES → Include conditionally in the main resource response
    └── NO → Single aggregate — include conditionally in the main response

Are the aggregates used for dashboard/reporting rather than per-item display?
├── YES → Separate `/stats` endpoint
└── NO → Per-resource aggregate inclusion

---

### Rationale

Per-row aggregates on list endpoints multiply query cost: 1000 rows × 5 aggregates = 5000 subqueries. A separate `/stats` endpoint with pre-computed or cached aggregate values avoids this multiplication while still providing the aggregate data.

---

### Recommended Default

**Default:** Include 1-3 aggregate fields conditionally per resource; use `/stats` for 5+ aggregates per resource or dashboard-level reporting
**Reason:** Per-resource aggregates are convenient for consumers but multiply query cost linearly with record count.

---

### Risks Of Wrong Choice

Embedding too many aggregates per resource on list endpoints causes severe performance degradation. Using a `/stats` endpoint for every aggregate forces clients into multi-request workflows.

---

### Related Rules

* Aggregate Overload Is an Anti-Pattern
* Use Consistent Custom Aggregate Aliases

---

### Related Skills

* Conditional Relationship Inclusion
* JSON:API Compound Documents
