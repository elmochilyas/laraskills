# Skill: Test Controller Actions via Feature or Integration Tests
## Purpose
Write feature tests that call controller endpoints via HTTP, asserting status codes, JSON structure, database state changes, and authZ enforcement — treating the controller as a black box.
## When To Use
For every controller action (index, show, store, update, destroy); for custom controller actions; when verifying authZ rules per action.
## When NOT To Use
Form Request validation rules (unit-test in isolation); service/action classes (unit-test separately); controller methods that are pure delegation (covered by feature tests).
## Prerequisites
Pest/PHPUnit feature tests; Laravel HTTP test helpers; Resource Controller Pattern.
## Inputs
Controller route definitions; expected HTTP methods and status codes; request body samples; auth setup.
## Workflow
1. Create one test class per controller (or per resource)
2. For each action, write a success case and a failure case (unauthorized, not found)
3. Use `actingAs()` for authenticated requests
4. Assert status code, JSON structure (via `assertJsonStructure`), and specific values
5. For store/update, assert database changes with `assertDatabaseHas` / `assertDatabaseMissing`
6. For destroy, assert database record is deleted (or soft-deleted)
7. Test authorization: assert 403 for unauthorized users per action
8. Test validation: assert 422 with error structure for invalid input
9. Test pagination: assert pagination meta for index actions
## Validation Checklist
- [ ] Every action has a happy-path test
- [ ] Every action has at least one failure test (403, 404, 422)
- [ ] AuthZ tests exist for role/permission-based access per action
- [ ] Store assertions include database state changes
- [ ] Destroy assertions confirm deletion (or soft-delete)
- [ ] Show asserts the full resource JSON structure
- [ ] Index asserts pagination envelope and data shape
- [ ] Tests use factories, not hard-coded IDs
- [ ] Edge cases: empty index, not-found show, invalid update, delete of non-existent
## Common Failures
- Testing only happy path — missing 403, 404, 422 branches
- Using hard-coded IDs instead of factories — tests fail on fresh DB
- Asserting database state only — missing JSON structure assertions
- Testing controller logic but not authZ — unauthorized access goes undetected
- Forgetting to test soft-delete behavior (index should exclude soft-deleted)
## Decision Points
- Feature test (full HTTP) vs integration test (call controller method directly)
- One test file per controller vs one test file per action (for complex controllers)
- Database refresh vs transaction per test
## Performance/Security Considerations
Feature tests are slower than unit tests — keep controller tests focused on HTTP + DB assertions. Security: authZ tests are the primary mechanism to catch permission leaks.
## Related Rules/Skills
Response Shape Testing; Controller Response Selection; Form Request Testing; Response Status Code Testing.
## Success Criteria
All controller actions are tested with happy path, authZ, and error cases; database state changes are verified; tests use factories; suite is exhaustive without being redundant.
