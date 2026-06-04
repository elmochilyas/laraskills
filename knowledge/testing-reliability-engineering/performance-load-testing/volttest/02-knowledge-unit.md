# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Performance & Load Testing
Knowledge Unit: VoltTest Laravel Performance Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
VoltTest is a PHP-native performance and load testing package for Laravel that runs load tests as Artisan commands within the Laravel framework. Unlike external tools (Apache Bench, JMeter), VoltTest executes tests from inside the application, eliminating network overhead and providing direct insight into application performance. It supports configurable concurrency, request repetition, custom request builders, and metric collection (RPS, min/max/avg duration, error count). VoltTest integrates naturally with Pest and PHPUnit, enabling performance assertions within feature tests. It is the recommended tool for developers who want quick performance feedback during development and CI without external infrastructure.

# Core Concepts
- **Artisan command**: `php artisan volt:load-test` runs load tests. Accepts options for url, method, concurrency, and iterations.
- **Concurrent requests**: Simulates multiple users making simultaneous requests. Configurable via `--concurrency` option.
- **Request repetition**: `--iterations` controls total requests per connection. Combined with concurrency: total requests = iterations × concurrency.
- **Metric collection**: Reports min, max, average, median, P95, and P99 response times. Also reports RPS, total duration, and error count.
- **Custom request builders**: PHP classes that define request parameters (headers, body, authentication). Enables complex request scenarios.
- **Performance assertions**: Assert response time, success rate, and RPS thresholds within tests. Enables CI performance gates.

# Mental Models
- **PHP-native as zero-overhead testing**: VoltTest runs inside Laravel, bypassing HTTP server and network. Measures application performance in isolation from infrastructure.
- **VoltTest vs `ab`**: `ab` tests the full stack (Nginx → PHP-FPM → Laravel). VoltTest tests only Laravel (routing → middleware → controller → DB). Both are useful for different purposes.
- **Development-time feedback**: Run VoltTest after each significant change to see if performance changed. Faster than deploying to staging and running `ab`.
- **Quick regression detection**: If a change doubles response time for a critical endpoint, VoltTest catches it in seconds during local development.

# Internal Mechanics
- **Request execution**: VoltTest uses Laravel's HTTP kernel to dispatch requests internally. Same as feature tests: `$this->get('/api/users')`. No network stack involved.
- **Concurrency model**: VoltTest uses PHP processes or threads for concurrency (depending on parallel extension availability). Each concurrent "user" is a separate PHP process.
- **Timer precision**: Uses `hrtime()` (high-resolution monotonic time) for nanosecond-precision timing. Reports in milliseconds.
- **Metric aggregation**: Collects all response times, computes statistics (mean, median, percentiles), counts errors (exceptions, timeouts), and calculates RPS.
- **Report output**: Console table showing endpoint, method, concurrency, iterations, RPS, min/avg/max/P95/P99 duration, and error count.

# Patterns
- **Pattern: Quick endpoint benchmark**
  - Purpose: Measure single endpoint performance
  - Benefits: 10-second test; immediate metrics
  - Tradeoffs: Single endpoint; no concurrent user simulation
  - Implementation: `php artisan volt:load-test --url=/api/users --iterations=100`

- **Pattern: Concurrency ramp test**
  - Purpose: Measure how performance degrades with concurrency
  - Benefits: Identifies concurrency bottlenecks (database connection pool, session locking)
  - Tradeoffs: Multiple runs needed; sequential
  - Implementation: Run at concurrency 1, 5, 10, 25, 50; observe latency curve

- **Pattern: CI performance assertion**
  - Purpose: Fail CI if endpoint is slower than threshold
  - Benefits: Performance regression caught before deployment
  - Tradeoffs: CI environment variability may cause false positives
  - Implementation: Assert in test: `$this->assertResponseTimeBelow(200, fn () => $this->get('/api/users'))`

- **Pattern: Before/after comparison**
  - Purpose: Measure performance impact of a change
  - Benefits: Objective before/after comparison
  - Tradeoffs: Requires running twice; environment must be consistent
  - Implementation: Run VoltTest before change, save metrics. Run after change, compare.

# Architectural Decisions
- **VoltTest vs external tools**: VoltTest for quick developer feedback and CI performance gates. External tools (LoadForge, JMeter) for pre-release full-stack load testing. Use both for comprehensive coverage.
- **Concurrency model**: PHP process-based concurrency for most scenarios. Thread-based if `pthreads` or `parallel` extension is available. Process-based is simpler and more reliable.
- **Assertion thresholds**: Set thresholds generously to account for CI variability. 50% buffer over observed local performance. Tighten over time as CI environment stabilizes.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| No network overhead; pure Laravel performance | Does not test full HTTP stack | Supplement with `ab` for full-stack testing |
| Instant feedback during development | PHP concurrency model limits parallelism | Use process-based concurrency for moderate loads |
| CI integration via performance assertions | CI environment variability | Use generous thresholds; run multiple times |
| Built-in metrics (P95, P99) | Limited to Laravel endpoint testing | Cannot test static assets or CDN performance |

