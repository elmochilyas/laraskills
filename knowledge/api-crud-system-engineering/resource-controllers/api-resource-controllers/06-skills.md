# Skill: Design API Resource Controllers

## Purpose
Create API-specific controllers with `apiResource()` route registration, thin methods delegating to actions/services, Form Request injection for validation, and Resource-based response transformation.

## When To Use
- All CRUD API endpoints
- New resource creation
- Existing resource endpoint refactoring

## When NOT To Use
- Action endpoints (use single-action controllers)
- Read-only endpoints (use invokable controllers or `__invoke()`)
- Non-API controllers (web, admin)

## Prerequisites
- Laravel route registration
- RESTful controller patterns

## Inputs
- Resource definitions
- CRUD operation requirements

## Workflow
1. Generate controller: `php artisan make:controller Api/V1/UserController --api`
2. Register routes with `Route::apiResource('users', UserController::class)` — never `resource()`
3. Implement 5 standard methods: `index`, `store`, `show`, `update`, `destroy`
4. Inject Form Request classes in store and update method signatures
5. Delegate business logic to action classes — keep methods under 10 lines
6. Return API Resources from all methods — never raw response()->json()
7. Use route model binding for show, update, destroy parameters
8. Add pagination for index via `Model::paginate()` or `cursorPaginate()`
9. Include authorization gates via `$this->authorize()` or `Policy`
10. Handle soft-deletes in destroy — `$model->delete()` for soft, `forceDelete()` only when intended

## Validation Checklist
- [ ] Controller generated with `--api` flag
- [ ] Routes registered with `Route::apiResource()`
- [ ] Only 5 CRUD methods present (index, store, show, update, destroy)
- [ ] Form Request injected for store and update
- [ ] Business logic delegated to actions/services
- [ ] API Resource returned from all methods
- [ ] Route model binding used for model resolution
- [ ] Pagination on index method
- [ ] Authorization gates applied
- [ ] Delete behavior handles soft-deletes correctly

## Common Failures
- Using `Route::resource()` instead of `apiResource()` — adds create/edit routes
- Business logic in controller — violates Single Responsibility
- Returning `response()->json()` instead of Resource instances — bypasses envelope
- No Form Request injection — validation inline or absent
- Missing pagination on index — returns all records
- Authorization in controller action instead of Policy — spreads authorization logic
- No resource transformation — raw models serialized with all attributes

## Decision Points
- Single vs split controllers (AdminUserController, UserController) — split for different access levels
- Form Request per action vs per resource — per action for clean separation
- Route model binding explicit vs implicit — implicit for standard, explicit with `->bind()` for custom

## Performance Considerations
- Route model binding adds one query per model in route — scope to eager-load where needed
- Form Request validation runs before controller — predictable execution order
- Controller method delegation overhead is negligible

## Security Considerations
- Authorization via Policy or `authorize()` method
- Route model binding with soft-delete — `withTrashed()` only when intended
- Scoped bindings for nested resources — prevents cross-resource access
- Form Request `authorize()` method gates access before validation

## Related Rules
- Use apiResource Route Registration
- Inject Form Requests In Store And Update Signatures
- Delegate Business Logic To Actions/Services
- Return API Resource Instances
- Use Route Model Binding For Model Resolution
- Add Pagination To Index Method

## Related Skills
- Nested Resource Controllers — for nested routing
- Resource Controller Methods — for method conventions
- Action Class Design — for delegation patterns
- Form Request Design for APIs — for validation injection

## Success Criteria
- Controllers follow consistent API resource pattern with 5 methods
- Routes registered via `apiResource` — exactly 5 routes per resource
- Controllers are thin (<10 lines per method) delegating to actions
- Form Request injection handles validation before controller execution
- API Resource transformation formats responses consistently
- Authorization gated via Policies or authorize() method
- Index method returns paginated results
