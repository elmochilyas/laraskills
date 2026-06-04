# Skill: Implement Conditional Relationship Inclusion

## Purpose
Include related resource data in API responses conditionally via `whenLoaded()`, ensuring related data only appears when eager-loaded for performance optimization.

## When To Use
- Resources with optional relationship data
- Performance-optimized responses
- Reducing payload size for common requests

## When NOT To Use
- Required relationships — always include
- Simple resources without relationships

## Prerequisites
- API Resource transformation
- Relationship definitions

## Inputs
- Optional relationship list per resource

## Workflow
1. Use `'relation' => $this->whenLoaded('relation', fn() => RelatedResource::make($this->relation))`
2. Only include relationships that are optional — not always needed
3. Use `whenLoaded()` in nested resources for chain loading
4. Combine with include parameter for client-driven relationship loading
5. Return null-safe: `whenLoaded` returns `null` not error when not loaded
6. Use `whenAggregated()` for aggregated relation data
7. Test with and without relationship loaded
8. Document which relationships are conditional vs always loaded

## Validation Checklist
- [ ] `whenLoaded()` for optional relationships
- [ ] Not-loaded relations return null, not error
- [ ] Nested resources use `whenLoaded()`
- [ ] Combined with include parameter
- [ ] Tested with and without loaded relations
- [ ] Documented conditional relationships

## Related Skills
- Include Related Resources
- Conditional Field Inclusion
- API Resource Transformation
