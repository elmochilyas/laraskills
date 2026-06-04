# Skill: Implement Conditional Field Inclusion

## Purpose
Include fields in API responses conditionally based on request parameters, authorization, or relationship load state using `when()`, `whenLoaded()`, `whenHas()`, `mergeWhen()` in API Resources.

## When To Use
- Resources with optional fields
- Performance-sensitive responses
- Authorization-gated field visibility

## When NOT To Use
- All fields always required
- Simple resources (2-3 fields)

## Prerequisites
- API Resource transformation
- Relationship definitions

## Inputs
- Conditional field rules per resource

## Workflow
1. Use `$this->when($condition, $value)` for boolean-gated fields
2. Use `$this->whenLoaded('relation', fn() => ...)` for optional relationships
3. Use `$this->whenHas('pivot_field', fn() => ...)` for pivot data
4. Use `$this->mergeWhen($condition, [...])` for conditional field groups
5. Use `$this->when($request->user()?->isAdmin(), ...)` for authorization-gated fields
6. Use `$this->when($request->has('include'), ...)` for request-gated fields
7. Never include sensitive fields without authorization check
8. Test field presence and absence under each condition
9. Document conditional fields with trigger conditions
10. Use `whenAppended()` for appended attributes

## Validation Checklist
- [ ] `when()` for boolean conditions
- [ ] `whenLoaded()` for optional relations
- [ ] `whenHas()` for pivot data
- [ ] `mergeWhen()` for conditional groups
- [ ] Authorization-gated fields use `when()`
- [ ] Sensitive fields protected by auth checks
- [ ] Field presence tested per condition
- [ ] Conditional fields documented

## Related Skills
- API Resource Transformation
- Include Related Resources
- Sparse Field Selection
