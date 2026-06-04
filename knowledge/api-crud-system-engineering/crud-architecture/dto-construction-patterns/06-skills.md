# Skill: Implement DTO Construction Patterns

## Purpose
Construct DTOs from validated request data, arrays, or model data using named constructors: `fromRequest()`, `fromArray()`, `fromModel()`, with validation before construction.

## When To Use
- DTO creation from multiple sources
- Type-safe data construction
- Action parameter preparation

## When NOT To Use
- Direct DTO construction with `new DTO(...)` only
- Simple parameter passing

## Workflow
1. Implement `fromRequest(StoreUserRequest $request): self` for Form Request data
2. Implement `fromArray(array $data): self` for array data
3. Implement `fromModel(User $user): self` for model data
4. Validate data before construction in named constructor
5. Use `static` return type for named constructors
6. Throw `InvalidArgumentException` for invalid construction data
7. Keep named constructors focused — one source per constructor
8. Use private constructor to force named constructor usage
9. Test each named constructor with valid and invalid data
10. Document construction patterns in team conventions

## Validation Checklist
- [ ] fromRequest() named constructor
- [ ] fromArray() named constructor
- [ ] fromModel() named constructor
- [ ] Validation before construction
- [ ] Invalid data throws exception
- [ ] Private constructor forces named usage
- [ ] Tested for all construction patterns

## Related Skills
- Data Transfer Object Design
- Form Request Validation Logic
- Action Class Design
