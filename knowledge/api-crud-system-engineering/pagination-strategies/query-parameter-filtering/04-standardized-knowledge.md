# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Query Parameter Filtering
**Difficulty:** Intermediate
**Category:** Pagination
**Last Updated:** 2026-06-03

---

# Overview

Query Parameter Filtering is the practice of accepting structured filter parameters in API requests to narrow result sets — using query string conventions like `?status=active&role=admin` or more expressive formats like `?filter[status]=active` or `?filter=[status=active,role=admin]`. It exists because list endpoints without filtering force clients to fetch and filter data client-side, wasting bandwidth and processing power.

Engineers must care because filtering design directly impacts API usability, query performance, and backend complexity. A well-designed filter system enables precise data retrieval without exposing the database structure. A poorly designed filter system either limits functionality (only simple equality filters) or creates SQL injection vectors.

---

# Core Concepts

**Simple Equality:** `?status=active` — filters where column equals value. Simple but limited to exact matches.

**Scoped Filters:** `?filter[status]=active&filter[role]=admin` — groups filters under a `filter` key for clarity.

**Operator Filters:** `?filter[created_at][gte]=2026-01-01` — specifies comparison operator (gte, lte, gt, lt, eq, neq).

**JSON Filter:** `?filter={"status":"active","age":{"gte":18}}` — JSON-encoded filter specification.

**Allowlist:** Explicitly defining which columns can be filtered. Prevents filtering on non-indexed or sensitive columns.

**Filter Normalization:** Converting shorthand filter values to query conditions. `?status=active` → `WHERE status = 'active'`.

---

# When To Use

- Any list endpoint that returns paginated or filtered results
- Admin panels and dashboards with data exploration needs
- APIs serving UI components that need filtered data (selects, autocompletes)
- Reporting and analytics endpoints

---

# When NOT To Use

- Endpoints returning fixed, non-filterable result sets
- Very small datasets that fit in a single response
- Endpoints where filtering is not a requirement

---

# Best Practices

**Use a filter allowlist.** Only allow filtering on columns that are indexed and safe to expose. Reject filters on unknown columns.

**Use scoped filter syntax.** `?filter[status]=active` is more expressive and extensible than `?status=active`.

**Define filter operators explicitly.** Support `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `like` operators with clear syntax.

**Validate filter values.** A filter like `?filter[status]=nonexistent` should not crash — it should return empty results or validate.

**Document all available filters.** Consumers need to know which fields are filterable and which operators are supported.

---

# Architecture Guidelines

**Filtering is applied at the query builder level.** A `FilterQueryBuilder` service accepts filter parameters and applies them to the query.

**Filter logic is separated from controllers.** Controllers pass raw filter parameters to a filtering service; they don't build WHERE clauses.

**Each filterable field has a dedicated filter handler.** `StatusFilter`, `DateRangeFilter`, `SearchFilter` classes encapsulate per-field filter logic.

**Filters are validated before execution.** Invalid filter fields or values are rejected before query building.

---

# Performance Considerations

**Unindexed filter columns cause full table scans.** Only allow filtering on indexed columns.

**Complex filters with multiple conditions add query overhead.** Each filter clause adds to query complexity.

**Text search filters (`LIKE '%term%'`) are slow on large tables.** Consider full-text search indexes for text filtering.

**Filter combinations (multiple filters applied together) multiply index requirements.** Composite indexes may be needed.

---

# Security Considerations

**Filter allowlist prevents data enumeration.** Only allow filtering on columns that should be filterable.

**Reject filter values that could be used for SQL injection.** Use parameterized queries; never concatenate filter values into SQL.

**Sensitive columns should not be filterable.** `password`, `ssn`, `internal_notes` should never appear in filter allowlists.

**Rate limit filter-heavy endpoints.** Complex filter combinations can be resource-intensive.

---

# Common Mistakes

**No filter allowlist.** Any query parameter becomes a potential filter, exposing database columns and enabling SQL injection.

**String interpolation in filters.** Concatenating filter values directly into SQL queries instead of using parameterized queries.

**Case-sensitive filters by default.** `?status=Active` vs `?status=active` producing different results.

**No validation of filter values.** `?filter[status]=nonexistent` crashes with a database error instead of returning empty results.

**Filtering on non-indexed columns.** Queries perform full table scans for every filtered request.

---

# Anti-Patterns

**Unrestricted Filtering:** Any query parameter is accepted as a filter, exposing the entire database schema.
**Better approach:** Implement a filter allowlist. Reject unknown filter parameters.

**Raw SQL In Filters:** Concatenating filter values into SQL strings.
**Better approach:** Use parameterized queries. Never trust filter input.

**Excessive Nested Filters:** Supporting deeply nested filter expressions that are impossible to optimize.
**Better approach:** Limit filter complexity. Complex queries belong in dedicated reporting endpoints.

**Filter As Injection Vector:** Accepting filter column names from clients without validation.
**Better approach:** Map public filter names to database columns server-side.

---

# Examples

**Filter implementation:**
```
class UserFilter
{
    private array $allowed = ['status', 'role', 'created_at', 'name'];

    public function apply(Builder $query, array $filters): Builder
    {
        foreach ($filters as $field => $value) {
            if (!in_array($field, $this->allowed)) continue;
            match ($field) {
                'status' => $query->where('status', $value),
                'role' => $query->where('role', $value),
                'created_at' => $query->whereDate('created_at', $value),
                'name' => $query->where('name', 'like', "%{$value}%"),
            };
        }
        return $query;
    }
}
```

---

# Related Topics

**Prerequisites:**
- Database Indexing
- Query Building in Laravel

**Closely Related Topics:**
- Query Parameter Sorting — ordering combined with filtering
- Pagination with Complex Filters — combining pagination and filtering
- Per-Page Parameter Design — page size configuration

**Advanced Follow-Up Topics:**
- Advanced Filter DSL — expressive filter languages
- Full-Text Search Integration — search across filtered results

**Cross-Domain Connections:**
- Input Validation Architecture — filter parameter validation
- Form Request Design — filter validation
