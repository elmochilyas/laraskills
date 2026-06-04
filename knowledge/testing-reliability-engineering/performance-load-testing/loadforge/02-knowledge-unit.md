# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Performance & Load Testing
Knowledge Unit: LoadForge Cloud Load Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
LoadForge is a cloud-based load testing platform that generates HTTP traffic against Laravel applications from distributed global locations. It uses Locust (Python-based) scripts for test definition and provides a web dashboard for real-time metrics (RPS, latency, error rate, concurrent users). LoadForge eliminates the infrastructure burden of self-managed JMeter clusters or distributed `ab` setups. It is particularly useful for teams that need regular load testing without maintaining their own load generator infrastructure. LoadForge tests run from 10+ global regions, providing realistic latency and throughput measurements for geographically distributed user bases.

# Core Concepts
- **LoadForge agent**: Managed infrastructure that generates HTTP traffic. Distributed across global regions. No self-management needed.
- **Locust script**: Python file defining user behavior. `class LaravelUser(HttpUser):` with `@task` decorators for different user actions.
- **Test run**: Single execution of a load test. Configurable: duration, virtual user count, spawn rate (users started per second), and regions.
- **Real-time dashboard**: Web-based metrics during test run. RPS, response time (avg, P95, P99), error rate, active users.
- **Scenario**: A named test configuration. Can include multiple Locust scripts, environment variables, and headers.
- **Test results**: Historical record of test runs. Compare current run against baseline to detect performance regression.

# Mental Models
- **Cloud load testing as outsourced infrastructure**: LoadForge manages the load generators. You define the test; they generate the traffic. No servers to provision.
- **Locust as Python test script**: Locust scripts describe user behavior in Python — login, browse, interact. More flexible than JMeter's GUI but requires Python knowledge.
- **Global distribution as realism**: Load testing from 10+ regions reveals geographic performance differences. A user in London experiences different latency than a user in Sydney.
- **Baseline comparison as regression detection**: Compare each test run against historical baselines. If median latency increased 20% since last week, investigate the deployment.

# Internal Mechanics
- **Locust script structure**: `class LaravelUser(HttpUser):` defines wait time (`wait_time = between(1, 5)`), tasks (`@task(3) def view_home(self)`), and on_start/on_stop hooks.
- **HTTP client in Locust**: Locust's `HttpUser` provides an HTTP client with built-in metrics collection. Supports GET, POST, PUT, DELETE, headers, and authentication.
- **LoadForge metrics pipeline**: Agent → LoadForge collector → real-time dashboard → stored results. Metrics include: response time, RPS, failures, response size, and user count.
- **Region distribution**: LoadForge agents in configured regions (us-east, eu-west, ap-southeast) each generate their portion of total traffic. Results aggregated per-region and globally.
- **Test lifecycle**: Upload script → configure test → start run → monitor dashboard → analyze results → compare with baseline.

# Patterns
- **Pattern: Laravel Locust test script**
  - Purpose: Define realistic Laravel user behavior
  - Benefits: Tests complete user flows, not just single endpoints
  - Tradeoffs: Requires Python knowledge; Locust scripting
  - Implementation: `class LaravelUser(HttpUser):` with tasks for login, browse products, add to cart, checkout

- **Pattern: Global region distribution test**
  - Purpose: Measure geographic performance differences
  - Benefits: Identifies CDN, regional hosting, and latency issues
  - Tradeoffs: More regions = higher cost
  - Implementation: Configure 5+ regions (US East, US West, EU West, EU Central, AP Southeast)

- **Pattern: Baseline comparison in CI**
  - Purpose: Detect performance regression automatically
  - Benefits: Performance regression caught before deployment
  - Tradeoffs: Baseline drift; environment variability
  - Implementation: After staging deploy, run LoadForge test, compare P95 latency against CI-stored baseline

- **Pattern: Gradual ramp-up load test**
  - Purpose: Find breaking point under increasing load
  - Benefits: Identifies maximum capacity before degradation
  - Tradeoffs: May cause temporary service degradation
  - Implementation: Start at 10 users, increase by 10 every minute, observe when error rate exceeds 1% or latency spikes

# Architectural Decisions
- **LoadForge vs self-managed JMeter**: LoadForge for teams without dedicated performance testing infrastructure. Self-managed JMeter for teams with specific compliance or network requirements (air-gapped environments, custom protocols).
- **LoadForge vs VoltTest**: LoadForge for external HTTP testing from global regions. VoltTest for PHP-native internal testing (faster, integrates with Pest). Use both for comprehensive coverage.
- **LoadForge plan**: Free tier (limited runs/month) for startups. Paid tiers for regular testing. Evaluate cost against JMeter infrastructure cost.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| No infrastructure management | Per-test-run cost | Evaluate volume vs self-managed cost |
| Global region distribution | Cannot test internal/private endpoints | Test staging via public endpoints or VPN |
| Real-time dashboard + historical data | Requires Python for Locust scripts | Team must maintain Python test scripts |
| Baseline comparison | Baseline drift over time | Reset baseline after major infrastructure changes |

