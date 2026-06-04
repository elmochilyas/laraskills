# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Laravel Bazooka Chaos Engineering
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel Bazooka is a chaos engineering package for Laravel that injects controlled disruptions into application behavior to test resilience. It uses "chaos points" — configurable injection sites in application code — that trigger failures (exceptions, latency, random responses) with configurable probability. Unlike traditional testing where failures are explicitly mocked, Bazooka introduces real chaos during development and CI, enabling teams to observe how their application behaves under unpredictable failure conditions. It is an experimental (nascent) tool in the Laravel ecosystem as of 2026, representing the frontier of resilience testing for PHP applications.

# Core Concepts
- **Chaos point**: A location in code where chaos can be injected. Defined by class, method, and parameters. Acts as a hook point for disruption.
- **Probability**: Likelihood that chaos is injected at a chaos point. `probability: 0.1` = 10% chance of failure. Configurable per chaos point.
- **Disruption types**: Exception (throw specified exception), Latency (delay response by X ms), Random (return random value), Null (return null), Empty (return empty array/collection).
- **Chaos experiment**: A named configuration defining chaos points, disruption types, and probabilities. Can be enabled/disabled per environment.
- **Chaos session**: A runtime period during which chaos experiments are active. Typically scoped to a test or development session.
- **Discovery mode**: Laravel Bazooka can run in discovery mode to identify potential chaos points without actually injecting failures.

# Mental Models
- **Chaos engineering as failure rehearsal**: Like fire drills — you don't wait for a real fire to test evacuation procedures. Chaos experiments rehearse failure scenarios before they happen in production.
- **Probability as realism**: Real failures don't happen on every request. They happen occasionally. Probability-based chaos injection mimics real-world failure patterns.
- **Chaos point as fuse box**: Each chaos point is a circuit that can be tripped. You don't trip all at once — you selectively test specific failure scenarios.
- **Discovery mode as exploration**: Run Bazooka in discovery mode to find which parts of your application touch external services, databases, or file systems. These are the failure-prone paths.

# Internal Mechanics
- **Chaos point registration**: Bazooka scans configured directories for classes implementing `ChaosPoint` interface. Each chaos point defines its target class/method and disruption configuration.
- **Middleware-based injection**: Bazooka uses Laravel middleware to intercept requests and apply chaos. Can also use service provider decoration for non-HTTP chaos (queue jobs, Artisan commands).
- **Probability check**: `rand(0, 100) < $probability * 100` — simple random check. Seeded for reproducibility in test mode.
- **Disruption execution**: When chaos is triggered, Bazooka executes the disruption: throws exception, calls `usleep()` for latency, modifies return value, or returns null/empty.
- **Logging**: All chaos injections are logged: which chaos point, what disruption, timestamp, request ID. Provides audit trail for debugging unexpected test failures.
- **Configuration**: `config/bazooka.php` defines experiments, chaos points, probabilities, and enabled environments. Typically enabled only for `local` and `testing`.

# Patterns
- **Pattern: Chaos experiment for external API failure**
  - Purpose: Test application behavior when external API returns 500
  - Benefits: Validates error handling, fallback logic, and user messaging
  - Tradeoffs: May cause real failures if misconfigured for production
  - Implementation: Define chaos point for HTTP client class; inject `HttpException` with 10% probability

- **Pattern: Latency injection for timeout testing**
  - Purpose: Verify timeout handling and circuit breaker behavior
  - Benefits: Ensures application doesn't hang when services are slow
  - Tradeoffs: Slows down test suite
  - Implementation: Define chaos point for database query; inject 5000ms latency with 5% probability

- **Pattern: Chaos session in CI**
  - Purpose: Run test suite with random failures to find resilience gaps
  - Benefits: Discovers untested failure scenarios
  - Tradeoffs: Flaky CI if not carefully configured
  - Implementation: Run CI twice: once without chaos, once with chaos experiments at low probability (1-5%)

- **Pattern: Discovery-based chaos point generation**
  - Purpose: Automatically find all external dependency touch points
  - Benefits: Comprehensive chaos coverage; no manual configuration needed
  - Tradeoffs: May flag internal-only methods as chaos points
  - Implementation: Run `php artisan bazooka:discover` to generate initial chaos point configuration

# Architectural Decisions
- **Bazooka vs Laravel Resilience**: Bazooka is for chaos engineering (random, probability-based disruption in development/testing). Laravel Resilience is for deterministic fault injection in tests. Use both: Bazooka for exploratory resilience testing, Resilience for targeted fault injection tests.
- **Probability levels**: 1-5% for CI (discover untested scenarios without breaking CI reliability). 10-25% for development (observe behavior under moderate failure). 50-100% for targeted chaos experiments.
- **Environment scoping**: Enable Bazooka only for `local` and `testing` environments. Never enable in production. Use environment detection in configuration.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Discovers untested failure scenarios | Random failures may be hard to reproduce | Use seeded randomness in test mode |
| Realistic failure injection | May cause flaky CI tests | Use low probability (1-5%) in CI |
| Low configuration overhead | Limited disruption types | Extend with custom disruptions |
| Discovery mode finds touch points | May flag unrelated code | Review and filter discovered chaos points |

