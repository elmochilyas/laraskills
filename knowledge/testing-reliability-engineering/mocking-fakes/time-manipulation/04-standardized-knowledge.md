# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Time Manipulation |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Carbon date library, Laravel scheduling concepts, Test double taxonomy |
| Related KUs | Rate limiting testing, Subscription testing, Scheduled task testing, Cache TTL testing |
| Source | domain-analysis.md K036 |

# Overview

Time manipulation controls the perceived current time in tests, enabling deterministic testing of time-dependent logic: scheduling, deadlines, rate limits, subscription expirations, and time-based queries. Laravel provides `Carbon::setTestNow()`, `travel()`, `travelTo()`, `freezeTime()`, and `freezeSecond()` via Pest's time helpers. Without time manipulation, tests involving time are flaky (varying by execution time), slow (requires real waiting), or impossible (future dates).

# Core Concepts

- **`Carbon::setTestNow(Carbon $time)`**: Sets Carbon's "current time" to the given moment.
- **`travel($time)->$unit`**: Pest helper. `travel(5)->days()` advances time by 5 days.
- **`travelTo(Carbon $time)`**: Pest helper. Sets current time to a specific moment.
- **`freezeTime()`**: Pest helper. Freezes time at the current moment.
- **`freezeSecond()`**: Pest helper. Freezes time but allows microsecond progression.
- **`travelBack()`**: Pest helper. Restores real time. Must be called in teardown.
- **`Clock` facade (Laravel 11+)**: `Clock::freeze()` and `Clock::resume()`.
- **Scope**: `Carbon::setTestNow()` is a global static. Affects all Carbon instances in the same process.

# When To Use

- For any test involving time-sensitive logic (expirations, deadlines, scheduling)
- For rate limit testing (verify limits reset after decay window)
- For subscription/trial expiration testing
- For scheduled task testing (cron, task scheduling)
- For cache TTL testing
- For preventing time-dependent flakiness (freeze time for non-time tests)

# When NOT To Use

