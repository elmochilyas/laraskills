# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Typed Attribute Accessors with DTOs
**Generated:** 2026-06-03

---

# Decision Inventory

* DTO accessor vs primitive cast
* Multi-column DTO vs single JSON column
* DTO accessor vs value object custom cast

---

# Architecture-Level Decision Trees

---

## DTO Accessor vs Primitive Cast

---

## Decision Context

Choosing between a typed accessor returning a DTO and a simple primitive cast for structured data.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the attribute represent structured data with multiple named fields?
↓
YES → Are individual fields accessed by name (e.g., `$model->address->city`)?
    YES → Create a typed accessor returning a DTO — enables named property access
    NO → Use primitive cast (`array` or `object`) — simpler if only iterating
NO → Is it a simple scalar (string, int, bool)?
    YES → Use primitive cast — DTO adds unnecessary overhead
    NO → Use primitive cast — simplest option

---

## Rationale

DTOs provide type safety, named property access with IDE autocompletion, and constructor validation. Primitive casts are simpler and faster but offer zero type safety or named access.

---

## Recommended Default

**Default:** Primitive cast
**Reason:** Simpler, faster, and sufficient unless structured field access is needed. Only introduce DTOs when the data has meaningful named fields.

---

## Risks Of Wrong Choice

Using DTOs for simple scalars adds unnecessary class count and object allocation on every access. Using primitive arrays for structured data forces magic string key access throughout the codebase.

---

## Related Rules

* Use typed accessors for structured data
* Make DTOs immutable with readonly properties

---

## Related Skills

* Create a Typed Accessor Returning a DTO

---

## Multi-Column DTO vs Single JSON Column

---

## Decision Context

Deciding how to store DTO-sourced data in the database — across multiple columns (normalized) or in a single JSON column.

---

## Decision Criteria

* performance
* maintainability
* architectural

---

## Decision Tree

Are the individual fields queried, indexed, or constrained independently?
↓
YES → Use multiple database columns — enables indexing, constraints, and partial updates
NO → Is the data structure fixed or does it evolve over time?
    FIXED → Multiple columns — schema enforces structure
    EVOLVING → Single JSON column — schema-less flexibility
NO → Are queries against individual fields needed in SQL?
    YES → Multiple columns with indexes
    NO → Single JSON column — simpler schema

---

## Rationale

Multiple columns enable database-level integrity (NOT NULL, foreign keys, CHECK constraints) and queryability. JSON columns offer flexibility for evolving schemas but sacrifice query performance and integrity enforcement.

---

## Recommended Default

**Default:** Multiple columns for stable, queryable data
**Reason:** Database-level integrity, indexing, and query performance are more important than schema flexibility for most business domains.

---

## Risks Of Wrong Choice

JSON columns for query-critical data causes full-table scans. Multiple columns for rapidly evolving schemas requires migrations for every field change.

---

## Related Rules

* Mutator maps DTO back to flat columns

---

## Related Skills

* Create a Typed Accessor Returning a DTO

---

## DTO Accessor vs Value Object Custom Cast

---

## Decision Context

Choosing between a typed accessor returning a DTO and a custom cast that returns a value object.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the DTO/value object used across multiple models?
↓
YES → Use a custom cast with `Castable` interface — reusable, consistent behavior
NO → Is the transformation read-only (no write-back needed)?
    YES → Accessor returning DTO is sufficient — simpler
    NO → Use custom cast — provides both get and set with type safety

---

## Rationale

Custom casts with `Castable` provide reusable, two-way transformation that can be registered on any model with a single string. Accessors are model-specific and ideal for read-only composition of existing columns into a structured object.

---

## Recommended Default

**Default:** Custom cast for cross-model value objects; accessor for model-specific DTOs
**Reason:** Custom casts provide reuse and two-way binding. Accessors are simpler for model-specific read-only DTOs.

---

## Risks Of Wrong Choice

Writing accessors on every model for the same value object type duplicates logic. Using custom casts for a one-off read-only DTO adds unnecessary cast class overhead.

---

## Related Rules

* Cache DTO accessor results with shouldCache
* Handle null stored values gracefully

---

## Related Skills

* Create a Typed Accessor Returning a DTO
