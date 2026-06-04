# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Conditional Relationship Inclusion
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Relationship Serialization Gating Strategy

---

### Decision Context

Determining whether to wrap relationship serialization in `whenLoaded()` to prevent N+1 queries, or access relationships directly for required relations.

---

### Decision Criteria

* performance
* reliability
* maintainability

---

### Decision Tree

Is the relationship always loaded on every code path of every controller action using this resource?
├── YES → Is the relationship required for the response to be meaningful?
│   ├── YES → Access directly (safe — always loaded) with `preventLazyLoading()` guard
│   └── NO → Use `whenLoaded()` — document as optional
└── NO → Use `whenLoaded()` for every relationship field
    ├── Is the relationship a BelongsToMany with pivot data?
    │   ├── YES → Gate pivot data inside `whenLoaded()` for the parent relation
    │   └── NO → Gate only the relationship itself
    └── Is `preventLazyLoading()` enabled in development?
        ├── YES → Missing loads surface immediately during development
        └── NO → Enable `preventLazyLoading()` in non-production environments

---

### Rationale

Accessing an unloaded relationship inside `toArray()` triggers an N+1 database query. `whenLoaded()` checks the in-memory relations array (constant-time) and omits the field when not loaded, decoupling the resource from the controller's loading decisions.

---

### Recommended Default

**Default:** Always wrap every relationship field in `whenLoaded()`; enable `Model::preventLazyLoading()` in development
**Reason:** Silent omission is safer than silent N+1; prevention catches missing loads during development.

---

### Risks Of Wrong Choice

Unconditional relationship access causes N+1 queries that multiply query count by collection size. Over-use of `whenLoaded()` on always-loaded relations adds unnecessary conditional overhead.

---

### Related Rules

* Always Wrap Relationship Serialization in `whenLoaded()`
* Prevent Lazy Loading in Development to Catch Missing Loads

---

### Related Skills

* Implement Conditional Relationship Inclusion
* Include Related Resources

---

---

## Count vs Full Relationship Inclusion

---

### Decision Context

Choosing between `whenCounted()` for aggregate counts and `whenLoaded()` for full relationship serialization based on what the client actually needs.

---

### Decision Criteria

* performance
* architectural

---

### Decision Tree

Does the client need the actual related records or just a count of them?
├── Just a count → Use `whenCounted('relation')`
│   ├── Is the count available via `withCount()` in the controller?
│   │   ├── YES → `whenCounted()` checks for the aggregate attribute
│   │   └── NO → Add `withCount()` in the controller
│   └── Does the response also need the full relationship?
│       ├── YES → Use both `whenCounted()` and `whenLoaded()` independently
│       └── NO → Use only `whenCounted()` — avoids loading all records
└── Full records needed → Use `whenLoaded('relation', fn() => RelatedResource::collection(...))`
    ├── Is this a HasMany relationship?
    │   ├── YES → Wrap in Resource collection with `whenLoaded()`
    │   └── NO → Use `new RelatedResource($this->whenLoaded('relation'))`
    └── Is there a nested chain of relations?
        ├── YES → Apply `whenLoaded()` at each nesting level
        └── NO → Single-level `whenLoaded()` is sufficient

---

### Rationale

`whenCounted()` checks for the `{relation}_count` attribute (loaded via `withCount()`), while `whenLoaded('relation')` checks if the entire collection was loaded. Loading all records just to get a count wastes memory and query cost.

---

### Recommended Default

**Default:** `whenCounted()` for counts, `whenLoaded()` for full relationship data
**Reason:** Using `whenLoaded()` to get a count loads the entire collection into memory — a costly mistake at scale.

---

### Risks Of Wrong Choice

Using `whenLoaded('posts')` to get a post count loads all posts into memory just to call `->count()`. Using `whenCounted()` for full records omits the relationship data.

---

### Related Rules

* Use `whenCounted()` for Counts, Not `whenLoaded()`
* Gate Pivot Data with `whenLoaded()`

---

### Related Skills

* Conditional Aggregate Inclusion
* API Resource Transformation

---

---

## Nested Conditional Resolution Strategy

---

### Decision Context

Handling conditional relationship inclusion within nested arrays and sub-resources where `Conditional` proxy objects do not resolve automatically.

---

### Decision Criteria

* reliability
* framework usage

---

### Decision Tree

Is the `whenLoaded()` call at the top level of `toArray()`'s return array?
├── YES → Pass `$this->whenLoaded('relation')` directly to the nested resource constructor
│   └── Does the nested resource itself have conditional fields?
│       ├── YES → The nested resource handles its own conditionals at its top level
│       └── NO → No special handling needed
└── NO → Is the `whenLoaded()` inside a sub-array or closure?
    ├── YES → Use explicit ternary `$this->relationLoaded('relation') ? ... : null` instead of `whenLoaded()`
    └── NO → Verify the position — if at top level, use `whenLoaded()` directly

---

### Rationale

`Conditional` proxy objects only resolve at the top level of `toArray()`. Sub-arrays and nested structures evaluate conditionals eagerly, causing unexpected serialization behavior. Explicit ternary with `relationLoaded()` works correctly at any depth.

---

### Recommended Default

**Default:** Pass `$this->whenLoaded('relation')` to nested resource constructors; use explicit ternary in sub-arrays
**Reason:** The `Conditional` proxy resolves correctly when passed to a nested resource, but does not resolve inside sub-arrays.

---

### Risks Of Wrong Choice

Using `whenLoaded()` inside a sub-array produces a serialized `{"condition": true, "value": ...}` object instead of the intended data, breaking the response shape.

---

### Related Rules

* Never Nest `whenLoaded()` Inside Sub-Arrays Without Explicit Handling
* Document Relationship Loading Contracts Between Controller and Resource

---

### Related Skills

* JSON:API Compound Documents
* Sparse Fieldset Design
