# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Flaky Test Prevention
Knowledge Unit: Flaky Test Prevention Strategies
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Flaky tests — tests that pass and fail without code changes — are the number one threat to test suite trust and CI reliability. In Laravel applications, common flakiness sources include time-dependent assertions, random test data, inter-test state leakage, network-dependent E2E tests, and CSS-selector brittleness in Dusk. Prevention strategies focus on determinism: freezing time, using explicit factory data, isolating test state via `RefreshDatabase`, faking HTTP calls with `Http::fake()`, using stable `@dusk` selectors, and maintaining a dedicated flaky test tracking process. The industry standard is a "flaky bot" that automatically retries failed tests, tracks flakiness metrics, and escalates persistently flaky tests.

# Core Concepts
- **Flaky test**: A test that produces both passing and failing results without any code changes to the test or the system under test.
- **Determinism**: The property that a test produces the same result every time it runs with the same inputs. The opposite of flakiness.
- **Time dependence**: Tests that rely on `now()`, `Carbon::now()`, or timestamps without freezing time are inherently flaky.
- **State leakage**: Test A mutates shared state (database, cache, session) that Test B depends on. Order-dependent failures.
- **Network dependence**: Tests that make real HTTP calls fail when network is slow, down, or returns unexpected responses.
- **Timing dependence**: Browser tests that rely on fixed waits (`pause()`) instead of element-specific waits (`waitFor()`).
- **Retry strategy**: Automated re-running of failed tests to distinguish genuine failures from flaky failures.

# Mental Models
- **Flaky test as noise**: Each flaky failure is false alarm noise. Enough noise and the team stops trusting CI. When trust erodes, real failures ship to production.
- **Determinism by design**: A test is either deterministic or flaky. There is no middle ground. Design every test to be fully deterministic from the start.
- **Flaky test debt**: Flaky tests are technical debt with compound interest. Every flaky failure costs 2-5 developer minutes × number of affected developers.
- **Flaky bot as triage system**: Automated retry with tracking creates a safety net while providing data to prioritize fixes. Don't ignore flaky tests; track and fix them.

# Internal Mechanics
- **Time manipulation in tests**: `Carbon::setTestNow(Carbon::parse('2026-01-01 12:00:00'))` freezes time. `$this->travelTo('2026-01-01')` and `$this->freezeTime()` are Pest/Laravel helpers that wrap Carbon's `setTestNow`.
- **`RefreshDatabase` transaction rollback**: Each test runs in a database transaction that is rolled back after the test. Prevents state leakage between tests that use `RefreshDatabase`.
- **`Http::fake()` behavior**: Replaces the HTTP client with a fake that returns predefined responses. No network calls are made. Prevents network-dependent flakiness.
- **Dusk `waitFor()` mechanism**: Polls the DOM at 100ms intervals until the element exists or timeout. More reliable than `sleep()` which waits a fixed duration regardless of actual load time.
- **Data ordering in databases**: Without explicit ordering, `User::first()` may return different rows depending on the database query plan. Always specify `orderBy` for deterministic results.

# Patterns
- **Pattern: Time freezing in time-sensitive tests**
  - Purpose: Eliminate time-dependent flakiness
  - Benefits: Tests pass regardless of when they run (midnight, new year, DST transition)
  - Tradeoffs: Must remember to unfreeze time after test (use `travelBack()` or `Carbon::setTestNow()`)
  - Implementation: `$this->freezeTime()` in test setup or per-test

- **Pattern: Explicit factory data over random data**
  - Purpose: Prevent random data from causing edge-case failures
  - Benefits: Reproducible test failures; tests are self-documenting
  - Tradeoffs: More verbose than leaving fields to random factory defaults
  - Implementation: `User::factory()->create(['name' => 'Test User', 'email' => 'test@example.com'])`

- **Pattern: HTTP fake for external API tests**
  - Purpose: Eliminate network dependency in tests
  - Benefits: Tests are fast, reliable, and work offline
  - Tradeoffs: Does not catch real API changes
  - Implementation: `Http::fake(['api.github.com/*' => Http::response(['status' => 'ok'])]);`

- **Pattern: Dusk `waitForText` over `pause`**
  - Purpose: Eliminate timing-dependent browser test flakiness
  - Benefits: Test waits only as long as necessary; no wasted time
  - Tradeoffs: Requires knowing what text/element to wait for
  - Implementation: `$browser->waitForText('Welcome back', 10)->assertSee('Dashboard')`

- **Pattern: Flaky test tracking with retry**
  - Purpose: Automatically retry failed tests and track flakiness
  - Benefits: CI passes despite flaky tests; data for prioritization
  - Tradeoffs: Masks genuine failures; retried tests increase CI time
  - Implementation: `--retry` flag in Pest/PHPUnit; custom CI script to log retried tests

