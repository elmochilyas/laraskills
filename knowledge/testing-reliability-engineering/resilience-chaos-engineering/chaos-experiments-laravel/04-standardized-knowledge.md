# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Chaos Experiments with Laravel Bazooka
 KU Code: ku-02-chaos-experiments-laravel
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Laravel Bazooka is a chaos engineering package that injects controlled disruptions into Laravel applications using "chaos points" — configurable injection sites in application code that trigger failures (exceptions, latency, random responses) with configurable probability. Unlike traditional testing where failures are explicitly mocked, Bazooka introduces real, probability-based chaos during development and CI, enabling teams to observe how their application behaves under unpredictable failure conditions. It is an experimental (nascent) tool as of 2026.

# Core Concepts
- **Chaos point**: A location in code where chaos can be injected. Defined by class, method, and parameters. Acts as a hook point for disruption.
- **Probability**: Likelihood that chaos is injected at a chaos point. `probability: 0.1` = 10% chance of failure.
- **Disruption types**: Exception (throw specified exception), Latency (delay response), Random (return random value), Null (return null), Empty (return empty array/collection).
- **Chaos experiment**: A named configuration defining chaos points, disruption types, and probabilities.
- **Chaos session**: A runtime period during which chaos experiments are active, typically scoped to a test or development session.
- **Discovery mode**: Run Bazooka in discovery mode to identify potential chaos points without actually injecting failures.
- **Seed-based randomness**: Fixed random seed ensures reproducible chaos experiments across runs.

# When To Use
- Exploratory resilience testing to find unknown failure modes
- CI validation of fallback behavior under random failures
- Development-time verification that circuit breakers and retries work
- Teams that already practice deterministic fault injection (Laravel Resilience) and want to add stochastic testing
- Staging environments before major releases

# When NOT To Use
- As the only form of resilience testing (use deterministic fault injection first)
- In production under any circumstances (Bazooka is designed for local/testing only)
- Without monitoring/logging to distinguish chaos-caused failures from real bugs
- With high probability (>5%) in CI — will break CI reliability
- For teams new to testing (establish standard testing practices first)

# Best Practices (WHY)
- **Start with 1% probability in CI**: Reason: low probability discovers untested failure modes without making CI unreliable. Increase gradually as resilience improves.
- **Use seed-based randomness in test mode**: Reason: `seed: 42` ensures the same tests experience the same failures, enabling reproducible debugging.
- **Run chaos experiments in a separate CI job**: Reason: chaos-injected failures should not block the main test suite's green status. Run as a scheduled workflow.
- **Log every chaos injection**: Reason: when a test fails, you need to know if the failure was caused by chaos or a real bug. Log chaos point, disruption, timestamp.
- **Combine with deterministic fault injection**: Reason: deterministic faults (Laravel Resilience) verify specific fallback paths. Bazooka discovers unknown paths. Both are needed.
- **Review chaos points quarterly**: Reason: renamed classes, new methods, and refactored services make chaos points stale. Outdated chaos points inject no chaos.
- **Document each experiment's purpose**: Reason: a chaos experiment without documented expected behavior cannot validate resilience. State what behavior is expected when chaos triggers.

# Architecture Guidelines
- **Configuration file structure**: Place Bazooka config in `config/bazooka.php`. Enable only for `local` and `testing` environments.
- **Chaos point naming**: Use descriptive names for chaos points: `payment-gateway-timeout`, `email-send-latency`. Names appear in logs.
- **Environment gating**: `'enabled' => env('BAZOOKA_ENABLED', false)` and ensure `BAZOOKA_ENABLED` is never set in production.
- **Seed storage**: Store the random seed in CI configuration. Same seed + same code = same chaos behavior.
- **Blast radius per experiment**: One chaos point per experiment initially. Combine only after each point's behavior is understood.
- **Experiment grouping**: Group chaos points by service domain (payments, notifications, auth) for focused experiments.

# Performance
- **Chaos point check**: <0.1ms per registered chaos point. Negligible when not injecting chaos.
- **Latency injection**: Delays response by configured amount (100ms-5000ms). Significant during experiments.
- **Logging overhead**: ~1ms per chaos injection. Acceptable for testing.
- **No overhead when disabled**: `config('bazooka.enabled')` check is fast. Zero overhead.
- **Discovery mode**: 1-10 seconds depending on codebase size. Runs once to generate configuration.

# Security
- **Production safety**: Bazooka is designed for development/testing only. Multi-layer gating: config + CI variable + runtime `APP_ENV` assertion.
- **Never commit production chaos config**: CI-generated config should use placeholder values in version control.
- **Log sanitization**: Chaos logs may include request data. Ensure logs don't contain PII or secrets.
- **Dependency scope**: Install as `require-dev` only. Production Composer install must exclude Bazooka.

