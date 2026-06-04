# Sparse Field Selection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** Sparse Field Selection
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Sparse Field Selection allows API consumers to specify which fields they want in the response via `?fields=id,name,email`. This reduces payload size, improves performance, and gives clients control over response content — critical for mobile clients and bandwidth-sensitive applications.

---

## Core Concepts
- **Fields Parameter**: `?fields[users]=id,name,email` or `?fields=id,name,email` per resource type
- **Field Allowlist**: Defining which fields are allowed to be selected (prevents data leaks)
- **Default Fields**: The set of fields returned when no `fields` parameter is provided
- **Relationship Fields**: Controlling fields on included relationships: `?fields[users]=id,name&fields[posts]=id,title`
- **Computed Fields**: Virtual/accessor fields that can be requested via sparse selection
- **Field Permission Scoping**: Different field sets based on user roles/permissions

---

## Mental Models
1. **Restaurant Menu Model**: The full resource is a multi-course meal. The client orders only the courses (fields) they want. Smaller order = smaller bill (response).
2. **Telescope Zoom Model**: The full resource is the wide-angle view. Sparse fields zoom into specific details, hiding everything else.

---

## Internal Mechanics
The server parses `?fields[users]=id,name,email`. The field list is validated against an allowlist. The resource's `toArray()` filters fields using `$this->only()` or array intersection. Eloquent can use `->select($fields)` at the query level for early field restriction. Nested resources use separate field parameters.

---

## Patterns

### Pattern 1: Resource-Level Field Selection
**Purpose**: Filter fields in the resource's `toArray()` based on the request parameter
**Benefits**: Works with any query structure; fine-grained control
**Tradeoffs**: Late filtering (data is still loaded from DB)

### Pattern 2: Query-Level Field Selection
**Purpose**: Apply `->select($fields)` at the Eloquent query level
**Benefits**: Loads only requested columns from database
**Tradeoffs**: Doesn't work with computed/accessor fields

---

## Architectural Decisions
### When To Use
- APIs with large models (20+ fields)
- Mobile APIs where bandwidth is constrained
- Public APIs where consumers have varying field needs
- GraphQL-like flexibility in REST APIs

### When To Avoid
- Simple APIs with small models (3-5 fields)
- Internal APIs where bandwidth is not a concern
- Endpoints where all fields are always needed

### Alternatives
- Include/exclude query parameters
- Version-based field sets (v1 returns less fields than v2)
- Client-side field stripping (wasteful of bandwidth)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduced response size | Field allowlist maintenance | Keep allowlist in sync with resource fields |
| Client-controlled responses | Complex field parameter parsing | Use a standard library or helper |
| Faster DB queries (query-level) | Doesn't support computed fields | Use resource-level for computed fields |
| Mobile bandwidth savings | Field selection logic in each resource | Extract to base resource class |

---

## Performance Considerations
- Query-level selection reduces data transfer from DB to PHP
- Resource-level selection still loads all columns from DB
- Field validation and filtering adds <0.1ms overhead
- Combine with `->cursor()` for large datasets to reduce memory
- Relations with sparse fields can use `->select()` separately

---

## Production Considerations
- Enforce a field allowlist to prevent exposing sensitive columns
- Document available fields per resource in API docs
- Test field selection with authorization — admin fields should never leak
- Log field selection patterns to understand client needs
- Cache default field sets; compute sparse sets per request

---

## Common Mistakes
**No allowlist**: Allowing `?fields[users]=password_hash,internal_notes` exposes sensitive data.
**Query-level selection on computed fields**: `->select()` fails for accessor/computed fields. Use resource-level selection for these.
**Inconsistent field naming**: Resource returns `user_name` but field parameter expects `userName`. Match consistently.
**Ignoring relationship fields**: Only supporting field selection on the primary resource, not included relationships.

---

## Failure Modes
**Data leak via unknown field**: A field name not in the allowlist returns an error or leaks data. *Detection:* Security audit. *Mitigation:* Throw validation error for unknown fields; never fall through to expose.
**Field name collision**: Same field name has different meaning on different resources. *Detection:* Confusing API docs. *Mitigation:* Document field meaning per resource.

---

## Ecosystem Usage
`spatie/laravel-query-builder` provides `allowedFields()` for automatic sparse field handling. Laravel's `$resource->only()` and `array_intersect_key()` enable manual implementation. JSON:API specifies `fields[TYPE]=field1,field2` as the standard syntax.

---

## Related Knowledge Units
### Prerequisites
- API resource transformation
- Eloquent query scopes

### Related Topics
- Include related resources
- API response shapes
- Query parameter filtering

### Advanced Follow-up Topics
- Permission-based field visibility
- Dynamic field computation
- Sparse fields with GraphQL-like field resolvers

---

## Research Notes
- JSON:API uses `?fields[articles]=title,body` syntax for sparse fieldsets
- GraphQL field selection is the inspiration for REST sparse fields
- `spatie/laravel-query-builder` supports both query-level and resource-level field selection
- Stripe uses `?expand[]=customer` for expansion and relies on predefined field sets