# Performance Considerations
- VoltTest overhead: Minimal (request dispatch + timer). Response times are 0.5-2ms less than HTTP-level testing for same endpoint.
- Concurrency scaling: 1-50 concurrent users on standard hardware. PHP process model limits beyond 50.
- Memory: Each concurrent process consumes ~20-50MB for Laravel boot. 50 concurrent processes = 1-2.5GB RAM.
- Test duration: 10-60 seconds per test configuration. Run multiple configurations for comprehensive results.
- Database connections: Each concurrent process needs a database connection. Ensure `max_connections` is configured accordingly.

# Production Considerations
- **CI integration**: Run VoltTest on the CI test environment (same PHP version, same database engine). Do not run against production.
- **Baseline establishment**: Run VoltTest on a known-good commit to establish baseline. Store baseline metrics in CI artifact or environment file.
- **Performance budget**: Define per-endpoint performance budgets (e.g., /api/users P95 < 200ms). Enforce in CI. Review and adjust quarterly.
- **Environment consistency**: VoltTest results vary significantly with environment. Use the same CI runner type, PHP version, and database configuration.

# Common Mistakes
- **Mistake: Treating VoltTest metrics as absolute**
  - Why: "VoltTest says 50ms; production will be 50ms"
  - Why harmful: Production has network, web server, and real-user overhead. Results are 2-5x higher.
  - Better: Use VoltTest for relative comparison (before/after, baseline vs PR), not absolute performance measurement

- **Mistake: Running with too few iterations**
  - Why: `--iterations=10` with concurrency 1
  - Why harmful: Too few data points for meaningful P95/P99; metrics are noisy
  - Better: Minimum 100 iterations per configuration for stable metrics

- **Mistake: Testing without warm-up**
  - Why: First request includes config loading, route registration, service provider booting
  - Why harmful: Metrics include cold-start overhead; not representative of steady-state performance
  - Better: Run 50 warm-up iterations before collecting metrics

- **Mistake: Ignoring concurrency in assertions**
  - Why: `assertResponseTimeBelow(200)` without specifying concurrency
  - Why harmful: 50ms at concurrency 1; 500ms at concurrency 25. Test passes but performance degrades under load.
  - Better: Assert at multiple concurrency levels; monitor latency curve

# Failure Modes
- **Process creation failure**: High concurrency may exhaust system process limits. Reduce concurrency or increase system `ulimit`.
- **Database connection exhaustion**: 50 concurrent processes × each needing a DB connection may exceed MySQL's default 151 connections. Increase `max_connections`.
- **Memory exhaustion**: PHP process memory accumulates during long test runs. Monitor with `memory_get_usage()`.
- **Interference with other tests**: VoltTest creates real requests that modify database state. Use separate test database for VoltTest runs.
- **False failure due to environment**: CI runner has higher load than expected. Use retry strategy or wider threshold.

# Ecosystem Usage
- **VoltTest package**: `volt-test/laravel-performance-testing` is a community package. Provides Artisan commands, Pest integration, and performance assertions.
- **Laravel core**: Laravel does not include built-in performance testing. VoltTest fills this gap as a community package.
- **Pest integration**: VoltTest can be used within Pest tests via the `assertResponseTimeBelow()` macro. Integrates naturally with existing test suites.
- **Forge + VoltTest**: Developers use VoltTest locally during development on Forge-provisioned environments to get early performance feedback.

# Related Knowledge Units
- **Prerequisites**: Laravel HTTP testing fundamentals, PHP process management
- **Related Topics**: Apache Bench and JMeter, LoadForge, Performance optimization with Laravel
- **Advanced Follow-up**: Performance assertion strategies, Concurrent request patterns, PHP-FPM tuning based on VoltTest results

# Research Notes
- VoltTest is an emerging tool in the Laravel ecosystem; it addresses a specific gap: PHP-native performance testing without external infrastructure
- The key advantage of VoltTest is network elimination — it measures pure Laravel performance without web server, PHP-FPM, or network overhead, making it ideal for development-time regression detection
- VoltTest concurrency is limited by PHP's process model; for high-concurrency testing (>50 simultaneous users), external tools (ab, JMeter, LoadForge) are still necessary
- The combination of VoltTest (development) + LoadForge (pre-release) + production monitoring (Pulse, New Relic) provides a comprehensive performance testing pyramid for Laravel applications
- Community feedback on VoltTest highlights the CI performance assertion feature as the most valuable; teams use it to prevent performance regressions before they reach staging
