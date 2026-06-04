# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Performance & Load Testing |
| Knowledge Unit | LoadForge Cloud Load Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P3 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Load testing fundamentals, HTTP protocol, Python basics (for Locust scripts) |
| Related KUs | Apache Bench and JMeter, VoltTest, Performance regression testing |
| Source | domain-analysis.md K041 |

# Overview

LoadForge is a cloud-based load testing platform that generates HTTP traffic against Laravel applications from distributed global locations. It uses Locust (Python-based) scripts for test definition and provides a web dashboard for real-time metrics (RPS, latency, error rate, concurrent users). LoadForge eliminates the infrastructure burden of self-managed JMeter clusters or distributed `ab` setups. It is particularly useful for teams that need regular load testing without maintaining their own load generator infrastructure.

# Core Concepts

- **LoadForge agent**: Managed infrastructure that generates HTTP traffic from global regions.
- **Locust script**: Python file defining user behavior. `class LaravelUser(HttpUser):` with `@task` decorators.
- **Test run**: Single execution. Configurable: duration, virtual user count, spawn rate, regions.
- **Real-time dashboard**: Web-based metrics during test run (RPS, response time, error rate).
- **Scenario**: Named test configuration with Locust scripts, environment variables, headers.
- **Test results**: Historical record. Compare current run against baseline for regression detection.

# When To Use

- For regular load testing without self-managed infrastructure
- For geographically distributed load testing (global user base)
- For pre-release performance validation
- For teams without dedicated performance engineering roles

# When NOT To Use

- For testing internal/private endpoints (LoadForge agents are external)
- For quick developer feedback during development (use VoltTest)
- When compliance/air-gap requirements prevent external traffic generation
- For very frequent testing on a limited budget (per-test-run costs add up)

# Best Practices (WHY)

- **Use staging, never production**: LoadForge traffic can exhaust production resources. Always test against staging. If production testing is necessary, coordinate with ops for off-peak.
- **Test from multiple regions**: If your users are global, test from 5+ regions. A user in London has different latency than a user in Sydney. Single-region testing misses geographic issues.
- **Include write operations**: POST, PUT, DELETE endpoints have different performance than GET. Weight the test mix by production traffic distribution.
- **Run minimum 5-minute tests**: Short tests (30s) include cold-start effects. 10-15 minutes for stable metrics with warm cache.
- **Use gradual ramp-up**: Start at 10 users, increase by 10 every minute. Find the breaking point where error rate exceeds 1% or latency spikes.

# Architecture Guidelines

- **LoadForge vs JMeter**: LoadForge for teams without infrastructure. Self-managed JMeter for compliance or custom protocol needs.
- **LoadForge vs VoltTest**: LoadForge for external HTTP testing from global regions. VoltTest for PHP-native internal testing. Use both.
- **Locust scripts**: Version control alongside application. Treat as production code.

# Performance Considerations

- Agent capacity: 1000-5000 virtual users per agent depending on test complexity.
- Latency overhead: Includes agent-to-server network latency. Subtract geographic latency for server-only performance.
- Test duration: Minimum 2 minutes (warm-up + measurement). Recommended 10-15 minutes.
- Ramp-up period: 30-60 seconds minimum. Prevents cold-start skew.

# Security Considerations

- Never load test production without explicit warning and coordination.
- Use test database for write operations. LoadForge traffic creates real data.
- Rate limiting may throttle LoadForge traffic. Whitelist LoadForge IPs or increase limits.
- Ensure Locust scripts don't contain real credentials or API keys.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Testing production without warning | "Production traffic is most realistic" | May exhaust production resources | Use staging or coordinate with ops |
| Single-region testing for global apps | "Server in US East; test from US East" | Geographic performance differences missed | Test from multiple regions representing user distribution |
| Testing only GET requests | "Read endpoints are most common" | Write endpoint performance untested | Include write operations; weight by production mix |
| Short test duration | "30 seconds is enough" | Cold cache skews results | Minimum 5 minutes; 10-15 recommended |
| Ignoring Locust script errors | Uploading without local validation | Test run fails at start | Validate locally: `locust -f script.py` |

# Anti-Patterns

- **Production load testing**: Could exhaust resources and affect real users. Always test on staging.
- **No write operations**: Only testing GET endpoints. Write operations have different performance.
- **Single-region**: Testing from one region for a globally distributed user base.
- **No warm-up**: Including cold-cache requests in metrics. Skews results.
- **Unversioned scripts**: Locust scripts not in version control. Hard to reproduce.

# Examples

```python
# Laravel Locust test script
from locust import HttpUser, task, between

class LaravelUser(HttpUser):
    wait_time = between(1, 5)

    def on_start(self):
        self.login()

    def login(self):
        response = self.client.post("/login", {
            "email": "test@example.com",
            "password": "password"
        })

    @task(3)
    def view_products(self):
        self.client.get("/api/products")

    @task(1)
    def create_order(self):
        self.client.post("/api/orders", {
            "product_id": 1,
            "quantity": 1
        })
```

```bash
# Validate Locust script locally
locust -f laravel_test.py --host=https://staging.example.com

# Run LoadForge test from CLI (if API available)
loadforge run --scenario=laravel-checkout --duration=600 --users=100
```

# Related Topics

- **Prerequisites**: Load testing fundamentals, HTTP protocol, Python basics
- **Related**: Apache Bench and JMeter, VoltTest, Performance regression testing
- **Advanced**: Locust script advanced patterns, Load testing in CI/CD pipeline, Global performance optimization with CDN

# AI Agent Notes

- LoadForge uses Locust under the hood. Any Locust-compatible script works on LoadForge, providing portability.
- The combination of VoltTest (development) + LoadForge (pre-release) + production monitoring provides a comprehensive performance testing strategy.
- Locust's Python-based approach has a learning curve for PHP/Laravel developers. Budget 1-2 days for script development.

# Verification

- [ ] Load tests run against staging, not production
- [ ] Tests include both read and write operations
- [ ] Multiple geographic regions are tested where applicable
- [ ] Test duration is at least 5 minutes (10-15 recommended)
- [ ] Gradual ramp-up is configured
- [ ] Locust scripts are version-controlled alongside the application
- [ ] Baseline comparison is established and reviewed
- [ ] LoadForge IPs are whitelisted (rate limiting bypassed)
- [ ] Test data cleanup strategy is defined
- [ ] Authentication handling (login in on_start) works correctly
