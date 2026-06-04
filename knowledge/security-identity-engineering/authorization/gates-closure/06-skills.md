# Skill: Define Authorization Gates Using Closures for Simple Access Rules

## Purpose
Implement lightweight authorization gates using closures in `AppServiceProvider` for simple, role-based, or context-specific access rules that don't warrant a full Policy class.

## When To Use
- Simple yes/no authorization rules (e.g., admin-only access)
- Authorization based on simple user attribute checks
- Gates that don't need a specific model or resource
- When a full Policy class is overkill

## When NOT To Use
- CRUD authorization per model (use Policies instead)
- Complex authorization with multiple conditions (use Policies)
- When the gate logic grows beyond a few lines (extract to Policy)

## Prerequisites
- Laravel authorization system configured
- Understanding of `AuthServiceProvider` gate registration

## Workflow
1. Define gates in `AppServiceProvider` or `AuthServiceProvider` using `Gate::define()`
2. Write closure that receives `$user` and optional model parameter
3. Return boolean from closure: `true` for authorized, `false` for denied
4. Use `@can('gate-name')` in Blade and `$this->authorize('gate-name')` in controllers
5. Use `Gate::before()` for super-admin bypass that overrides all gates
6. Test each gate with authorized and unauthorized users
7. Extract gates to Policy class when they exceed 3-4 conditions

## Validation Checklist
- [ ] Gates defined for application-specific access rules
- [ ] Each gate returns boolean for unambiguous authorization
- [ ] `Gate::before()` allows super-admin to bypass all gates
- [ ] Gates tested with both authorized and unauthorized users
- [ ] Complex gates extracted to Policy classes where appropriate
