# Skill: Convert Form Request to DTO via toDto Method
## Purpose
Provide a `toDto()` method on Form Requests that transforms validated data into a typed DTO, keeping the transformation logic co-located with the validation rules.
## When To Use
When every controller action that uses this Form Request needs the same DTO; when the mapping from validated data to DTO is non-trivial (renames, nested objects, type casts).
## When NOT To Use
Simple CRUD DTO mapping (use direct constructor from `validated()`); when the mapping varies per controller (use a service-level mapper instead).
## Prerequisites
Form Request Design; DTO class; understanding of Laravel's validation lifecycle.
## Inputs
Validated data array; target DTO class; mapping rules (optional).
## Workflow
1. Add a `toDto()` method to the Form Request that returns a DTO instance
2. Inside `toDto()`, call `$this->validated()` and pass mapped values to the DTO
3. Handle nested/conditional mapping inside `toDto()` — not in the controller
4. Type-hint the Form Request and call `$request->toDto()` in the controller
5. If the DTO needs additional data not in the request, pass it as a parameter to `toDto()`
## Validation Checklist
- [ ] `toDto()` references only `validated()` — never raw request data
- [ ] DTO constructor accepts mapped parameter names matching the DTO properties
- [ ] Nested arrays are mapped to typed sub-DTOs or collections
- [ ] Optional validated fields default correctly in the DTO
- [ ] `toDto()` is tested independently with known validated data
## Common Failures
- `toDto()` uses `$this->input()` — bypasses validation
- Mapping logic duplicates the validation rules (field exists but is optional)
- DTO has required parameters for nullable validated fields
- `toDto()` has side effects (logging, dispatch) — use `passedValidation()` for that
## Decision Points
- `toDto()` on Form Request vs static factory on DTO class
- Implicit mapping (same key names) vs explicit mapping (rename/cast)
## Performance/Security Considerations
Negligible overhead. Security: validated-only data guarantee; never expose internal or unvalidated fields on the DTO.
## Related Rules/Skills
Form Request Design; DTO Integration — Payload Method; Input Preparation; After Validation Hooks.
## Success Criteria
Every controller action receives a typed DTO via `$request->toDto()`; mapping logic is centralized in one place, not duplicated across controllers.
