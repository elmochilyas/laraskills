# Metadata
Domain: Testing & Reliability Engineering
Subdomain: CI/CD Pipeline Integration
Knowledge Unit: Post-Deployment Health Checks
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Post-deployment health checks validate that a Laravel application is functioning correctly after deployment to production or staging. These checks run after the deployment pipeline and before traffic is fully routed to the new deployment. They include HTTP status monitoring, database connectivity verification, queue worker responsiveness, cache connectivity, and key business transaction smoke tests. Health checks serve as the final quality gate between deployment and full production traffic, catching environment-specific issues that pre-deployment tests cannot (configuration drift, missing environment variables, extension mismatches).

# Core Concepts
- **Smoke test**: A minimal test that verifies the application is running. `GET /health` returns `200 OK`. Verifies PHP-FPM, web server, and framework booting.
- **Health endpoint**: Dedicated route (e.g., `/health` or `/api/health`) that returns application status. Should not require authentication.
- **Dependency checks**: Health endpoint pings database, Redis, cache driver, and queue connection. Reports each dependency's status individually.
- **Readiness vs liveness**: Readiness check (is the app ready to serve traffic?) vs liveness check (is the app alive? for orchestrators like Kubernetes).
- **Graceful degradation**: A health check should pass even if non-critical services are unavailable. Database down = critical failure. Cache down = degraded but acceptable.
- **Transaction smoke test**: Executes a real business transaction (e.g., create a test record, then clean it up) to verify the full stack works end-to-end.

# Mental Models
- **Health check as canary**: The health endpoint is a canary in the coal mine. If it's unhealthy, the deployment should be rolled back automatically.
- **Dependency tree awareness**: Health checks are hierarchical. Database → Cache → Queue. If database is down, cache and queue checks are irrelevant (they depend on the database indirectly).
- **Pre-flight vs post-flight**: Pre-flight checks run before deployment (is the environment ready?). Post-flight checks run after deployment (is the deployment working?).
- **Health as contract**: The health endpoint is a contract between the deployment pipeline and the application. It must be maintained as the application evolves.

# Internal Mechanics
- **Health route implementation**: A simple controller in `routes/web.php` (or `api.php`) that checks core services. Should not trigger middleware like CSRF, auth, or session.
- **Database check**: `DB::connection()->getPdo()` — throws exception if database is unreachable. For MySQL, can execute `SELECT 1` for a more thorough connectivity check.
- **Cache check**: `Cache::store('redis')->set('health-check', true, 10); Cache::store('redis')->get('health-check');` — verifies read/write.
- **Queue check**: `Queue::connection('redis')->size('health-check')` — verifies queue connection. For more thorough checks, dispatch a test job and verify execution.
- **Response format**: JSON response with `{ "status": "ok" | "degraded" | "failure", "services": { "database": "ok", "cache": "ok", "queue": "ok" } }`.
- **Load balancer integration**: ELB, Nginx, and Kubernetes use health endpoint responses to determine if the instance should receive traffic.

# Patterns
- **Pattern: Simple health endpoint**
  - Purpose: Basic liveness check for load balancers
  - Benefits: Fast (<10ms); no dependencies needed
  - Tradeoffs: No visibility into service health
  - Implementation: Route returns `response()->json(['status' => 'ok'])` without any dependency checks

- **Pattern: Dependency-checking health endpoint**
  - Purpose: Verify all core services are reachable
  - Benefits: Catches configuration drift (wrong Redis host, DB credentials)
  - Tradeoffs: Slower (100-500ms); may fail on transient network issues
  - Implementation: Check database, cache, queue connections; return per-service status

- **Pattern: Transaction smoke test**
  - Purpose: Verify end-to-end business operation
  - Benefits: Catches business logic issues that simple pings miss
  - Tradeoffs: May leave test data if cleanup fails; slower
  - Implementation: Create a test record, read it, delete it. Assert all steps succeed.

- **Pattern: CI-integrated health check**
  - Purpose: Verify deployment health as part of CI pipeline
  - Benefits: Automated rollback on health check failure
  - Tradeoffs: Requires deployment environment access from CI
  - Implementation: After deployment, curl health endpoint; if non-200, trigger rollback

# Architectural Decisions
- **Health endpoint placement**: Separate from application routes (e.g., `/health` at web server level, before Laravel bootstrap). Or simple Laravel route. Web server level is faster but cannot check Laravel-specific dependencies.
- **Authentication**: Health endpoints should not require authentication. Load balancers and CI systems cannot provide credentials. Use network-level access control (firewall, internal network) instead.
- **Check frequency**: Load balancer: every 5-10 seconds. CI post-deploy: once. Monitoring system (Pingdom, UptimeRobot): every minute.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catches environment-specific issues | Health endpoint is an attack surface | Restrict to internal network |
| Automatic rollback on failure | May cause false-positive rollbacks | Tune timeout and retry settings |
| Service-level insight | Slower checks with more dependencies | Layer checks: fast liveness + full health |
| Transaction tests catch real issues | Test data may persist on failure | Use test cleanup with fallback |

