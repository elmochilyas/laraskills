# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Flaky Test Prevention |
| Knowledge Unit | Flaky Test Prevention Strategies |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHPUnit/Pest fundamentals, Test isolation concepts, Dusk browser testing |
| Related KUs | Test organization patterns, Time manipulation, HTTP client faking, Dusk waiting strategies |
| Source | domain-analysis.md K027 |

# Overview

Flaky tests — tests that pass and fail without code changes — are the number one threat to test suite trust and CI reliability. In Laravel applications, common flakiness sources include time-dependent assertions, random test data, inter-test state leakage, network-dependent E2E tests, and CSS-selector brittleness in Dusk. Prevention strategies focus on determinism: freezing time, using explicit factory data, isolating test state via `RefreshDatabase`, faking HTTP calls with `Http::fake()`, using stable `@dusk` selectors, and maintaining a dedicated flaky test tracking process.

# Core Concepts

- **Flaky test**: A test that produces both passing and failing results without any code changes.
- **Determinism**: The property that a test produces the same result every time with the same inputs.
- **Time dependence**: Tests relying on `now()`, `Carbon::now()`, or timestamps without freezing time.
- **State leakage**: Test A mutates shared state that Test B depends on. Order-dependent failures.
- **Network dependence**: Tests making real HTTP calls fail when network is slow or returns unexpected responses.
- **Timing dependence**: Browser tests relying on fixed waits (`pause()`) instead of element-specific waits (`waitFor()`).

# When To Use

- In every test (prevent flakiness from the start, not after it appears)
- For time-sensitive logic (expirations, deadlines, scheduling)
- For any test making HTTP calls to external services
- For browser/Dusk tests with dynamic rendering
- For tests using random/faker data in assertions

# When NOT To Use

- For non-deterministic behavior that must be tested (race conditions should be tested in separate dedicated tests)
- When freezing time would mask time-dependent behavior that should be tested (test both with and without time freezing)
- When faking HTTP would prevent testing real API integration (have separate integration tests)

# Best Practices (WHY)

- **Freeze time for every time-sensitive test**: `$this->freezeTime()` prevents failures at midnight, DST transitions, or month boundaries. Time-dependent flakiness accounts for ~40% of all flaky failures in Laravel.
- **Use explicit values, not Faker defaults, for fields in assertions**: Random data may contain edge-case characters (emojis, accents) that cause encoding failures. Explicit values make tests reproducible.
- **Use `RefreshDatabase` for all feature tests**: Transaction-based isolation prevents state leakage between tests. Without it, order-dependent failures are inevitable.
- **Use `Http::fake()` for any test interacting with external APIs**: Network calls are the #1 source of non-determinism. Fake all external HTTP interactions.
- **Replace `pause()` with `waitFor()` in all Dusk tests**: Fixed waits are too short on slow CI and too long on fast CI. Polling-based waits adapt to actual conditions.

# Architecture Guidelines

