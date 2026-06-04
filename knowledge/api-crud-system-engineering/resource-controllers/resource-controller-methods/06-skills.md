# Skill: Structure Resource Controller Methods

## Purpose
Implement resource controller methods with consistent signatures: `index(Request)` returning paginated collection, `store(StoreRequest)` returning created resource, `show(Model)` returning resource, `update(UpdateRequest, Model)` returning updated resource, `destroy(Model)` returning 204.

## When To Use
- All CRUD API resource controllers
- New resource endpoint implementation
- Controller method standardization

## When NOT To Use
- Action endpoints (cancel, export) — use separate controllers
- Read-only resources — use invokable or `__invoke()` pattern

## Prerequisites
- `apiResource()` route registration
- API Resource classes

## Inputs
- Resource CRUD operation specifications
- Route model binding configuration

## Workflow
1. Implement `index(Request $request)` — return paginated collection via `Resource::collection(Model::paginate())`
2. Implement `store(StoreRequest $request)` — delegate to action, return single resource with 201
3. Implement `show(Model $model)` — return single resource with 200
4. Implement `update(UpdateRequest $request, Model $model)` — delegate to action, return updated resource with 200
5. Implement `destroy(Model $model)` — delegate to action, return 204 No Content
6. Use type-hinted model parameters for route model binding
7. Inject specific Form Request classes for store/update
8. Include `$this->authorize()` calls before business logic
9. Return proper HTTP status codes — 201 for store, 200 for show/update, 204 for destroy
10. Keep methods under 10 lines — delegate to actions/services

## Validation Checklist
- [ ] `index` returns `Resource::collection(Model::paginate())`
- [ ] `store` returns `new Resource($model)` with 201
- [ ] `show` returns `new Resource($model)` with 200
- [ ] `update` returns `new Resource($model)` with 200
- [ ] `destroy` returns 204 No Content
- [ ] Model parameters type-hinted for route model binding
- [ ] Specific Form Requests injected for store/update
- [ ] `$this->authorize()` called before business logic
- [ ] Correct HTTP status codes per method
- [ ] Methods under 10 lines — business logic delegated

## Common Failures
- `store` returning 200 instead of 201 — client can't distinguish create
- `destroy` returning 200 with body instead of 204 — extra processing
- Model parameter not type-hinted — missing route model binding
- Generic `Request` instead of specific Form Request — validation inline
- No authorization — resource accessible without permission check
- Business logic in controller — action class should handle it
- `index` without pagination — returns all records

## Decision Points
- Return type consistency — always return Resource instances for 200/201
- Status code for update — 200 (with body) vs 204 (without body)
- Pagination type — `paginate()` for offset, `cursorPaginate()` for cursor

## Performance Considerations
- Route model binding adds one query per model — scope to eager-load
- Pagination query runs on `index` — use indexes for performance
- Resource transformation runs on responses — test for large collections

## Security Considerations
- `$this->authorize()` must run before any business logic
- Route model binding with soft-deletes — use `->withTrashed()` only where intended
- Form Request `authorize()` method gates access at validation level
- Destroy must check authorization before deletion

## Related Rules
- Return 201 For Store, 200 For Show/Update, 204 For Destroy
- Inject Specific Form Request Classes
- Use Type-Hinted Model Parameters For Route Model Binding
- Call Authorize Before Business Logic
- Delegate Business Logic To Actions/Services
- Return Paginated Collection From Index

## Related Skills
- API Resource Controllers — for controller creation
- Action Class Design — for delegation pattern
- Form Request Design for APIs — for validation injection
- Route Model Binding — for binding configuration

## Success Criteria
- All resource controllers follow consistent method signatures
- Correct HTTP status codes for each CRUD operation
- Form Requests handle validation for store/update
- Authorization runs before business logic
- Business logic delegated to action classes
- Methods under 10 lines — single responsibility per method
- Integration tests verify method behavior per status code
