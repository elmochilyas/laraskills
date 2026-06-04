# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Mock External Dependencies
- [ ] Verify: Test Real Business Logic, Not Mock Interaction
- [ ] Verify: Use Factory Data for Inputs
- [ ] Verify: Test All Conditional Branches
- [ ] Service is instantiated directly (not via HTTP request) â€” unit test, not feature test
- [ ] Only external/expensive dependencies are mocked; pure logic uses real implementations
- [ ] All conditional branches have at least one test case
- [ ] Each test method verifies exactly one behavior
- [ ] Result assertions are preferred over mock interaction assertions
- [ ] Test inputs use factories, not raw inline arrays (for inputs with 2+ fields)
- [ ] Error handling paths are tested: each dependency failure scenario has a test
- [ ] Test method names describe the behavior being verified
- [ ] No tests for CRUD pass-through methods that lack business logic
- [ ] Tests run in milliseconds â€” no framework boot per test

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Service Unit Test
- [ ] Architecture guideline: class OrderServiceTest extends TestCase
- [ ] Architecture guideline: private OrderService $service;
- [ ] Architecture guideline: private MockInterface $repository;
- [ ] Architecture guideline: protected function setUp(): void
- [ ] Architecture guideline: parent::setUp();
- [ ] Architecture guideline: $this->repository = Mockery::mock(OrderRepository::class);
- [ ] Architecture guideline: $this->service = new OrderService($this->repository);
- [ ] Architecture guideline: public function test_place_order_creates_order()
- [ ] Architecture guideline: $data = new PlaceOrderData(customerId: 1, items: [['product_id' => 1, 'qty' => 2]]);
- [ ] Architecture guideline: $this->repository->shouldReceive('create')
- [ ] Architecture guideline: ->andReturn(new Order(['id' => 1]));

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Mock External Dependencies
- [ ] Best practice: Test Real Business Logic, Not Mock Interaction
- [ ] Best practice: Use Factory Data for Inputs
- [ ] Best practice: Test All Conditional Branches
- [ ] Skill applied: Write Unit Tests for a Service Class

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
- [ ] Service is instantiated directly (not via HTTP request) â€” unit test, not feature test
- [ ] Only external/expensive dependencies are mocked; pure logic uses real implementations
- [ ] All conditional branches have at least one test case
- [ ] Each test method verifies exactly one behavior
- [ ] Result assertions are preferred over mock interaction assertions
- [ ] Test inputs use factories, not raw inline arrays (for inputs with 2+ fields)
- [ ] Error handling paths are tested: each dependency failure scenario has a test

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
### Skills (from 06)
- Write Unit Tests for a Service Class
### Decision Trees (from 07)
- Unit Testing Services vs Feature Testing via HTTP
- Mocking External Dependencies vs Real Implementations
- Behavioral Assertions vs Interaction Assertions
- Testing All Conditional Branches vs Happy-Path-Only Testing
### Related Rules (from 06 skills)
- **Rule 1**: Test Services as Unit Tests, Not Feature Tests
- **Rule 2**: Mock Only External or Expensive Dependencies
- **Rule 3**: Prefer Result Assertions Over Mock Interaction Assertions
- **Rule 4**: Test All Conditional Branches
- **Rule 5**: Use Factory Data for Test Inputs
- **Rule 6**: Test Error Handling Paths
- **Rule 7**: Each Test Must Verify One Behavior
- **Rule 8**: Do Not Test CRUD Pass-Through at the Service Level
### Related Skills (from 06 skills)
- Design a Service Class
- Orchestrate a Multi-Step Workflow in a Service Method

