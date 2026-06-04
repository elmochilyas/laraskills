# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Chaos Engineering Concepts
 KU Code: ku-01-chaos-engineering-concepts
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Chaos engineering is the discipline of experimenting on a system to build confidence in its capability to withstand turbulent conditions in production. In Laravel, chaos engineering involves injecting controlled failures (exceptions, latency, resource exhaustion) into application behavior to validate resilience. Unlike traditional testing where failures are explicitly mocked, chaos engineering introduces real, probability-based disruptions during development and CI to uncover unknown failure modes. Key tools include Laravel Resilience (deterministic fault injection) and Laravel Bazooka (probability-based chaos points).

# Core Concepts
- **Chaos hypothesis**: A specific prediction about system behavior under failure. "If the database connection fails, the application serves cached data within 500ms."
- **Blast radius**: The scope of impact when chaos is injected. Controlled experiments limit blast radius to a single service or request.
- **Steady state**: The measurable normal behavior of the system (response time, error rate, throughput). Chaos experiments measure deviation from steady state.
- **Chaos point**: A location in code where disruption can be injected. Defined by class, method, and parameters.
- **Fault injection**: Introducing controlled failures (exception, timeout, latency) into a service without replacing the service itself.
- **Probability-based disruption**: Failures occur with configurable probability (e.g., 10% of requests experience latency), mimicking real-world intermittent failures.
- **Discovery → Scaffold → Test**: The workflow for resilience testing: discover container-managed services, scaffold test templates, write resilience tests.

# When To Use
- Applications with external dependencies (APIs, databases, caches, queues)
- Services that have fallback or degraded-mode behavior
- Before deploying critical infrastructure changes
- When adding circuit breakers, retry logic, or bulkheads
- Teams practicing Site Reliability Engineering (SRE) principles
- During staging/CI validation of resilience-critical paths

# When NOT To Use
- During production without proper guardrails and blast radius controls
- On systems without monitoring to detect unexpected side effects
- When the team lacks capacity to investigate and fix discovered issues
- As a replacement for standard unit/feature testing
- On legacy systems with unknown failure modes (discover first, experiment later)

# Best Practices (WHY)
- **Start with deterministic fault injection before probability-based chaos**: Reason: deterministic faults (always throw exception) establish baseline resilience. Probability-based chaos (10% chance) adds realism after baselines pass.
- **Use discovery mode before writing experiments**: Reason: `php artisan resilience:discover` reveals which services are injectable. Writing experiments blindly misses services that can't be decorated.
- **Run chaos experiments in a separate CI stage**: Reason: chaos tests are slower (latency/timeout faults) and may be flaky. Main test suite should not depend on them.
- **Limit blast radius per experiment**: Reason: injecting chaos into the entire database affects every test. Scope to one service, one method, one fault type.
- **Document each experiment's hypothesis and expected fallback**: Reason: without clear expected behavior, a passing test gives false confidence that fallback works.
- **Use fixed random seeds for reproducibility**: Reason: probability-based failures must be reproducible for debugging. Seed-based randomness ensures the same test experiences the same failures.
- **Review chaos configuration quarterly**: Reason: code changes (renamed classes, new interfaces) can make chaos points ineffective without warning.

# Architecture Guidelines
- **Service decoration layer**: Chaos tools decorate container-managed services. Ensure all external-facing services are bound to the container as interfaces.
- **Environment gating**: Chaos experiments must be environment-aware. Never enable in production. Use `APP_ENV` checks and CI variable verification.
- **Fault scope isolation**: Each test should activate its own faults and clean up in teardown. Global faults across tests cause unpredictable failures.
- **Monitoring integration**: Chaos experiments should log every injection (what, where, when, result). Logs enable debugging unexpected test failures.
- **Fallback instrumentation**: Fallback code paths should set assertion markers (`$fallbackUsed = true`) that resilience tests can verify.
- **Gradual adoption path**: Start with 1-2 critical services (payment gateway, auth provider), add resilience tests, then expand to all external dependencies.

# Performance
- **Fault injection overhead**: <0.1ms per service call when no fault is active. Negligible for test execution.
- **Timeout faults**: Delay test by the configured timeout duration (e.g., 5s). Use short timeouts (100-500ms) in tests.
- **Latency faults**: Add configured delay (e.g., 2000ms). Use minimal latency (50-100ms) for testing.
- **Discovery command**: Takes 1-10 seconds depending on container bindings. Run on demand, not per-test.
- **Separate CI stage**: Chaos experiments should run in a slower, scheduled CI workflow rather than blocking PRs.

# Security
- **Never enable chaos in production environment**: Environment gating must be multi-layered (config check + CI variable + runtime assertion).
- **Blast radius isolation**: Chaos in one service should never affect other services' state or data integrity.
- **Injection logging**: Log all chaos injections with request ID, timestamp, and fault type. Audit logs for debugging.
- **Dependency scope**: Install chaos packages as `require-dev` only. Production Composer install must not include them.
- **Secrets in discovery**: Discovery may reveal service bindings with credentials. Review discovery output before committing.

