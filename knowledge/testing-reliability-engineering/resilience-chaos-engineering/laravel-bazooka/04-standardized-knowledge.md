# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Resilience & Chaos Engineering |
| Knowledge Unit | Laravel Bazooka Chaos Engineering |
| Difficulty | Advanced |
| Maturity | Nascent |
| Priority | P3 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Resilience testing concepts, Laravel middleware and service providers |
| Related KUs | Laravel Resilience fault injection, Circuit breaker patterns, Deterministic testing |
| Source | domain-analysis.md K038 |

# Overview

Laravel Bazooka is a chaos engineering package for Laravel that injects controlled disruptions into application behavior to test resilience. It uses "chaos points" — configurable injection sites in application code — that trigger failures (exceptions, latency, random responses) with configurable probability. Unlike traditional testing where failures are explicitly mocked, Bazooka introduces real chaos during development and CI, enabling teams to observe how their application behaves under unpredictable failure conditions. It is an experimental (nascent) tool in the Laravel ecosystem as of 2026, representing the frontier of resilience testing for PHP applications.

# Core Concepts

- **Chaos point**: A location in code where chaos can be injected. Defined by class, method, and parameters. Acts as a hook point for disruption.
- **Probability**: Likelihood that chaos is injected at a chaos point. `probability: 0.1` = 10% chance of failure. Configurable per chaos point.
- **Disruption types**: Exception (throw specified exception), Latency (delay response by X ms), Random (return random value), Null (return null), Empty (return empty array/collection).
- **Chaos experiment**: A named configuration defining chaos points, disruption types, and probabilities. Can be enabled/disabled per environment.
- **Chaos session**: A runtime period during which chaos experiments are active. Typically scoped to a test or development session.
- **Discovery mode**: Laravel Bazooka can run in discovery mode to identify potential chaos points without actually injecting failures.

# When To Use

- Exploratory resilience testing during development
- CI-based resilience validation with low-probability chaos
- Team training and resilience culture building
- Identifying untested failure scenarios in the application
- Complementing deterministic fault injection (Laravel Resilience)

# When NOT To Use

- Production environments (Bazooka is strictly a development/testing tool)
- As a primary testing strategy (deterministic tests are still the foundation)
- With high probability in CI (will cause flaky CI and reduce trust)
- As a replacement for traditional fault injection (use Bazooka + Resilience together)
- Without understanding the application's baseline behavior

# Best Practices (WHY)

- **Enable Bazooka only for `local` and `testing` environments**: Reason: never risk production disruptions. Use environment gating in configuration.
- **Use 1-5% probability in CI**: Reason: low probability discovers scenarios without breaking CI reliability. 10-25% for development.
- **Use seeded randomness in test mode**: Reason: ensures reproducible chaos experiments. Same seed = same failures.
- **Run chaos CI as a separate job**: Reason: chaos-injected tests may fail; don't mix with deterministic test results.
- **Log every chaos injection**: Reason: without logging, distinguishing chaos-caused failures from real bugs is impossible.
- **Review chaos configuration quarterly**: Reason: chaos point targets change as code evolves. Outdated chaos points don't inject chaos as expected.

# Architecture Guidelines

- **Environment scoping**: Enable Bazooka only for `local` and `testing`. Never production.
- **Probability levels**: 1-5% for CI, 10-25% for development, 50-100% for targeted experiments.
- **Disruption variety**: Mix disruption types (exceptions, latency, random values, null returns) for comprehensive coverage.
- **Discovery workflow**: Run `php artisan bazooka:discover` to generate initial chaos point configuration.
- **Seed-based reproducibility**: Use fixed random seed in CI to ensure repeatable chaos experiments.
- **Chaos experiment documentation**: Document each experiment's purpose, expected behavior, and known gaps.

# Performance Considerations

- **Chaos point check**: <0.1ms per registered chaos point. Negligible overhead when not injecting chaos.
- **Latency injection**: Delays response by configured amount (100ms-5000ms). Significant during chaos experiments.
- **Logging overhead**: ~1ms per chaos injection. Acceptable for testing.
- **No chaos when disabled**: Zero overhead when chaos is disabled for the environment.
- **Discovery mode**: 1-10 seconds depending on codebase size. Runs once to generate configuration.

