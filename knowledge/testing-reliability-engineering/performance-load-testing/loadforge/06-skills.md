# Skill: Run Cloud-Based Load Tests with LoadForge

## Purpose
Use LoadForge's cloud infrastructure to run distributed load tests against Laravel applications from multiple geographic regions, simulating realistic user traffic patterns with configurable request flows.

## When To Use
- When you need geographically distributed load testing
- When simulating realistic user journeys (login → browse → checkout)
- When testing infrastructure scalability (auto-scaling groups, load balancers)
- When coordinating load tests with CI/CD pipelines
- When Apache Bench or JMeter are insufficient for the scale required

## When NOT To Use
- For quick ad-hoc benchmarks (use Apache Bench locally)
- For testing non-HTTP services (use protocol-specific tools)
- When the application is not deployed to a testable environment
- When the test scenarios are simple single-endpoint tests

## Prerequisites
- LoadForge account and API key
- Staging or production-like environment accessible from the internet
- Defined test scenarios (URLs, headers, assertions)
- Understanding of RPS (requests per second) and concurrent user modeling

## Inputs
- LoadForge test plan configuration (URLs, headers, request bodies)
- Target users, duration, and ramp-up time
- Geographic regions for distributed testing
- Assertion rules for response validation
- CI integration configuration

## Workflow
1. Design the test scenario: user flow with multiple steps (login, browse, checkout)
2. Create a LoadForge test plan with step URLs, headers, and expected responses
3. Configure the load profile: target concurrent users, ramp-up time, test duration
4. Select geographic regions for distributed testing
5. Run the load test from LoadForge's cloud
6. Monitor real-time metrics: RPS, latency percentiles, error rate, bandwidth
7. Analyze the report: timeline view, geographic distribution, error breakdown
8. Compare results against baseline or previous runs
9. Configure CI integration for automated performance regression detection

## Validation Checklist
- [ ] Test plan covers critical user flows (login, search, checkout)
- [ ] Load profile matches expected traffic patterns (not just flat load)
- [ ] Geographic regions represent user distribution
- [ ] Response assertions validate correctness, not just HTTP status
- [ ] Baseline metrics are established
- [ ] CI integration is configured for regression detection
- [ ] Reports are shared with the team
- [ ] Performance budgets are enforced

## Common Failures
- Testing with unrealistic traffic patterns — flat load doesn't simulate real user behavior
- Not including think time — users don't request pages back-to-back
- Ignoring ramp-up time — sudden full load may trigger auto-scaling incorrectly
- Not asserting response correctness — high throughput with errors is a false positive
- Testing only the happy path — realistic traffic includes error scenarios
- Not coordinating with infrastructure team — auto-scaling may not be configured for the test

## Decision Points
- LoadForge vs local tools — LoadForge for distributed/realistic testing, local tools for quick benchmarks
- Scenario-based vs URL-based — scenario for realistic flows, URL-only for simple throughput testing
- Geographic distribution — single region for baseline, multi-region for global application testing

## Performance Considerations
- LoadForge agents run in cloud data centers — results include network latency from cloud to app
- Each concurrent virtual user requires resources — balance user count with agent count
- Ramp-up period affects auto-scaling behavior — use gradual ramp-up for auto-scaling tests
- Test duration: 5-10 minutes minimum for stable metrics, 30+ minutes for soak tests

## Security Considerations
- LoadForge agents connect from external IPs — ensure firewall allows test traffic
- Never send real user credentials in load test data
- Use a separate test environment or production read replicas
- LoadForge API keys should be stored as CI secrets, not in code
- Coordinate with the security team — load tests may trigger security alerts

## Related Rules
- [Rule: Use Realistic Traffic Patterns](./05-rules.md)
- [Rule: Include Think Time and Ramp-Up](./05-rules.md)
- [Rule: Assert Response Correctness, Not Just HTTP Status](./05-rules.md)

## Related Skills
- Apache Bench and JMeter
- CI/CD Performance Gates
- Scalability Testing

## Success Criteria
- [ ] LoadForge test plan covers all critical user flows
- [ ] Load tests are run from multiple geographic regions
- [ ] Performance metrics (RPS, p50/p95/p99) are tracked over time
- [ ] CI integration catches performance regressions automatically
- [ ] Reports are reviewed and acted upon by the team
