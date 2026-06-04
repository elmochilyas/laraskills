# Skill: Integrate Volttest for Lightweight Load Testing

## Purpose
Use Volttest to define and run lightweight, code-first load tests within the Laravel testing framework, asserting on response times and throughput directly in test assertions.

## When To Use
- When you want load testing as part of the regular test suite
- When asserting that specific endpoints stay within response time budgets
- When testing API rate limiting and throttling behavior under load
- When integrating performance assertions directly into CI pipelines
- When you need simple, repeatable load tests without external infrastructure

## When NOT To Use
- For large-scale distributed load testing (use LoadForge or cloud tools)
- For testing infrastructure scalability (auto-scaling, load balancers)
- When you need geographically distributed test traffic
- When the application is not deployed and accessible via HTTP

## Prerequisites
- Volttest installed (`composer require --dev volttest/volttest`)
- Application running locally or in a test environment
- Defined response time budgets for each endpoint
- Understanding of concurrent request simulation

## Inputs
- HTTP endpoints to test
- Expected response time thresholds (e.g., <200ms p95)
- Number of concurrent requests and total requests
- Authentication tokens or session data
- Request payloads for POST endpoints

## Workflow
1. Install Volttest: `composer require --dev volttest/volttest`
2. Create a load test file in `tests/Load/` or alongside feature tests
3. Configure the test scenario: endpoint, method, headers, body
4. Set concurrency level and request count
5. Define response time budgets: `$this->assertResponseTimeBelow(200, 'ms')`
6. Execute the load test and collect metrics
7. Assert that p50, p95, and p99 stay within budget
8. Assert that error rate is 0%
9. Run as part of CI to catch performance regressions
10. Track metrics over time for performance trend monitoring

## Validation Checklist
- [ ] Volttest is installed and configured
- [ ] Response time budgets are defined for each endpoint
- [ ] Concurrency levels match expected production traffic
- [ ] Error rate assertions are included (should be 0%)
- [ ] Tests run in CI as non-blocking advisory or blocking gate
- [ ] Performance budgets are reviewed quarterly
- [ ] Metrics are logged for trend analysis
- [ ] Authentication and session handling is configured

## Common Failures
- Setting budgets too tight — flaky failures in CI under variable load
- Setting budgets too loose — performance regressions go undetected
- Testing in isolation without cache warm-up — cold responses exceed budgets
- Not accounting for background jobs or queue processing — request times vary
- Running load tests alongside database tests on the same environment — resource contention

## Decision Points
- Volttest vs LoadForge — Volttest for lightweight CI-integrated tests, LoadForge for large-scale distributed testing
- Blocking vs advisory — blocking for critical endpoints, advisory for non-critical
- Request count vs duration — count-based for consistency, duration-based for soak testing

## Performance Considerations
- Volttest runs on the test machine — results are affected by machine performance
- Concurrent requests are simulated within PHP — limited by available process/thread capacity
- Keep tests short (10-50 requests per endpoint) for fast CI feedback
- Use dedicated CI runners for load tests to avoid interference from other jobs

## Security Considerations
- Load tests may stress the application — coordinate with operations team
- Ensure Volttest tests don't accidentally trigger billing or payment endpoints
- Use test-specific API keys and tokens, not production credentials
- Monitor for rate limiting activation during load tests

## Related Rules
- [Rule: Define Response Time Budgets](./05-rules.md)
- [Rule: Assert 0% Error Rate](./05-rules.md)
- [Rule: Track Performance Metrics Over Time](./05-rules.md)

## Related Skills
- Apache Bench and JMeter
- LoadForge Cloud Testing
- CI/CD Performance Gates

## Success Criteria
- [ ] Volttest is integrated and running in CI
- [ ] Critical endpoints have response time budgets with assertions
- [ ] Performance regressions are caught in CI before deployment
- [ ] Metrics are tracked over time for trend analysis
- [ ] Budgets are reviewed and adjusted as the application evolves
