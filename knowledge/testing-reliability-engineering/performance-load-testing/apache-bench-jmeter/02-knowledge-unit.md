# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Performance & Load Testing
Knowledge Unit: Apache Bench and JMeter
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Apache Bench (`ab`) and Apache JMeter are external load testing tools used to benchmark Laravel applications under simulated production traffic. `ab` is a lightweight command-line tool for simple HTTP load testing (requests per second, latency percentiles, concurrency). JMeter is a full-featured GUI-based load testing platform supporting complex scenarios, assertions, distributed testing, and comprehensive reporting. Both tools complement PHP-native solutions like VoltTest by testing the application through the full HTTP stack (web server, PHP-FPM, database) under realistic concurrency. They are used primarily for capacity planning, bottleneck detection, and performance regression testing before major releases.

# Core Concepts
- **Requests per second (RPS)**: Number of HTTP requests the application can handle per second. Primary throughput metric.
- **Concurrency level**: Number of simultaneous connections. `ab -c 10` = 10 concurrent connections. Simulates multiple users accessing the app simultaneously.
- **Percentile latency**: P50 (median), P95, P99 latency. P99 under load is critical for user experience. `ab` reports these in the "Percentage of requests served within a certain time" section.
- **JMeter test plan**: XML configuration defining thread groups (virtual users), samplers (HTTP requests), listeners (reporters), and assertions.
- **Thread group**: JMeter's virtual user group. Configurable count, ramp-up period, and loop count.
- **Assertion**: JMeter plugin that validates responses. Response code assertion (expect 200), response body assertion (contains "Welcome"), duration assertion (response under 2s).
- **Distributed testing**: Multiple JMeter agents generating load from different machines. Necessary for high-load testing (>1000 RPS from a single machine is unreliable).

# Mental Models
- **`ab` as quick pulse check**: `ab` is for quick "is this endpoint fast?" checks. Run it before and after a change to see if performance regressed. Not for complex scenarios.
- **JMeter as full rehearsal**: JMeter simulates real user behavior: login → browse → search → add to cart → checkout. Multiple page types, think times, and assertions.
- **Load testing vs benchmarking**: Benchmarking measures raw server capacity (max RPS). Load testing measures behavior under expected traffic patterns (sustained load, ramp-up, spike).
- **Tool independence from framework**: `ab` and JMeter test the application through HTTP. They don't know about Laravel. They test the entire stack: Nginx → PHP-FPM → Laravel → MySQL → Redis.

# Internal Mechanics
- **`ab` command structure**: `ab -n 1000 -c 10 -k https://example.com/api/users`. `-n` = total requests, `-c` = concurrency, `-k` = keep-alive (reuse connections).
- **`ab` output**: Includes Document Path, Document Length, Concurrency Level, Time taken for tests, Complete requests, Failed requests, Requests per second, Time per request, Transfer rate, Connection Times, Percentage served.
- **JMeter test plan structure**: Test Plan → Thread Group → Config Elements (HTTP Request Defaults) → Samplers (HTTP Request) → Listeners (Summary Report, Aggregate Report, Graph Results) → Assertions (Response Assertion).
- **JMeter non-GUI mode**: `jmeter -n -t test-plan.jmx -l results.jtl -e -o /report`. Headless execution for CI. Results stored as JTL (JSON-like) and HTML report generated.
- **PHP-FPM process management**: Under load, PHP-FPM's `pm.max_children` limits concurrent PHP processes. Exceeding this causes queuing (502/504 errors). `ab` tests reveal this bottleneck.

# Patterns
- **Pattern: Quick baseline with `ab`**
  - Purpose: Establish performance baseline for a single endpoint
  - Benefits: 10-second test; immediate RPS/latency numbers
  - Tradeoffs: Single endpoint; no session/cookie handling
  - Implementation: `ab -n 1000 -c 10 https://example.com/api/users`

- **Pattern: JMeter comprehensive load test**
  - Purpose: Simulate realistic multi-page user behavior
  - Benefits: End-to-end flow performance; catches session-state issues
  - Tradeoffs: Complex test plan creation (GUI tool); 30-60 minutes per test
  - Implementation: Create JMeter test plan with thread groups, HTTP samplers, assertions, and aggregate report listener

- **Pattern: CI performance regression gate**
  - Purpose: Detect performance degradation before deployment
  - Benefits: Prevents slow endpoints from reaching production
  - Tradeoffs: CI environment performance varies; baseline drift
  - Implementation: Run `ab` on staging environment after deploy; compare RPS against baseline; alert if >20% degradation

- **Pattern: Distributed load test for high-traffic endpoints**
  - Purpose: Generate load beyond single-machine capacity
  - Benefits: Realistic high-concurrency testing
  - Tradeoffs: Infrastructure setup; network coordination
  - Implementation: Deploy JMeter agents to 3-5 machines; configure master-slave mode

