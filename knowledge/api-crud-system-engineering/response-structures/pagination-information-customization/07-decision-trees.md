# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Pagination Information Customization
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Customization Scope: Global vs Per-Endpoint

---

### Decision Context

Deciding whether to customize pagination metadata globally via a base collection class or allow per-endpoint customization.

---

### Decision Criteria

* maintainability
* architectural
* reliability

---

### Decision Tree

Do all paginated endpoints in the API need the same pagination metadata shape?
├── YES → Override `paginationInformation()` in a single base `ResourceCollection` class
│   ├── Are there exceptions that need a different shape?
│   │   ├── YES → Create a second base class for the exception group, document both
│   │   └── NO → One base class for all collections
│   └── Is the naming convention consistent with the rest of the API?
│       ├── YES → Good — no additional changes needed
│       └── NO → Rename fields in the base class to match API convention
└── NO → Are the differences driven by API version?
    ├── YES → Version-conditional logic in a single base class using `$request`
    └── NO → Per-endpoint customization — acceptable only for small APIs (2-3 endpoints)
        ├── Accept the maintenance burden of inconsistent metadata shapes
        └── Consider standardizing instead — document the inconsistencies

---

### Rationale

Per-endpoint customization guarantees inconsistency as the API grows. A base class with a single `paginationInformation()` override enforces uniform pagination metadata across all paginated endpoints. Version-conditional logic can be handled within the same base class via request inspection.

---

### Recommended Default

**Default:** Single base `ResourceCollection` class with centralized `paginationInformation()` override
**Reason:** One source of truth for pagination metadata shape; prevents inconsistency as the API grows.

---

### Risks Of Wrong Choice

Per-endpoint customization creates inconsistent pagination metadata. Clients must know which naming convention each endpoint uses. Integration tests must assert different shapes per endpoint.

---

### Related Rules

* Centralize `paginationInformation()` in a Base Collection Class
* Match Pagination Field Naming to the API's Existing Convention

---

### Related Skills

* Customize Pagination Information in Response Metadata
* Top-Level Meta and Links

---

---

## Paginator Type Handling

---

### Decision Context

Handling different paginator types (`LengthAwarePaginator`, `CursorPaginator`, `Paginator`) in the same `paginationInformation()` override.

---

### Decision Criteria

* reliability
* maintainability

---

### Decision Tree

Does the API use multiple paginator types across different endpoints?
├── YES → Check paginator type with `instanceof` before accessing type-specific fields
│   ├── Is it a `LengthAwarePaginator`?
│   │   ├── YES → Include `total`, `lastPage`, `currentPage`, `perPage`
│   │   └── NO → Check for `CursorPaginator`
│   │       ├── YES → Include `nextCursor`, `prevCursor`, `hasMore`; exclude `total`, `lastPage`
│   │       └── NO → Simple `Paginator` — include `currentPage`, `perPage` only
│   └── Are there fields common to all paginator types?
│       ├── YES → Extract common fields first, add type-specific fields conditionally
│       └── NO → Handle each type in separate conditional branches
└── NO → Single paginator type — type-specific fields are safe
    └── Document that the paginator type is fixed to prevent future breakage

---

### Rationale

`CursorPaginator` does not have `total` or `last_page`. `LengthAwarePaginator` lacks `next_cursor` or `has_more`. Accessing non-existent keys throws `ErrorException` or returns null inconsistently. `instanceof` checks prevent these errors.

---

### Recommended Default

**Default:** Always use `$paginated['field'] ?? null` with null-safe access; use `instanceof` only when different field names are needed per type
**Reason:** Null-safe access handles missing keys gracefully; `instanceof` branches enable type-appropriate field names.

---

### Risks Of Wrong Choice

Accessing `total` on a `CursorPaginator` throws 500 error. Omitting `hasMore` when using cursor pagination leaves clients without end-of-data signal.

---

### Related Rules

* Always Check Paginator Type Before Accessing Type-Specific Fields
* Always Return an Array from `paginationInformation()`

---

### Related Skills

* Cursor Pagination Metadata
* Offset Pagination Design

---

---

## Field Renaming Strategy

---

### Decision Context

Planning the migration path when renaming pagination metadata fields to avoid breaking existing clients.

---

### Decision Criteria

* maintainability
* reliability

---

### Decision Tree

Is there an existing client base consuming the current pagination metadata field names?
├── YES → Use dual-emit strategy during migration
│   ├── Version N: Include both old and new field names (dual-emit)
│   │   ├── Old name: `current_page`
│   │   └── New name: `currentPage`
│   ├── Version N+1: Remove old field name, keep new name only
│   └── Is the migration window documented and communicated?
│       ├── YES → Proceed with clear deprecation timeline
│       └── NO → Document migration plan before deployment
└── NO → Rename freely — no backward compatibility concern
    ├── Are there API documentation references to old names?
    │   ├── YES → Update documentation simultaneously
    │   └── NO → Safe rename
    └── Are clients internal-only and easily updated?
        ├── YES → Rename immediately, update client code
        └── NO → Use dual-emit as safety measure

---

### Rationale

Pagination metadata fields are part of the API contract. Renaming them silently breaks client parsing code that expects the old names. Dual-emit (including both old and new names for one version) provides a migration window without breaking existing clients.

---

### Recommended Default

**Default:** Dual-emit during field rename for one version; remove old name in the next version
**Reason:** Dual-emit is backward-compatible; single-version migration window gives clients time to update.

---

### Risks Of Wrong Choice

Immediate rename breaks all existing clients. No migration window causes production failures. Dual-emit forever creates unnecessary payload bloat.

---

### Related Rules

* Use Dual-Emit During Field Renames
* Match Pagination Field Naming to the API's Existing Convention

---

### Related Skills

* Response Versioning
* Response Format Decision Framework
