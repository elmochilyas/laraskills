# Anti-Patterns â€” Controller Testing Strategies
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Resource Controllers |
| Knowledge Unit | Controller Testing Strategies |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Testing Through HTTP Only | Medium | High | All tests HTTP tests when unit would be faster |
| No Controller-Specific Test Suite | Medium | Medium | Controller tests mixed with feature tests |
| Testing Laravel Framework Behavior | Medium | High | Tests verify framework instead of custom logic |
| Missing Error Response Tests | High | Medium | No tests for auth failures, validation errors, 404 |
| Testing Implementation Details | Medium | Medium | Asserting query counts instead of behavior |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Controller Testing Convention | No guidelines for what to test | Inconsistent coverage |
| Test Duplication | Same scenarios via HTTP and unit tests | Slower suite |

## Anti-Pattern Details

### AP-CTS-01: Testing Through HTTP Only
**Description**: All controller tests use HTTP methods.
**Root Cause**: HTTP tests as default approach.
**Impact**: Slow test suite. Tests break on route changes.
**Detection**: No controller-level unit tests.
**Solution**: Test business logic at action/service level. Keep HTTP for integration verification.

### AP-CTS-02: No Controller-Specific Test Suite
**Description**: Controller tests mixed with feature/action tests.
**Root Cause**: Tests organized by feature, not type.
**Impact**: Unclear where to add tests.
**Detection**: Test files cover both controller and action concerns.
**Solution**: Separate test files by type.

### AP-CTS-03: Testing Laravel Framework Behavior
**Description**: Tests assert framework behavior Laravel already tests.
**Root Cause**: HTTP tests implicitly test framework.
**Impact**: Slow tests, break on Laravel upgrades.
**Detection**: Tests failing on upgrade for non-application reasons.
**Solution**: Test only custom logic.

### AP-CTS-04: Missing Error Response Tests
**Description**: No tests for error scenarios.
**Root Cause**: Happy-path testing only.
**Impact**: Error responses may be wrong in production.
**Detection**: Suite covers only successful requests.
**Solution**: Test every error path.

### AP-CTS-05: Testing Implementation Details
**Description**: Tests assert specific method calls or query counts.
**Root Cause**: Implementation-oriented testing.
**Impact**: Tests break on refactoring.
**Detection**: Query count assertions.
**Solution**: Test observable behavior only.
