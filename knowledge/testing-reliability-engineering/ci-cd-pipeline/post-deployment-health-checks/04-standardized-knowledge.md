# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | Post-Deployment Health Checks |
| Difficulty | Advanced |
| Maturity | Mature |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel routing and middleware, Deployment strategies, Load balancer concepts |
| Related KUs | Zero-downtime deployment, CI/CD pipeline design, Graceful degradation patterns |
| Source | domain-analysis.md K055 |

# Overview

Post-deployment health checks validate that a Laravel application is functioning correctly after deployment to production or staging. These checks run after the deployment pipeline and before traffic is fully routed to the new deployment. They include HTTP status monitoring, database connectivity verification, queue worker responsiveness, cache connectivity, and key business transaction smoke tests. Health checks serve as the final quality gate between deployment and full production traffic, catching environment-specific issues that pre-deployment tests cannot (configuration drift, missing environment variables, extension mismatches).

# Core Concepts

- **Smoke test**: A minimal test verifying the application is running. `GET /health` returns `200 OK`.
- **Health endpoint**: Dedicated route returning application status. Should not require authentication.
- **Dependency checks**: Health endpoint pings database, Redis, cache driver, and queue connection.
- **Readiness vs liveness**: Readiness (is app ready for traffic?) vs liveness (is app alive? for orchestrators).
- **Graceful degradation**: Non-critical service failures should return "degraded" not "failure".
- **Transaction smoke test**: Executes a real business transaction to verify the full stack.

# When To Use

- After every production deployment as the final quality gate
- In load balancer health check configurations
- In Kubernetes liveness/readiness probe configurations
- When deploying to new environments or after infrastructure changes
- For compliance-required uptime and availability monitoring

# When NOT To Use

- As a substitute for proper pre-deployment testing (unit, feature, E2E tests)
- When health endpoint exposes sensitive information (stack traces, internal config)
- Without network-level access control (health endpoints should be internal-only)
- With hard dependency requirements that cause false-positive rollbacks

# Best Practices (WHY)

- **Layer health checks by criticality**: Separate fast liveness check (no dependencies) from full health check (with dependency checks). Load balancers use the fast check; post-deploy pipelines use the full check.
- **Exclude health route from middleware stack**: Health checks should bypass auth, session, CSRF, and most middleware. A session failure (database driver unavailable) should not cause health check failure — that's a circular dependency.
- **Return degraded (not failure) for non-critical services**: Cache down = degraded but acceptable. Database down = failure. Use a response format that distinguishes between "degraded" and "failure" states.
- **Automate rollback on health check failure**: Configure the deployment pipeline to automatically roll back if the health check fails within the first 5 minutes. Manual rollback is slower and more error-prone.
- **Implement health check in deployment pipeline**: Add a `curl` step after deploy that checks the health endpoint. Exit non-zero if unhealthy to trigger rollback workflow.

# Architecture Guidelines

- **Health endpoint placement**: Separate route before Laravel bootstrap (fastest) or a simple Laravel route (more detailed checks). For dependency checks, use Laravel route.
- **Authentication**: Health endpoints should not require authentication. Use network-level access control (firewall, internal network) instead.
- **Check frequency**: Load balancer: every 5-10 seconds. CI post-deploy: once. Monitoring system: every minute.
- **Response format**: JSON response with `{ "status": "ok" | "degraded" | "failure", "services": { ... } }`.

# Performance Considerations

- Simple liveness check: <10ms (no PHP framework boot if at web server level).
- Full dependency check: 50-500ms depending on service response times.
- Transaction smoke test: 200-2000ms depending on business logic complexity.
- Health endpoint should not trigger full Laravel session, auth, or middleware stack.
- Rate limit health endpoint: 1 request per second per instance.

# Security Considerations

- Health endpoints are an attack surface. Restrict to internal network via firewall rules.
- Never expose stack traces, configuration details, or environment information in health responses.
- Return only "ok", "degraded", or "failure" status per service. No error messages.
- Use separate health endpoint for internal (detailed) vs external (simple OK) consumers.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Health endpoint requires database | "The app can't work without the database" | Rollback on database maintenance window | Return degraded (not failure) for non-critical dependencies |
| Health endpoint returns sensitive info | Error messages include stack traces | Information disclosure | Return only status per service |
| No health endpoint at all | Using TCP health check only | App may accept TCP but return 500 on every request | Implement HTTP health endpoint returning 200 only when functional |
| Health check in same middleware stack | Route goes through auth, session, CSRF | Fails circularly if session DB driver unavailable | Exclude health route from all middleware except throttling |
| Not integrating with deployment pipeline | Manual verification after deploy | Human forgets; broken deployment reaches users | Add automated health check curl step in deployment pipeline |

# Anti-Patterns

- **Health endpoint behind authentication**: Load balancers and CI systems can't authenticate. Instead, use network-level access control.
- **Health check as only quality gate**: Deploying without pre-deployment tests, relying solely on health checks. Instead, use unit/feature/E2E tests before deploy.
- **All-or-nothing health response**: Returning "failure" if any single dependency is down. Instead, use layered criticality (database=critical, cache=degraded).
- **Exposing internal topology**: Health response includes server IPs, database hostnames, or Redis keys. Instead, return abstracted status only.

# Examples

```php
// routes/web.php (excluded from middleware)
Route::get('/health', function () {
    $status = 'ok';
    $services = [];

    try {
        DB::connection()->getPdo();
        $services['database'] = 'ok';
    } catch (\Exception $e) {
        $services['database'] = 'failure';
        $status = 'failure';
    }

    try {
        Cache::store('redis')->set('health', true, 10);
        Cache::store('redis')->get('health');
        $services['cache'] = 'ok';
    } catch (\Exception $e) {
        $services['cache'] = 'degraded';
        if ($status === 'ok') {
            $status = 'degraded';
        }
    }

    return response()->json([
        'status' => $status,
        'services' => $services,
        'timestamp' => now()->toIso8601String(),
    ]);
})->middleware('throttle:60,1');
```

# Related Topics

- **Prerequisites**: Laravel routing and middleware, Deployment strategies, Load balancer concepts
- **Related**: Zero-downtime deployment, CI/CD pipeline design, Graceful degradation patterns
- **Advanced**: Kubernetes liveness/readiness probes for Laravel, Health check aggregation for microservices, Synthetic transaction monitoring

# AI Agent Notes

- When implementing a health endpoint, first check if the project uses Laravel Forge, Vapor, or Kubernetes. Each platform has specific health check integration patterns.
- The health endpoint must be excluded from middleware. Create a dedicated route in `routes/web.php` that bypasses the default middleware stack using `->withoutMiddleware()` or by defining the route in `routes/api.php` with separate middleware configuration.
- For transaction smoke tests, use a try/catch/finally pattern to ensure cleanup. Never leave test data in production.
- If the app uses Laravel Horizon, include a queue check that verifies Horizon is running and workers are processing jobs.

# Verification

- [ ] Health endpoint returns 200 when all critical services are healthy
- [ ] Health endpoint returns non-200 when critical services are unavailable
- [ ] Health endpoint does not require authentication
- [ ] Health endpoint excludes sensitive information from responses
- [ ] Health endpoint bypasses session and auth middleware
- [ ] Health check is integrated into deployment pipeline as post-deploy gate
- [ ] Automated rollback is configured on health check failure
- [ ] Load balancer uses health endpoint for instance health evaluation
- [ ] Rate limiting is configured to prevent accidental DDoS from monitoring
