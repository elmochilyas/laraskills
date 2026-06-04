# Rules — Flaky Test Prevention Strategies

## Rule 1: Freeze Time for Every Time-Sensitive Test
| Field | Value |
|-------|-------|
| **Name** | Freeze Time for Every Time-Sensitive Test |
| **Category** | Determinism & Reliability |
| **Rule** | Use `$this->freezeTime()` (or `Carbon::setTestNow()`) in every test that relies on time-dependent logic (expirations, deadlines, scheduling, timestamps). Never let tests depend on the actual system clock. |
| **Reason** | Time-dependent flakiness accounts for ~40% of all flaky failures in Laravel tests. Tests that pass at 2 PM fail at midnight, fail on DST boundaries, or fail at month-end because they depend on `now()` evaluating to a specific time. Freezing time makes the test completely independent of when it runs. |
| **Bad Example** | `test('invoice marked overdue after 30 days')` — passes when run on most days but fails on 31-day months or DST boundaries. |
| **Good Example** | `$this->freezeTime('2026-06-01'); $invoice = Invoice::factory()->create(['due_date' => now()->subDays(31)]); $this->assertTrue($invoice->isOverdue());` |
| **Exceptions** | Tests that specifically verify real-time behavior (e.g., countdown timers, real-time updates). |
| **Consequences Of Violation** | ~40% of all flaky test failures; tests that intermittently fail at time boundaries. |

## Rule 2: Use Explicit Values, Not Faker Defaults, for Asserted Fields
| Field | Value |
|-------|-------|
| **Name** | Use Explicit Values, Not Faker Defaults, for Asserted Fields |
| **Category** | Determinism & Reliability |
| **Rule** | Use explicit, fixed values for any field that appears in a test assertion. Never use Faker-generated values in assertion comparisons. |
| **Reason** | Faker generates random data — emails with special characters, names with accented letters, strings that may cause encoding issues. A test that asserts `$user->email` equals the Faker-generated value may pass 999 times and fail on the 1000th run when Faker generates `test+special@example.com` which behaves differently in URL routing or validation. |
| **Bad Example** | `$user = User::factory()->create(); $this->assertEquals($user->email, ...)` — Faker email may contain problematic characters. |
| **Good Example** | `$user = User::factory()->create(['email' => 'test@example.com']); $this->assertEquals('test@example.com', ...)` — fixed value, always reproducible. |
| **Exceptions** | Fields that are never asserted on and don't affect test behavior. |
| **Consequences Of Violation** | Non-reproducible failures from edge-case Faker output; debugging time wasted on "impossible" failures. |

## Rule 3: Use `RefreshDatabase` for All Feature Tests
| Field | Value |
|-------|-------|
| **Name** | Use `RefreshDatabase` for All Feature Tests |
| **Category** | Isolation & Reliability |
| **Rule** | Use the `RefreshDatabase` trait on all feature test classes. Never rely on test data created by other tests. |
| **Reason** | Without database isolation, tests become order-dependent — Test A creates a user, Test B depends on that user existing. Tests pass when run in a specific order but fail when run individually or in a different order. `RefreshDatabase` wraps each test in a transaction that rolls back, ensuring each test starts with a clean database. |
| **Bad Example** | `class UserTest extends TestCase { /* no RefreshDatabase */ }` — Test 2 fails when run alone because Test 1's data is missing. |
| **Good Example** | `class UserTest extends TestCase { use RefreshDatabase; }` — every test gets a clean database, no order dependencies. |
| **Exceptions** | Tests that intentionally test database state persistence across requests (rare). |
| **Consequences Of Violation** | Order-dependent test failures; tests that pass in suite but fail in isolation. |

## Rule 4: Use `Http::fake()` for Any Test Interacting with External APIs
| Field | Value |
|-------|-------|
| **Name** | Use `Http::fake()` for Any Test Interacting with External APIs |
| **Category** | Determinism & Reliability |
| **Rule** | Fake all external HTTP calls using `Http::fake()` in feature tests. Never let tests make real HTTP requests to external services. |
| **Reason** | Real HTTP calls introduce network latency, service availability dependencies, rate limiting, and unpredictable responses. A test that calls a real API fails when the API is down, during network outages, or when the API response format changes. `Http::fake()` makes tests deterministic, fast, and independent of external services. |
| **Bad Example** | `$response = Http::get('https://api.weather.com/current')` — test fails when API is down or network is slow. |
| **Good Example** | `Http::fake(['api.weather.com/*' => Http::response(['temp' => 22])]); $response = Http::get('https://api.weather.com/current');` — deterministic, fast, no external dependency. |
| **Exceptions** | Dedicated integration tests that specifically verify real API contracts (run separately, not in main CI). |
| **Consequences Of Violation** | Tests fail due to external API downtime, network issues, or API contract changes. |

## Rule 5: Replace `pause()` with `waitFor()` in All Dusk Tests
| Field | Value |
|-------|-------|
| **Name** | Replace `pause()` with `waitFor()` in All Dusk Tests |
| **Category** | Timing & Reliability |
| **Rule** | Never use `pause()` for waiting in Dusk tests. Always use `waitFor()`, `waitForText()`, or `whenAvailable()` with element-specific selectors. |
| **Reason** | `pause(1000)` is too short on slow CI (element appears at 1.2s → test fails) and too long on fast machines (element appears at 200ms → 800ms wasted). `waitFor()` polls every 100ms and returns immediately when the condition is met, adapting to actual page timing. This is the single highest-impact improvement for Dusk test reliability. |
| **Bad Example** | `$browser->pause(2000)->click('@results')` — flaky on slow CI, slow on fast CI. |
| **Good Example** | `$browser->waitFor('@results', 5)->click('@results')` — waits adaptively, returns immediately when element appears. |
| **Exceptions** | None. `pause()` should never be used in committed tests. |
| **Consequences Of Violation** | The #1 source of flaky Dusk tests; tests pass locally but fail in CI. |

## Rule 6: Track and Fix Flaky Tests Within 2 Weeks
| Field | Value |
|-------|-------|
| **Name** | Track and Fix Flaky Tests Within 2 Weeks |
| **Category** | Process & Culture |
| **Rule** | Track every flaky test failure. Fix or quarantine any test that fails non-deterministically within 2 weeks. Never let flaky tests accumulate. |
| **Reason** | Flaky tests erode trust in the test suite. A single flaky test failing 5% of the time causes a failure every 20 CI runs. Teams that ignore flaky tests eventually stop trusting CI results entirely — they start merging with failing tests and deploying without confidence. Each flaky failure costs developer time (context switch, investigation, re-run). |
| **Bad Example** | "That test is flaky, just re-run CI" — 3 flaky tests, each failing 10% of time → 27% of CI runs have at least one failure; team stops trusting CI. |
| **Good Example** | "Flaky test `UserTest::test_login` fails intermittently — tracked in issue #1234, assigned to developer, fix committed within 3 days." |
| **Exceptions** | Quarantined tests that are explicitly excluded from the main suite and scheduled for fix. |
| **Consequences Of Violation** | Eroded trust in CI; developers start ignoring failures; production bugs from untested code. |
