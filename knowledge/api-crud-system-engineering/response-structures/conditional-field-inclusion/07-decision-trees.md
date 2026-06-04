# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Conditional Field Inclusion
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Conditional Field Method Selection

---

### Decision Context

Choosing the appropriate conditional inclusion method (`when()`, `whenHas()`, `whenNotNull()`, `whenLoaded()`, `mergeWhen()`) for a given field based on the nature of the condition.

---

### Decision Criteria

* maintainability
* reliability
* security

---

### Decision Tree

What type of condition determines field inclusion?
├── Authorization or request-driven boolean → Use `when($condition, $value)`
│   ├── Is the condition about user roles/permissions?
│   │   ├── YES → Use `when($request->user()?->isAdmin(), $value)`
│   │   └── NO → Use `when($request->has('include'), $value)`
│   └── Are multiple fields gated by the same condition?
│       ├── YES → Use `mergeWhen($condition, [...])` for the group
│       └── NO → Use individual `when()` calls
├── Model attribute existence → Is the field a boolean, zero, or empty string?
│   ├── YES → Use `whenHas('attribute')` (handles falsy values correctly)
│   └── NO → Use `when(isset($this->attribute), $value)`
├── Nullable computed/accessor value → Use `whenNotNull($value)`
└── Relationship loaded state → Use `when($this->relationLoaded('name'), fn() => ...)`

---

### Rationale

Each method addresses a specific conditional scenario. Using the wrong method causes silent omission (e.g., `when()` omits boolean false values) or null leakage (e.g., unconditionally returning nullable computed values).

---

### Recommended Default

**Default:** `when()` for boolean conditions; `whenHas()` for attribute existence; `whenNotNull()` for nullable values; `when()` with `relationLoaded()` for relationships
**Reason:** Each method maps to a distinct conditional pattern, making the code self-documenting and preventing edge-case bugs.

---

### Risks Of Wrong Choice

Using `when()` for attribute existence silently omits boolean false, numeric zero, and empty strings. Returning nullable values unconditionally leaks null into responses. Using `mergeWhen()` incorrectly clutters the return array.

---

### Related Rules

* Use `whenHas()` for Model Attribute Existence Checks
* Use `whenNotNull()` for Computed or Accessor Values

---

### Related Skills

* Implement Conditional Field Inclusion
* Sparse Fieldset Design

---

---

## Security vs Conditional Field Omission

---

### Decision Context

Determining whether conditional field inclusion via `when()` is sufficient for protecting sensitive fields, or whether authorization middleware is also required.

---

### Decision Criteria

* security
* reliability
* architectural

---

### Decision Tree

Does the field contain sensitive data (PII, credentials, internal IDs)?
├── YES → Is there authorization middleware (Policy, Gate) protecting the endpoint?
│   ├── YES → Does the middleware run before serialization?
│   │   ├── YES → Use `when()` for field visibility as secondary defense
│   │   └── NO → Add middleware authorization first, then use `when()` for field visibility
│   └── NO → Is conditional omission the SOLE protection for this field?
│       ├── YES → Add authorization middleware — mandatory
│       └── NO → Use authorization AND `when()` for defense in depth
└── NO → Is the field non-sensitive but optional?
    ├── YES → Use `when()`, `whenNotNull()`, or `whenHas()` as appropriate
    └── NO → Include unconditionally

Are responses cached at a layer that doesn't vary by user role?
├── YES → Add cache key variation by user role/authorization level
└── NO → Use `when()` for role-gated fields safely

---

### Rationale

Conditional field omission hides sensitive fields from unauthorized users but does not prevent carefully crafted requests from reaching the data. Authorization middleware blocks unauthorized access before serialization, providing defense in depth.

---

### Recommended Default

**Default:** Always pair authorization middleware with `when()` for sensitive fields; cache keys must vary by authorization level
**Reason:** Conditional omission alone is insufficient security. Defense in depth ensures sensitive data never reaches the resource layer for unauthorized users.

---

### Risks Of Wrong Choice

Using `when()` as the sole protection for sensitive fields leaves data accessible to any request that reaches the controller. Role-invariant caching serves privileged data to lower-privilege users.

---

### Related Rules

* Never Substitute `when()` for Authorization Middleware
* Role-Based Conditions Belong in Resources, Authorization Results Passed In

---

### Related Skills

* Resource Controller Middleware Assignment
* API Authorization

---

---

## Conditional Explosion Management

---

### Decision Context

Managing the complexity of resources with many conditional fields to avoid creating an untestable matrix of response shapes.

---

### Decision Criteria

* maintainability
* reliability

---

### Decision Tree

How many conditionally included fields does the resource have?
├── 1-5 fields → Use individual `when()`/`whenHas()` calls in the resource
│   └── Are conditions independent of each other?
│       ├── YES → Keep individual calls
│       └── NO → Group related conditions with `mergeWhen()`
├── 6-15 fields → Create separate resource classes per variant
│   └── Are there 2-3 distinct response variants (admin, user, public)?
│       ├── YES → Create one resource class per variant
│       └── NO → Use `mergeWhen()` with computed condition groups
└── 16+ fields → Reconsider the API design
    └── Should this be split into multiple endpoints?
        ├── YES → Create specialized endpoints instead of one resource with all fields
        └── NO → Use sparse fieldsets (client selects fields) to reduce variants

---

### Rationale

Each combination of conditional fields creates a unique response shape. With 10 boolean conditions, there are 1024 possible response shapes — most untested and potentially buggy. Separating resource classes by variant or using sparse fieldsets reduces the testable combinations.

---

### Recommended Default

**Default:** Keep conditional fields under 5 per resource; use separate resource classes for 6-15 fields
**Reason:** Linear growth in conditionals creates exponential growth in response shape variants.

---

### Risks Of Wrong Choice

Conditional explosion creates an untestable matrix of response shapes, leading to untested edge cases and cache fragmentation. Debugging field absence becomes exponentially harder.

---

### Related Rules

* Wrap Every Optional Field in `when()`
* Don't Overuse `when()` on Every Field

---

### Related Skills

* Sparse Fieldset Design
* JSON:API Resource Structure
