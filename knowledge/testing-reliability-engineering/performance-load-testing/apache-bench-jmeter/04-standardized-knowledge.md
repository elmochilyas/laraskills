# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Performance & Load Testing |
| Knowledge Unit | Apache Bench and JMeter |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP protocol understanding, Web server configuration (Nginx/Apache), PHP-FPM configuration |
| Related KUs | Load testing with VoltTest, LoadForge cloud load testing, PHP-FPM performance tuning |
| Source | domain-analysis.md K040 |

# Overview

Apache Bench (`ab`) and Apache JMeter are external load testing tools used to benchmark Laravel applications under simulated production traffic. `ab` is a lightweight command-line tool for simple HTTP load testing (requests per second, latency percentiles, concurrency). JMeter is a full-featured GUI-based load testing platform supporting complex scenarios, assertions, distributed testing, and comprehensive reporting. Both tools test the application through the full HTTP stack (web server, PHP-FPM, database) under realistic concurrency.

# Core Concepts

- **Requests per second (RPS)**: Number of HTTP requests the application can handle per second.
- **Concurrency level**: Number of simultaneous connections. `ab -c 10` = 10 concurrent connections.
- **Percentile latency**: P50 (median), P95, P99 latency. P99 under load is critical for user experience.
- **JMeter test plan**: XML configuration defining thread groups, samplers, listeners, and assertions.
- **Thread group**: JMeter's virtual user group. Configurable count, ramp-up period, and loop count.
- **Distributed testing**: Multiple JMeter agents generating load from different machines.

# When To Use

- For quick endpoint benchmarks (`ab` for 10-second performance checks)
- For comprehensive pre-release load testing (JMeter for complex user flows)
- For CI performance regression gates
- For capacity planning (finding max RPS before degradation)

# When NOT To Use

- For quick developer feedback during development (use VoltTest for instant results)
- For testing static assets or CDN performance
- When the application isn't deployed to a staging environment (local benchmarks are misleading)
- For unit-level performance assertions (use VoltTest or micro-benchmarks)

# Best Practices (WHY)

- **Load test on staging, not local**: Local machine performance is not production-equivalent. Use staging with production-equivalent hardware, software, and data size. Results from local testing are misleading.
- **Always warm up before measuring**: Run 100+ warm-up requests before collecting metrics. Cold cache shows slower performance. Warm cache is production-realistic.
- **Test multiple endpoint types**: Success paths, validation errors, auth failures, and not-found responses all have different performance. Error pages may be much slower than happy paths.
- **Use `-k` (keep-alive) for realistic benchmarks**: Connection reuse is standard in modern browsers. Without keep-alive, results are 2-5x slower and not representative.
- **Run JMeter in non-GUI mode for actual tests**: `jmeter -n -t plan.jmx -l results.jtl -e -o /report`. The GUI consumes resources and skews results.

# Architecture Guidelines

- **`ab` vs JMeter**: `ab` for quick benchmarks and CI regression gates. JMeter for comprehensive load testing with complex scenarios.
- **External vs internal testing**: `ab`/JMeter test through HTTP (external). More realistic for pre-release validation than PHP-native tools.
- **Local vs staging**: Load test on staging with production-equivalent hardware. Local benchmarks are not meaningful.

# Performance Considerations

- `ab` single machine: up to 5000-10000 RPS for simple endpoints.
- JMeter single machine: up to 2000-5000 RPS (Java overhead).
- PHP-FPM bottleneck: Laravel typically 50-200 RPS per worker. `pm.max_children` is critical.
- Database connections: MySQL default 151 connections. May bottleneck under high concurrency.

# Security Considerations

- Never load test production without warning. Could exhaust resources and affect real users.
- Disable rate limiting for test endpoints or whitelist load generator IPs.
- Monitor for self-DDOS — verify target is test/staging, not production.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Load testing on local machine | Convenient; no deployment needed | Results meaningless | Load test on staging with production-equivalent hardware |
| Testing only the happy path | "Test the most common endpoint" | Error/edge case performance untested | Test multiple endpoint types |
| Not warming the application first | First request is always cold | Metrics include cache building; slower than reality | Run 100+ warm-up requests first |
| Ignoring JMeter non-GUI mode | Running from GUI | GUI consumes resources; results unreliable | Develop in GUI; execute via CLI |
| Testing with insufficient concurrency | concurrency=1 | Single-user performance ≠ multi-user | Test at multiple concurrency levels |

# Anti-Patterns

- **Production load testing without warning**: Could exhaust production resources. Always coordinate with ops.
- **Single-endpoint only**: Only testing the homepage or health check. Not representative of real traffic.
- **No warm-up**: Including cold-cache requests in metrics. Skews results.
- **Ignoring P99 latency**: Only looking at average response time. P99 latency determines real user experience under load.

# Examples

```bash
# Quick baseline with ab
ab -n 1000 -c 10 -k https://staging.example.com/api/users

# ab with specific headers
ab -n 1000 -c 10 -H "Accept: application/json" https://staging.example.com/api/users

# JMeter non-GUI execution
jmeter -n -t load-test-plan.jmx -l results.jtl -e -o /reports/load-test

# CI performance regression gate (bash)
BASELINE_RPS=500
CURRENT_RPS=$(ab -n 1000 -c 10 https://staging.example.com/api/users | grep "Requests per second" | awk '{print $4}')
if (( $(echo "$CURRENT_RPS < $BASELINE_RPS * 0.8" | bc -l) )); then
  echo "Performance regression detected: $CURRENT_RPS RPS vs baseline $BASELINE_RPS RPS"
  exit 1
fi
```

# Related Topics

- **Prerequisites**: HTTP protocol, Web server configuration (Nginx/Apache), PHP-FPM configuration
- **Related**: VoltTest, LoadForge, PHP-FPM performance tuning
- **Advanced**: Distributed load testing infrastructure, Performance regression automation, Production capacity planning

# AI Agent Notes

- PHP-FPM is typically the bottleneck. Watch `pm.max_children` and `pm.max_requests`. `ab` quickly reveals suboptimal PHP-FPM configuration.
- Nginx + PHP-FPM + Laravel + MySQL on standard hardware (4 CPU, 16GB RAM) typically handles 200-500 RPS for API endpoints.
- Always run warm-up requests before measuring. Cold cache performance is not representative.

# Verification

- [ ] Load tests run on staging with production-equivalent hardware and data
- [ ] Warm-up requests (100+) are sent before collecting metrics
- [ ] Multiple endpoint types are tested (success, error, auth, not-found)
- [ ] Keep-alive is enabled (`-k` for `ab`)
- [ ] JMeter runs in non-GUI mode for actual tests
- [ ] P50, P95, and P99 latency are measured
- [ ] Multiple concurrency levels are tested (not just single-user)
- [ ] PHP-FPM configuration is verified and tuned based on results
- [ ] Rate limiting is disabled for test endpoints
- [ ] Load tests are never run against production without warning
