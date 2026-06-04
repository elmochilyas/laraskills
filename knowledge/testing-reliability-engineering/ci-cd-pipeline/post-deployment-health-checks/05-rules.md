# Rules — Post-Deployment Health Checks

## Rule 1: Layer Health Checks by Criticality — Liveness vs Readiness
| Field | Value |
|-------|-------|
| **Name** | Layer Health Checks by Criticality — Liveness vs Readiness |
| **Category** | Architecture & Design |
| **Rule** | Implement two health endpoints: a fast liveness check (no dependencies, returns immediately) and a full readiness check (validates database, cache, queue connectivity). Load balancers use liveness; deployment pipelines use readiness. |
| **Reason** | Load balancers need a fast check every 5-10 seconds. A full dependency check (500ms) would slow load balancer decisions. The liveness check confirms the application process is running; the readiness check confirms it can serve traffic. Separating these prevents circular dependencies and provides appropriate granularity. |
| **Bad Example** | Single `/health` endpoint that checks database — when database is under maintenance, load balancer marks all instances as down, even though they could serve cached content. |
| **Good Example** | `/livez` — returns 200 immediately (process is running). `/readyz` — checks database, cache, queue and returns detailed status. |
| **Exceptions** | Simple single-server deployments where a single health endpoint suffices. |
| **Consequences Of Violation** | Load balancer marks healthy instances as unhealthy during database maintenance; unnecessary instance cycling. |

## Rule 2: Exclude Health Route from Middleware Stack
| Field | Value |
|-------|-------|
| **Name** | Exclude Health Route from Middleware Stack |
| **Category** | Architecture & Reliability |
| **Rule** | Exclude the health endpoint route from auth, session, CSRF, and most middleware. Apply only throttling middleware. |
| **Reason** | Health checks must work when auth or session services are unavailable. A health check behind session middleware fails circularly when session storage (database driver) is down — the health check reports "unhealthy" because it can't check health. This creates a false positive. |
| **Bad Example** | Health endpoint goes through `web` middleware — session middleware requires database connection; database is down → health check reports unhealthy → load balancer drains all instances. |
| **Good Example** | `Route::get('/health', ...)->withoutMiddleware([\App\Http\Middleware\Authenticate::class, \Illuminate\Session\Middleware\StartSession::class])->middleware('throttle:60,1')`. |
| **Exceptions** | None. Health endpoints must bypass auth and session middleware. |
| **Consequences Of Violation** | False-positive health check failures during database maintenance; circular dependency crashes. |

## Rule 3: Return Degraded (Not Failure) for Non-Critical Services
| Field | Value |
|-------|-------|
| **Name** | Return Degraded (Not Failure) for Non-Critical Services |
| **Category** | Architecture & Resilience |
| **Rule** | Use a three-tier response: `ok` (all critical services healthy), `degraded` (non-critical service down, but app functions), and `failure` (critical service down, app cannot serve traffic). Never return `failure` when only non-critical services are affected. |
| **Reason** | Not all dependencies are equally critical. Cache being down is acceptable (degraded performance but app works). Database being down is critical (app cannot serve requests). Returning `failure` for cache unavailability triggers unnecessary rollbacks and load balancer draining. |
| **Bad Example** | Health check returns `failure` when Redis is down — app still works without cache; but deployment pipeline rolls back and load balancer drains instances. |
| **Good Example** | Cache down → `{ "cache": "degraded", "status": "degraded" }`. Database down → `{ "database": "failure", "status": "failure" }`. |
| **Exceptions** | Applications where every dependency is critical (rare in practice). |
| **Consequences Of Violation** | Unnecessary rollbacks and instance draining for non-critical service disruptions. |

## Rule 4: Automate Rollback on Health Check Failure
| Field | Value |
|-------|-------|
| **Name** | Automate Rollback on Health Check Failure |
| **Category** | Operations & Reliability |
| **Rule** | Configure the deployment pipeline to automatically roll back if the post-deploy health check fails within the first 5 minutes. Never rely on manual rollback. |
| **Reason** | Manual rollback is slow (5-15 minutes) and error-prone (wrong commands, forgetting steps). Automated rollback takes seconds and follows a tested procedure. Every minute of degraded service affects users. Automated rollback minimizes MTTR (mean time to recovery). |
| **Bad Example** | Health check fails after deploy — developer is paged, manually SSHes into server, runs `php artisan down`, swaps symlink back — 15 minutes of downtime. |
| **Good Example** | Health check fails → deploy pipeline automatically runs `rollback` task → symlink reverts to previous release → ops is notified. |
| **Exceptions** | Deployments to environments where automated rollback is not supported by the deployment tooling. |
| **Consequences Of Violation** | Extended downtime during deployment failures; slow, error-prone manual recovery. |

## Rule 5: Never Expose Sensitive Information in Health Responses
| Field | Value |
|-------|-------|
| **Name** | Never Expose Sensitive Information in Health Responses |
| **Category** | Security |
| **Rule** | Return only status indicators per service (`ok`, `degraded`, `failure`). Never include stack traces, configuration values, server IPs, database hostnames, or environment details in health responses. |
| **Reason** | Health endpoints are an attack surface. Even if restricted to internal network, information leakage (stack traces revealing code paths, database hostnames aiding lateral movement) is a security risk. The health endpoint should reveal whether the app is healthy, not how it works. |
| **Bad Example** | `{ "database": { "status": "failure", "error": "SQLSTATE[HY000] [1045] Access denied for user 'app'@'10.0.0.5'" } }` — reveals credentials and internal IP. |
| **Good Example** | `{ "database": "failure", "status": "failure" }` — status only, no detail. |
| **Exceptions** | Internal debugging endpoints in non-production environments (not exposed via health endpoint). |
| **Consequences Of Violation** | Sensitive information leakage; increased attack surface for security incidents. |

## Rule 6: Implement Transaction Smoke Test for Critical Flows
| Field | Value |
|-------|-------|
| **Name** | Implement Transaction Smoke Test for Critical Flows |
| **Category** | Operations & Reliability |
| **Rule** | Include a transaction smoke test in the deployment pipeline that executes a real business transaction (e.g., create a product, complete a checkout) to verify the full application stack. |
| **Reason** | Individual service health checks don't verify that the application's business logic works correctly. A smoke test that creates `Order #1` and verifies it appears in the database exercises the complete stack: route → controller → validation → database → response. This catches integration issues that isolated health checks miss. |
| **Bad Example** | Health check pings database and cache — both respond OK. But the application's checkout flow is broken because a recent migration renamed the `orders` table. |
| **Good Example** | Post-deploy smoke test: `POST /api/checkout` with test data → assert 200 response → assert `Order` exists in database → clean up test data. |
| **Exceptions** | Applications where creating test data in production is not feasible (e.g., read-only systems). |
| **Consequences Of Violation** | Critical business flows may be broken despite passing infrastructure health checks. |
