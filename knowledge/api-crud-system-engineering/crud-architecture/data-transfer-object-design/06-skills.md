# Skill: Implement Data Transfer Object Design

## Purpose
Create immutable Data Transfer Objects (DTOs) for passing structured data between layers with typed properties, named constructors, validation, serialization, and Action class integration.

## When To Use
- Passing data between controllers and actions
- Complex input data with multiple fields (>3)
- Type-safe data transfer across architectural boundaries

## When NOT To Use
- Simple single-field inputs — direct parameter passing
- Eloquent model data — models are already structured
- Form Request data that's used directly in controller

## Prerequisites
- PHP 8+ property promotion
- Action class pattern

## Inputs
- Data field specifications
- Type and validation requirements

## Workflow
1. Create final immutable DTO class with `readonly` properties
2. Use constructor property promotion: `public function __construct(public readonly string $name, ...)`
3. Implement named constructor `fromArray(array $data): static` for creation from arrays
4. Use typed properties with union types where nullable: `public readonly ?string $middleName`
5. Add `toArray(): array` method for serialization
6. Include static validation: `public static function rules(): array` for validation rule integration
7. Keep DTOs anemic — no business logic, only data
8. Use DTOs in action class method signatures: `public function __invoke(CreateUserDto $dto): User`
9. Create DTO from validated request data in controller
10. Document field descriptions and constraints on DTO properties

## Validation Checklist
- [ ] DTO class is final with readonly properties
- [ ] Constructor property promotion used
- [ ] `fromArray()` named constructor for array creation
- [ ] Typed properties with nullable types where needed
- [ ] `toArray()` method for serialization
- [ ] Static `rules()` for validation rule integration
- [ ] DTO is anemic — no business logic
- [ ] Action accepts DTO as parameter
- [ ] DTO created from validated request in controller
- [ ] Property docblocks describe fields

## Common Failures
- DTO with business logic — violates single responsibility
- Mutable DTO — properties can change after creation, unpredictable behavior
- No `fromArray()` — everywhere creates DTO manually, inconsistent
- DTO too large — 10+ fields suggests need for nested DTOs
- DTO used instead of Form Request — DTO is for data, Form Request is for validation
- No `toArray()` — can't easily serialize for response or logging
- DTO constructor with many optional parameters — use named constructor or builder

## Decision Points
- Immutable vs mutable — immutable for all DTOs, mutable only for form builders
- Named constructor vs direct `new` — named constructor for validation/conversion
- Nested DTOs vs flat — nested for hierarchical, flat for simple transfers
- DTO vs Collection — DTO for single record, Collection for multiple

## Performance Considerations
- DTO creation is lightweight (~0.001ms) — no overhead concern
- `toArray()` on large nested DTOs involves recursion — O(n)
- Immutable objects are memory-efficient — shared references for unchanged properties

## Security Considerations
- DTOs created from validated data — trust data after validation
- Never pass raw request data directly to DTO — validate first
- `toArray()` must not expose internal implementation details or sensitive fields
- `__debugInfo()` override to prevent sensitive data leakage in logs

## Related Rules
- Create Final, Readonly DTO Classes
- Use Constructor Property Promotion
- Implement fromArray And toArray Methods
- Keep DTOs Anemic — No Business Logic
- Accept DTOs In Action Class Signatures
- Create DTOs From Validated Request Data

## Related Skills
- Action Class Design — for DTO integration
- Form Request Validation Logic — for validation before DTO creation
- Resource Controller Methods — for DTO usage in controllers

## Success Criteria
- DTOs are immutable with typed readonly properties
- Named constructor `fromArray()` creates DTO from validated data
- `toArray()` serializes consistently
- DTOs passed to action classes for business logic
- No business logic in DTO classes
- Fields documented with descriptions and types
