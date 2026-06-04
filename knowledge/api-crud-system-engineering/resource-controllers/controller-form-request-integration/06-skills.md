# Skill: Implement Controller Form Request Integration

## Purpose
Inject specific Form Request classes into controller method signatures for automatic validation, authorization, and cleaned data access before controller logic executes.

## When To Use
- CRUD controller store and update methods
- Controllers requiring request validation
- Authorization at request level

## When NOT To Use
- Read-only endpoints (GET, DELETE without body)
- Simple endpoints with inline validation

## Prerequisites
- Form Request creation
- Controller method injection

## Inputs
- Store and Update Form Request classes per resource

## Workflow
1. Create dedicated Form Request per action: `StoreUserRequest`, `UpdateUserRequest`
2. Inject in controller method: `public function store(StoreUserRequest $request) { ... }`
3. Access validated data via `$request->validated()`
4. Access authorization result via `$request->authorize()`
5. Use `$request->only()` or `$request->safe()` for specific fields
6. Keep controller method signature with specific Request type
7. Use base Request class for shared validation
8. Test Form Request validation via controller integration tests
9. Document which Form Request handles which action
10. Ensure `failedValidation()` override returns JSON

## Validation Checklist
- [ ] Dedicated Form Request per action
- [ ] Injected in controller method signature
- [ ] validated() used for data access
- [ ] authorize() method implemented
- [ ] failedValidation() returns JSON
- [ ] Tested via integration tests

## Related Skills
- Form Request Design for APIs
- Form Request Validation Logic
- Resource Controller Methods
