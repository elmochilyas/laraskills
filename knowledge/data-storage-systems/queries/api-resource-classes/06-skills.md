# Skill: Shape API Responses with Resource Classes

## Purpose

Create API Resource classes (extending `JsonResource`) for per-endpoint data shaping — using conditional attributes (`whenLoaded`, `whenHas`), narrow field selection, and resource collections for paginated responses — preventing the one-serialization-fits-all anti-pattern.

## When To Use

- API endpoints returning model data
- Different field sets for list vs detail views
- Conditional attribute inclusion based on loaded relationships
- Paginated responses with metadata

## When NOT To Use

- Internal-only responses (use simple toArray/toJson)
- Simple endpoints where the default serialization is sufficient

## Prerequisites

- Understanding of the resource's `toArray($request)` method
- Knowledge of `whenLoaded`, `whenHas`, `when` helpers

## Inputs

- Model instance or collection
- Request context (for conditional inclusion)
- Relationship loading state (for whenLoaded)

## Workflow

1. Generate resource: `php artisan make:resource PostResource`
2. Define `toArray($request)` returning only needed fields
3. Use `$this->whenLoaded('comments')` for conditional relationship inclusion
4. Use `PostResource::collection($posts)` for list responses
5. Use `PostResource::collection($posts)->response()` for paginated responses

## Validation Checklist

- [ ] No N+1 from resource accessing unloaded relationships
- [ ] Sensitive fields are not included in the resource
- [ ] List resources are sparse (fewer fields than detail resources)
- [ ] Paginated resources properly wrap meta information

## Common Failures

### Accessor causing N+1
A resource accesses `$this->someRelation->count()` which lazy loads the relation. Use `whenLoaded` or preload the relationship.

### Including too many fields by default
The resource includes all model attributes, exposing sensitive columns. Be explicit about included fields.

## Decision Points

### Resource vs model $hidden/$appends?
Resources provide per-endpoint control. $hidden/$appends are model-wide. Use resources when different endpoints need different data shapes.

### Single resource vs resource collection?
Single resource for item endpoints. Resource collection (or `SomeResource::collection()`) for list endpoints.

## Performance Considerations

Resources execute accessors. Ensure accessed relationships are eager loaded. Use `whenLoaded` to avoid lazy loading. Sparse resources for lists reduce response size.

## Security Considerations

Always explicitly include fields in resources. Don't rely on `$this->attributes` — list only what the consumer needs. Exclude internal/system fields.

## Related Rules

- Use whenLoaded to prevent N+1 in resources
- Be explicit about included fields
- Create separate resources for list vs detail views

## Related Skills

- Configure Model Serialization
- Define Eloquent Relationship Types
- Cast Model Attributes for Type Safety

## Success Criteria

- Resources have explicit, minimal field lists
- No N+1 queries from resource accessor calls
- List and detail views use different resources
- Paginated responses include proper meta data
