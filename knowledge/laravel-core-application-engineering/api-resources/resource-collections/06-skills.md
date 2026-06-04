# Skill: Create a Resource Collection

## Purpose

Build consistent collection responses for list endpoints that transform each item through a resource and wrap the result in a standardized envelope with optional pagination metadata.

## When To Use

- Any list endpoint returning multiple resources
- Paginated responses where automatic `links` and `meta` injection is desired
- Collection responses that need custom metadata (totals, aggregates, applied filters)
- When response consistency across all list endpoints is required

## When NOT To Use

- Single-resource responses (use resource directly)
- Non-HTTP outputs (CLI, queue) where array formatting is fine
- Extremely simple list endpoints where a manual `->map()` in the controller suffices and no pagination is needed
- When the collection is empty and a bare `[]` is the expected response format

## Prerequisites

- A resource class (`JsonResource`) that formats individual items
- A controller that provides the data (paginator or collection)
- Understanding of paginator types for paginated endpoints

## Inputs

- Resource class to wrap individual items
- Controller providing the data source (paginated or non-paginated)
- Decision on anonymous vs named collection class

## Workflow

1. For simple endpoints without custom metadata, use the anonymous collection in the controller: `UserResource::collection(User::paginate(20))`.
2. For custom metadata or pagination overrides, create a named collection class: `php artisan make:resource UserCollection --collection`.
3. Set `$collects` explicitly on named collections: `public $collects = UserResource::class`.
4. Keep pagination logic in the controller — the collection only formats whatever paginator instance it receives.
5. Always paginate list endpoints that could exceed 50 items — never use `Model::all()` for list endpoints.
6. Always wrap collection responses from the start (even without pagination) to allow adding pagination metadata later without breaking changes.
7. Use a base collection class if 3+ collection endpoints exist to enforce consistent `data`, `links`, and `meta` structure.
8. Only set `$preserveKeys = true` when the client explicitly expects non-sequential keys.
9. Keep collection types homogeneous — never pass mixed model types to a collection with a fixed `$collects`.

## Validation Checklist

- [ ] Collection responses consistently include `data` key
- [ ] Paginated collections include `links` and `meta` with correct structure
- [ ] `$collects` is explicitly set on all custom resource collections
- [ ] Controller decides pagination parameters; collection only formats
- [ ] Relationships accessed in the collection's items are eager-loaded in the controller
- [ ] No sensitive data exposed in custom metadata fields

## Common Failures

- Forgetting pagination metadata — passing a plain `Collection` or array instead of a paginator instance results in missing `links`/`meta` keys
- Preserving keys unintentionally — `$preserveKeys = true` produces a JSON object instead of an array, confusing clients
- Mixing resource types in a collection — passing mixed model types to a collection with fixed `$collects` causes errors or incorrect output
- Collection-as-controller — putting pagination logic (page size, sorting) inside the collection instead of the controller

## Decision Points

- **Anonymous vs named collection**: Use anonymous (`Resource::collection()`) for simple endpoints. Create a named `ResourceCollection` when custom metadata, pagination overrides, or collection-specific behavior is needed.
- **Paginated vs non-paginated**: Always paginate list endpoints that could exceed 50 items. Non-paginated collections risk memory exhaustion.
- **Base class vs per-collection customization**: Use a base collection class when 3+ collection endpoints exist to enforce consistent envelope structure.

## Performance Considerations

- Collection resolution iterates once, calling `toArray()` per item — memory usage is proportional to collection size
- A collection of 100 resources adds ~1ms overhead — negligible compared to database query time
- When a collection resource accesses relationships on each model without eager loading, N+1 queries occur
- `LengthAwarePaginator` runs `COUNT(*)` — on large tables (millions of rows), consider `CursorPaginator`

## Security Considerations

- Collection responses expose field sets defined by the individual resource — ensure authorization checks exist at the controller level
- Custom metadata added via `paginationInformation()` or `toArray()` is visible to all consumers — do not include internal state, server paths, or unauthenticated data
- Preserving collection keys (`$preserveKeys = true`) with non-sequential keys returns a JSON object instead of an array — some clients may misinterpret this

## Related Rules

- Always Set $collects Explicitly on Custom Collections (Maintainability)
- Keep Pagination Logic in the Controller, Not the Collection (Architecture)
- Paginate List Endpoints That Could Exceed 50 Items (Performance)
- Standardize the Collection Envelope via a Base Class (Code Organization)
- Use Anonymous Collections for Simple Endpoints (Design)
- Only Preserve Collection Keys When Clients Rely on Them (Design)
- Keep Collection Types Homogeneous (Reliability)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Data Wrapping](../data-wrapping/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)

## Success Criteria

- All list endpoints return consistent collection envelope with `data` key
- Paginated collections include `links` and `meta` with predictable structure
- `$collects` is explicitly set and correct on all named collections
- Controller controls pagination; collection only formats
- No sensitive data appears in custom metadata
