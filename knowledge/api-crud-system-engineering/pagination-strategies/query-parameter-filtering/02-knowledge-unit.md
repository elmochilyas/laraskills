# Query Parameter Filtering

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Query Parameter Filtering
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
Query Parameter Filtering defines how API consumers filter data using URL query parameters. Well-designed filtering conventions enable flexible, expressive data retrieval while maintaining query performance and preventing abuse.

---

## Core Concepts
- **Filter Parameter Convention**: Common patterns like `?status=active`, `?filter[status]=active`, or `?filter(status,active)`
- **Exact Match Filtering**: `?status=active` — matching a field to an exact value
- **Operator-Based Filtering**: `?price[gt]=100` or `?filter[price][gt]=100` for range/comparison filters
- **Multi-Field Filtering**: Combining multiple filters with AND semantics: `?status=active&role=admin`
- **Filter Allowlist**: Explicitly defining which fields are filterable to prevent data exposure
- **OR vs AND Logic**: Whether multiple values on the same field are OR (`in`) or AND (narrowing)

---

## Mental Models
1. **SQL WHERE Model**: Each query parameter is a WHERE clause. The parameters translate directly to SQL conditions.
2. **Shopping Cart Model**: Filters are like narrowing search criteria on e-commerce — each filter removes items that don't match, building a progressively smaller result set.

---

## Internal Mechanics
The controller or action receives query parameters from the request. A query builder class or scope iterates through allowed filter parameters and applies corresponding WHERE clauses. PHP's `request()->query('filter')` or `$request->input('filter')` retrieves filter values. Parameter names map to database columns with validation against an allowlist.

---

## Patterns

### Pattern 1: Flat Key-Value Filtering
**Purpose**: Simple `?field=value` parameters for exact matches
**Benefits**: Simplest for clients to use and understand
**Tradeoffs**: Limited to exact match; conflicts with resource field names

### Pattern 2: Array/Sub-Key Filtering
**Purpose**: Nested `?filter[field]=value` or `?filter[field][operator]=value` parameters
**Benefits**: Namespaced, extensible, supports operators
**Tradeoffs**: More complex URL construction for clients

### Pattern 3: Query Builder Scopes
**Purpose**: Laravel query scopes that map filter parameters to query conditions
**Benefits**: Reusable, testable, framework-aligned
**Tradeoffs**: One scope per filterable field or need dynamic scope resolution

---

## Architectural Decisions
### When To Use
- List/index endpoints with large datasets
- Admin panels and data exploration tools
- Any endpoint where clients need to narrow results

### When To Avoid
- Show/detail endpoints (single record by ID)
- Write endpoints (POST, PUT, PATCH, DELETE)
- Very simple datasets returned in full

### Alternatives
- Server-side predefined filters (limited options selected by the API)
- POST-based filtering (filter criteria in request body for complex queries)
- Search-based approach (`?q=term`) for full-text across fields

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Flexible data retrieval | URL length limits for many filters | Use POST for complex filter sets |
| Client-controlled filtering | Must validate filter field names | Enforce allowlist to prevent data leaks |
| Cache-friendly | Complex filter combinations slow queries | Index filterable columns |

---

## Performance Considerations
- Filtering on unindexed columns scans full tables
- Each additional filter adds a WHERE clause — composite indexes help
- OR filters with multiple values can't use indexes efficiently
- Filtering on JSON columns is slower than direct columns
- URL length limits (2048 chars for some browsers) constrain complex filter queries

---

## Production Considerations
- Enforce a filter allowlist — never let clients filter on arbitrary columns
- Log unusual filter combinations for security monitoring
- Set maximum number of active filters per request
- Document filterable fields, accepted values, and operator syntax
- Test filter parameter handling with known SQL injection vectors

---

## Common Mistakes
**No filter allowlist**: Allowing clients to filter on any column exposes sensitive data (created_by, is_admin, etc.).
**Inconsistent filter syntax**: Different endpoints use different filter conventions. Standardize across the API.
**Not supporting negation/exclusion**: Clients need `?status!=archived` or equivalent for excluding values.
**Case-sensitive filtering**: Database columns are case-sensitive by default. Use `ILIKE` or `LOWER()` for case-insensitive options.

---

## Failure Modes
**SQL injection via filter values**: Malicious filter values with SQL syntax. *Detection:* Database error logs. *Mitigation:* Use Eloquent parameter binding for all filter values.
**Denial of service via complex filters**: Many OR conditions create slow queries. *Detection:* Slow query logs. *Mitigation:* Limit the number of active filters and complexity.

---

## Ecosystem Usage
Laravel's `when()` method on the query builder enables conditional filters. Scopes (`scopeActive()`) define reusable filter segments. Community packages like `spatie/laravel-query-builder` provide automatic filtering from request parameters.

---

## Related Knowledge Units
### Prerequisites
- SQL WHERE clauses and indexing
- URL structure design

### Related Topics
- Query parameter sorting
- Search query patterns
- Pagination integration

### Advanced Follow-up Topics
- Dynamic query builder integration
- Complex filtering with nested conditions
- Filter serialization for cached queries

---

## Research Notes
- `spatie/laravel-query-builder` is the most popular Laravel filtering package, supporting `filter`, `sort`, `include`, `fields`, and `append` parameters
- JSON:API uses `?filter[field]=value` syntax with AND semantics
- GraphQL uses `where: { field: { eq: "value" } }` with explicit operator naming
