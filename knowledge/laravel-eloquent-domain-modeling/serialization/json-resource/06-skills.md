# JSON Resource Skills

## Skill: Transform Eloquent models into structured JSON responses using API Resources

### Purpose
Use `JsonResource` to create a dedicated transformation layer between Eloquent models and JSON responses, enabling attribute renaming, computed fields, conditional inclusion, nested relationship transformations, and request-aware output.

### When To Use
- Any public API endpoint where default model `toArray()` shape is insufficient
- Renaming, flattening, nesting, or computing attributes differently than model's internal shape
- Request-aware serialization (admin fields based on authenticated user)
- Conditional attributes, pagination metadata, or top-level wrapping
- API versioning via separate resource classes per version

### When NOT To Use
- For non-HTTP serialization (queue, broadcast, CLI, events) — use DTOs or model `toArray()`
- When model `toArray()` with `$hidden`/`$appends` already produces the desired output
- For internal/admin panels where raw model data is acceptable
- When the resource would contain business logic or SQL queries

### Prerequisites
- Eloquent model with optionally eager-loaded relationships and aggregates

### Inputs
- Model instance (single or collection/paginator)

### Workflow
1. Generate resource: `php artisan make:resource UserResource`
2. Define `toArray($request)` with explicit field mappings
3. Wrap every nested relationship field in `$this->whenLoaded('relation')`
4. Use `$this->whenCounted('relation')` for withCount aggregate fields
5. Add `with($request)` for top-level metadata (version, timestamp)
6. For listing endpoints, use `UserResource::collection($paginator)`
7. Always eager-load relationships used in nested resources at the query site
8. Extract complex transformation logic into private methods
9. Test resource structure with `assertJsonStructure()` in feature tests
10. Version resources by namespace/directory (V1, V2) — not by conditional logic

### Validation Checklist
- [ ] Relationships used in nested resources are always eager-loaded at the query site
- [ ] Resources contain no SQL queries or business logic
- [ ] `whenLoaded()` guards all nested relationship resource calls
- [ ] Sensitive fields are excluded (model `$hidden` as fallback)
- [ ] Resource structure is tested via `assertJsonStructure`
- [ ] Paginated collection resources use `Resource::collection()` correctly
- [ ] No circular resource references exist
- [ ] Resources are not serialized to queues or broadcast events
- [ ] Resources are kept at the HTTP boundary only

### Common Failures
- Calling `Resource::collection()` on unpaginated large collections — memory issues
- Overriding `toArray()` but not calling parent — losing conditional attribute support
- Nesting resources without verifying relationships loaded — silent empty data
- Using resources for internal serialization (queues) — HTTP coupling
- Putting SQL queries or business logic inside `toArray()` — violates separation of concerns

### Decision Points
- **Single resource or collection?** — Use `Resource::make()` for single items; `Resource::collection()` for lists
- **Custom collection class or anonymous?** — Use `ResourceCollection` subclass when custom metadata is needed; anonymous `Resource::collection()` for simple lists
- **Direct model or Resource?** — Always wrap models in Resources for HTTP endpoints, never return raw models

### Performance Considerations
- Resource instantiation is lightweight; collection iteration over many models creates many objects
- Nested resources trigger eager loading chains — verify with Laravel Debugbar
- Consider cursor pagination with resource collections for large datasets
- Heavy `with()` data merged per-resource can inflate response size

### Security Considerations
- Resources can expose data not intended for the client — verify against known-safe model state
- Use `when()` with authorization checks for role-sensitive fields
- Resources cannot override model `$hidden` — model `$hidden` is always applied
- Never pass raw user input into resource output without escaping/validation
- Test conditionally-included fields are absent for unauthorized users

### Related Rules
- [Resource-Use-Compat-For-Listings](../json-resource/05-rules.md)
- [Resource-Always-Guard-WhenLoaded](../json-resource/05-rules.md)
- [Resource-No-Business-Logic](../json-resource/05-rules.md)
- [Resource-Version-By-Separate-Classes](../json-resource/05-rules.md)
- [Resource-Not-In-Queues](../json-resource/05-rules.md)
- [Resource-Test-Output-Structure](../json-resource/05-rules.md)
- [Resource-HTTP-Boundary-Only](../json-resource/05-rules.md)
- [Resource-With-For-Metadata](../json-resource/05-rules.md)
- [Resource-Eager-Load-Relationships](../json-resource/05-rules.md)
- [Resource-Private-Methods-For-Complexity](../json-resource/05-rules.md)
- [Resource-Never-Raw-Models](../json-resource/05-rules.md)
- [Resource-Test-No-SQL-Queries](../json-resource/05-rules.md)

### Related Skills
- Conditionally include/exclude JSON fields in API Resources using when/whenLoaded/whenCounted
- Return paginated resource responses with metadata

### Success Criteria
- Resource output matches expected JSON structure
- Nested relationship data only appears when eager-loaded
- Collection/paginated responses include correct `data`, `links`, `meta` structure
- Admin-only fields are absent from unauthorized responses
- No SQL queries are triggered during resource serialization
- Resource structure tests pass for both populated and empty states
