# Skill: Implement Sparse Fieldsets for a Resource

## Purpose

Allow API clients to request only the fields they need via the `fields[type]` query parameter, reducing response size and bandwidth by filtering both the response output and optionally the database query.

## When To Use

- Mobile APIs where bandwidth is limited or costly
- APIs consumed by multiple client types with different data needs
- Public APIs where clients should control payload size
- When paired with JSON:API (sparse fieldsets are part of the spec)

## When NOT To Use

- Internal APIs on fast networks where response size is not a concern
- Simple CRUD APIs with fewer than 10 fields per resource
- When cache efficiency is more important than bandwidth — each field combination creates a separate cache entry
- As an authorization mechanism — sparse fieldsets only filter fields already in `toArray()`

## Prerequisites

- A resource class implementing `toArray()`
- Understanding of the `fields[type]` query parameter convention
- An allowed field list per resource type

## Inputs

- The `fields[type]` query parameter from the request
- The resource's full field list (from `toArray()`)
- An allowed fields whitelist for validation

## Workflow

1. Define an allowed fields whitelist for each resource type: `protected array $allowedUserFields = ['id', 'name', 'email', 'bio']`.
2. Define a sensible default field set for when the client does not specify fields: `protected array $defaultFields = ['id', 'name', 'email']`.
3. In the resource's `toArray()`, parse the `fields[type]` parameter: `$request->input('fields.users')`.
4. Validate requested field names against the allowed list — reject invalid fields with a 400 error.
5. Always include identifier fields (`id`, `type`) regardless of what the client requests.
6. Build the full field set and filter using `array_intersect_key()`.
7. (Optional) For database-level optimization, pass the validated fields to the controller's query builder:
   - Always include primary keys and foreign keys: `$query->select(array_unique(array_merge($fields, ['id'])))`.
   - Validate fields before passing to `Model::select()`.
8. Ensure each resource type in compound responses (via includes) independently filters its own fields.
9. Normalize field set keys alphabetically before using them for cache key generation.
10. Document available fields per resource type in API docs.

## Validation Checklist

- [ ] Sparse fieldsets are documented per resource type with available field names
- [ ] Requested fields are validated against an allowed list
- [ ] Identifier fields (`id`, `type`) are always included regardless of field selection
- [ ] Each resource type in compound responses independently supports sparse fieldsets
- [ ] Database-level selection includes primary and foreign keys for relationship integrity
- [ ] A reasonable default field set is provided when the client does not specify fields

## Common Failures

- Forgetting to filter nested fields — using `include=posts` with sparse fieldsets on the parent but not filtering child resource fields, so related resources return all fields
- Over-filtering database columns — selecting only client-requested columns without including primary keys and foreign keys, breaking Eloquent relationships
- Inconsistent field names — field names in `fields[type]` must match `toArray()` keys exactly
- Sparse fieldsets as authorization — sensitive fields in `toArray()` can be requested by any client via sparse fieldsets; use conditional attributes or separate resources instead
- No default field set — returning all fields when the client does not specify any makes the response unpredictable

## Decision Points

- **Response-level vs database-level filtering**: Always implement response-level filtering. Add database-level selection when response size reduction is critical and the dataset is large.
- **Reject vs silently ignore invalid fields**: Reject invalid fields with a 400 error to prevent client confusion. Silently ignoring them can hide bugs in client code.
- **Default field set composition**: Curate defaults for the common client use case. When in doubt, include all safe fields.

## Performance Considerations

- Response size reduction: 40-70% when clients request a subset of fields
- Database-level selection reduces transfer from database to application server — meaningful for large result sets
- Cache fragmentation: with 10 optional fields, there are 2^10 = 1024 possible combinations. Normalize field sort order to reduce variability
- Response-level filtering is `array_intersect_key` — O(n) on the attribute count, negligible cost

## Security Considerations

- Sparse fieldsets only filter fields defined in `toArray()` — if a field should never be exposed, it must not be in `toArray()` at all
- Clients can request any field in `toArray()` — no additional authorization happens per field
- Always validate requested fields against an allowed list before passing to database `select()` — unvalidated field names can leak schema info through SQL error messages
- Never use sparse fieldsets as an authorization mechanism — sensitive fields must be controlled by conditional attributes or separate resources

## Related Rules

- Always Include Identifier Fields Regardless of Sparse Fieldset (Design)
- Validate Requested Field Names Against an Allowed List (Security)
- Each Resource Type Must Independently Filter Its Own Fields (Design)
- Always Include Primary and Foreign Keys in Database Selection (Performance)
- Provide a Sensible Default Field Set (Design)
- Never Use Sparse Fieldsets as Authorization (Security)
- Normalize Field Set Keys for Caching (Performance)
- Document Available Fields Per Resource Type (Maintainability)
- Validate Before Passing to Database select() (Security)

## Related Skills

- [JSON:API Resources](../json-api-resources/06-skills.md)
- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)

## Success Criteria

- Clients can request specific fields via `fields[type]` and receive only those fields
- Identifier fields are always present in the response regardless of client request
- Invalid field names are rejected with a clear error
- Each resource type independently filters its own fields in compound responses
- Database-level selection includes all required keys for relationship resolution
- A sensible default field set is returned when the client does not specify fields
