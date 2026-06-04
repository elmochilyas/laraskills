# Skill: Implement Authorization in Form Requests

## Purpose
Define authorization logic in Form Request's `authorize()` method to gate access before validation runs, preventing information leakage through validation errors.

## When To Use
- Form Requests with authorization requirements
- Preventing validation-based information disclosure
- Authorization at the request level

## When NOT To Use
- Authorization already handled by middleware or controller
- Public endpoints without auth requirements

## Prerequisites
- Form Request design
- Laravel authorization system

## Inputs
- Authorization rules per request type

## Workflow
1. Implement `authorize(): bool` in Form Request
2. Check user authentication: `return auth()->check()`
3. Check user permissions/roles: `return $user->can('create', Post::class)`
4. Return false for unauthorized — framework handles 403
5. Return true for public endpoints
6. Use Policy gates for model-specific authorization
7. Access route parameters in authorize(): `$this->route('user')`
8. Don't query database in authorize() — use Policy instead
9. Test authorize method with authorized and unauthorized users
10. Document authorization rules per Form Request

## Validation Checklist
- [ ] authorize() method implemented
- [ ] Authentication check
- [ ] Permission/role check
- [ ] Returns false for unauthorized → 403
- [ ] Uses Policy gates
- [ ] Tested with authorized and unauthorized users

## Related Skills
- Form Request Design for APIs
- Policy Design for APIs
- Authorization via Middleware
