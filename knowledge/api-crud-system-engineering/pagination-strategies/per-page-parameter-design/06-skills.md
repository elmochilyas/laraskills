# Skill: Implement Per-Page Parameter Design

## Purpose
Design `per_page` query parameter behavior: default value, maximum cap, allowed values, validation, and response behavior when parameter is omitted or invalid.

## When To Use
- Paginated list endpoints
- Configurable page size APIs

## When NOT To Use
- Fixed page size endpoints
- Cursor pagination without per_page parameter

## Inputs
- Default per_page value
- Max per_page cap
- Allowed values (if restricted set)

## Workflow
1. Set default `per_page`: 15 for general APIs, 50 for admin
2. Set maximum `per_page`: 100 for public, 500 for internal
3. Validate `per_page` is positive integer: `integer|min:1|max:100`
4. Return 422 for per_page > max
5. Return 422 for per_page < 1 or non-numeric
6. Return 422 for per_page = 0 (edge case)
7. Use default when per_page omitted
8. Document per_page behavior per endpoint
9. Consider allowed values set for simpler validation
10. Log high per_page values (>50) for abuse detection

## Validation Checklist
- [ ] Default per_page configured
- [ ] Max per_page cap enforced
- [ ] Positive integer validation
- [ ] 422 for exceeds max
- [ ] 422 for non-numeric/zero
- [ ] Default used when omitted
- [ ] Documented behavior

## Related Skills
- Offset-Based Pagination
- Pagination Strategy Selection
- Pagination Parameter Validation