- For testing real-time interactions (WebSockets, real-time notifications — test with real delays)
- For testing database-level time functions (`DB::raw('NOW()')` is not affected by Carbon)
- When `time()` PHP function is used instead of `Carbon::now()` (Carbon mocking doesn't affect it)
- For JavaScript `Date.now()` on the client side (server-side mocking doesn't affect browsers)

# Best Practices (WHY)

- **Always reset time after manipulation**: `travelBack()` or `Carbon::setTestNow(null)` in `afterEach()` or `tearDown()`. Frozen time leaking between tests causes inconsistent failures. This is the #1 mistake.
- **Freeze time even for non-time tests**: `$this->freezeTime()` at the start of tests that don't explicitly test time prevents flaky failures at midnight, DST transitions, or month boundaries.
- **Use explicit timestamps for database columns**: When creating models with time fields, pass explicit values: `User::factory()->create(['trial_ends_at' => now()->addDays(30)])`. Don't rely on database `CURRENT_TIMESTAMP`.
- **Use `travel()` for relative time, `travelTo()` for absolute time**: `travel(5)->days()` is readable for "5 days from now." `travelTo('2026-01-01')` is better for specific date scenarios (e.g., New Year's).
- **Use `freezeSecond()` when ordering within the same second matters**: Two events dispatched in rapid succession need different microsecond timestamps for ordering.

# Architecture Guidelines

- **`Carbon::setTestNow()` vs `travel()`**: `setTestNow()` for explicit control. `travel()` for relative offsets. Both work; choose based on readability.
- **`freezeTime()` vs `freezeSecond()`**: `freezeTime()` for most tests. `freezeSecond()` when microsecond ordering matters.
- **Time in setUp vs per-test**: Freeze in `setUp()` if time is irrelevant. Freeze per-test if specific dates matter.
- **Pest vs PHPUnit**: Pest provides `travel()`, `freezeTime()` as global functions. PHPUnit users use `Carbon::setTestNow()` directly.

# Performance Considerations

- Time manipulation overhead: <0.01ms per call (static property assignment).
- `freezeTime()`: Captures current time once. Negligible.
- `travel()`: Carbon arithmetic operations. Negligible.
- `travelBack()`: Null assignment. Negligible.

# Security Considerations

- Time-based security logic (password reset expirations, session timeouts, token expirations) must be tested with frozen time to ensure deterministic behavior.
- Test with both current time and near-boundary times (just before/after expiration).

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting to reset time after test | Test manipulates time but no `travelBack()` | Subsequent tests use frozen time; failing or passing incorrectly | Always reset in `afterEach()` or `tearDown()` |
| Assuming DB timestamps are affected | `Model::create(['created_at' => now()])` freezes but `DB::raw('CURRENT_TIMESTAMP')` doesn't | Database defaults set real time; assertions may fail | Always pass explicit timestamp values instead of relying on DB defaults |
| Testing caching with time manipulation | Cache TTL depends on real time, not Carbon | `Cache::put('key', $val, 60)` with frozen time doesn't expire as expected | Use Carbon-referenced TTL: `Cache::put('key', $val, now()->addMinutes(1))` |
| Using `freezeTime()` when `freezeSecond()` is needed | Freezing at microsecond precision may cause ordering issues | Two events recorded with same microsecond | Use `freezeSecond()` for tests dispatching multiple events rapidly |
| Not testing DB timestamp columns | Columns set via `$table->timestamps()` use PHP Carbon | May work but inconsistent | Verify with explicit `created_at` assertion |

# Anti-Patterns

- **Real waiting in tests**: `sleep(60)` to wait for a rate limit to reset. Use `travel()` instead.
- **No time reset in teardown**: Frozen time leaks across tests, causing mysterious failures.
- **Testing with random time**: Not freezing time and relying on the current system time. Tests fail at boundaries.
- **Using `time()` instead of `Carbon::now()`**: `time()` is not affected by Carbon mocking. Always use `Carbon::now()` in application code when testability matters.

# Examples

```php
// Future date for expiration testing
public function test_expired_subscription_is_locked()
{
    $this->freezeTime();
    $user = User::factory()->create();
    $user->subscription()->update([
        'expires_at' => now()->addDays(30),
    ]);

    $this->assertFalse($user->subscription->isExpired());

    travel(31)->days();

    $this->assertTrue($user->subscription->fresh()->isExpired());
}

// Rate limit reset
public function test_rate_limit_resets_after_decay()
{
    $this->freezeTime();
    $user = User::factory()->create();

    for ($i = 0; $i < 61; $i++) {
        $this->actingAs($user)->getJson('/api/users');
    }

    $this->actingAs($user)
        ->getJson('/api/users')
        ->assertStatus(429);

    travel(61)->seconds();

    $this->actingAs($user)
        ->getJson('/api/users')
        ->assertOk();
}

// Midnight boundary testing
public function test_daily_report_correct_at_midnight()
{
    $this->travelTo('2026-01-01 23:59:59');
    // Just before midnight - report should show today
    $this->get('/reports/daily')->assertSee('2026-01-01');

    $this->travelTo('2026-01-02 00:00:01');
    // Just after midnight - report should show new day
    $this->get('/reports/daily')->assertSee('2026-01-02');
}

// Clock facade (Laravel 11+)
public function test_with_clock_facade()
{
    Clock::freeze('2026-01-01 12:00:00');

    $this->assertEquals('2026-01-01', now()->format('Y-m-d'));

    Clock::resume();
}
```

# Related Topics

- **Prerequisites**: Carbon date library, Laravel scheduling concepts, Test double taxonomy
- **Related**: Rate limiting testing, Subscription testing, Scheduled task testing, Cache TTL testing
- **Advanced**: Clock facade, Database-level time handling, Timezone-aware testing

# AI Agent Notes

- Time-dependent flakiness accounts for ~40% of all flaky test failures. `$this->freezeTime()` is the single most impactful prevention strategy.
- The most common mistake is forgetting to reset time. Always call `travelBack()` or `Carbon::setTestNow(null)` in teardown.
- `Carbon::setTestNow()` does NOT affect `time()`, `DB::raw('NOW()')`, or JavaScript `Date.now()`. Ensure your application uses `Carbon::now()` for time-dependent logic that needs testing.

# Verification

- [ ] Time is always reset in `afterEach()` or `tearDown()` (`travelBack()` or `Carbon::setTestNow(null)`)
- [ ] Tests with time-sensitive logic use `freezeTime()`, `travel()`, or `travelTo()`
- [ ] Database timestamps use explicit Carbon values, not `CURRENT_TIMESTAMP`
- [ ] Cache TTL uses Carbon references (not raw seconds) when time is frozen
- [ ] `freezeSecond()` is used when microsecond ordering matters
- [ ] Application code uses `Carbon::now()` instead of `time()` for testability
- [ ] Boundary scenarios (midnight, month end, DST) are tested with specific dates
- [ ] Time manipulation in one test doesn't leak into other tests