# Performance Considerations
- LoadForge agent capacity: 1000-5000 virtual users per agent depending on test complexity.
- Latency overhead: LoadForge results include agent-to-server network latency. Subtract geographic latency for server-only performance.
- Test duration: Minimum 2 minutes (warm-up + measurement). Recommended 10-15 minutes for stable metrics.
- Ramp-up period: 30-60 seconds minimum. Gradual ramp-up prevents cold-start effects from skewing results.
- Results stability: First 30% of test duration may show higher latency (warm-up). Consider discarding initial data.

# Production Considerations
- **Production safety**: Never load test production without warning. Use staging environment or production with read-only replicas.
- **Cost management**: LoadForge charges per test run minute or per virtual user hour. Budget accordingly for regular testing.
- **Script versioning**: Treat Locust scripts as code. Version control alongside the application. Update tests when application behavior changes.
- **Environment configuration**: LoadForge test environment must match production configuration. Use same PHP version, database engine, cache backend.
- **Authentication handling**: For authenticated endpoints, implement login in `on_start()` and store session token. Locust handles cookies automatically.

# Common Mistakes
- **Mistake: Testing against production without warning**
  - Why: "Production traffic is the most realistic"
  - Why harmful: Load test may exhaust production resources; real users affected
  - Better: Use staging environment; or coordinate with ops team for off-peak production testing

- **Mistake: Single-region testing for global applications**
  - Why: "Server is in US East; test from US East"
  - Why harmful: Users in Asia, Europe, and Australia have different experiences
  - Better: Test from multiple regions representing user distribution

- **Mistake: Testing only GET requests**
  - Why: "Read endpoints are the most common"
  - Why harmful: Write endpoints (POST, PUT, DELETE) have different performance characteristics
  - Better: Include write operations in test mix; weight by production traffic distribution

- **Mistake: Short test duration**
  - Why: "30 seconds is enough"
  - Why harmful: Cold cache, JIT warm-up, and connection pooling ramp-up skew results
  - Better: Minimum 5 minutes; recommended 10-15 minutes for stable metrics

# Failure Modes
- **Locust script errors**: Python syntax errors or runtime exceptions in Locust scripts. Validate scripts locally with `locust -f script.py` before uploading to LoadForge.
- **Authentication timeouts**: Session tokens expire during long tests. Implement token refresh in Locust script.
- **Rate limiting**: Laravel rate limiting throttles LoadForge traffic. Increase rate limits for test environment or whitelist LoadForge IPs.
- **Data pollution**: LoadForge write operations create test data. Use test database or implement cleanup hooks.
- **Cost overrun**: Accidental long-running test or high virtual user count. Set maximum test duration and user limits in LoadForge configuration.

# Ecosystem Usage
- **LoadForge**: Provides a Laravel-specific load testing guide on their website. Includes sample Locust scripts for common Laravel patterns (auth, API, checkout).
- **Laravel Forge**: Forge-provisioned servers are commonly tested with LoadForge. The combination provides a complete deployment → test → monitor workflow.
- **LoadForge + New Relic/Blackfire**: Combine LoadForge load tests with application performance monitoring (APM) tools for code-level bottleneck identification.
- **Locust community**: Locust's open-source community provides extensions for CSV data feeding, custom metrics, and advanced reporting that complement LoadForge's built-in features.

# Related Knowledge Units
- **Prerequisites**: Load testing fundamentals, HTTP protocol, Python basics (for Locust scripts)
- **Related Topics**: Apache Bench and JMeter, VoltTest, Performance regression testing
- **Advanced Follow-up**: Locust script advanced patterns, Load testing in CI/CD pipeline, Global performance optimization with CDN

# Research Notes
- LoadForge uses Locust as its test execution engine; any Locust-compatible script works on LoadForge, providing portability if the team later switches to self-managed Locust
- The LoadForge Laravel guide recommends testing three endpoint types: public (no auth), authenticated (session-based), and API (token-based) to cover the full spectrum of Laravel request handling paths
- Cloud-based load testing services (LoadForge, Flood.io, K6 Cloud) are increasingly preferred over self-managed JMeter for teams without dedicated performance engineering roles
- Locust's Python-based approach has a learning curve for PHP/Laravel developers; teams should budget 1-2 days for Locust script development
- LoadForge results should be correlated with server-side metrics (PHP-FPM status, MySQL slow query log, Redis hit rate) collected during the test run for meaningful bottleneck identification