# Performance Considerations
- Chaos point check: <0.1ms per registered chaos point. Negligible overhead when not injecting chaos.
- Latency injection: Delays response by configured amount (100ms-5000ms). Significant during chaos experiments.
- Logging overhead: ~1ms per chaos injection. Acceptable for testing.
- No chaos when disabled: Bazooka has zero overhead when chaos is disabled for the environment. `config('bazooka.enabled')` check is fast.
- Discovery mode: 1-10 seconds depending on codebase size. Runs once to generate configuration.

# Production Considerations
- **Production safety**: Bazooka is designed for development/testing only. Never enable in production. Use environment gating and CI variable verification.
- **CI integration**: Run a separate CI job with Bazooka enabled. Do not mix chaos and non-chaos test results in the same job.
- **Seed-based reproducibility**: In CI, use a fixed random seed for chaos experiments. This ensures the same tests experience the same failures, enabling reproducible debugging.
- **Chaos experiment documentation**: Document each chaos experiment: what it tests, expected behavior, and known gaps. Share with the team as resilience knowledge.

# Common Mistakes
- **Mistake: Enabling Bazooka in production**
  - Why: "To test resilience in production"
  - Why harmful: Real users experience real failures; data corruption risk
  - Better: Use staging environment for chaos experiments; never production

- **Mistake: High probability in CI**
  - Why: "100% failure probability ensures we test resilience"
  - Why harmful: Every test fails; no useful signal from CI
  - Better: 1-5% probability for CI; higher probability for targeted local experiments

- **Mistake: Not logging chaos injections**
  - Why: "We'll know if chaos is injected because the test fails"
  - Why harmful: Hard to distinguish chaos-caused failures from real bugs
  - Better: Log every chaos injection; include in test output for debugging

- **Mistake: Only testing happy-path chaos**
  - Why: "Test what happens when the database is down"
  - Why harmful: Misses chaos edge cases: partial failures, slow responses, intermittent errors
  - Better: Mix disruption types: exceptions, latency, random values, null returns

# Failure Modes
- **False confidence**: Tests pass even with chaos injected, giving a false sense of resilience. The tests may not be asserting the right behavior. Review test assertions for chaos scenarios.
- **Unrepeatable failures**: Random chaos causes failures that cannot be reproduced. Use seed-based randomness for reproducibility.
- **Chaos cascade**: One chaos injection triggers a chain of failures that overwhelm the application. Set up circuit breakers and bulkheads to contain chaos effects.
- **Configuration drift**: Chaos point targets change as code evolves. Outdated chaos points may not inject chaos as expected. Review chaos configuration quarterly.

# Ecosystem Usage
- **Laravel Bazooka (ludoguenet/laravel-bazooka)**: Early-stage package with limited adoption (few stars, minimal documentation). Represents the experimental edge of Laravel resilience testing.
- **Chaos Monkey (Netflix)**: The original inspiration for Bazooka. Netflix's Chaos Monkey randomly terminates production instances to test resilience. Bazooka applies the same philosophy at the application level.
- **Laravel Resilience package**: Complements Bazooka with deterministic fault injection and more mature tooling. The Resilience package is more suitable for production-ready resilience testing.
- **PHP community**: Chaos engineering in PHP is nascent; Bazooka is one of the first tools attempting to bring chaos engineering patterns to the PHP ecosystem.

# Related Knowledge Units
- **Prerequisites**: Resilience testing concepts, Laravel middleware and service providers
- **Related Topics**: Laravel Resilience fault injection, Circuit breaker patterns, Deterministic testing
- **Advanced Follow-up**: Production chaos engineering (gated experiments), Chaos experiment design patterns, Resilience metrics and observability

# Research Notes
- Laravel Bazooka is a nascent project as of 2026; it represents the early stage of chaos engineering adoption in the PHP ecosystem
- The probability-based disruption model distinguishes Bazooka from traditional fault injection tools (which are deterministic); this randomness is both its strength (realistic failure patterns) and weakness (hard to reproduce failures)
- Chaos engineering in PHP faces unique challenges compared to JVM languages: PHP's shared-nothing architecture (each request is isolated) means chaos effects are limited to single requests, unlike Java where chaos can affect shared state
- Bazooka's discovery mode is a notable innovation — automatically identifying potential chaos points reduces the barrier to entry for teams new to chaos engineering
- The Bazooka package is best suited for teams already practicing resilience testing (via Laravel Resilience) who want to add stochastic chaos to discover unknown failure modes
