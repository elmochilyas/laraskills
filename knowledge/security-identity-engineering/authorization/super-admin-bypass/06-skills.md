# Skill: Implement Super-Admin Bypass for Unrestricted Access

## Purpose
Configure super-admin users who bypass all authorization checks using `Gate::before()`, wildcard permissions, or policy overrides, while maintaining audit trails for bypassed actions.

## When To Use
- Applications requiring administrator accounts with unrestricted access
- Support teams needing to view and act on any resource
- Multi-tenant platforms with platform-level administrators

## When NOT To Use
- Applications where no user should have unrestricted access
- When privilege escalation risks outweigh administrative convenience
- Compliance environments requiring strict separation of duties

## Prerequisites
- User model with `is_admin` flag or super-admin role
- Authorization system (Gates, Policies, or Spatie)
- Audit logging for super-admin actions

## Workflow
1. Define super-admin identification: `$user->hasRole('super-admin')` or `$user->is_admin`
2. Implement `Gate::before()` in `AuthServiceProvider`: return `true` for super-admin
3. For Spatie: assign `*` wildcard permission to super-admin role only
4. Log all super-admin actions for audit trail — bypassed checks should still be logged
5. Test that super-admin passes all policy checks
6. Test that non-admin users are correctly restricted
7. Implement confirmation dialog for destructive super-admin actions

## Validation Checklist
- [ ] `Gate::before()` returns `true` for super-admin users
- [ ] Spatie wildcard `*` assigned only to super-admin role
- [ ] Super-admin can access all resources and actions
- [ ] Regular users correctly denied for unauthorized actions
- [ ] All super-admin actions logged in audit trail
- [ ] Destructive actions require additional confirmation
