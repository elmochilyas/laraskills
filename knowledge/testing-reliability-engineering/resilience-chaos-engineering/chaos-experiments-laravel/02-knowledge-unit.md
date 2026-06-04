# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Resilience & Chaos Engineering
Knowledge Unit: Chaos Experiments with Laravel Bazooka
KU Code: ku-02-chaos-experiments-laravel
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Laravel Bazooka is a chaos engineering package that injects controlled disruptions into Laravel applications using chaos points. Unlike traditional testing where failures are explicitly mocked, Bazooka introduces real, probability-based chaos during development and CI, enabling teams to observe how their application behaves under unpredictable failure conditions. It is an experimental tool as of 2026.

# Core Concepts
- **Chaos point**: A location in code where chaos can be injected. Defined by class, method, and parameters.
- **Probability**: Likelihood that chaos is injected at a chaos point. `probability: 0.1` = 10% chance of failure.
- **Disruption types**: Exception (throw specified exception), Latency (delay response), Random (return random value), Null, Empty.
- **Chaos experiment**: A named configuration defining chaos points, disruption types, and probabilities.
- **Chaos session**: A runtime period during which chaos experiments are active.
- **Discovery mode**: Run Bazooka in discovery mode to identify potential chaos points without injecting failures.
- **Seed-based randomness**: Fixed random seed ensures reproducible chaos experiments.

# Mental Models
- **Bazooka as exploratory tool**: It finds unknown failure modes. Use it to discover weaknesses, not to validate known behavior.
- **Probability as risk gradient**: Low probability (1%) reflects real-world intermittent failures. High probability (100%) is deterministic fault injection.
- **Seed as reproducibility key**: Same seed + same code = same chaos behavior. Essential for debugging.

# Internal Mechanics
- Bazooka hooks into Laravel's service container to wrap registered services with chaos decorators.
- Chaos point resolution checks the class, method, and parameters against the configuration.
- The random number generator uses a seeded Mersenne Twister for reproducibility.
- When chaos is triggered, the configured disruption is executed: exception thrown, sleep() for latency, or modified return value.
- Discovery mode scans the container and codebase to identify injectable services and methods.

# Patterns
- **Low probability CI pattern**: Use 1-5% probability in CI to discover failures without making CI unreliable.
- **Seed for reproducibility pattern**: Use fixed `BAZOOKA_SEED` in test mode for reproducible failures.
- **Separate CI job pattern**: Run chaos experiments in a scheduled CI workflow, not blocking PRs.
- **Mix disruption types pattern**: Combine exception, latency, null, and empty disruptions for comprehensive testing.

# Architectural Decisions
- **Decision: Probability-based over deterministic-only**: Probability-based chaos catches real-world intermittent failures that deterministic injection misses.
- **Decision: Seed-based randomness**: Ensures reproducibility across runs. Critical for debugging.
- **Decision: Configuration-driven chaos points**: Chaos points defined in config files, not code. Allows non-developers to configure experiments.

# Tradeoffs
- **Probability vs determinism**: Low probability (1%) finds unknown issues but may miss in CI. High probability (100%) is reliable but misses the stochastic element.
- **Bazooka vs Laravel Resilience**: Bazooka discovers unknown failure modes. Resilience validates known fallback behavior. Both are needed.
- **Chaos CI job vs main CI job**: Separate jobs maintain PR speed but require separate CI configuration and monitoring.

# Performance Considerations
- Chaos point check: <0.1ms per registered chaos point. Negligible when not injecting chaos.
- Latency injection: Delays response by configured amount (100ms-5000ms). Significant during experiments.
- Logging overhead: ~1ms per chaos injection. Acceptable for testing.
- No overhead when disabled: `config('bazooka.enabled')` check is fast. Zero overhead.
- Discovery mode: 1-10 seconds depending on codebase size.

# Production Considerations
- Production safety: Bazooka is designed for development/testing only. Multi-layer gating required.
- Never commit production chaos config: CI-generated config should use placeholder values in version control.
- Log sanitization: Chaos logs may include request data. Ensure logs don't contain PII or secrets.
- Dependency scope: Install as `require-dev` only. Production Composer install must exclude Bazooka.

# Common Mistakes
- **Enabling Bazooka in production**: Real users experience real failures; potential data corruption.
- **High probability in CI**: 50-100% probability makes every test fail; no useful signal from CI.
- **Not logging chaos injections**: Hard to distinguish chaos-caused failures from real bugs.
- **Only testing exception disruptions**: Misses latency-related bugs, null pointer issues, and empty response handling.

# Failure Modes
- Stale chaos points: Renamed classes break chaos points silently. No injection occurs.
- Seed collision: Different experiments with the same seed may produce correlated failures.
- Probability cascading: Multiple low-probability chaos points triggered simultaneously in a single request.
- Unlogged failures: Chaos-caused test failures without logging make debugging impossible.

# Ecosystem Usage
- Bazooka is an experimental/nascent tool as of 2026 with limited community adoption.
- The discovery mode is the recommended starting point.
- Bazooka is installed as a Composer `require-dev` dependency.
- CI integration requires setting `BAZOOKA_ENABLED` and `BAZOOKA_SEED` environment variables.

# Related Knowledge Units
- Laravel Resilience deterministic fault injection
- Circuit breaker patterns (laravel-fuse)
- Laravel Resilience discovery and scaffold workflow
- Degraded mode patterns
- Retry and backoff strategies

# Research Notes
- Bazooka is a nascent project with limited community adoption. Agents should prefer Laravel Resilience for deterministic fault injection tests.
- The package name "Bazooka" reflects its shotgun-like approach to discovering unknown failure modes.
- Probability-based chaos engineering originated from Netflix's Chaos Monkey (2011).
- PHP's shared-nothing architecture limits some chaos engineering approaches compared to JVM-based systems.
