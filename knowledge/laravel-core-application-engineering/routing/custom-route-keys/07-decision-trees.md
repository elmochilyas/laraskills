# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Custom Route Keys
**Generated:** 2026-06-03

---

# Decision Inventory

* Inline Custom Key Syntax vs Model-Level getRouteKeyName()
* UUID/ULID Keys vs Auto-Increment IDs for Public Routes
* Unique Constraint Enforcement on Custom Key Columns
* Database Index Strategy for Custom Key Columns

---

# Architecture-Level Decision Trees

---

## Decision 1: Inline Custom Key Syntax vs Model-Level getRouteKeyName()

---

## Decision Context

Whether to specify the binding column inline in the route definition (`{user:slug}`) or override `getRouteKeyName()` on the model.

---

## Decision Criteria

* Whether all routes for the model should use the same custom key
* Whether only specific routes need non-ID resolution
* Whether the custom key is fundamental to the model's identity

---

## Decision Tree

Do ALL routes binding to this model need to use the same non-ID column?
↓
NO → Inline syntax — `{user:slug}` only affects the specific route; other routes use default ID binding
YES → Is the custom key the model's natural identifier (UUID primary key, natural key)?
    ↓
    YES → `getRouteKeyName()` — the model is fundamentally identified by this column
    NO → Does the model have multiple route uses with different key requirements?
        ↓
        YES → Inline syntax — public routes use slug, admin routes use ID
        NO → `getRouteKeyName()` — if all routes should bind by the same non-ID column
NO → Does the custom key also affect URL generation via `route()`?
    ↓
    YES → Use `getRouteKeyName()` if URL generation should also use the custom key; use inline syntax if not
    NO → Inline syntax — doesn't affect `getRouteKey()`; URL generation still uses ID

---

## Rationale

Inline syntax (`{user:slug}`) is explicit at the route level and scoped to that specific route. `getRouteKeyName()` affects ALL bindings globally AND changes `getRouteKey()` which controls URL generation. Inline syntax should be preferred for single-route customization. `getRouteKeyName()` should only be used when the model's identity fundamentally uses a non-ID column.

---

## Recommended Default

**Default:** Inline `{user:slug}` syntax for all custom key routes. `getRouteKeyName()` only when the model uses a non-numeric primary key.
**Reason:** Inline syntax is explicit and scoped. `getRouteKeyName()` silently changes all bindings and URL generation.

---

## Risks Of Wrong Choice

* `getRouteKeyName()` for single route: All bindings change behavior; URL generation changes silently
* Inline syntax on every route: Repetitive; if the key changes, every route definition must update
* `getRouteKeyName()` without URL generation consideration: `route('users.show', $user)` now uses slug in URL
* Non-unique key column with `getRouteKeyName()`: All bindings silently return wrong model on duplicate values

---

## Related Rules

* Ensure Column Uniqueness for Custom Binding Keys
* Use Type-Hinted Parameters in Controllers

---

## Related Skills

* Use Custom Column Binding for Non-ID Route Resolution
* Override getRouteKeyName for Model-Wide Custom Route Keys

---

---

## Decision 2: UUID/ULID Keys vs Auto-Increment IDs for Public Routes

---

## Decision Context

Whether to expose auto-increment IDs in URLs or use UUIDs, ULIDs, or slugs.

---

## Decision Criteria

* Whether the route is publicly accessible
* Whether sequential IDs reveal business intelligence
* Whether the IDs need to be unpredictable

---

## Decision Tree

Is the route publicly accessible (no authentication required)?
↓
YES → Sequential IDs reveal entity count and growth rate
    ↓
    YES → UUID/ULID — sequential IDs expose business intelligence (user count, order volume)
    NO → Slug — descriptive, SEO-friendly, hides sequential nature
NO → Is the route authenticated but exposes data across tenants?
    ↓
    YES → UUID/ULID — cross-tenant ID guessing is harder with non-sequential IDs
    NO → Auto-increment ID — authenticated routes with proper authorization don't need non-sequential IDs
NO → Do URLs need to be human-readable and SEO-friendly?
    ↓
    YES → Slug — UUIDs are not human-readable; slugs are descriptive
    NO → UUID/ULID — machine-readable, unpredictable, no sequential exposure

---

## Rationale

Auto-increment IDs in public URLs reveal entity count, growth rate, and allow sequential enumeration. UUIDs and ULIDs are non-sequential and unpredictable. Slugs are human-readable and SEO-friendly. The tradeoff: UUIDs are slower for database indexing (vs integers) but acceptable for typical traffic. Slugs require uniqueness enforcement.

---

## Recommended Default

**Default:** Auto-increment IDs for internal/admin routes with proper authorization. UUIDs for public API routes where ID exposure is a concern. Slugs for SEO-friendly public routes (blog posts, products).
**Reason:** Auto-increment IDs are fastest for database lookups. UUIDs provide non-sequential exposure. Slugs are best for human readability.

---

## Risks Of Wrong Choice

