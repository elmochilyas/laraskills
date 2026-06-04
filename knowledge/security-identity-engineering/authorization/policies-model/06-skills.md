# Skill: Create Model Policies for Resource-Based Authorization

## Purpose
Define authorization policies per Eloquent model using `php artisan make:policy` to centralize CRUD access control logic in dedicated policy classes.

## When To Use
- Every Eloquent model that needs CRUD authorization
- Standardizing authorization across view, create, update, delete operations
- Separating authorization logic from controllers

## When NOT To Use
- Simple admin-only checks that don't vary per resource (use Gates)
- Applications without resource-specific authorization logic

## Prerequisites
- Laravel authorization system configured
- Eloquent models requiring authorization
- User authentication configured

## Workflow
1. Generate policy: `php artisan make:policy PostPolicy --model=Post`
2. Implement `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete` methods
3. Register policy in `AuthServiceProvider::$policies` array
4. Use `$this->authorize('update', $post)` in controllers
5. Use `$user->can('update', $post)` for manual checks
6. Use `@can('update', $post)` in Blade templates
7. Implement super-admin bypass via `Gate::before()` or policy method
8. Write PHPUnit tests for each policy method with authorized and unauthorized users

## Validation Checklist
- [ ] Policy registered in `AuthServiceProvider`
- [ ] All CRUD methods implemented (viewAny, view, create, update, delete)
- [ ] Soft-delete methods where needed (restore, forceDelete)
- [ ] Policies authorize based on resource ownership or attributes
- [ ] Super-admin bypass implemented
- [ ] Policy tests cover all methods with both positive and negative cases
