# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Time Manipulation
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Time manipulation controls the perceived current time in tests, enabling deterministic testing of time-dependent logic: scheduling, deadlines, rate limits, subscription expirations, and time-based queries. Laravel provides `Carbon::setTestNow()`, `travel()`, `travelTo()`, `freezeTime()`, and `freezeSecond()` via Pest's time helpers. Without time manipulation, tests involving time are flaky (varying by execution time), slow (requires real waiting), or impossible (future dates).

# Core Concepts
- **`Carbon::setTestNow(Carbon $time)`**: Sets Carbon's "current time" to the given moment. All `Carbon::now()` calls return this frozen time.
- **`travel($time)->$unit`**: Pest helper. `travel(5)->days()` advances time by 5 days. `travel(-1)->hour()` goes back 1 hour.
- **`travelTo(Carbon $time)`**: Pest helper. Sets current time to a specific moment.
- **`freezeTime()`**: Pest helper. Freezes time at the current moment. All `now()` calls return the same timestamp.
- **`freezeSecond()`**: Pest helper. Freezes time but allows microsecond progression (for ordering assertions within the same second).
- **`travelBack()`**: Pest helper. Restores real time. Must be called in teardown or `afterEach()`.
- **Time facades**: `Clock` facade (Laravel 11+) provides `Clock::freeze()` and `Clock::resume()`.
- **Database time**: `DB::raw('NOW()')` or database-level timestamps (MySQL `CURRENT_TIMESTAMP`) are NOT affected by Carbon mocking. Use Laravel's `$table->timestamps()` which uses PHP Carbon internally.

# Mental Models
- **Time as frozen variable**: Time becomes a variable you control, not a flowing dimension. `Carbon::now()` reads this variable.
- **Time travel as state change**: Advancing time 5 days changes the application state as if 5 days really passed. Subscriptions expire, deadlines pass, rate limits reset.
- **`freezeTime()` vs `setTestNow()`**: `freezeTime()` captures current time for you; `setTestNow()` requires an explicit time. Both do the same thing afterward.
- **Microsecond progression in freezeSecond**: Even in frozen time, events happening in the same second can be ordered by microsecond. `freezeSecond()` preserves this.

# Internal Mechanics
- **`Carbon::setTestNow()`**: Sets a static property on the `Carbon` class. `Carbon::now()` checks this property first; if set, returns a clone of it instead of querying system time.
- **`travel()`**: Calls `Carbon::setTestNow()` with the offset. `travel(5)->days()` resolves to `Carbon::now()->addDays(5)`.
- **`freezeTime()`**: Calls `Carbon::setTestNow(now())`. The current time is captured and frozen.
- **`travelBack()`**: Calls `Carbon::setTestNow(null)`. Resets to real system time.
- **`Clock` facade**: Introduced in Laravel 11. Provides `Clock::freeze()` and `Clock::resume()`. Integrates with Carbon's test time.
- **Scope**: `Carbon::setTestNow()` is a global static. It affects ALL Carbon instances and all code using `Carbon::now()` in the same process.
- **Not affected**: `time()` PHP function, `DateTime::__construct()`, `DateInterval`, database `NOW()`, JavaScript `Date.now()`.

# Patterns
- **Pattern: Future date for expiration testing**
  - Purpose: Test subscription/coupon/token expiration logic
  - Benefits: Test expiration without waiting for real time
  - Tradeoffs: Must reset time after test
  - Implementation: `freezeTime(); $user->update(['trial_ends_at' => now()->addDays(30)]); travel(31)->days(); // now expired`

- **Pattern: Rate limit reset verification**
  - Purpose: Test that rate limits reset after the decay window
  - Benefits: Verify rate limiter behavior without real waiting
  - Tradeoffs: Time manipulation may not affect all cache drivers
  - Implementation: Exceed rate limit ? assert 429 ? `travel(61)->seconds()` ? assert request succeeds

- **Pattern: Ordering within same second**
  - Purpose: Test that events occurring rapidly are ordered correctly
  - Benefits: Deterministic ordering for real-time features
  - Tradeoffs: `freezeSecond()` is less commonly understood
  - Implementation: `freezeSecond(); event(new UserRegistered($user)); event(new UserSubscribed($user)); assertEventOrder()`

- **Pattern: Midnight/day boundary testing**
  - Purpose: Test behavior at day boundaries (end of day, start of day)
  - Benefits: Catches off-by-one date bugs
  - Tradeoffs: Timezone sensitivity
  - Implementation: `travelTo('2026-01-01 23:59:59')` ? assert ? `travelTo('2026-01-02 00:00:00')` ? assert different behavior

