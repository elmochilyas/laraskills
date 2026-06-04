# Skill: Test a Modular Monolith Effectively

## Purpose
Implement a testing strategy with pure unit tests for domain logic, contract tests for cross-module interfaces, in-memory adapters for fast contract tests, parallel CI per module, and minimal E2E tests for critical journeys only.

## When To Use
- Every modular monolith from day one

## When NOT To Use
- Single-module application (the modular testing strategy adds overhead without benefit)

## Prerequisites
- Module internal structure and contracts established
- PHPUnit/Pest configured for multi-module test discovery
- CI infrastructure for parallel job execution

## Inputs
- Module list with test directories
- Contract interfaces per module
- Critical user journeys for E2E tests

## Workflow
1. **Unit test domain logic with pure PHP tests (no Laravel boot).** Write tests for entities, value objects, services, and actions as `extends \PHPUnit\Framework\TestCase`. These should run in milliseconds without a database.

2. **Contract test every cross-module interface.** Write contract tests for every interface in each module's Contracts/. The providing module's test suite verifies the implementation satisfies the contract interface and behavior.

3. **Use in-memory adapters for contract tests.** Provide in-memory implementations of module dependencies. These replace real infrastructure (database, queue, HTTP) with in-memory versions that satisfy the same contract.

4. **Create test data through contracts, not by direct table insertion.** When Module A needs Module B's data in a test, create it through Module B's contract interface. This prevents test coupling to internal schemas.

5. **Architecturally test module isolation.** Write Pest architecture tests that verify: no cross-module imports from internal namespaces, no cross-module Eloquent model usage, no cross-module database table references.

6. **Limit end-to-end tests to only critical user journeys.** Write E2E tests only for critical paths spanning multiple modules. Use contract tests for boundary verification instead — they're faster and more reliable.

7. **Run module tests in parallel CI jobs.** Configure CI to run each module's test suite as a separate parallel job. Modules are independent — their tests should not need to run sequentially.

## Validation Checklist
- [ ] Domain logic has pure unit tests (no Laravel boot, milliseconds)
- [ ] Every contract interface has a contract test
- [ ] In-memory adapters exist for contract tests
- [ ] Module test suites can run independently
- [ ] E2E tests are minimal (only critical paths)
- [ ] Architecture tests enforce module isolation rules
- [ ] Module CI runs in parallel jobs

## Common Failures
- **Skipping contract tests.** Relying only on E2E tests to catch cross-module bugs — slow and flaky.
- **Testing internal implementation across modules.** Module A's test directly accesses Module B's models — couples test suites.
- **No in-memory adapters.** Every contract test requires full Laravel bootstrap and database — slow test suite.
- **Creating test data through direct DB insertion.** Schema changes in one module break another module's tests.

## Decision Points
- **Contract tests vs E2E tests for boundary verification?** Contract tests are faster and more reliable. Only use E2E for critical multi-module user journeys.

## Performance Considerations
- Module-isolated unit tests: fastest (pure PHP, no boot).
- Contract tests with in-memory adapters: fast (partial boot, no database).
- E2E tests: slowest (seconds each). Minimize count.

## Security Considerations
- No specific security implications — testing patterns are structural.

## Related Rules
- Rule: Unit Test Domain Logic (MMD-16/05-rules.md)
- Rule: Contract Test Every Interface (MMD-16/05-rules.md)
- Rule: Use In-Memory Adapters (MMD-16/05-rules.md)
- Rule: Limit E2E Tests (MMD-16/05-rules.md)
- Rule: Run Module Tests in Parallel CI (MMD-16/05-rules.md)
- Rule: Create Test Data Through Contracts (MMD-16/05-rules.md)
- Rule: Architecture Tests for Module Isolation (MMD-16/05-rules.md)

## Related Skills
- Write Architecture Tests (LAP-13/06-skills.md)
- Test Service Layer (SLP-17/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
- Configure CI Enforcement (AEG-02/06-skills.md)

## Success Criteria
- Domain logic tests run in milliseconds without Laravel boot.
- Every contract interface has a contract test with in-memory adapters.
- Module test suites run in parallel CI, completing in the time of the slowest module.
- E2E tests cover only critical multi-module journeys.
