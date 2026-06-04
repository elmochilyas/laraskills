# Decision Trees

## Domain: Testing & Reliability Engineering
## Subdomain: CI/CD Pipeline Integration
## Knowledge Unit: Post-Deployment Health Checks

---

### Tree 1: Health Check Layer Selection — Liveness vs Readiness

```mermaid
flowchart TD
    A[Choose health check type] --> B{Consumer?}
    B -->|Load balancer — 5-10s interval| C[Liveness check — no dependencies, <10ms, returns 200]
    B -->|Deployment pipeline — post-deploy| D[Readiness check — validates DB, cache, queue, 50-500ms]
    B -->|Monitoring system — 1min interval| E[Readiness check — detailed status for alerting]
    A --> F{False positive risk?}
    F -->|Must avoid — critical traffic| G[Liveness check — minimal false positives]
    F -->|Acceptable — ops investigation| H[Readiness check — more informative, slightly slower]
    A --> I{Implementation level?}
    I -->|Web server (nginx) level| J[Fastest — no PHP bootstrap, only checks process]
    I -->|Laravel route level| K[Detailed — can check all dependencies, middleware excluded]
    A --> L{Check granularity?}
    L -->|Binary — up or down| M[Single endpoint, returns 200 or 5xx]
    L -->|Three-tier — ok/degraded/failure| N[Dependency-level status, distinguishes non-critical failures]
```

**Key decision points:**
- **Consumer determines layer**: Load balancers need fast liveness checks. Deployment pipelines need full readiness checks.
- **False positive sensitivity**: Liveness = minimal false positives. Readiness = more informative, slower.
- **Binary vs three-tier**: Binary for simple load balancers. Three-tier for deployment gates.

---

### Tree 2: Dependency Criticality Classification

```mermaid
flowchart TD
    A[Classify dependencies] --> B{Dependency type?}
    B -->|Database| C[Critical — app cannot function without DB]
    B -->|Cache (Redis/Memcached)| D[Non-critical — degraded performance, app still works]
    B -->|Queue (Horizon/Beanstalkd)| E[Non-critical — async operations degrade, sync paths work]
    B -->|Session storage| F[Non-critical — may impact logged-in users, public pages work]
    B -->|External API| G[Depends — critical if API is core business, degraded if optional]
    A --> H{Health status for<br>this dependency?}
    H -->|Critical available| I[ok]
    H -->|Critical unavailable| J[failure — triggers rollback, load balancer drain]
    H -->|Non-critical available| K[ok]
    H -->|Non-critical unavailable| L[degraded — reported but does not trigger rollback]
    A --> M{Health endpoint<br>response?}
    M -->|All critical ok| N[{ status: 'ok' }]
    M -->|Non-critical down, critical ok| O[{ status: 'degraded' }]
    M -->|Critical down| P[{ status: 'failure' }]
```

**Key decision points:**
- **Critical vs non-critical**: Database is critical. Cache, queue, session are non-critical.
- **Response tiers**: ok → degraded → failure. Only "failure" triggers rollback.
- **External APIs**: Classify based on business impact. Payment API = critical. Analytics API = optional.

---

### Tree 3: CI Placement — Health Check Integration

```mermaid
flowchart TD
    A[Integrate health checks into CI] --> B{Deployment phase?}
    B -->|After symlink swap| C[Run health check immediately — validate new code works]
    B -->|After all instances updated| D[Run health check on each instance — consistent]
    A --> E{Health check<br>passes?}
    E -->|Yes — all critical services ok| F[Proceed — route traffic, warm caches]
    E -->|No — critical service failure| G[Trigger automated rollback]
    G --> H[Configurable: retry count (3), retry interval (5s)]
    A --> I{Cache warm-up<br>before health check?}
    I -->|Yes| J[Warm caches first, then health check — avoids false failures from cold caches]
    I -->|No| K[Health check may fail on cold caches — add retries]
    A --> L{Transaction smoke<br>test needed?}
    L -->|Yes — critical business flow| M[Add smoke test to deployment pipeline]
    M --> N[Create test data, execute transaction, verify response, clean up]
    L -->|No — simple app| O[Dependency-only health check is sufficient]
```

**Key decision points:**
- **Post-swap timing**: Run health check immediately after symlink swap, before routing user traffic.
- **Automated rollback**: Configure retries (3 attempts, 5s interval) before triggering rollback.
- **Cache warm-up**: Warm caches before health check to avoid false cold-cache failures.

---

### Tree 4: Middleware Exclusion — What to Bypass

```mermaid
flowchart TD
    A[Configure health route middleware] --> B{Middleware type?}
    B -->|Auth / Authenticate| C[MUST exclude — health check cannot require login]
    B -->|Session / StartSession| D[MUST exclude — circular dependency on session storage]
    B -->|CSRF| E[MUST exclude — health check is GET, no form token]
    B -->|VerifyCsrfToken| F[MUST exclude — same as CSRF]
    B -->|Throttle / RateLimit| G[SHOULD keep — prevent accidental DDoS from monitoring]
    B -->|Log / Request logging| H[MAY exclude — avoid filling logs with monitoring requests]
    A --> I{Consequence of<br>not excluding?}
    I -->|Auth middleware enabled| J[Health check fails for unauthenticated consumers (load balancer)]
    I -->|Session middleware enabled| K[Circular failure — health check can't check DB because session needs DB]
    I -->|CSRF enabled| L[Health check returns 419 for GET requests with CSRF]
    A --> M{Implementation<br>approach?}
    M -->|Dedicated route outside middleware| N[Fastest — no middleware processing at all]
    M -->|Route with ->withoutMiddleware()| O[Simple — specify which middleware to exclude]
    M -->|Separate route file for health| P[Clean — organize health routes separately from application routes]
```

**Key decision points:**
- **Exclude auth, session, CSRF**: These middleware cause health-check failures on non-health-related issues.
- **Keep throttling**: Prevent monitoring tools from overwhelming the application.
- **Implementation**: Dedicated route outside middleware stack is fastest and most reliable.
