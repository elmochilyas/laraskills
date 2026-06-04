# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Query Parameter Sorting
**Difficulty:** Intermediate
**Category:** Pagination
**Last Updated:** 2026-06-03

---

# Overview

Query Parameter Sorting is the practice of allowing API consumers to specify sort order for list endpoints using query parameters like `?sort=name` or `?sort=-created_at,name`. It exists because clients need to control result ordering for display, comparison, and data export purposes.

Engineers must care because sort parameters directly impact query performance via database index usage. Sort operations on unindexed columns cause full table scans followed by filesorts. A well-designed sort system prevents slow queries while giving consumers ordering flexibility.

---

# Core Concepts

**Sort Field:** The column to sort by — `?sort=name`. Maps to `ORDER BY name ASC`.

**Sort Direction:** Prefix with `-` for descending: `?sort=-created_at`. Maps to `ORDER BY created_at DESC`.

**Multi-Column Sort:** Comma-separated fields: `?sort=-created_at,name`. Maps to `ORDER BY created_at DESC, name ASC`.

**Sort Allowlist:** Explicitly defining which columns can be sorted. Prevents sorting on non-indexed or sensitive columns.

**Default Sort:** The sort order applied when no sort parameter is provided. Typically `-created_at` or `-id`.

---

# When To Use

- Any list endpoint returning ordered results
- Endpoints where users may want different sort orders
- Data export endpoints where sort order matters
- Admin panels with sortable columns

---

# When NOT To Use

- Single-resource endpoints (no list to sort)
- Endpoints returning unsorted data where order doesn't matter
- Endpoints where sort would reveal sensitive information

---

# Best Practices

**Use a sort allowlist.** Only allow sorting on columns that are indexed and safe to expose. Reject unknown sort fields.

**Default sort to primary key descending.** `-id` or `-created_at` ensures consistent ordering across requests.

**Use `-` prefix for descending.** `?sort=-created_at` is intuitive and follows common API conventions.

**Validate sort parameters.** Reject sorting on disallowed columns with 422.

**Document all available sort fields.** Consumers need to know which sort options are available.

---

# Architecture Guidelines

**Sort logic is applied at the query builder level.** A `SortQueryBuilder` service parses sort parameters and applies ORDER BY clauses.

**Sort validation happens before query execution.** Invalid sort fields return 422, not SQL errors.

**Sort parameters are combined with pagination.** Sort order affects which records appear on which page — sort must be stable.

**Default sort is applied when no sort parameter is provided.** Ensures consistent pagination ordering.

---

# Performance Considerations

**Sorting on unindexed columns causes filesort.** The database must load all matching rows into memory and sort them.

**Multi-column sorts require composite indexes.** `ORDER BY created_at DESC, name ASC` benefits from `INDEX(created_at, name)`.

**Sorting on large result sets before pagination is expensive.** Apply filters first to reduce the set, then sort.

**Descending sorts on indexed columns can use backward index scans.** Performance is similar to ascending.

---

# Security Considerations

**Sort allowlist prevents information gathering.** Sorting by internal columns could reveal information about record order or density.

**Default sort should not expose sensitive ordering.** Don't default to sorting by `last_login_at` or other sensitive timestamps.

**Sort validation prevents SQL injection.** Sort field values must not be interpolated into SQL.

---

# Common Mistakes

**No sort allowlist.** Any column name is accepted as a sort field, exposing database schema and enabling injection.

**Sorting without an index.** Queries perform filesort on every request, degrading as data grows.

**No default sort.** Results order is unpredictable without explicit sort, causing pagination inconsistencies.

**Case-sensitive sorting.** `ORDER BY name` sorts case-sensitively by default in MySQL. Use `ORDER BY LOWER(name)` or case-insensitive collation.

**Multi-column sort without composite index.** Only the first sort column uses an index; the second causes filesort.

---

# Anti-Patterns

**Unrestricted Sort:** Any query parameter accepted as a sort field, exposing internal column names.
**Better approach:** Sort allowlist with explicit mapping from public names to database columns.

**No Default Sort:** Endpoint without default sort produces unpredictable ordering.
**Better approach:** Always provide a default sort. Primary key descending is the safest default.

**Filesort On Large Sets:** Sorting thousands of records before pagination returns only 15.
**Better approach:** Ensure sort columns are indexed. Filter before sorting to reduce the working set.

**Raw Sort Column Injection:** Passing sort column names directly to `orderBy()`.
**Better approach:** Map sort parameters through an allowlist. Never pass raw input to orderBy.

---

# Examples

**Sort parameter parsing:**
```
protected function applySort(Builder $query, ?string $sort): Builder
{
    if (!$sort) return $query->orderBy('created_at', 'desc');

    $allowed = ['name', 'email', 'created_at', 'updated_at'];

    foreach (explode(',', $sort) as $field) {
        $direction = 'asc';
        if (str_starts_with($field, '-')) {
            $direction = 'desc';
            $field = substr($field, 1);
        }
        if (!in_array($field, $allowed)) continue;
        $query->orderBy($field, $direction);
    }

    return $query;
}
```

---

# Related Topics

**Prerequisites:**
- Database Indexing
- MySQL/PostgreSQL ORDER BY

**Closely Related Topics:**
- Query Parameter Filtering — filtering combined with sorting
- Pagination with Complex Filters — sorting in filtered results

**Advanced Follow-Up Topics:**
- Composite Index Design — indexes for multi-column sorts
- Full-Text Search Relevance Sorting

**Cross-Domain Connections:**
- Pagination Strategy Selection — sort impact on pagination
- Per-Page Parameter Design
