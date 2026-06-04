# Skill: Test Authorization Policies, Gates, and Permissions

## Purpose
Write comprehensive PHPUnit tests for Laravel authorization (Gates, Policies, RBAC permissions) to verify access control rules are correctly enforced.

## When To Use
- Any application with authorization logic
- Before deploying authorization changes to production
- When adding new roles, permissions, or policies
- Compliance testing (verify access controls work as documented)

## When NOT To Use
- Applications without authorization logic
- Rapid prototyping (test coverage added later)

## Prerequisites
- PHPUnit configured in Laravel project
- Authorization system in place (Gates, Policies, or Spatie)
- User factories with role/permission assignment

## Workflow
1. Create test users with specific roles and permissions
2. Test each policy method (view, create, update, delete) with authorized user
3. Test each policy method with unauthorized user (expect 403)
4. Test edge cases: unauthenticated user, soft-deleted resource, suspended user
5. For Spatie: test that `$user->can('permission')` returns correct boolean
6. For Gates: test each gate closure with allowed and denied scenarios
7. Test authorization bypass: super-admin should pass all checks
8. Test that permission changes take effect (cache cleared)

## Validation Checklist
- [ ] Every policy method tested (view, create, update, delete, restore, forceDelete)
- [ ] Authorized and unauthorized users tested for each method
- [ ] Edge cases covered: unauthenticated, suspended, soft-deleted
- [ ] RBAC permission checks tested independently
- [ ] Gate closures tested with passing and failing conditions
- [ ] Permission cache tests verify invalidation works