# Architectural Decisions
- **`ab` vs JMeter**: Use `ab` for quick benchmarks and CI regression gates (simple, scriptable). Use JMeter for comprehensive load testing (complex scenarios, assertions, distributed testing).
- **Internal vs external load testing**: `ab` and JMeter test through HTTP (external). This is more realistic than VoltTest (PHP-native internal). Use external tools for final pre-release validation.
- **Local vs staging load testing**: Load test on staging with production-equivalent hardware. Local machine performance is not representative. Use staging for meaningful benchmarks.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `ab` is instant and simple | Single endpoint; no session support | Use for quick checks; JMeter for full scenarios |
| JMeter simulates real user behavior | Complex GUI tool; steep learning curve | Invest time for critical pre-release testing |
| External HTTP testing catches full-stack issues | Requires running application instance | Test on staging, not local |
| Distributed testing scales to high loads | Infrastructure and coordination overhead | Use only for high-traffic applications |

# Performance Considerations
- `ab` single machine: up to 5000-10000 RPS for simple endpoints (limited by network stack and CPU).
- JMeter single machine: up to 2000-5000 RPS (Java overhead; more realistic scenarios).
- PHP-FPM bottleneck: Laravel typically handles 50-200 RPS per PHP-FPM worker. For 1000 RPS at 200ms/request: need 200 concurrent workers. `pm.max_children` must be configured accordingly.
- Database connection pool: MySQL default 151 connections. Under load, connection pooling (pdo_mysql) may become bottleneck.
- Keep-alive (`-k`): Enables connection reuse. 2-5x RPS improvement over non-keep-alive.

# Production Considerations
- **Staging environment parity**: Load test on staging with same hardware, software versions, and data size as production. Otherwise, results are misleading.
- **Warm-up period**: Run warm-up requests (100-500) before measuring. Cold cache shows slower performance. Warm cache is production-realistic.
- **Test data freshness**: Use stale but representative test data. Freshly created test records (sequential IDs, same timestamps) produce different performance characteristics than production data.
- **Database backup before load testing**: Load tests may corrupt test data. Always restore from production snapshot before testing.
- **Monitoring during load test**: Watch server metrics (CPU, memory, disk I/O, network, PHP-FPM status, MySQL slow queries) during load test. The bottleneck often isn't where you expect.

# Common Mistakes
- **Mistake: Load testing on local machine**
  - Why: Convenient; no deployment needed
  - Why harmful: Local machine is not production-equivalent; results are meaningless
  - Better: Load test on staging with production-equivalent hardware and data

- **Mistake: Testing only the happy path**
  - Why: "Test the most common endpoint"
  - Why harmful: Error pages, validation responses, and edge cases may be much slower
  - Better: Test multiple endpoint types: success, validation error, auth failure, not-found

- **Mistake: Not warming the application first**
  - Why: First request is always cold
  - Why harmful: Results include cache building; performance looks worse than reality
  - Better: Run 100+ warm-up requests before collecting metrics

- **Mistake: Ignoring JMeter's `-n` (non-GUI) mode**
  - Why: Running tests from JMeter GUI
  - Why harmful: GUI consumes resources; results are less reliable
  - Better: Develop test plans in GUI; execute them with `jmeter -n -t plan.jmx` in CLI

# Failure Modes
- **`ab` failing to connect**: Web server not running or wrong URL. Verify `curl` works first.
- **JMeter out of memory**: Large test plans consume Java heap. Increase `JVM_ARGS="-Xmx2g"`.
- **Self-DDOS**: Load test from CI runner against production. Always verify target environment is test/staging, not production.
- **Rate limiting interference**: Laravel's rate limiter may throttle load test requests. Disable rate limiting for test endpoints or use IP whitelist.
- **Database connection exhaustion**: High concurrency load tests exhaust database connection pool. Configure `max_connections` accordingly or instrument pool monitoring.

# Ecosystem Usage
- **Laravel core**: Laravel's performance testing recommendations include `ab` for quick benchmarks and JMeter for comprehensive load testing.
- **Laravel Forge**: Forge provides server monitoring (CPU, memory, disk) that teams use alongside `ab` during performance testing on Forge-provisioned servers.
- **Blackfire.io**: Blackfire is a PHP-specific profiling tool that complements `ab`/JMeter by identifying code-level bottlenecks under load.
- **LoadForge**: LoadForge provides managed load testing as a service (Locust-based), which is an alternative to self-managed JMeter infrastructure.

# Related Knowledge Units
- **Prerequisites**: HTTP protocol understanding, Web server configuration (Nginx/Apache), PHP-FPM configuration
- **Related Topics**: Load testing with VoltTest, LoadForge cloud load testing, PHP-FPM performance tuning
- **Advanced Follow-up**: Distributed load testing infrastructure, Performance regression automation, Production capacity planning

# Research Notes
- Apache Bench is part of the Apache HTTP Server project (`httpd-tools` package); it has not been significantly updated in years but remains the standard for quick HTTP benchmarks due to its simplicity and ubiquity
- JMeter is a Java application; its resource consumption means a single JMeter instance is typically limited to 1000-2000 virtual users; for higher loads, distributed testing with multiple JMeter agents is required
- PHP-FPM is typically the bottleneck in Laravel load testing: `pm.max_children` and `pm.max_requests` are the critical configuration parameters; `ab` quickly reveals suboptimal PHP-FPM configuration
- Nginx + PHP-FPM + Laravel + MySQL on standard hardware (4 CPU, 16GB RAM) typically handles 200-500 RPS for API endpoints and 50-100 RPS for full-page rendering (with Blade views)
- LoadForge and similar managed services are increasingly replacing self-managed JMeter infrastructure for teams that need regular load testing without maintaining JMeter agent clusters
