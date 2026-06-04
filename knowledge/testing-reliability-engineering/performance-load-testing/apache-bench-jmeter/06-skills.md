# Skill: Run Performance Benchmarks with Apache Bench and JMeter

## Purpose
Use Apache Bench (ab) and Apache JMeter to perform load testing against Laravel applications, measuring throughput, response times, and concurrency handling to identify performance bottlenecks.

## When To Use
- Before a major launch to establish baseline performance metrics
- When optimizing slow endpoints or pages
- When comparing performance before and after infrastructure changes
- When testing concurrency limits and connection pooling
- When establishing performance budgets for CI/CD gating

## When NOT To Use
- For testing database query performance (use Laravel's debug bar or EXPLAIN)
- For unit-level performance assertions (use PHPUnit's `@small` or `@medium` annotations)
- For profiling code-level bottlenecks (use Laravel Debugbar or telescope)
- As a replacement for application monitoring in production

## Prerequisites
- Apache Bench installed (`ab` command) or JMeter installed
- A running instance of the application (local or staging)
- Understanding of HTTP and concurrent connections
- Defined performance budgets (acceptable response times, throughput)

## Inputs
- Target URL(s) to load test
- Number of requests and concurrency level
- HTTP headers, cookies, or authentication tokens
- Expected response time percentiles (p50, p95, p99)
- Performance budget thresholds

## Workflow
1. Identify the endpoint(s) to test — focus on critical paths and known bottlenecks
2. Warm up the application cache: `php artisan optimize` and curl critical pages
3. Run a warm-up batch: `ab -n 100 -c 10 https://staging.example.com/`
4. Run the actual benchmark: `ab -n 1000 -c 50 -H "Accept: application/json" https://staging.example.com/api/users`
5. For JMeter, create a test plan with thread groups, HTTP request defaults, and listeners
6. Analyze results: requests/second, mean latency, p50/p95/p99, error rate
7. Test with different concurrency levels (10, 50, 100 concurrent users)
8. Document baseline metrics and compare after changes
9. For CI integration, use `ab` with pass/fail thresholds

## Validation Checklist
- [ ] Application cache is warmed before benchmarking
- [ ] Benchmark runs with production-like concurrency (not 1 user)
- [ ] Results include p50, p95, p99 latency
- [ ] Error rate is recorded (should be 0% for valid tests)
- [ ] Warm-up requests precede the actual measurement run
- [ ] Tests are repeated 3x and results averaged
- [ ] Performance budgets are defined and enforced
- [ ] Database is in a known state (consistent data volume)

## Common Failures
- Testing against a cold cache — results are not representative
- Single concurrent user — doesn't test connection pooling or contention
- Not recording percentiles — average hides slow tail latencies
- Testing on local machine — network latency and CPU contention distort results
- Not isolating the test environment — other processes affect results
- Insufficient warm-up — PHP opcache not populated

## Decision Points
- Apache Bench vs JMeter — ab for simple HTTP benchmarks, JMeter for complex scenarios (cookies, sessions, assertions)
- Concurrent users level — start with expected production concurrency, stress test at 2-5x
- Staging vs production — staging for repeatable tests, production for real-world baseline (use read-only endpoints)

## Performance Considerations
- `ab` runs from a single machine — may become the bottleneck at high concurrency
- JMeter distributed testing for very high throughput requirements
- Each concurrent user uses one connection — monitor system's open file limits
- Database connection pool size may limit effective concurrency
- PHP-FPM process pool size affects concurrent request handling

## Security Considerations
- Never load test against production without explicit authorization
- Use staging environments with production-like data
- Load testing may trigger rate limiting, WAF, or DDoS protections
- Ensure load test traffic is identifiable (custom User-Agent, source IPs)
- Run during off-peak hours for production testing

## Related Rules
- [Rule: Warm Up Application Cache Before Benchmarking](./05-rules.md)
- [Rule: Record p50/p95/p99 Latencies, Not Just Average](./05-rules.md)
- [Rule: Test with Production-Like Concurrency](./05-rules.md)

## Related Skills
- LoadForge Load Testing
- Volttest Integration
- CI/CD Pipeline Performance Gates

## Success Criteria
- [ ] Baseline performance metrics are established for critical endpoints
- [ ] Performance budgets are defined and enforced in CI
- [ ] Bottlenecks are identified and addressed before launches
- [ ] Load testing results are reproducible and consistent across runs
- [ ] Metrics are tracked over time to catch regressions
