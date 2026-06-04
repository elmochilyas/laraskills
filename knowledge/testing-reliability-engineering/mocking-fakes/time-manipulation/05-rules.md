# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Time Manipulation

---

### Rule 1: Always reset time after manipulation in `afterEach()` or `tearDown()`

| Field | Value |
|-------|-------|
| **Name** | Reset time in teardown |
| **Category** | Time Management |
| **Rule** | Call `travelBack()` (Pest) or `Carbon::setTestNow(null)` (PHPUnit) in `afterEach()` or `tearDown()` after any test that manipulates time. |
| **Reason** | Time manipulation is a global static — `Carbon::setTestNow()` affects all Carbon instances in the process. If not reset, frozen time leaks into subsequent tests, causing them to fail mysteriously. This is the #1 time manipulation mistake. |
| **Bad Example** | `travel(31)->days(); // ... test ...` — no reset; next test runs 31 days in the future. |
| **Good Example** | `afterEach(fn () => travelBack())` in Pest or `tearDown(): void { Carbon::setTestNow(null); }` in PHPUnit. |
| **Exceptions** | None. Always reset time. |
| **Consequences Of Violation** | Frozen time leaks to subsequent tests. Order-dependent failures that are extremely hard to debug. |

---

### Rule 2: Freeze time even for tests that don't explicitly test time

| Field | Value |
|-------|-------|
| **Name** | Freeze time by default |
| **Category** | Test Determinism |
| **Rule** | Call `$this->freezeTime()` at the start of tests that create records with timestamps, even if time is not the subject under test. |
| **Reason** | Time-dependent flakiness accounts for ~40% of flaky test failures. A test that creates a `User` at 11:59 PM and asserts `created_at->isToday()` fails when run at 12:01 AM. Freezing time prevents this class of flaky failure entirely. |
| **Bad Example** | `User::factory()->create()` in a test — asserts on `created_at` may fail at midnight boundaries. |
| **Good Example** | `$this->freezeTime(); User::factory()->create();` — `created_at` is deterministic. |
| **Exceptions** | Tests that specifically verify real-time behavior (rare). |
| **Consequences Of Violation** | Tests fail at date boundaries (midnight, month end, DST transitions). Flaky failures that are hard to reproduce. |

---

### Rule 3: Use explicit timestamps in database factories

| Field | Value |
|-------|-------|
| **Name** | Explicit database timestamps |
| **Category** | Factory Design |
| **Rule** | When creating models with time-dependent fields (e.g., `trial_ends_at`, `expires_at`), pass explicit `Carbon` values: `User::factory()->create(['trial_ends_at' => now()->addDays(30)])`. Do not rely on database `CURRENT_TIMESTAMP`. |
| **Reason** | Database `CURRENT_TIMESTAMP` defaults are not affected by `Carbon::setTestNow()`. If time is frozen in PHP but the database uses `CURRENT_TIMESTAMP`, the timestamps in the database reflect real time, not frozen time. This causes assertion failures. |
| **Bad Example** | Migration uses `$table->timestamp('trial_ends_at')->useCurrent()` — not affected by PHP time freezing. |
| **Good Example** | Explicit factory value: `'trial_ends_at' => now()->addDays(30)` — respects frozen time. |
| **Exceptions** | Timestamps that are never asserted on in tests. |
| **Consequences Of Violation** | Database timestamps differ from PHP frozen time. Assertions comparing timestamps fail. |

---

### Rule 4: Use `travel()` for relative time, `travelTo()` for absolute time

| Field | Value |
|-------|-------|
| **Name** | Choose right time helper |
| **Category** | Time Manipulation |
| **Rule** | Use `travel(5)->days()` for relative offsets from the current time. Use `travelTo('2026-01-01')` for specific date scenarios. |
| **Reason** | `travel()` is more readable for "advance 5 days from current." `travelTo()` is better for testing specific dates like New Year's Eve, Daylight Savings, or month boundaries. The right choice makes test intent clear. |
| **Bad Example** | `travelTo(now()->addDays(5))` — unnecessary absolute when relative `travel(5)->days()` is clearer. |
| **Good Example** | Relative: `travel(5)->days()`. Absolute: `travelTo('2026-12-31 23:59:59')` for boundary testing. |
| **Exceptions** | None. Both are valid; choose for readability. |
| **Consequences Of Violation** | Tests are less readable than they could be. |

---

### Rule 5: Use `freezeSecond()` when microsecond ordering matters

| Field | Value |
|-------|-------|
| **Name** | Microsecond precision for ordering |
| **Category** | Time Manipulation |
| **Rule** | Use `freezeSecond()` instead of `freezeTime()` in tests where multiple events within the same second must be ordered by timestamp. |
| **Reason** | `freezeTime()` freezes the exact microsecond — two events dispatched "simultaneously" get the exact same timestamp. `freezeSecond()` allows microsecond progression within the same second, preserving ordering. |
| **Bad Example** | `freezeTime()` — two events dispatched in rapid succession get identical timestamps. |
| **Good Example** | `freezeSecond()` — events dispatched microseconds apart get distinct but predictable timestamps. |
| **Exceptions** | Tests where timestamp ordering is not a concern. |
| **Consequences Of Violation** | Two events get identical timestamps. Order-dependent assertions fail or give wrong results. |

---

### Rule 6: Use `Carbon::now()` in application code, not `time()` or `date()`

| Field | Value |
|-------|-------|
| **Name** | Use Carbon for testable time |
| **Category** | Code Design |
| **Rule** | Use `Carbon::now()` in application code instead of `time()`, `date()`, or `new DateTime()`. |
| **Reason** | `Carbon::setTestNow()` does NOT affect `time()`, `date()`, or `new DateTime()`. Only `Carbon::now()` and `now()` (helper) respect the frozen time. Application code using `time()` cannot be tested with time manipulation. |
| **Bad Example** | `$expired = time() > strtotime($this->expires_at);` — cannot be tested with frozen time. |
| **Good Example** | `$expired = now()->gt($this->expires_at);` — respects `Carbon::setTestNow()`. |
| **Exceptions** | Performance-critical hot paths where `time()` is significantly faster. |
| **Consequences Of Violation** | Time-dependent code cannot be tested with time manipulation. Tests require real waiting or are impossible. |
