# Skill: Bridge FormRequest to Typed DTO Using validated()

## Purpose
Convert a validated FormRequest into a strongly-typed, immutable Data Transfer Object before passing data to the service layer, decoupling domain code from HTTP concerns.

## When To Use
- Services and actions that need typed, validated input
- Data crossing multiple layers (controller → service → action → repository)
- API-first applications where data must be serialized, cached, or queued
- Teams enforcing strong typing and immutability in the domain layer

## When NOT To Use
- Simple CRUD where data flows directly to Eloquent create/update
- Actions needing only 1-2 fields
- Single-layer operations where DTO adds ceremony without benefit

## Prerequisites
- FormRequest class with validation rules defined
- DTO class in the domain/feature layer (not HTTP layer)
- PHP 8.1+ for `readonly` properties

## Inputs
- FormRequest instance (post-validation)
- Validated data from `$request->validated()`

## Workflow
1. Create a DTO class in the domain layer (e.g., `App\Domain\User\Data\UserDto`)
2. Declare DTO properties as `public readonly` in the constructor
3. Add a static factory method `fromRequest(StoreUserRequest $request): self` on the DTO
4. Inside the factory, use `$request->validated()` (never `$request->all()`)
5. Spread validated data into the DTO constructor: `new self(...$request->validated())`
6. Optionally use `$request->safe()->only(['field1', 'field2'])` for scoped DTO construction
7. Optionally add a `payload()` convenience method on the FormRequest
8. In the controller, convert request to DTO before passing to service

## Validation Checklist
- [ ] DTO built from `$request->validated()` — never `$request->all()`
- [ ] DTO properties are `public readonly` (immutable)
- [ ] DTO lives in domain/feature layer — not `App\Http`
- [ ] Service layer receives DTO, not FormRequest
- [ ] `fromRequest()` factory method provided on DTO
- [ ] `safe()->only()` used for scoped DTO construction when applicable
- [ ] Controller converts request to DTO before calling service
- [ ] Tests cover DTO construction from valid/invalid data

## Common Failures
- Using `$request->all()` instead of `$request->validated()` — unvalidated data enters DTO
- Placing DTO in HTTP namespace — domain code depends on HTTP infrastructure
- Passing FormRequest directly to service — couples service to HTTP
- Creating mutable DTOs — state can be changed after construction
- Spreading all validated fields into DTO without scoping — extra fields leak through

## Decision Points
- Use `fromRequest()` factory on DTO vs `payload()` method on FormRequest — be consistent across the codebase
- Use `validated()` spread for exact match vs `safe()->only()` for scoped construction
- Place DTO in feature module vs centralized `App\Domain\Data` directory

## Performance Considerations
- DTO construction is sub-millisecond — negligible overhead
- `safe()` returns a `ValidatedInput` instance — negligible overhead
- Immutable DTOs are safe to cache, serialize, or queue

## Security Considerations
- DTOs provide an additional security layer by guaranteeing only validated data enters domain code
- `validated()` excludes extra fields — prevents mass-assignment through DTO
- Type hints on DTO properties prevent type confusion attacks
- Immutability prevents accidental data corruption in service code

## Related Rules
- Rule 1: Build DTOs from validated() — Never from all()
- Rule 2: Make DTOs Immutable with readonly Properties
- Rule 3: Keep DTOs in the Domain Layer — Not the HTTP Layer
- Rule 4: Do Not Pass FormRequest to the Service Layer
- Rule 5: Use Static Factory Methods on DTOs for Consistent Construction
- Rule 6: Use safe()->only() for Scoped DTO Construction

## Related Skills
- Create and Use Invokable Custom Validation Rules
- Implement HTTP-Layer Authorization in FormRequests

## Success Criteria
- Service layer receives strongly-typed DTO with validated data
- No HTTP dependency exists in domain code
- DTO is immutable after construction
- Controller code is clean: `$service->execute(UserDto::fromRequest($request))`
- Tests verify DTO construction from validated data
- No unvalidated data can enter the DTO

---

# Skill: Implement payload() Convenience Method on FormRequest

## Purpose
Add a `payload()` method to FormRequests that returns a typed DTO directly, providing a clean, consistent interface for controllers.

## When To Use
- When the DTO bridge pattern is used consistently across the project
- Teams that prefer the `$request->payload()` syntax over `Dto::fromRequest($request)`
- FormRequests that always produce the same DTO type

## When NOT To Use
- When the same FormRequest produces different DTOs depending on controller context
- When the DTO construction logic is complex and belongs on the DTO itself
- When the project standardizes on the `fromRequest()` factory pattern

## Prerequisites
- FormRequest class with validation rules
- DTO class in the domain layer

## Inputs
- FormRequest instance
- Validated data from `$request->validated()`

## Workflow
1. Add a `payload(): DtoType` method to the FormRequest
2. Inside `payload()`, use `$request->validated()` as the data source
3. Use `$this->safe()->only(['field1', 'field2'])` for scoped construction
4. Return a new DTO instance with the validated data
5. In the controller, call `$request->payload()` and pass the result to the service
6. Write tests that verify the payload method produces the correct DTO from valid input

## Validation Checklist
- [ ] `payload()` returns the typed DTO (not array)
- [ ] Method uses `validated()` or `safe()->only()` — never `all()`
- [ ] Return type is explicitly declared (e.g., `payload(): UserDto`)
- [ ] Controller uses the payload method consistently
- [ ] Tests verify DTO creation from payload()

## Common Failures
- Using `$request->all()` inside payload() — unvalidated data enters DTO
- Not declaring return type — defeats type safety purpose
- Inconsistent usage — some controllers use payload(), others use fromRequest()
- Complex logic inside payload() that should be on the DTO

## Decision Points
- Use `payload()` on FormRequest vs `fromRequest()` on DTO — choose one convention and apply consistently
- Place payload() on request vs factory on DTO — depends on where mapping knowledge resides

## Performance Considerations
- Negligible overhead — same as manual DTO construction

## Security Considerations
- Same as DTO bridge — only validated data passes through
- Type hint on return value enforces correct DTO type

## Related Rules
- Rule 5: Use Static Factory Methods on DTOs for Consistent Construction

## Related Skills
- Bridge FormRequest to Typed DTO Using validated
- Create and Use Invokable Custom Validation Rules

## Success Criteria
- Controller code is concise: `$service->execute($request->payload())`
- Return type is explicitly typed
- Only validated data reaches the DTO
- Pattern is consistent across all FormRequests