# Architectural Decisions
- **`Carbon::setTestNow()` vs `travel()`**: `setTestNow()` for explicit control. `travel()` for relative offsets. Both work; choose based on readability.
- **`freezeTime()` vs `freezeSecond()`**: `freezeTime()` for most tests. `freezeSecond()` only when microsecond ordering matters.
- **Time manipulation in setUp vs per-test**: Freeze time in `setUp()` if time is irrelevant to the test. Freeze per-test if specific dates matter.
- **Pest vs PHPUnit time helpers**: Pest provides `travel()`, `freezeTime()`, etc. as global functions. PHPUnit users use `Carbon::setTestNow()` directly.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deterministic time-dependent tests | Global static state can leak between tests | Always call `travelBack()` or `Carbon::setTestNow(null)` in teardown |
| `travel()` is readable and simple | Doesn't affect database-level time functions | Use `DB::raw('NOW()')` sparingly; prefer Carbon for timestamps |
| `freezeSecond()` for ordering tests | Less common; team confusion risk | Document usage; use only when needed |
| Time travel enables expiration testing | Tests may pass with manipulated time but fail in real time | Layer an integration test that runs with real time |

# Performance Considerations
- Time manipulation overhead: <0.01ms per call (static property assignment).
- `freezeTime()`: Captures current time once. Negligible.
- `travel()`: Carbon arithmetic operations. Negligible.
- `travelBack()`: Null assignment. Negligible.

# Production Considerations
- **Leaked test time in production**: Ensure `travelBack()` is called in test teardown. If a test crashes, the time leak is process-scoped—next test or request gets real time.
- **Timezone handling**: `Carbon::setTestNow()` uses the default timezone. Set `date_default_timezone_set('UTC')` in tests for consistency.
- **Parallel execution**: Each parallel worker is a separate process with its own time state. No cross-worker time leakage.
- **`Clock` facade usage**: Prefer `Clock::freeze()` (Laravel 11+) for framework-aligned time management.

# Common Mistakes
- **Mistake: Forgetting to reset time after test**
  - Why: Test manipulates time but doesn't call `travelBack()`
  - Why harmful: Subsequent tests use frozen time; failing or passing incorrectly
  - Better: Always reset in `afterEach()` or `tearDown()`: `travelBack()` or `Carbon::setTestNow(null)`

- **Mistake: Assuming DB timestamps are affected**
  - Why: `Model::create(['created_at' => now()])` freezes but `DB::raw('CURRENT_TIMESTAMP')` doesn't
  - Why harmful: Database defaults set real time; assertions may fail
  - Better: Always pass explicit timestamp values instead of relying on DB defaults in test

- **Mistake: Testing caching with time manipulation**
  - Why: Cache TTL depends on real time, not Carbon time
  - Why harmful: `Cache::put('key', 'value', 60)` with frozen time doesn't expire as expected
  - Better: Use `Cache::put('key', 'value', Carbon::now()->addMinutes(1))` with Carbon-referenced TTL

- **Mistake: Using `freezeTime()` when `freezeSecond()` is needed**
  - Why: Freezing at microsecond precision may cause ordering issues
  - Why harmful: Two events dispatched in same test are recorded with same microsecond
  - Better: Use `freezeSecond()` for tests that dispatch multiple events in rapid succession

# Failure Modes
- **Carbon static leak**: `Carbon::setTestNow()` is a static property. If a test crash prevents `travelBack()`, all subsequent tests in the process use frozen time.
- **Time-sensitive cache expiry**: Cache TTL based on wall clock vs Carbon time may behave differently. Test cache TTL with both frozen and real time.
- **PHP `time()` function**: `Carbon::setTestNow()` doesn't affect `time()`. If the code uses `time()` instead of `Carbon::now()`, time manipulation has no effect.
- **JavaScript `Date.now()`**: Server-side time manipulation doesn't affect browser-side JavaScript. Tests that mix server and client time need care.

# Ecosystem Usage
- **Laravel core**: Laravel's `Cache`, `RateLimiter`, and `Session` tests use `Carbon::setTestNow()` for time-dependent assertions.
- **Laravel Cashier**: Subscription trial, expiration, and grace period testing relies heavily on time manipulation.
- **Laravel Spark**: Plan change, proration, and invoice date testing uses `travelTo()` for specific billing dates.
- **Laravel Horizon**: Job scheduling, retry delays, and prune policies tested with frozen time.
- **Pest**: Pest's `travel()`, `freezeTime()`, and `freezeSecond()` are first-class helpers in the Pest API.

# Related Knowledge Units
- **Prerequisites**: Carbon date library, Laravel scheduling concepts, Test double taxonomy
- **Related Topics**: Rate limiting testing, Subscription testing, Scheduled task testing, Cache TTL testing
- **Advanced Follow-up**: Clock facade, Database-level time handling, Timezone-aware testing

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