# Common Mistakes

**Mistake: Enabling Bazooka in production**
- Description: Setting `BAZOOKA_ENABLED=true` in production environment
- Cause: "To test resilience in production"
- Consequence: Real users experience real failures; potential data corruption
- Better: Use staging environment for chaos experiments. Never production.

**Mistake: High probability in CI**
- Description: Setting 50-100% probability for chaos experiments in CI
- Cause: "100% failure probability ensures we test resilience"
- Consequence: Every test fails; no useful signal from CI
- Better: 1-5% probability for CI. Higher probability for targeted local experiments.

**Mistake: Not logging chaos injections**
- Description: Running chaos experiments without logging what was injected
- Cause: "We'll know if chaos is injected because the test fails"
- Consequence: Hard to distinguish chaos-caused failures from real bugs
- Better: Log every chaos injection with chaos point, disruption type, and timestamp.

**Mistake: Only testing exception disruptions**
- Description: Using only `Exception` disruption type across all experiments
- Cause: "Exceptions are the most realistic failure"
- Consequence: Misses latency-related bugs, null pointer issues, and empty response handling
- Better: Mix disruption types: exceptions, latency, random, null, empty.

# Anti-Patterns
- **Deterministic probability (100%)**: Setting 100% probability defeats the purpose of chaos engineering. You're just doing fault injection.
- **Unseeded randomness**: Chaos that can't be reproduced is untestable. Always use fixed seeds in test mode.
- **No blast radius review**: Injecting chaos into a service used by every test creates flaky CI. Scope experiments narrowly.
- **Silent chaos**: Running chaos without alerting the team. Notify when chaos experiments are active, especially in shared environments.
- **Chaos as a crutch**: Using Bazooka instead of writing proper fallback code. Chaos reveals gaps; it doesn't fix them.

# Examples

**Basic Bazooka configuration**
```php
// config/bazooka.php
return [
    'enabled' => env('BAZOOKA_ENABLED', false),
    'seed' => env('BAZOOKA_SEED', null),
    'experiments' => [
        'api-partner-timeout' => [
            'chaos_points' => [
                PartnerApiClient::class => [
                    'methods' => ['sendRequest'],
                    'disruption' => 'latency',
                    'value' => 3000,
                    'probability' => 0.1,
                ],
            ],
        ],
    ],
];
```

**Running Bazooka in CI**
```yaml
# .github/workflows/chaos.yml
name: Chaos Engineering
on:
  schedule:
    - cron: '0 6 * * 1' # Weekly Monday 6AM
jobs:
  chaos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
      - run: composer install
      - run: cp .env.testing.example .env.testing
      - run: php artisan bazooka:discover
      - run: BAZOOKA_ENABLED=true BAZOOKA_SEED=42 php artisan test --filter=Resilience
```

**Testing with Bazooka in a Pest test**
```php
test('application handles payment gateway latency', function () {
    config(['bazooka.experiments.payment-latency' => [
        'chaos_points' => [
            PaymentGateway::class => [
                'methods' => ['charge'],
                'disruption' => 'latency',
                'value' => 2000,
                'probability' => 1.0,
            ],
        ],
    ]]);

    $response = $this->post('/checkout', ['amount' => 5000]);

    $response->assertStatus(200);
    $response->assertSee('Order confirmed');
});
```

# Related Topics
- Laravel Resilience deterministic fault injection
- Circuit breaker patterns (laravel-fuse)
- Laravel Resilience discovery and scaffold workflow
- Degraded mode patterns
- Retry and backoff strategies

# AI Agent Notes
- Bazooka is a nascent project with limited community adoption. Agents should prefer Laravel Resilience for deterministic fault injection tests.
- When generating Bazooka configurations, always include `'enabled' => env('BAZOOKA_ENABLED', false)` for safety.
- Seed-based randomness is critical for reproducible tests. Always set `'seed'` in test mode.
- Probability values under 0.05 (5%) are recommended for CI. Higher values (0.25-1.0) for targeted local experiments.
- Bazooka's discovery mode (`php artisan bazooka:discover`) is the recommended starting point. Run it first, review the output, then configure experiments.

# Verification
- [ ] Can configure a chaos experiment with specific class, method, disruption type, and probability
- [ ] Chaos injection triggers expected application behavior (fallback, error handling, degraded mode)
- [ ] Fixed random seed produces reproducible chaos behavior across runs
- [ ] Bazooka is disabled in production via multi-layer environment gating
- [ ] All chaos injections are logged with chaos point name, disruption type, and timestamp
- [ ] Discovery mode identifies potential chaos points without injecting failures
- [ ] CI chaos job runs separately from the main test suite
