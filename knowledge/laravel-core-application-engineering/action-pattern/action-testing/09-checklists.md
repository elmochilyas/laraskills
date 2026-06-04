# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Maintain 1:1 Mapping Between Action Files and Test Files
- [ ] Enforce: Name Action Tests by Business Outcome, Not Technical Operation
- [ ] Enforce: Use Pure Unit Tests as the Primary Testing Strategy
- [ ] Enforce: Limit Mocking to Expensive or Unreliable Dependencies
- [ ] Enforce: Freeze Time in Time-Dependent Action Tests
- [ ] Enforce: Test Business Rules, Not Only the Happy Path
- [ ] Enforce: Use QueueableActionFake for Queued Action Dispatching Tests
- [ ] Enforce: Do Not Test Actions Through HTTP Feature Tests as Primary Strategy
- [ ] Test class has exactly one corresponding action class (1:1 mapping)
- [ ] Test method names describe business outcomes, not technical operations
- [ ] Only expensive/unreliable dependencies are mocked (not every dependency)
- [ ] Action is instantiated manually (not through container)
- [ ] Happy path is tested
- [ ] At least one validation/exception path is tested
- [ ] At least one side-effect path is tested
- [ ] Time is frozen if the action is time-dependent
- [ ] Test runs in under 1ms
- [ ] No database, framework boot, or HTTP context

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Test file location:** `tests/Unit/Actions/{Domain}/{ActionName}Test.php`. Mirror the source d...
- [ ] Architecture guideline: - **Test class per action:** One test class per action class. No shared test classes for multiple...
- [ ] Architecture guideline: - **Test method granularity:** One test method per business rule. A typical action has 3-5 test m...
- [ ] Architecture guideline: - **Coverage expectations:** Every action must have at least one happy-path test, one validation ...
- [ ] Architecture guideline: - **CI pipeline:** Run pure unit tests in the fastest CI stage (no external services required). R...
- [ ] Architecture guideline: - **Parallel execution:** Action tests are parallel-safe because they do not share state. PHPUnit...
- [ ] Decision: Pure Unit Test vs Hybrid Database Test vs Feature Test - ensure correct choice is made
- [ ] Decision: Mocking Strategy â€” What to Mock vs Use Real Implementations - ensure correct choice is made
- [ ] Decision: Test Granularity â€” One Test Class Per Action vs Shared Test Classes - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Maintain 1:1 Mapping Between Action Files and Test Files
- [ ] Apply rule: Name Action Tests by Business Outcome, Not Technical Operation
- [ ] Apply rule: Use Pure Unit Tests as the Primary Testing Strategy
- [ ] Apply rule: Limit Mocking to Expensive or Unreliable Dependencies
- [ ] Apply rule: Freeze Time in Time-Dependent Action Tests
- [ ] Apply rule: Test Business Rules, Not Only the Happy Path
- [ ] Apply rule: Use QueueableActionFake for Queued Action Dispatching Tests
- [ ] Apply rule: Do Not Test Actions Through HTTP Feature Tests as Primary Strategy
- [ ] Skill applied: Write a Pure Unit Test for an Action
- [ ] Skill applied: Test a Queued Action with QueueableActionFake

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Test class has exactly one corresponding action class (1:1 mapping)
- [ ] Test method names describe business outcomes, not technical operations
- [ ] Only expensive/unreliable dependencies are mocked (not every dependency)
- [ ] Action is instantiated manually (not through container)
- [ ] Happy path is tested
- [ ] At least one validation/exception path is tested
- [ ] At least one side-effect path is tested

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Feature Tests as Primary Action Test Strategy -- apply preferred alternative
    - [ ] Count action tests using `$this->post/get/json` (feature tests)
    - [ ] Measure average test time (threshold: <1ms per pure unit, 20-30ms per feature)
    - [ ] Check if HTTP routing changes break action tests
- [ ] Prevent: One Giant Test Class for All Action Tests -- apply preferred alternative
    - [ ] Check if multiple actions share a test file
    - [ ] Verify 1:1 mapping between action files and test files
- [ ] Prevent: Mocking Every Collaborator (Over-Mocking) -- apply preferred alternative
    - [ ] Count mocked vs real dependencies per test
    - [ ] Check if mock expectations match implementation methods (not business outcomes)
- [ ] Prevent: Testing Implementation Details Instead of Business Outcomes -- apply preferred alternative
    - [ ] Do test names describe technical operations or business outcomes?
    - [ ] Would the test survive an internal implementation refactoring?
- [ ] Prevent: No Exception / Failure Path Tests -- apply preferred alternative
    - [ ] Does every action have at least one exception/validation test?
    - [ ] Are `expectException()` or `assertThrows()` used in action tests?
    - [ ] Are validation rules tested directly on the action (not just through FormRequest)?

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Maintain 1:1 Mapping Between Action Files and Test Files
- Name Action Tests by Business Outcome, Not Technical Operation
- Use Pure Unit Tests as the Primary Testing Strategy
- Limit Mocking to Expensive or Unreliable Dependencies
- Freeze Time in Time-Dependent Action Tests
- Test Business Rules, Not Only the Happy Path
- Use QueueableActionFake for Queued Action Dispatching Tests
- Do Not Test Actions Through HTTP Feature Tests as Primary Strategy
### Skills (from 06)
- Write a Pure Unit Test for an Action
- Test a Queued Action with QueueableActionFake
### Decision Trees (from 07)
- Pure Unit Test vs Hybrid Database Test vs Feature Test
- Mocking Strategy â€” What to Mock vs Use Real Implementations
- Test Granularity â€” One Test Class Per Action vs Shared Test Classes
### Anti-Patterns (from 08)
- Feature Tests as Primary Action Test Strategy
- One Giant Test Class for All Action Tests
- Mocking Every Collaborator (Over-Mocking)
- Testing Implementation Details Instead of Business Outcomes
- No Exception / Failure Path Tests
### Related Rules (from 06 skills)
- Rule: Maintain 1:1 Mapping Between Action Files and Test Files (action-testing/05-rules.md)
- Rule: Name Action Tests by Business Outcome, Not Technical Operation (action-testing/05-rules.md)
- Rule: Use Pure Unit Tests as the Primary Testing Strategy (action-testing/05-rules.md)
- Rule: Limit Mocking to Expensive or Unreliable Dependencies (action-testing/05-rules.md)
- Rule: Freeze Time in Time-Dependent Action Tests (action-testing/05-rules.md)
- Rule: Test Business Rules, Not Only the Happy Path (action-testing/05-rules.md)
- Rule: Do Not Test Actions Through HTTP Feature Tests as Primary Strategy (action-testing/05-rules.md)
### Related Skills (from 06 skills)
- Test an Orchestrating Service with Mocked Sub-Actions (action-composition/06-skills.md)
- Test a Queued Action with QueueableActionFake (queued-actions/06-skills.md)