* Auto-increment on public routes: Competitors can estimate user count, order volume, growth rate
* UUIDs everywhere: Slower indexed lookups; less readable for debugging; harder to type
* Slugs without uniqueness: Duplicate slugs cause binding to return wrong model
* Security through obscurity: Hiding behind UUIDs is not authorization — always implement proper access control

---

## Related Rules

* Ensure Column Uniqueness for Custom Binding Keys
* Use Type-Hinted Parameters in Controllers

---

## Related Skills

* Use Custom Column Binding for Non-ID Route Resolution
* Implement UUID or ULID Primary Keys for Public Routes

---

---

## Decision 3: Unique Constraint Enforcement on Custom Key Columns

---

## Decision Context

Whether to enforce database-level unique constraints on custom route key columns.

---

## Decision Criteria

* Whether the column must have unique values for correct binding
* Whether the application handles duplicate values gracefully
* Whether the database supports the constraint type

---

## Decision Tree

Is the custom key column used for route model binding?
↓
YES → Must be unique — binding resolves via `where(key, value)->firstOrFail()`
    ↓
    YES → Add database UNIQUE constraint — prevents duplicate values at database level
    NO → Is there an application-level uniqueness guarantee?
        ↓
        YES → Add database UNIQUE constraint anyway — defense in depth
        NO → Add database UNIQUE constraint — binding WILL return wrong model on duplicates
NO → Is the column expected to have unique values by business logic?
    ↓
    YES → Add database UNIQUE constraint — document the business rule at the database level
    NO → No constraint needed — column is not used for identity resolution

---

## Rationale

Custom key binding resolves via `Model::where('slug', $value)->firstOrFail()`. If multiple records have the same slug value, the query returns the first match, which may be wrong. A database UNIQUE constraint prevents duplicate values at the storage level. Without it, application-level validation must prevent duplicates.

---

## Recommended Default

**Default:** Add a database UNIQUE constraint to every column used as a custom route key.
**Reason:** The binding query assumes unique resolution. Without a constraint, duplicate values cause silent data exposure.

---

## Risks Of Wrong Choice

* No unique constraint: Duplicate slugs cause binding to return the first match; wrong model resolved
* Unique constraint added late: Existing duplicates must be resolved before migration can run
* Unique constraint on nullable column: Multiple NULL values may violate constraint depending on DBMS
* Application-level uniqueness only: Race conditions can create duplicates between validation and insert

---

## Related Rules

* Ensure Column Uniqueness for Custom Binding Keys
* Use Type-Hinted Parameters in Controllers

---

## Related Skills

* Use Custom Column Binding for Non-ID Route Resolution
* Enforce Unique Constraints on Custom Route Key Columns

---

---

## Decision 4: Database Index Strategy for Custom Key Columns

---

## Decision Context

Whether to add a database index to the custom route key column and what type of index to use.

---

## Decision Criteria

* Whether the column is queried frequently in WHERE clauses
* Whether the column is a string type (slower than integer)
* Whether the table is large enough to benefit from indexing

---

## Decision Tree

Is the custom key column queried via WHERE clause in route binding?
↓
YES → Add an index — binding queries use `WHERE key = value`; index speeds this up
    ↓
    YES → Is the column a string type (varchar, text)?
        ↓
        YES → Is the table large (>10K rows)?
            ↓
            YES → Index is essential — string scan on large table is slow
            NO → Index is recommended — query plans benefit even on smaller tables
    NO → Is the column an integer?
        ↓
        YES → Index is beneficial for large tables; auto-increment is already indexed
        NO → Index recommended — any non-indexed WHERE clause degrades at scale
NO → Is the table queried by this column in other contexts (reports, admin searches)?
    ↓
    YES → Add index — multiple query patterns benefit
    NO → No index needed — binding column is only used in route resolution
NO → Is the column also a foreign key?
    ↓
    YES → Add index — foreign keys should generally be indexed
    NO → Evaluate based on query patterns

---

## Rationale

Custom key columns are queried via `Model::where('slug', $value)->firstOrFail()` on every route that uses them. Without an index, this is a full table scan. String columns (varchar, text) benefit more from indexing than integers because string comparison is more expensive. UUID columns, while slower than integers, are acceptable for typical traffic volumes with proper indexing.

---

## Recommended Default

**Default:** Always add a database index to custom route key columns. Use a regular B-tree index (default).
**Reason:** Route binding queries are executed on every request. An index ensures fast, consistent lookup performance.

---

## Risks Of Wrong Choice

* No index on string column: Full table scan on every request; performance degrades with table size
* No index on UUID column: UUID comparison with sequential scan is extremely slow on large tables
* Wrong index type: Full-text index on UUID column is wasteful and slower than B-tree
* Composite index missing: For scoped bindings, `(parent_id, slug)` composite index is needed

---

## Related Rules

* Ensure Column Uniqueness for Custom Binding Keys
* Use Type-Hinted Parameters in Controllers

---

## Related Skills

* Use Custom Column Binding for Non-ID Route Resolution
* Add Database Indexes for Custom Route Key Columns
