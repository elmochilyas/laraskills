# Skill: Design API-Specific Responses with Resources

## Purpose
Configure API Resource classes for response transformation: customize `toArray()` with explicit field mapping, handle conditionally loaded relations, wrap in envelope, and use `whenLoaded()`/`when()` for optional fields.

## When To Use
- All API response transformation
- Field-level output modification
- Conditional field inclusion

## When NOT To Use
- Direct model serialization in controllers
- Non-API responses (Inertia, Blade)

## Prerequisites
- JsonResource class usage
- Envelope response design

## Inputs
- API field specification per resource
- Conditional fields and relationships

## Workflow
1. Generate API Resource per model: `php artisan make:resource UserResource`
2. Define `toArray()` with explicit field mapping — never return `parent::toArray()`
3. Use `when()` for conditional attributes based on request or value: `'is_admin' => $this->when($this->is_admin, true, false)`
4. Use `whenLoaded()` for eager-loaded relations: `'profile' => ProfileResource::make($this->whenLoaded('profile'))`
5. Use `whenHas()` for conditional pivot data
6. Use `mergeWhen()` for groups of conditional fields
7. Return collection resources with `ResourceClass::collection($models)`
8. Use `additional()` for resource-level metadata
9. Add `withResponse()` for response-level adjustments (status code, headers) in rare cases
10. Avoid `Resource::collection()` within resources — creates unexpected nesting

## Validation Checklist
- [ ] `toArray()` uses explicit field mapping
- [ ] `when()` for conditional attributes based on context
- [ ] `whenLoaded()` for eager-loaded relations
- [ ] `mergeWhen()` for conditional field groups
- [ ] Collection resources use `::collection()`
- [ ] `additional()` for resource-level metadata
- [ ] Sensitive fields excluded from output
- [ ] Field naming matches API convention (camelCase/snake_case consistent)
- [ ] Resources never call `Resource::collection()` within another resource
- [ ] Nested relations use dedicated Resource classes

## Common Failures
- Returning `parent::toArray()` — exposes all model attributes including sensitive ones
- Missing `whenLoaded()` — relation loaded but not included, or worse, relation not loaded but code crashes
- Resources nesting other Resource collections — unexpected nested `data` keys
- Field naming inconsistent with API convention — some camelCase, some snake_case
- Conditional fields always included — false sense of optimization, still serializes

## Decision Points
- Field mapping explicit vs `only()` — explicit for control, only for simple delegation
- `when()` vs separate resource methods — `when()` for field-level, method for conditional blocks
- Nested resources inline vs separate — separate for reuse, inline for one-off relationships

## Performance Considerations
- Each Resource instantiation is lightweight (<0.01ms)
- `whenLoaded()` avoids serialization of unloaded relations — saves memory
- `additional()` data merged after `toArray()` — no serialization overhead
- Large collections overhead is O(n) — avoid heavy transformations in toArray

## Security Considerations
- Never expose sensitive fields: passwords, tokens, internal IDs, pivot timestamps
- `when('is_admin')` must match actual user authorization — not request input
- Conditional fields must not leak information about unloaded relations
- Ensure `whenLoaded()` doesn't silently fail when relation is loaded but null

## Related Rules
- Define toArray With Explicit Field Mapping
- Use when and whenLoaded For Conditional Fields
- Use mergeWhen For Conditional Field Groups
- Use dedicated Resource Classes For Nested Relations
- Always Use whenLoaded For Optional Relationships
- Never Return parent::toArray() In API Resources

## Related Skills
- Envelope Response Design — for data wrapping
- Resource Relationships — for relation serialization
- Sparse Field Selection — for field-level inclusion

## Success Criteria
- Resources transform model data to API contract exactly
- Conditional fields appear only when conditions are met
- Related resources use `whenLoaded()` — no crashes on unloaded relations
- Sensitive fields never exposed in serialized output
- Field names consistent with API naming convention
- Collections transform predictably with `::collection()`
