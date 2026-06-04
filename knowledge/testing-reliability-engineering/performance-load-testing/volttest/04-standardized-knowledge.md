# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Performance & Load Testing |
| Knowledge Unit | VoltTest Laravel Performance Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel HTTP testing fundamentals, PHP process management |
| Related KUs | Apache Bench and JMeter, LoadForge, Performance optimization with Laravel |
| Source | domain-analysis.md K039 |

# Overview

VoltTest is a PHP-native performance and load testing package for Laravel that runs load tests as Artisan commands within the Laravel framework. Unlike external tools (Apache Bench, JMeter), VoltTest executes tests from inside the application, eliminating network overhead and providing direct insight into application performance. It supports configurable concurrency, request repetition, custom request builders, and metric collection (RPS, min/max/avg duration, error count). VoltTest integrates naturally with Pest and PHPUnit, enabling performance assertions within feature tests.

# Core Concepts

- **Artisan command**: `php artisan volt:load-test` runs load tests. Options for url, method, concurrency, iterations.
- **Concurrent requests**: Simulates multiple users making simultaneous requests. Configurable via `--concurrency`.
- **Request repetition**: `--iterations` controls total requests per connection.
- **Metric collection**: Reports min, max, average, median, P95, P99 response times, RPS, error count.
- **Custom request builders**: PHP classes defining request parameters (headers, body, authentication).
- **Performance assertions**: Assert response time, success rate, RPS thresholds within tests.

# When To Use

- For quick developer feedback during development (instant performance checks)
- For CI performance gates (assert response time below threshold)
- For before/after comparison of performance-impacting changes
- For concurrency ramp testing (identify bottlenecks under load)

# When NOT To Use

- For final pre-release validation (use external tools for full-stack testing)
- For testing static assets or CDN performance
- When full HTTP stack testing is needed (web server, PHP-FPM, network)
- For very high concurrency testing (>50 concurrent users)

# Best Practices (WHY)

- **Use VoltTest for relative comparison, not absolute measurement**: VoltTest bypasses the HTTP server and network. Production response times are 2-5x higher. Use VoltTest for before/after comparison, not for predicting production performance.
- **Run minimum 100 iterations per configuration**: Too few data points make P95/P99 metrics noisy and unreliable. 100+ iterations for stable metrics.
- **Always warm up before collecting**: Run 50 warm-up iterations. First requests include config loading, route registration, service provider booting. Not representative of steady state.
- **Test at multiple concurrency levels**: An endpoint may be fast at concurrency 1 but degrade significantly at concurrency 25. Monitor the latency curve across concurrency levels.
- **Set generous thresholds for CI assertions**: CI environment variability causes false positives. Start with 50% buffer over observed local performance, tighten over time.

# Architecture Guidelines

- **VoltTest vs external tools**: VoltTest for quick developer feedback and CI gates. External tools for pre-release full-stack testing. Use both.
- **Concurrency model**: PHP process-based concurrency. Thread-based if `pthreads` or `parallel` extension is available.
- **Assertion thresholds**: 50% buffer over observed local performance. Tighten as CI environment stabilizes.

# Performance Considerations

- VoltTest overhead: Minimal. Response times are 0.5-2ms less than HTTP-level testing.
- Concurrency scaling: 1-50 concurrent users on standard hardware.
- Memory: Each concurrent process consumes ~20-50MB for Laravel boot.
- Test duration: 10-60 seconds per configuration.
- Database connections: Each process needs a connection. Ensure `max_connections` is sufficient.

# Security Considerations

- Run VoltTest on CI test environment, not production.
- Use separate test database — VoltTest creates real database state.
- Rate limiting may interfere with VoltTest tests. Disable for test endpoints.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Treating VoltTest metrics as absolute | "VoltTest says 50ms; production will be 50ms" | Production has network overhead; results 2-5x higher | Use VoltTest for relative comparison, not absolute |
| Running with too few iterations | `--iterations=10` | Metrics noisy; P95/P99 unreliable | Minimum 100 iterations per configuration |
| Testing without warm-up | First request is cold | Metrics include cold-start overhead | Run 50 warm-up iterations first |
| Ignoring concurrency in assertions | Assert at concurrency 1 only | Performance may degrade at higher concurrency | Assert at multiple concurrency levels |
| Setting tight CI thresholds | Same as local thresholds | CI variability causes false positives | 50% buffer; tighten over time |

# Anti-Patterns

- **Absolute performance assertions**: Expecting VoltTest metrics to match production. Use relative comparison.
- **No concurrency testing**: Only testing single-user performance. Concurrency bottlenecks missed.
- **No warm-up**: Including cold-cache requests in metrics. Skews results.
- **Insufficient iterations**: 10 requests do not produce meaningful P95/P99. Use 100+.

# Examples

```bash
# Quick endpoint benchmark
php artisan volt:load-test --url=/api/users --iterations=100

# Concurrency ramp test
php artisan volt:load-test --url=/api/users --concurrency=10 --iterations=100
php artisan volt:load-test --url=/api/users --concurrency=25 --iterations=100
php artisan volt:load-test --url=/api/users --concurrency=50 --iterations=100

# Custom request builder
php artisan volt:load-test --request=App\\LoadTests\\CreateOrderRequest --concurrency=5 --iterations=50
```

```php
// Performance assertion in Pest test
test('api users endpoint responds quickly')
    ->assertResponseTimeBelow(200, function () {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/users');
    });

// Before/after comparison
public function test_query_optimization_improved_performance()
{
    $before = $this->measureResponseTime(fn () =>
        $this->getJson('/api/reports/slow')
    );

    // Apply optimization...
    Cache::forget('report_cache');

    $after = $this->measureResponseTime(fn () =>
        $this->getJson('/api/reports/slow')
    );

    $this->assertLessThan($before, $after);
}
```

# Related Topics

- **Prerequisites**: Laravel HTTP testing fundamentals, PHP process management
- **Related**: Apache Bench and JMeter, LoadForge, Performance optimization with Laravel
- **Advanced**: Performance assertion strategies, Concurrent request patterns, PHP-FPM tuning based on VoltTest results

# AI Agent Notes

- The combination of VoltTest (development) + LoadForge/JMeter (pre-release) + production monitoring provides a comprehensive performance testing pyramid.
- VoltTest is for relative comparison only. A 20% improvement in VoltTest likely means a 20% improvement in production, but the absolute numbers will differ significantly.
- For CI performance gates, use generous thresholds with a 50% buffer. Tighten over time as the CI environment stabilizes.

# Verification

- [ ] VoltTest metrics are used for relative comparison, not absolute prediction
- [ ] Minimum 100 iterations per configuration
- [ ] Warm-up iterations (50+) are run before collecting metrics
- [ ] Multiple concurrency levels are tested (1, 10, 25, 50)
- [ ] CI performance thresholds have a buffer (50% over local)
- [ ] Before/after comparison is used for optimization validation
- [ ] Custom request builders handle authentication where needed
- [ ] Test database is used (separate from development/production)
- [ ] Rate limiting is disabled for test endpoints
- [ ] Performance budgets are defined per endpoint and reviewed quarterly
