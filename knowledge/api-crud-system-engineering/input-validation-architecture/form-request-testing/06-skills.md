# Skill: Test Form Request Validation Rules In Isolation
## Purpose
Verify Form Request validation rules — required fields, formats, unique constraints, custom rules — without hitting a controller or database, using unit tests that simulate request data.
## When To Use
For every Form Request with custom or non-trivial rules; when rules depend on other fields (prohibits, required_if); before integration testing the full controller.
## When NOT To Use
Simple `required|string|max:255` rules (covered by integration tests); global middleware validation; tests that need the full HTTP kernel.
## Prerequisites
Form Request Design; Pest/PHPUnit; `ValidationTestCase` base class or helper.
## Inputs
Form Request class name; test data arrays (valid and invalid); expected error messages.
## Workflow
1. Create a base `ValidationTestCase` that resolves a Form Request against given data
2. For each validation rule, write a test case with data that should fail
3. Assert validation fails and the expected error messages appear
4. Write a "passes" test with fully valid data
5. Test conditional rules (`required_if`, `prohibits`, `exclude_if`) with both conditions
6. Group tests by Form Request class for organization
7. Run these tests separately from feature tests (fast feedback)
## Validation Checklist
- [ ] Every `required` field is tested with missing data
- [ ] Every format rule is tested with invalid format
- [ ] Every conditional rule is tested with both true and false conditions
- [ ] Custom rule classes are tested independently before Form Request integration
- [ ] Error messages are asserted by key and content
- [ ] Boundary values are tested (`max:255` with 256 chars)
- [ ] Valid data tests confirm the Form Request passes
## Common Failures
- Testing only valid cases — missing all rule-edge scenarios
- Not isolating the Form Request — test fails due to missing dependencies
- Testing rules that don't exist in the Form Request (false pass)
- Using `assertValid()` without asserting the specific failing field
## Decision Points
- Dedicated `ValidationTestCase` helper vs `$this->passesValidation()` trait
- One test class per Form Request vs grouped by feature
## Performance/Security Considerations
Unit validation tests run in milliseconds — add to pre-commit hook for fast feedback. Security: test XSS patterns, SQL injection attempts, and boundary overflows.
## Related Rules/Skills
Form Request Design; Validation Rule Array Design; Manual Validator Creation; Pest Test Structure.
## Success Criteria
All Form Request rules are exercised by at least one failing test; valid data passes; invalid data fails with the expected messages.
