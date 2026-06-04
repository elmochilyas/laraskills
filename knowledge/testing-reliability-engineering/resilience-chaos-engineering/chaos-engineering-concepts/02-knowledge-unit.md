# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Chaos Engineering Concepts
KU Code: ku-01-chaos-engineering-concepts
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Chaos engineering is the discipline of experimenting on a system to build confidence in its capability to withstand turbulent conditions in production. In Laravel, chaos engineering involves injecting controlled failures into application behavior to validate resilience. Unlike traditional testing where failures are explicitly mocked, chaos engineering introduces real, probability-based disruptions to uncover unknown failure modes.

# Core Concepts
- **Chaos hypothesis**: A specific prediction about system behavior under failure.
- **Blast radius**: The scope of impact when chaos is injected. Controlled experiments limit blast radius to a single service or request.
- **Steady state**: The measurable normal behavior of the system. Chaos experiments measure deviation from steady state.
- **Chaos point**: A location in code where disruption can be injected.
- **Fault injection**: Introducing controlled failures into a service without replacing the service itself.
- **Probability-based disruption**: Failures occur with configurable probability, mimicking real-world intermittent failures.
- **Discovery to Scaffold to Test**: The workflow for resilience testing.

# Mental Models
- **Chaos as hypothesis testing**: Each experiment tests a hypothesis about system behavior. Passing means the hypothesis is confirmed, not that the system is resilient.
- **Blast radius as surgical incision**: Chaos should be precise and limited. Broad chaos obscures results and risks real damage.
- **Steady state as baseline**: Without knowing normal behavior, you cannot measure the impact of chaos.

# Internal Mechanics
- Laravel Resilience decorates container-managed services with fault-injection wrappers.
- The decorator pattern intercepts method calls, checks if a fault is active, and either delegates to the real service or injects the fault.
- Discovery scans container bindings and identifies services that can be decorated.
- Scaffold generates test templates from discovery output.
- Probability-based chaos uses a seeded random number generator for reproducibility.

# Patterns
- **Deterministic-first pattern**: Start with deterministic fault injection. Add probability-based chaos after baselines pass.
- **One fault per experiment pattern**: Inject exactly one fault type per test. Multiple faults obscure which caused the behavior.
- **Blast radius scoping pattern**: Scope chaos to one service, one method, one fault type per experiment.
- **Hypothesis documentation pattern**: Document expected behavior before running the experiment.

# Architectural Decisions
- **Decision: Decorator-based fault injection**: Wraps real services instead of replacing them. Preserves service behavior when no fault is active.
- **Decision: Deterministic before probabilistic**: Establish baseline resilience with predictable faults before introducing random failures.
- **Decision: Separate CI stage for chaos**: Chaos experiments run in a slower, scheduled CI workflow rather than blocking PRs.

# Tradeoffs
- **Deterministic vs probabilistic faults**: Deterministic is predictable and debuggable. Probabilistic catches real-world patterns but is harder to reproduce.
- **Fault injection vs mocking**: Fault injection preserves the real service behavior (except the fault). Mocking replaces the entire service.
- **CI speed vs resilience confidence**: Chaos experiments are slower. Running them separately maintains PR speed while building resilience confidence.

# Performance Considerations
- Fault injection overhead: <0.1ms per service call when no fault is active. Negligible for test execution.
- Timeout faults: Delay test by the configured timeout duration. Use short timeouts (100-500ms) in tests.
- Latency faults: Add configured delay. Use minimal latency (50-100ms) for testing.
- Discovery command: Takes 1-10 seconds depending on container bindings. Run on demand, not per-test.
- Separate CI stage: Chaos experiments should run in a slower, scheduled CI workflow.

# Production Considerations
- Never enable chaos in production environment: Environment gating must be multi-layered.
- Blast radius isolation: Chaos in one service should never affect other services' state or data integrity.
- Injection logging: Log all chaos injections with request ID, timestamp, and fault type.
- Dependency scope: Install chaos packages as `require-dev` only.
- Secrets in discovery: Discovery may reveal service bindings with credentials. Review discovery output before committing.

# Common Mistakes
- **No hypothesis before experiment**: Injecting failures without defining expected behavior. Passing test gives false confidence.
- **One experiment testing everything**: Multiple faults simultaneously. Cannot determine which fault caused which behavior.
- **No steady-state measurement**: Running chaos without measuring normal behavior first. Cannot quantify deviation.
- **Only testing happy-path chaos**: Testing only service-down scenarios. Misses partial failures like slow responses.

# Failure Modes
- Unbounded blast radius: Chaos in a shared service affects all tests, causing widespread failures.
- Stale chaos points: Renamed classes or methods make chaos points ineffective without warning.
- Probability flakiness: Low-probability chaos may not trigger in CI, giving false confidence.
- Decorator incompatibility: Some services may not support decoration (final classes, static methods).

# Ecosystem Usage
- Laravel Resilience (v0.7.0) provides deterministic fault injection with container-aware decorators.
- Laravel Bazooka provides probability-based chaos experiments.
- Both packages are early-stage (experimental as of 2026) with limited community adoption.
- The discovery to scaffold to test workflow is unique to the Laravel ecosystem.

# Related Knowledge Units
- Circuit breaker patterns (laravel-fuse, laravel-circuit-breaker)
- Laravel Bazooka chaos experiments
- Laravel Resilience fault injection
- Retry and backoff strategies
- Bulkhead pattern implementation
- Degraded mode patterns

# Research Notes
- Chaos engineering in Laravel is nascent. The Laravel Resilience package and Bazooka are early-stage with limited community adoption.
- PHP's shared-nothing architecture limits chaos blast radius to single requests, unlike JVM languages where chaos can affect shared state.
- The field draws heavily from Netflix's Chaos Monkey (2011) and Principles of Chaos Engineering (2017).
- Adoption in the PHP/Laravel community is significantly behind the Java and Go ecosystems.
