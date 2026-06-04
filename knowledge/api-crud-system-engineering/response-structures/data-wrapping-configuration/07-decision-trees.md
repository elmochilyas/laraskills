# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Data Wrapping Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Wrapper Key Strategy

---

### Decision Context

Choosing between a generic `data` wrapper key, custom per-resource wrapper keys, or no wrapper (bare-body) for API resource responses.

---

### Decision Criteria

* maintainability
* architectural
* reliability

---

### Decision Tree

Is the API consumed by third-party or unknown clients?
├── YES → Use envelope with generic `'data'` wrapper key
│   ├── Are some endpoints versioned differently?
│   │   ├── YES → Create version-specific base resource classes with consistent `$wrap`
│   │   └── NO → Use a single base resource class with `public static $wrap = 'data'`
│   └── Do existing clients depend on a legacy wrapper key?
│       ├── YES → Create version-specific resources: legacy keeps old key, new uses 'data'
│       └── NO → Use `'data'` universally
└── NO → Is an API gateway adding the envelope later?
    ├── YES → Use `withoutWrapping()` + `withoutWrappingCollection()` on all resources
    └── NO → Are consumers known and controlled?
        ├── YES → Consider bare-body with consistent `withoutWrapping()`
        └── NO → Use envelope with `'data'` wrapper

---

### Rationale

A generic `'data'` wrapper is the most future-proof choice. Custom wrapper keys (`user`, `post`) couple clients to resource names. Mixed wrapping (some wrapped, some bare) creates the worst client experience. Since Laravel has no global wrapping toggle, a base resource class enforces consistency.

---

### Recommended Default

**Default:** `public static $wrap = 'data'` on a base `App\BaseResource` class extended by all resources
**Reason:** Generic `'data'` wrapper matches JSON:API convention and allows resource renaming without breaking clients.

---

### Risks Of Wrong Choice

Per-resource custom wrapper keys force clients to know which key to parse per endpoint. Mixed wrapping creates conditional client parsing. Non-static `$wrap` silently falls back to default.

---

### Related Rules

* Declare `$wrap` as Public Static
* Use a Base Resource Class for Consistent Wrapping

---

### Related Skills

* Design API Data Wrapping Configuration
* Envelope Response Design

---

---

## Collection vs Single-Resource Wrapping Consistency

---

### Decision Context

Ensuring collection responses and single-resource responses use consistent wrapping behavior to avoid asymmetric response shapes.

---

### Decision Criteria

* reliability
* maintainability

---

### Decision Tree

Are collection responses wrapping differently from single-resource responses?
├── YES → Is the asymmetry intentional and documented?
│   ├── YES → Document the pattern and ensure all endpoints follow it
│   └── NO → Fix: call both `withoutWrapping()` and `withoutWrappingCollection()` or neither
└── NO → Is wrapping disabled for both singles and collections?
    ├── YES → Verify both methods are called
    │   ├── `UserResource::withoutWrapping()` → affects singles
    │   └── `UserResource::withoutWrappingCollection()` → affects collections
    └── NO → Wrapping is enabled for both — consistent by default

Do paginated responses wrap differently from non-paginated collections?
├── YES → `PaginatedResourceResponse` may handle wrapping differently
│   ├── Check if `$wrap` is applied consistently
│   └── Ensure both paginated and non-paginated collections use the same wrapper key
└── NO → Consistent wrapping across all response types

---

### Rationale

Single-resource wrapping and collection wrapping are configured independently in Laravel. Disabling wrapping for singles does not automatically disable it for collections, creating asymmetric response shapes where some endpoints return `{data: {...}}` and others return `{...}`.

---

### Recommended Default

**Default:** Maintain consistent wrapping between singles and collections; always test both
**Reason:** Asymmetric response shapes force clients to implement conditional parsing per endpoint.

---

### Risks Of Wrong Choice

Collection wrapping differs from single-resource wrapping, creating endpoint-specific client parsing. Paginated responses have different wrapping than non-paginated ones.

---

### Related Rules

* Configure Collection Wrapping Independently
* Never Call `withoutWrapping()` Conditionally

---

### Related Skills

* Implement Envelope Response Design
* Resource Controller Response Selection

---

---

## Wrapping Inheritance and Override Management

---

### Decision Context

Managing `$wrap` inheritance across parent and child resource classes to prevent unexpected propagation of wrapping changes.

---

### Decision Criteria

* maintainability
* reliability

---

### Decision Tree

Does the child resource class explicitly declare `public static $wrap`?
├── YES → Child uses its own wrapping — parent changes don't propagate
│   └── Is the child's `$wrap` intentionally different from the parent?
│       ├── YES → Document the divergence in the child class
│       └── NO → Child should inherit parent's `$wrap` — remove explicit declaration
└── NO → Child inherits parent's `$wrap`
    └── Is changing the parent's `$wrap` intended to affect all children?
        ├── YES → Change parent's `$wrap` — all children will follow (document this)
        └── NO → Explicitly declare `$wrap` on each child to decouple from parent changes

---

### Rationale

Child classes inherit `$wrap` from their parent. Changing the parent's `$wrap` silently propagates to all children, potentially breaking their response contracts. Explicit declaration makes intent clear and prevents cascading changes.

---

### Recommended Default

**Default:** Explicitly declare `$wrap` on every concrete resource class (even if it matches the parent)
**Reason:** Explicit declarations prevent silent behavior changes when parent wrapping is refactored.

---

### Risks Of Wrong Choice

Changing a base resource's `$wrap` silently changes all child resources. A single omission in a child class creates an inconsistent endpoint.

---

### Related Rules

* Never Override `$wrap` in Child Classes Without Explicit Intent
* Test Wrapping Behavior Exhaustively in a Single Test

---

### Related Skills

* API Resource Transformation
* JSON:API Resource Structure