# Security Considerations

- **Production safety**: Bazooka must never be enabled in production. Use environment detection and CI variable verification.
- **Chaos point discovery**: Discovered chaos points may reveal internal application structure. Review discovered points before committing.
- **Data corruption risk**: Random value disruption may cause data corruption if injected into data-modifying operations. Configure chaos points carefully.
- **Disruption logging**: Chaos injection logs may contain sensitive information. Restrict access to logs.

# Common Mistakes

**Mistake: Enabling Bazooka in production**
- Description: Configuring Bazooka to run in production environment
- Cause: "To test resilience in production"
- Consequence: Real users experience real failures; data corruption risk
- Better: Use staging environment for chaos experiments; never production.

**Mistake: High probability in CI**
- Description: Setting 100% failure probability in CI jobs
- Cause: "Ensures we test resilience"
- Consequence: Every test fails; no useful signal from CI
- Better: 1-5% probability for CI.

**Mistake: Not logging chaos injections**
- Description: Running chaos experiments without logging disruptions
- Cause: "We'll know if chaos is injected because the test fails"
- Consequence: Hard to distinguish chaos-caused failures from real bugs
- Better: Log every chaos injection with request ID and timestamp.

**Mistake: Only testing happy-path chaos**
- Description: Only testing "database is down" scenarios
- Cause: Focus on obvious failure modes
- Consequence: Misses edge cases: partial failures, slow responses, intermittent errors
- Better: Mix disruption types across multiple chaos points.

# Anti-Patterns

- **Deterministic chaos in CI**: Setting 100% probability makes chaos testing indistinguishable from traditional mocking.
- **Single disruption type**: Only using exceptions without latency, random values, or null returns.
- **Unreviewed chaos points**: Automatically accepting all discovered chaos points without filtering.
- **Ignoring chaos test results**: Running chaos experiments but never acting on the findings.

# Examples

**Bazooka configuration**
```php
// config/bazooka.php
return [
    'enabled' => env('BAZOOKA_ENABLED', false),
    'seed' => env('BAZOOKA_SEED', null),
    'experiments' => [
        'external-api-failure' => [
            'chaos_points' => [
                [
                    'class' => App\Services\PaymentGateway::class,
                    'method' => 'charge',
                    'disruption' => 'exception',
                    'exception' => HttpException::class,
                    'probability' => 0.1,
                ],
            ],
        ],
        'database-latency' => [
            'chaos_points' => [
                [
                    'class' => App\Repositories\UserRepository::class,
                    'method' => 'findAll',
                    'disruption' => 'latency',
                    'latency' => 2000,
                    'probability' => 0.05,
                ],
            ],
        ],
    ],
];
```

**Chaos session in CI**
```yaml
# .github/workflows/chaos.yml
jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    env:
      BAZOOKA_ENABLED: true
      BAZOOKA_SEED: 42
    steps:
      - uses: actions/checkout@v4
      - run: php artisan test
```

# Related Topics

- Laravel Resilience fault injection
- Circuit breaker patterns
- Deterministic testing
- Production chaos engineering (gated experiments)
- Resilience metrics and observability

# AI Agent Notes

- Never generate code that enables Bazooka in production environments. Always use environment gating.
- When generating Bazooka configurations, use seeded randomness for reproducibility.
- Generate mixed disruption types (exceptions, latency, random values) for comprehensive coverage.
- Document each chaos experiment's purpose and expected behavior.
- For CI configurations, generate a separate job for chaos testing, not mixed with deterministic tests.
- Always include logging configuration to track chaos injections.

# Verification

- [ ] Bazooka is enabled only for `local` and `testing` environments
- [ ] CI chaos experiments use 1-5% probability
- [ ] Seeded randomness is configured for reproducibility
- [ ] Chaos injections are logged with request ID and timestamp
- [ ] Multiple disruption types are configured (exceptions, latency, random)
- [ ] Chaos experiments are run in a separate CI job
- [ ] Chaos configuration is reviewed quarterly
- [ ] Discovered chaos points are filtered and validated before use
