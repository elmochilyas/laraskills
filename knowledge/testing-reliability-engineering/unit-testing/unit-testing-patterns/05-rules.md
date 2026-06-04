# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Unit Testing Patterns

---

### Rule 1: Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly

| Field | Value |
|-------|-------|
| **Name** | Skip framework boot in unit tests |
| **Category** | Performance |
| **Rule** | Use the `#[UnitTest]` attribute (Pest) or extend `PHPUnit\Framework\TestCase` directly (PHPUnit) for every unit test. |
| **Reason** | Laravel's `Tests\TestCase` boots the entire framework (~30-50ms per test). Unit tests test isolated logic — they don't need routes, middleware, or database. Skipping boot reduces execution to <1ms. |
| **Bad Example** | `class TaxCalculatorTest extends Tests\TestCase` — framework booted unnecessarily. |
| **Good Example** | `#[UnitTest]` or `class TaxCalculatorTest extends PHPUnit\Framework\TestCase`. |
| **Exceptions** | Tests that need specific Laravel helpers but not the full database stack. Rare. |
| **Consequences Of Violation** | Unit tests are 30-50x slower than necessary. TDD feedback loop is significantly degraded. |

---

### Rule 2: Test behavior, not implementation details

| Field | Value |
|-------|-------|
| **Name** | Test observable behavior |
| **Category** | Test Design |
| **Rule** | Test what the code does (public API behavior), not how it does it (private methods, internal state). |
| **Reason** | Implementation details change during refactoring. Tests that verify private methods or internal state break when the behavior is preserved but the implementation changes. Public API behavior tests survive refactoring. |
| **Bad Example** | Testing that a private method `calculateDiscount()` was called with specific arguments. |
| **Good Example** | Testing that `processOrder()` returns the correct total with discount applied. |
| **Exceptions** | When testing algorithmic correctness of a complex private method that is extracted to its own class. |
| **Consequences Of Violation** | Tests break on every refactoring. Developers are afraid to refactor because tests are fragile. |

---

### Rule 3: Use real instances for value objects and collections

| Field | Value |
|-------|-------|
| **Name** | Real instances for simple objects |
| **Category** | Test Design |
| **Rule** | Use `new Email('test@test.com')` or `collect([1, 2, 3])` directly. Never create mocks for value objects or collections. |
| **Reason** | Value objects and collections are simple data containers. Real instances are simpler to create, more reliable, and more readable than mocks. Mocking them adds zero value. |
| **Bad Example** | `$this->createMock(Email::class)` — a real instance is one line: `new Email('test@test.com')`. |
| **Good Example** | `new Email('test@test.com')` — simple, clear, reliable. |
| **Exceptions** | Value objects with expensive construction or complex setup (rare). |
| **Consequences Of Violation** | Unnecessary complexity and brittleness. Mock setup code exceeds the value of the test. |

---

### Rule 4: Mock at class boundaries only

| Field | Value |
|-------|-------|
| **Name** | Mock external boundaries, not internal collaborators |
| **Category** | Test Design |
| **Rule** | Mock only dependencies that cross a class boundary (database, API, mail, filesystem). Do not mock internal collaborators within the same module or layer. |
| **Reason** | Mocking internal collaborators couples tests to the module's internal structure and makes refactoring difficult. Only external boundaries (I/O, network, persistence) need isolation via mocks. |
| **Bad Example** | Mocking a helper class within the same `Services/` namespace that the SUT delegates to internally. |
| **Good Example** | Mocking the `UserRepositoryInterface` (database boundary). |
| **Exceptions** | When testing orchestration logic where the internal collaborator is injected for testability. |
| **Consequences Of Violation** | Tests are coupled to internal structure. Internal refactoring breaks tests. |

---

### Rule 5: Target >90% line coverage on business logic

| Field | Value |
|-------|-------|
| **Name** | High coverage on business logic |
| **Category** | Coverage |
| **Rule** | Aim for >90% line coverage on business logic classes (calculators, policies, services, actions). |
| **Reason** | Business logic contains the most conditional branches (if/else, switch, match). These are where bugs hide. Unit tests excel at covering these branches because they execute fast and don't depend on external infrastructure. |
| **Bad Example** | 30% coverage on `TaxCalculator` — untested `if (isInternational)` branch causes production error. |
| **Good Example** | Every conditional branch in `TaxCalculator` has a dedicated test case. |
| **Exceptions** | Boilerplate code (constructors, getters, simple delegation) where coverage adds no value. |
| **Consequences Of Violation** | Production bugs in conditional branches. Business logic errors reach customers. |

---

### Rule 6: Freeze time in `setUp()` for date-dependent logic

| Field | Value |
|-------|-------|
| **Name** | Deterministic time in unit tests |
| **Category** | Determinism |
| **Rule** | Call `Carbon::setTestNow(now())` in `beforeEach()` or `setUp()` for any test class that depends on dates, times, or timestamps. |
| **Reason** | Without frozen time, tests produce different results depending on when they run. A test for "due today" passes at 10:00 AM but fails at 11:59 PM. Freezing time makes tests deterministic. |
| **Bad Example** | `test_invoice_is_overdue()` — passes at midnight but fails at 11:59 PM on the due date. |
| **Good Example** | `Carbon::setTestNow('2026-06-15 10:00:00')` in `setUp()` — deterministic. |
| **Exceptions** | Tests that specifically verify real-time behavior. |
| **Consequences Of Violation** | Intermittent test failures based on execution time. CI fails at specific times of day. |
