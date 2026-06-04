# Anti-Patterns â€” Service Testing
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Service Layer |
| Knowledge Unit | Service Testing |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Testing Services Through HTTP Only | High | High | All service tests go through HTTP endpoints, slow and indirect |
| Mocking Everything in Service Tests | High | Medium | Every dependency mocked, testing mock interactions not real behavior |
| No Unit Tests for Service Logic | High | High | Complex service logic tested only via integration tests |
| Testing Implementation Details | Medium | Medium | Tests assert method calls or internal state instead of observable outcomes |
| Service Tests with Database in Unit Tests | Medium | Medium | Unit tests for services hit the database, making them slow and fragile |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Service Testing Standard | No guidelines for how services should be tested | Inconsistent test coverage and quality |
| Overlapping Coverage | Service tested via HTTP tests AND unit tests | Duplicate test maintenance, slower suite |

## Anti-Pattern Details

### AP-ST-01: Testing Services Through HTTP Only
**Description**: Service tests only exist as HTTP integration tests that exercise the full stack.
**Root Cause**: Services not exposed as testable units. Tests written at the controller level.
**Impact**: Slow test suite. Tests break on route changes. Hard to isolate service behavior.
**Detection**: No direct service unit tests exist. All coverage comes from HTTP tests.
**Solution**: Write dedicated unit tests for service classes with mocked dependencies.

### AP-ST-02: Mocking Everything in Service Tests
**Description**: Every dependency mocked, making tests verify mock interactions rather than real behavior.
**Root Cause**: Over-application of isolation testing.
**Impact**: Tests pass even when real integration fails. Brittle to refactoring.
**Detection**: Tests have 5+ mock setups. Tests fail on internal restructuring.
**Solution**: Use real implementations for stable dependencies. Mock only expensive or side-effect-producing collaborators.

### AP-ST-03: No Unit Tests for Service Logic
**Description**: Service logic covered only by integration or HTTP tests, not isolated unit tests.
**Root Cause**: Testing service in isolation considered too difficult.
**Impact**: Complex business logic untested at the unit level.
**Detection**: Critical service methods have no dedicated test class.
**Solution**: Write unit tests for each public service method covering happy path, edge cases, and errors.

### AP-ST-04: Testing Implementation Details
**Description**: Tests assert that specific methods were called or specific queries were executed.
**Root Cause**: Testing oriented toward implementation rather than behavior.
**Impact**: Tests break on refactoring that doesn't change behavior.
**Detection**: Tests use shouldReceive(), assertCalled(), or assertQueryCount().
**Solution**: Test observable outcomes: return values, database state changes, events dispatched.