- **Retry vs quarantine**: Retry (auto-retry flaky tests) is simpler but masks issues. Quarantine (separate suite that doesn't block CI) is more honest but requires discipline to fix.
- **`RefreshDatabase` vs `DatabaseTransactions`**: `RefreshDatabase` is more thorough (migrates + transactions). `DatabaseTransactions` is faster but may miss schema issues.
- **Fixed vs random data**: Fixed data for fields in assertions. Random (Faker) only for fields tests don't assert on.

# Performance Considerations

- Time freezing: Zero overhead. `Carbon::setTestNow()` is a static setter.
- `Http::fake()`: Faster than real HTTP calls (ms vs hundreds of ms).
- `RefreshDatabase`: Migration overhead per suite (~1-5s), not per test (transaction rollback is instant).
- `--retry` flag: Doubles CI time for flaky tests. Monitor retry rate.
- `waitFor()`: Polls every 100ms. More efficient than `pause(1000)`.

# Security Considerations

- Flaky tests in security-critical areas (auth, permissions) are dangerous. A flaky security test may pass when it should fail.
- Time-based security logic (password reset expirations, session timeouts) must be tested with frozen time.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Ignoring flaky tests | "It's just flaky; re-run and it'll pass" | Flaky tests multiply; CI trust erodes | Track every flaky failure; fix or quarantine within 2 weeks |
| Using `pause()` in Dusk tests | "Wait 1 second; element should be rendered" | Too short on slow CI; too long on fast | Use `waitFor()` or `waitForText()` |
| Not freezing time for time-sensitive code | "Test passes at 2 PM; it's fine" | Fails at midnight or DST boundary | Always freeze time for time-sensitive logic |
| Using random data in assertions | Faker default in asserted field | Random data may cause encoding failures | Use explicit fixed values for asserted fields |
| No test isolation | Missing `RefreshDatabase` | Order-dependent failures; tests pass in isolation but fail in suite | Always use `RefreshDatabase` or `DatabaseTransactions` |

# Anti-Patterns

- **`pause()` in Dusk tests**: Fixed time waits. Use `waitFor()` with element/text selectors.
- **Real network calls in tests**: Tests that depend on external APIs being available. Use `Http::fake()`.
- **No time freezing**: Tests relying on `Carbon::now()` without freezing. Flaky at boundaries.
- **Ignoring flaky test debt**: Letting flaky tests accumulate. Each flaky failure costs developer time and erodes trust.
- **Zero-assertion tests**: Tests that pass without verifying anything. Always flaky in the "always passes" direction.

# Examples

```php
// Time freezing
public function test_expired_subscription_shows_locked()
{
    $this->freezeTime();
    $user = User::factory()->create();
    $user->subscribe()->expireInDays(-1);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertSee('Subscription locked');
}

// Explicit factory data
public function test_user_can_update_profile()
{
    $user = User::factory()->create([
        'name' => 'Original Name',
        'email' => 'original@example.com',
    ]);

    $this->actingAs($user)
        ->put('/profile', [
            'name' => 'Updated Name',
        ])->assertOk();

    $this->assertEquals('Updated Name', $user->fresh()->name);
}

// HTTP fake for external API
public function test_weather_endpoint_returns_data()
{
    Http::fake([
        'api.weather.com/*' => Http::response(['temp' => 22]),
    ]);

    $response = $this->get('/weather');
    $response->assertSee('22°C');
}

// Dusk waitFor over pause
public function test_user_sees_notification()
{
    $this->browse(function (Browser $browser) {
        $browser->visit('/dashboard')
            ->waitForText('Welcome back', 10)
            ->assertSee('Dashboard');
    });
}
```

# Related Topics

- **Prerequisites**: PHPUnit/Pest fundamentals, Test isolation concepts, Dusk browser testing
- **Related**: Test organization patterns, Time manipulation, HTTP client faking, Dusk waiting strategies
- **Advanced**: Flaky test detection algorithms, Test retry infrastructure, Deterministic testing methodology

# AI Agent Notes

- Time-dependent flakiness is the #1 source in Laravel apps. `$this->freezeTime()` is the single most impactful prevention strategy.
- For Dusk tests, always use `waitFor()` or `waitForText()` with a reasonable timeout. Never use `pause()` in production tests.
- When using `--retry` in CI, track the retry rate. If more than 5% of tests are retried, invest in fixing flaky tests.

# Verification

- [ ] Every time-sensitive test uses `$this->freezeTime()` or equivalent
- [ ] All external HTTP calls use `Http::fake()` in feature tests
- [ ] No Dusk tests use `pause()` — all use `waitFor()` or `waitForText()`
- [ ] All feature tests use `RefreshDatabase` or `DatabaseTransactions`
- [ ] Asserted fields use explicit values, not Faker defaults
- [ ] Zero-assertion tests are eliminated
- [ ] Flaky test tracking process is in place (retry tracking, dashboard)
- [ ] Flaky test policy exists and is enforced (fix or quarantine within 2 weeks)