# Common Mistakes

**Mistake: No hypothesis before experiment**
- Description: Injecting failures without defining what behavior is expected
- Cause: "Let's see what happens" approach
- Consequence: Passing test gives false confidence; actual resilience gaps go unnoticed
- Better: State the hypothesis: "When PaymentGateway::charge throws TimeoutException, the order transitions to `pending` and a retry job is dispatched."

**Mistake: One experiment testing everything**
- Description: A single chaos experiment injects multiple faults simultaneously
- Cause: "More chaos = more resilience confidence"
- Consequence: Cannot determine which fault caused which behavior
- Better: One fault type per experiment. Run multiple experiments sequentially.

**Mistake: No steady-state measurement**
- Description: Running chaos without measuring normal behavior first
- Cause: Assumption that current behavior is the steady state
- Consequence: Cannot quantify deviation caused by chaos injection
- Better: Measure response time, error rate, and throughput before injecting faults.

**Mistake: Only testing happy-path chaos**
- Description: Testing only "service is down" scenarios
- Cause: Binary thinking (works vs doesn't work)
- Consequence: Misses partial failures (slow responses, intermittent errors, degraded data)
- Better: Mix disruption types: exceptions, latency, random values, empty responses.

# Anti-Patterns
- **Chaos in production without monitoring**: Injecting failures without observability is reckless. You can't know if the system handled it correctly.
- **Deterministic-only chaos**: Always throwing exceptions misses real-world failure patterns (intermittent, transient, degraded). Mix probability-based injection.
- **No fallback verification**: Injecting faults without asserting fallback behavior is just chaos, not engineering. Every experiment must verify the response.
- **Carpet-bombing discovery**: Applying chaos to every discovered service at once. Prioritize services with no redundancy (single DB, single API).
- **Isolated chaos program**: Running chaos experiments without involving the team that owns the service. Resilience is a shared responsibility.

# Examples

**Laravel Resilience fault injection for HTTP client**
```php
use Illuminate\Support\Facades\Resilience;

test('user profile loads from cache when API is down', function () {
    Resilience::fake(UserApiService::class, 'fetchUser', ExceptionFault::class);

    $response = $this->get("/users/1");

    $response->assertOk();
    $this->assertFallbackUsed();
    $this->assertStringContainsString('cached', $response->content());
});
```

**Laravel Bazooka chaos experiment in CI**
```php
// config/bazooka.php
return [
    'enabled' => env('BAZOOKA_ENABLED', false),
    'seed' => env('BAZOOKA_SEED', 42),
    'experiments' => [
        'payment-timeout' => [
            'chaos_points' => [
                PaymentGateway::class => [
                    'methods' => ['charge'],
                    'disruption' => 'latency',
                    'value' => 5000,
                    'probability' => 0.05,
                ],
            ],
        ],
    ],
];
```

**Discovery and scaffold workflow**
```bash
# Step 1: Discover injectable services
php artisan resilience:discover

# Step 2: Scaffold resilience tests
php artisan resilience:scaffold

# Step 3: Run with fault injection
php artisan test --filter=Resilience
```

# Related Topics
- Circuit breaker patterns (laravel-fuse, laravel-circuit-breaker)
- Laravel Bazooka chaos experiments
- Laravel Resilience fault injection
- Retry and backoff strategies
- Bulkhead pattern implementation
- Degraded mode patterns

# AI Agent Notes
- Chaos engineering in Laravel is nascent. The Laravel Resilience package (v0.7.0) and Bazooka are early-stage with limited community adoption. Recommend pinning versions and contributing findings back.
- PHP's shared-nothing architecture limits chaos blast radius to single requests, unlike JVM languages where chaos can affect shared state.
- For AI agents generating tests, prefer deterministic `Resilience::fake()` over probability-based Bazooka for predictable test outcomes.
- When generating resilience tests, always include fallback assertion (`assertFallbackUsed()` or content inspection) — without it the test validates nothing.
- The discovery → scaffold → test workflow should be automated in CI: run discovery after container binding changes, regenerate scaffolds, notify team of new test opportunities.

# Verification
- [ ] Can inject an ExceptionFault into a container-managed service and observe the fallback response
- [ ] Can run `php artisan resilience:discover` and interpret the output
- [ ] Can configure a Bazooka chaos point with specific probability and disruption type
- [ ] Chaos experiments run in a separate CI stage without blocking the main test suite
- [ ] All chaos injections are logged with request ID and fault type
- [ ] Production environment blocks all chaos configuration via multi-layered gating
- [ ] Team can reproduce a probability-based failure using a fixed random seed
