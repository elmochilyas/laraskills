# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Test One Behavior Per Test
- [ ] Verify: Use Form Requests in Tests
- [ ] Verify: Test Authorization Scenarios
- [ ] Verify: Don't Assert Business Logic in Controller Tests
- [ ] Verify: Use Database Transactions
- [ ] Enforce: Test Every Controller Action
- [ ] Enforce: Test Three Authorization Scenarios Per Protected Action
- [ ] Enforce: Test Validation Errors for Every Store and Update Action
- [ ] Enforce: Do Not Mock Services in Controller Tests
- [ ] Enforce: Test One Behavior Per Test Method
- [ ] Enforce: Use RefreshDatabase or DatabaseTransactions for Isolation
- [ ] Enforce: Use actingAs() for Authenticated Routes
- [ ] Enforce: Do Not Assert Business Logic in Controller Tests
- [ ] Enforce: Avoid Over-Asserting Response Details
- [ ] Every controller action has at least one test
- [ ] All three authorization scenarios are tested per protected action (guest, unauthorized, authorized)
- [ ] Validation errors are tested for each rule in store and update FormRequests
- [ ] No business logic assertions (service calls, complex calculations) in controller tests
- [ ] `RefreshDatabase` or `DatabaseTransactions` is used for database isolation

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Test Structure
- [ ] Architecture guideline: class UserControllerTest extends TestCase
- [ ] Architecture guideline: use RefreshDatabase;
- [ ] Architecture guideline: public function test_guests_cannot_view_users()
- [ ] Architecture guideline: $this->get('/users')->assertRedirect('/login');
- [ ] Architecture guideline: public function test_authenticated_users_can_view_users()
- [ ] Architecture guideline: $this->actingAs(User::factory()->create());
- [ ] Architecture guideline: $this->get('/users')->assertOk();
- [ ] Architecture guideline: public function test_store_validates_required_fields()
- [ ] Architecture guideline: $this->actingAs(User::factory()->create());
- [ ] Architecture guideline: $this->post('/users', [])->assertSessionHasErrors(['name', 'email']);
- [ ] Architecture guideline: public function test_store_creates_user_and_redirects()

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Test One Behavior Per Test
- [ ] Best practice: Use Form Requests in Tests
- [ ] Best practice: Test Authorization Scenarios
- [ ] Best practice: Don't Assert Business Logic in Controller Tests
- [ ] Best practice: Use Database Transactions
- [ ] Apply rule: Test Every Controller Action
- [ ] Apply rule: Test Three Authorization Scenarios Per Protected Action
- [ ] Apply rule: Test Validation Errors for Every Store and Update Action
- [ ] Apply rule: Do Not Mock Services in Controller Tests
- [ ] Apply rule: Test One Behavior Per Test Method
- [ ] Apply rule: Use RefreshDatabase or DatabaseTransactions for Isolation
- [ ] Apply rule: Use actingAs() for Authenticated Routes

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
- [ ] Every controller action has at least one test
- [ ] All three authorization scenarios are tested per protected action (guest, unauthorized, authorized)
- [ ] Validation errors are tested for each rule in store and update FormRequests
- [ ] No business logic assertions (service calls, complex calculations) in controller tests
- [ ] `RefreshDatabase` or `DatabaseTransactions` is used for database isolation
- [ ] `$this->actingAs()` is used for authenticated routes
- [ ] Response structure assertions use `assertJsonStructure()` not `assertExactJson()`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mocking Services in Controller Tests -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Over-Asserting Response Details -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Business Logic Through Controllers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Without Authentication Context -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Testing Validation Errors -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Test Every Controller Action
- Test Three Authorization Scenarios Per Protected Action
- Test Validation Errors for Every Store and Update Action
- Do Not Mock Services in Controller Tests
- Test One Behavior Per Test Method
- Use RefreshDatabase or DatabaseTransactions for Isolation
- Use actingAs() for Authenticated Routes
- Do Not Assert Business Logic in Controller Tests
- Avoid Over-Asserting Response Details
### Skills (from 06)
- Write Feature Tests for Controller Actions
- Write Controller Tests for a Store Action
### Decision Trees (from 07)
- Feature Test (HTTP) vs Unit Test for Controller Behavior
- Test Scope â€” What to Assert in Controller Tests
- Authorization Scenario Coverage
### Anti-Patterns (from 08)
- Mocking Services in Controller Tests
- Over-Asserting Response Details
- Testing Business Logic Through Controllers
- Testing Without Authentication Context
- Not Testing Validation Errors
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Test Every Controller Action"
- `05-rules.md` Rule: "Test Three Authorization Scenarios Per Protected Action"
- `05-rules.md` Rule: "Test Validation Errors for Every Store and Update Action"
- `05-rules.md` Rule: "Do Not Mock Services in Controller Tests"
- `05-rules.md` Rule: "Test One Behavior Per Test Method"
- `05-rules.md` Rule: "Use RefreshDatabase or DatabaseTransactions for Isolation"
- `05-rules.md` Rule: "Use actingAs() for Authenticated Routes"
- `05-rules.md` Rule: "Do Not Assert Business Logic in Controller Tests"
- `05-rules.md` Rule: "Avoid Over-Asserting Response Details"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” understanding what controllers should do
- "Apply Dependency Injection to Controllers" â€” understanding controller wiring for testing
- "Refactor a Fat Controller into a Thin Controller" â€” prerequisite for writing clean tests

