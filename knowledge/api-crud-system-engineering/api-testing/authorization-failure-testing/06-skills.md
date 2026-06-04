# Skill: Test Authorization Failures

## Purpose
Write feature tests verifying that authenticated users without required permissions receive 403 Forbidden, using two-user positive-negative patterns, per-policy-method coverage, ownership tests, and database state assertions on denied mutations.

## When To Use
- Any endpoint with authorization logic (Gates, Policies, `authorize()`)
- APIs with role-based or ownership-based access control
- Multi-tenant APIs where users access only their data

## When NOT To Use
- Authentication failures (401)
- General happy path success testing
- Unit tests on policy classes (feature tests verify routing + policy integration)

## Prerequisites
- Laravel authorization (Gates, Policies)
- Feature test structure
- Authentication failure testing as prerequisite

## Inputs
- List of policy methods per resource
- Role/permission definitions
- User factories with different permission levels

## Workflow
1. Use two-user positive-negative pattern: create one user with permission (should succeed) and one without (should 403)
2. Write separate 403 test for each policy method (view, create, update, delete, restore, forceDelete)
3. Assert database state unchanged after denied mutations (update, restore, delete)
4. Test ownership explicitly: User A cannot modify User B's resource
5. Test with non-admin users only for denial tests — admin bypasses via `Gate::before`
6. Never expose denied permission details in 403 response error body
7. Use PestPHP datasets for role-based permission testing across multiple roles

## Validation Checklist
- [ ] Two-user positive-negative pattern for each authorization scenario
- [ ] Every policy method tested for denial (view, create, update, delete, restore, forceDelete)
- [ ] Database state asserted unchanged on denied mutations
- [ ] Ownership tests: User A cannot modify User B's resource
- [ ] Non-admin users used for denial tests (no Gate::before bypass)
- [ ] 403 error body does not expose denied permission details

## Common Failures
- Testing authorization with same user (both acting and owning) — never triggers denial
- Asserting only 403 without checking response body
- Forgetting ownership-based authorization tests
- Using admin users who bypass policies via `Gate::before`
- Missing policy tests — endpoint uses `authorize()` but no policy registered

## Decision Points
- Test organization: per-policy-method tests vs per-role dataset tests
- Positive-negative pairing: same test method vs separate methods
- Ownership test scope: all member routes vs representative sample

## Performance Considerations
- AuthZ tests require multiple database records (two users, resources owned by each)
- Use `beforeEach` to create user + resource once per class
- Use PestPHP datasets for role variations

## Security Considerations
- 403 responses must never reveal which permission was missing
- Log authZ failures at warning level — often indicate probing
- Global `Gate::before` bypasses all policies for admin — test with non-admin users

## Related Rules
- Use Two-User Positive-Negative Pattern
- Test Every Policy Method Individually
- Assert Database State Unchanged On Denied Mutations
- Test With Non-Admin Users Only
- Test Ownership Explicitly

## Related Skills
- Test Authentication Failures
- Test Validation Failures
- Test Response Shape

## Success Criteria
- Every policy method has corresponding 403 test
- Two-user pattern proves gates correctly allow and deny
- Denied mutations leave database unchanged
- Ownership restriction is enforced in tests
- Admin bypass does not mask authorization bugs
- 403 error body is consistent and non-revealing
