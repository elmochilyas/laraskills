# Skill: Map Validated Data to DTO Payload in Form Request
## Purpose
Automatically convert validated request data into a typed Data Transfer Object (DTO) within the Form Request, so controllers receive a strongly-typed object instead of a raw array.
## When To Use
When using DTOs for internal data passing; when controllers should not depend on request state; when multiple consumers need the same validated shape.
## When NOT To Use
Simple CRUD with no DTO layer; when the DTO is constructed manually in the controller (use manual construction instead); prototype/exploratory code.
## Prerequisites
Form Request Design; DTO class with typed properties; validation rules.
## Inputs
Validated input array; DTO class definition; optional: mapping logic for complex transformations.
## Workflow
1. Define a DTO class with typed public properties or a constructor with named parameters
2. In the Form Request, override `passedValidation()` or create a custom `toDto()` method
3. Inside the method, instantiate the DTO using `$this->validated()` or `$this->validatedWithCasts()`
4. For nested or transformed fields, map inside the DTO factory method (not in the Form Request)
5. Register the Form Request in the controller method signature — DTO is resolved automatically
6. Optionally use a `DTOFactory` or `DTOFromRequest` action for complex mapping
## Validation Checklist
- [ ] DTO properties match validated keys (or mapping is explicit)
- [ ] DTO constructor or factory uses `validated()` — never raw `$this->input()`
- [ ] DTO is type-hinted in the controller method for automatic resolution
- [ ] Optional fields are nullable in the DTO to match validation
- [ ] Nested data is mapped to nested DTOs or value objects
## Common Failures
- Using `$this->input()` inside DTO mapping — bypasses validation
- DTO constructor requires all fields but validation allows nullables
- Mapping logic leaks into the Form Request instead of the DTO factory
- DTO is instantiated inside controller — duplicates mapping logic
## Decision Points
- DTO instantiation in `passedValidation()` vs dedicated service provider binding
- Named constructor (`DTO::fromRequest()`) vs constructor injection
## Performance/Security Considerations
DTO instantiation is negligible overhead. Security: DTO never contains unvalidated data; sensitive fields are excluded in validation.
## Related Rules/Skills
Form Request Design; DTO Integration — `toDto()` Method; Input Preparation.
## Success Criteria
Controllers receive a typed DTO with validated data; no controller method calls `$request->input()` or `$request->validated()` directly.
