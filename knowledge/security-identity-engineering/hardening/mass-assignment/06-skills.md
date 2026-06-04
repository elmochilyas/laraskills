# Skill: Protect Against Mass Assignment Vulnerabilities

## Purpose
Configure Eloquent `$fillable` or `$guarded` properties on all models to prevent mass assignment attacks where request input sets unauthorized attributes.

## When To Use
- Every Eloquent model accepting user input
- Any `create()` or `update()` call passing request data directly
- API endpoints that accept JSON payloads mapping to model attributes

## When NOT To Use
- Read-only models (never written via user input)
- Models where all attributes are intentionally mass-assignable (rare — document clearly)

## Prerequisites
- Eloquent models
- Understanding of which attributes should be mass-assignable

## Workflow
1. Define `$fillable` array on every model — list only safe attributes for mass assignment
2. Alternatively use `$guarded` with `$guarded = ['id']` for allow-all-except-few approach
3. Never add sensitive attributes to `$fillable` (is_admin, role_id, password)
4. Explicitly set guarded/sensitive attributes individually: `$user->is_admin = true`
5. Use Form Requests with `$request->validated()` to get only validated data
6. Audit all `create()` and `update()` calls to ensure only intended attributes are passed
7. Enable Enlightn's mass assignment checks in CI to detect missing `$fillable`

## Validation Checklist
- [ ] All models have `$fillable` or `$guarded` defined
- [ ] Sensitive attributes (is_admin, role_id) not in `$fillable`
- [ ] `$request->validated()` used with Form Requests
- [ ] No `create($request->all())` patterns in codebase
- [ ] Enlightn mass assignment check passes
