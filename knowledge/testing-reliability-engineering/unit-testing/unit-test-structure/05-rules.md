# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Unit Testing
## Knowledge Unit: Unit Test Structure

---

### Rule 1: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly

| Field | Value |
|-------|-------|
| **Name** | Skip framework boot in unit tests |
| **Category** | Performance |
| **Rule** | Use the `#[UnitTest]` attribute (Pest 4) or extend `PHPUnit\Framework\TestCase` directly (PHPUnit) for every unit test. Never use Laravel's `Tests\TestCase` base class. |
| **Reason** | Laravel's `Tests\TestCase` boots the entire framework (~30-50ms) for every test. Unit tests don't need the framework — they test isolated business logic. Skipping boot reduces execution to <1ms per test. |
| **Bad Example** | `class TaxCalculatorTest extends Tests\TestCase` — framework booted for a pure calculation test. |
| **Good Example** | `#[UnitTest]` on the class or extending `PHPUnit\Framework\TestCase` directly. |
| **Exceptions** | Tests that need some Laravel helpers but not a full database. Prefer dependency injection over framework boot. |
| **Consequences Of Violation** | Unit tests are 30-50x slower than necessary. Developers run fewer tests during TDD. |

---

### Rule 2: Prefer state verification over interaction verification

| Field | Value |
|-------|-------|
| **Name** | Test result values, not method calls |
| **Category** | Test Design |
| **Rule** | Assert the result of the method under test (`expect($calculator->add(2, 2))->toBe(4)`) rather than verifying that a specific method was called on a dependency. |
| **Reason** | State verification tests the actual behavior. Interaction verification tests implementation details. Refactoring the implementation (while keeping the behavior the same) breaks interaction-based tests but not state-based tests. |
| **Bad Example** | `$repository->expects($this->once())->method('save')` — tests that `save()` was called, not that data was saved. |
| **Good Example** | `expect($result->total)->toBe(108.00)` — tests the actual output. |
| **Exceptions** | When testing orchestration logic where the only observable effect is which methods were called (e.g., a command dispatcher that routes commands to handlers). |
| **Consequences Of Violation** | Tests break on every refactoring. High maintenance cost discourages refactoring. |

---

### Rule 3: Test one scenario per test method

| Field | Value |
|-------|-------|
| **Name** | One scenario per test method |
| **Category** | Test Organization |
| **Rule** | Write one test method per behavior scenario. Name the method to describe the specific scenario being tested. |
| **Reason** | A test named `it_calculates_tax_for_domestic_order` immediately tells you what failed. A test that checks 5 different scenarios in one method passes or fails as a whole — you don't know which scenario broke. |
| **Bad Example** | `test_calculator()` — tests addition, subtraction, multiplication, and division in one method. |
| **Good Example** | `test_adds_two_numbers()`, `test_subtracts_numbers()`, `test_multiplies_numbers()`, `test_divides_by_zero_throws_exception()`. |
| **Exceptions** | Dataset-driven tests where multiple inputs test the same behavior (e.g., `test_email_validation` with 10 email variants). |
| **Consequences Of Violation** | Test failures don't identify which scenario broke. Multiple scenarios in one method create a debugging bottleneck. |

---

### Rule 4: Cover all conditional branches (if/else, switch, match)

| Field | Value |
|-------|-------|
| **Name** | Test every branch of conditionals |
| **Category** | Coverage |
| **Rule** | For every `if/else`, `switch`, or `match` statement in the code under test, write a test for each branch. |
| **Reason** | Conditional branches are where the majority of business logic bugs hide. A single uncovered `else` branch is often the cause of a production bug. |
| **Bad Example** | Testing only the "discount applies" branch of an `if (eligibleForDiscount)` — the "no discount" branch untested. |
| **Good Example** | `test_eligible_user_receives_discount()` + `test_ineligible_user_pays_full_price()`. |
| **Exceptions** | Guard clauses that throw exceptions for invalid inputs (these should be tested as edge cases). |
| **Consequences Of Violation** | Untested conditional branches reach production with undetected bugs. |

---

### Rule 5: Use `Carbon::setTestNow()` in `setUp()` for time-dependent tests

| Field | Value |
|-------|-------|
| **Name** | Freeze time for deterministic date logic |
| **Category** | Determinism |
| **Rule** | Call `Carbon::setTestNow(now())` in `setUp()` or `beforeEach()` for any test that depends on dates, times, or timestamps. |
| **Reason** | Without frozen time, tests produce different results when run at midnight vs noon, on the last day of the month vs the first. `Carbon::setTestNow()` makes all `now()`, `Carbon::now()`, and `today()` calls return the same value. |
| **Bad Example** | Test for "calculateAge" passes at noon but fails at midnight due to date boundary. |
| **Good Example** | `Carbon::setTestNow(Carbon::parse('2026-06-01 12:00:00'))` — age calculation is deterministic. |
| **Exceptions** | Tests that specifically verify real-time behavior (rare). |
| **Consequences Of Violation** | Tests pass or fail based on the time of day they run. CI fails mysteriously at specific hours. |

---

### Rule 6: Never call Eloquent methods that trigger SQL queries in unit tests

| Field | Value |
|-------|-------|
| **Name** | No database queries in unit tests |
| **Category** | Isolation |
| **Rule** | Never call `save()`, `update()`, `delete()`, `where()`, `find()`, or any Eloquent method that executes SQL in a unit test. Mock the repository or query builder at the class boundary. |
| **Reason** | Eloquent queries require a database connection. Unit tests should not depend on a database. Calling Eloquent methods directly makes the test a feature/integration test, not a unit test. |
| **Bad Example** | `$user = User::factory()->create(); $result = (new UserService())->process($user);` — creates a real database record. |
| **Good Example** | `$repository = $this->createMock(UserRepository::class); $service = new UserService($repository);` — no database involved. |
| **Exceptions** | Using `new User([...])` without saving is acceptable — no SQL is executed. |
| **Consequences Of Violation** | Test requires a database connection. Fails in CI if database is unavailable. Not a true unit test. |

---

### Rule 7: Name tests as behavior specifications

| Field | Value |
|-------|-------|
| **Name** | Use behavior-describing test names |
| **Category** | Test Readability |
| **Rule** | Name test methods to describe the behavior being verified: `it_calculates_tax_for_domestic_order`, `it_prevents_publishing_without_content`. |
| **Reason** | Behavior-describing test names serve as living documentation. A failing test named `it_prevents_publishing_without_content` immediately tells you what behavior is broken. `test_post_1` tells you nothing. |
| **Bad Example** | `test_post()`, `test_user_1()`, `test_calculator_a()`. |
| **Good Example** | `it_calculates_tax_for_domestic_order()`, `test_admin_can_delete_any_post()`, `it_throws_exception_for_negative_amount()`. |
| **Exceptions** | Very simple getter/setter tests where the method name mirrors the property. |
| **Consequences Of Violation** | Test names provide no context. Debugging requires reading each test's body to understand what it tests. |