# Performance Considerations
- Simple liveness check: <10ms (no PHP framework boot if at web server level).
- Full dependency check: 50-500ms depending on service response times. Acceptable for post-deploy checks.
- Transaction smoke test: 200-2000ms depending on business logic complexity.
- Health endpoint should not trigger full Laravel session, auth, or middleware stack for fast responses.
- Rate limit health endpoint: 1 request per second per instance. Prevent accidental DDoS from monitoring systems.

# Production Considerations
- **Rollback automation**: Configure deployment pipeline to rollback automatically if health check fails within the first 5 minutes of deployment.
- **Health check logging**: Log all health check requests and responses. Monitor for patterns: repeated failures, slow responses, degraded states.
- **Load balancer health check configuration**: Set appropriate interval (5-10s), timeout (2-5s), unhealthy threshold (2-3 failures), healthy threshold (1-2 successes).
- **Health endpoint alerting**: Configure alerts for health endpoint failures. PagerDuty/OpsGenie integration for critical failures.
- **Graceful shutdown**: Health endpoint should return unhealthy when the application is shutting down (receives SIGTERM). This prevents load balancers from routing traffic to stopping instances.

# Common Mistakes
- **Mistake: Health endpoint requires database**
  - Why: "The app can't work without the database"
  - Why harmful: Deployment rollback on database maintenance window
  - Better: Return degraded (not failure) for non-critical dependency issues; failure only for truly fatal conditions

- **Mistake: Health endpoint returns sensitive information**
  - Why: Error messages in health response include stack traces
  - Why harmful: Information disclosure; internal service configuration exposed
  - Better: Return only "ok", "degraded", or "failure" status per service

- **Mistake: No health endpoint at all**
  - Why: Load balancer uses TCP health check only
  - Why harmful: App may accept TCP connections but return 500 on every request
  - Better: Implement HTTP health endpoint that returns 200 only when the app is fully functional

- **Mistake: Health check is in the same middleware stack**
  - Why: Health route goes through auth, session, CSRF middleware
  - Why harmful: Health check fails if database session driver is unavailable (circular dependency)
  - Better: Exclude health route from all middleware except maybe throttling

# Failure Modes
- **False positive (unhealthy during deployment)**: Database migration runs after code deploy; health check fails because schema doesn't match. Run health check after migration completes.
- **False positive (transient network blip)**: Redis connection timeout causes health check failure. Implement retry logic (1 retry) in health check.
- **False negative (healthy when app is broken)**: Health endpoint returns 200 but API endpoints return 500. Implement transaction-based health check for critical paths.
- **Monitoring storm**: Health check failure triggers alerts → on-call investigates → service recovers → alert resolves. If health check is flaky, monitoring noise increases.

# Ecosystem Usage
- **Laravel Forge**: Forge provides built-in health checking for sites. Configure endpoint URL and expected status code. Forge also supports deployment scripts with post-deployment checks.
- **Laravel Vapor**: Vapor (serverless Laravel) provides CloudWatch-based health monitoring. Health endpoint is checked automatically after deployment.
- **Kubernetes (Laravel on K8s)**: `livenessProbe` and `readinessProbe` configurations point to the health endpoint. Kubernetes manages pod lifecycle based on health check results.
- **AWS ELB/ALB**: Configure target group health checks to point to `/health` or `/api/health`. ALB supports HTTP 200 checks and content-based checks (startsWith "ok").

# Related Knowledge Units
- **Prerequisites**: Laravel routing and middleware, Deployment strategies, Load balancer concepts
- **Related Topics**: Zero-downtime deployment, CI/CD pipeline design, Graceful degradation patterns
- **Advanced Follow-up**: Kubernetes liveness/readiness probes for Laravel, Health check aggregation for microservices, Synthetic transaction monitoring

# Research Notes
- The standard Laravel health check pattern uses a dedicated route in `routes/web.php` that bypasses session and auth middleware; the `App\Http\Middleware\TrustProxies` middleware is important for health checks behind load balancers
- Health check endpoints should be excluded from rate limiting; many monitoring systems (AWS Route 53, Pingdom, UptimeRobot) send requests more frequently than standard rate limits allow
- GitHub Actions deployment workflows commonly include a "smoke test" step after deployment that curls the health endpoint and exits non-zero on failure, triggering the rollback workflow
- Forge's Quick Deploy feature deploys on push; combining this with a post-deployment health check script that runs after Forge's deploy hook adds production verification without manual steps
- The Laravel community increasingly uses Laravel Pulse or Laravel Horizon's monitoring dashboard alongside health endpoints for comprehensive post-deployment verification