# Architectural Decisions
- **Retry vs quarantine**: Retry (auto-retry flaky tests) is simpler but masks issues. Quarantine (move flaky tests to a separate suite that does not block CI) is more honest but requires discipline to fix.
- **`RefreshDatabase` vs `DatabaseTransactions`**: `RefreshDatabase` is more thorough (migrates + transactions). `DatabaseTransactions` is faster (transactions only) but may miss schema-related issues. Use `RefreshDatabase` for reliability.
- **Fixed vs random data in factories**: Fixed data for all tests that care about specific values. Random data (via Faker) only for fields that tests don't assert on. Never use random data in assertions.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deterministic tests = reliable CI | Time freezing adds boilerplate | Use Pest's `freezeTime()` helper |
| Retry strategy reduces CI noise | Masks genuine failures | Track retry rate; escalate if >5% |
| Explicit factory data prevents random failures | More verbose test setup | Worth the verbosity for reliability |
| `waitFor()` over `pause()` | Need to know what to wait for | Use `@dusk` selectors for stable waits |

# Performance Considerations
- Time freezing: Zero overhead. `Carbon::setTestNow()` is a static setter.
- `Http::fake()`: Faster than real HTTP calls (milliseconds vs hundreds of milliseconds).
- `RefreshDatabase`: Migration overhead per test suite (~1-5s), not per test (transaction rollback per test is instant).
- `--retry`: Doubles CI time for flaky tests (runs twice). Monitor retry rate to limit impact.
- `waitFor()`: Polls every 100ms. If element appears in 50ms, only 150ms wasted. More efficient than `pause(1000)`.

# Production Considerations
- **Fix over quarantine**: Dedicate a "flaky test fix" sprint each quarter. Do not let flaky tests accumulate indefinitely.
- **Flaky test policy**: Define a policy: "Any test that fails >3 times in 2 weeks is quarantined and assigned to the owning team." Escalate if not fixed within 2 weeks.
- **CI flaky test dashboard**: Track flaky test metrics over time. Number of flaky failures per week, retry rate, time-to-fix. Share with the team.
- **Developer workflow**: When a developer encounters a flaky test failure, they should report it (Slack bot, GitHub issue) and move on. Do not block deploys on flaky tests.

# Common Mistakes
- **Mistake: Ignoring flaky tests**
  - Why: "It's just flaky; re-run and it'll pass"
  - Why harmful: Flaky tests multiply; CI trust erodes; real failures missed
  - Better: Track every flaky failure; fix or quarantine within 2 weeks

- **Mistake: Using `pause()` in Dusk tests**
  - Why: "Wait 1 second; the element should be rendered by then"
  - Why harmful: 1 second may be too short on slow CI or too long on fast CI
  - Better: Use `waitFor()` or `waitForText()` that waits for specific conditions

- **Mistake: Not freezing time for time-sensitive code**
  - Why: "The test passes at 2 PM; it's fine"
  - Why harmful: Test fails at midnight, on DST boundary, or on first day of month
  - Better: Always freeze time when testing time-sensitive logic

- **Mistake: Using random data in assertions**
  - Why: `User::factory()->create(); $this->assertDatabaseHas('users', ['name' => User::first()->name]);`
  - Why harmful: Random name may contain characters that cause encoding issues (emojis, accents)
  - Better: Use explicit fixed values for fields in assertions

# Failure Modes
- **False negative (test passes but shouldn't)**: Test is flaky in the "always passes" direction — never fails but doesn't verify anything useful. Monitor assertion count: zero-assertion tests are always flaky.
- **Order-dependent flakiness**: Test A creates data, Test B depends on it, Test C cleans up. When tests run in different order, B fails. Always use `RefreshDatabase` for isolation.
- **Resource leak flakiness**: Tests that create files, database records, or queue jobs without cleanup cause subsequent tests to fail. Use `RefreshDatabase` and `Storage::fake()`.
- **CI environment variability**: Different CI runner specs (CPU speed, memory, disk I/O) cause timing-dependent tests to pass on fast runners and fail on slow runners. Always use `waitFor()` over fixed pauses.

# Ecosystem Usage
- **Laravel core**: Laravel's own test suite treats flaky tests as critical bugs. CI uses `--retry` and tracks retry rate per commit.
- **PHPUnit**: PHPUnit supports `@doesNotPerformAssertions` to mark intentionally non-asserting tests (rare, used for smoke tests).
- **Pest**: Pest's `--retry` flag re-runs failed tests up to the specified count. `--repeat` flag runs tests multiple times to detect flakiness.
- **Dusk**: Dusk's `waitFor()` methods are designed to prevent timing-related flakiness. The `pause()` method exists only for debugging, not for production tests.

# Related Knowledge Units
- **Prerequisites**: PHPUnit/Pest fundamentals, Test isolation concepts, Dusk browser testing
- **Related Topics**: Test organization patterns, Time manipulation, HTTP client faking, Dusk waiting strategies
- **Advanced Follow-up**: Flaky test detection algorithms, Test retry infrastructure, Deterministic testing methodology

# Research Notes
- Flaky tests are the #1 cause of CI unreliability across all programming languages, not just PHP; studies show teams lose 2-5 developer-hours per week per flaky test
- Time-dependent flakiness accounts for ~40% of all flaky test failures in Laravel applications; time freezing is the single most impactful prevention strategy
- The `--retry` flag in Pest/PHPUnit retries the entire failed test, not just the failing assertion; this means retry is conservative and may hide failures that occur in setup code
- Dusk tests are 3-5x more likely to be flaky than feature tests; the primary causes are timing (elements not rendered) and state (previous test's data visible)
- A flaky test tracking process (bot that files issues for flaky tests, auto-assigns to recent committers) is recommended when the test suite exceeds 500 tests or has >5% flaky failure rate
