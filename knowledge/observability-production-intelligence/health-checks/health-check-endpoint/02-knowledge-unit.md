# Health Check Endpoint

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 06-health-checks
- **Knowledge Unit:** health-check-endpoint
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

A health check endpoint (`/health`, `/healthz`, `/readyz`) reports whether an application is running, ready to serve traffic, and able to connect to its dependencies. Consumed by load balancers, container orchestrators (Kubernetes probes), and monitoring systems, it distinguishes application-level failures from infrastructure failures without manual intervention.

---

## Core Concepts

- **Liveness Probe:** Checks if the application is alive (not stuck or deadlocked) — lightweight, just process responsiveness
- **Readiness Probe:** Checks if the application is ready to serve traffic — dependencies available, migrations run, cache warm
- **Startup Probe:** Checks if initialization completed (migrations, warmup) — runs once for slow-starting applications
- **Component Check:** Single dependency health check — database connection, Redis ping, queue connection, S3 accessibility
- **Degraded State:** Application functional but non-critical dependencies unavailable — returns HTTP 200 with degraded status
- **Graceful Degradation:** Application continues functioning with reduced capability while dependencies are unavailable

---

## Mental Models

- **Traffic Light Model:** Green (200) = healthy, Yellow (200 with degraded components) = proceed with caution, Red (503) = stop routing traffic
- **Canary in Coal Mine Model:** Health checks are the canary — they detect problems (database down, cache unreachable) before users experience failures
- **Pre-flight Checklist Model:** Like a pilot's pre-flight checklist — each component check verifies one system before takeoff (serving traffic)

---

## Internal Mechanics

Health endpoints are typically registered as a dedicated route without authentication middleware. When called, the endpoint executes a series of component checks (database `SELECT 1`, Redis `PING`, queue connection test). Each component returns a status. If all components are healthy, the endpoint returns HTTP 200 with a JSON body. If any critical component fails, it returns HTTP 503. Results may be cached for 5-10 seconds to prevent dependency hammering. Health checks must be read-only — no database writes, cache writes, or queue pushes.

---

## Patterns

- **Separate Liveness and Readiness:** Liveness is a lightweight PHP ping (just process check). Readiness includes comprehensive dependency checks with 200/503 response. Benefit: appropriate probe granularity for Kubernetes. Tradeoff: requires two endpoints to maintain.
- **Component-Level JSON Response:** Return structured health data with per-component status. Benefit: enables debugging and automation. Tradeoff: reveals infrastructure details.
- **Cached Health Results:** Cache component check results for 5-10 seconds. Benefit: prevents dependency hammering from frequent probe calls. Tradeoff: delayed detection of dependency failures.

---

## Architectural Decisions

**Keep liveness probes lightweight.** Liveness should only verify the PHP process is responsive. Making database queries in liveness creates unnecessary dependencies — slow database causes unnecessary pod restarts.

**Use separate probes for liveness and readiness.** Liveness: lightweight PHP ping. Readiness: comprehensive dependency check. Kubernetes uses both for different purposes.

**Health endpoint without authentication.** Orchestrators and load balancers cannot provide auth tokens. Accept this risk but keep health responses minimal.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automatic traffic routing away from unhealthy instances | Health endpoint reveals infrastructure information | Keep responses minimal; accept no-auth risk |
| Component-level status enables targeted debugging | Each check execution adds latency | Target <100ms total response time |
| Cached checks prevent dependency hammering | 5-10s delay in failure detection | Acceptable for orchestration probes |

---

## Performance Considerations

Each health check call executes 1-10 dependency checks — target <100ms total response time. Kubernetes defaults to probe every 10-30 seconds per pod. 100 pods × 30s = 200 health checks/minute. Without caching, health checks can overload dependencies — cache database ping results for 5-10 seconds.

---

## Production Considerations

Health endpoints reveal internal infrastructure information (which services, connection details). No authentication on health routes — orchestrators cannot provide auth tokens. Health endpoints should not be rate-limited — load balancers may call health check aggressively during incidents.

---

## Common Mistakes

**Database queries in liveness probes** — liveness fails when database is slow → orchestrator restarts pod → new pod also has slow database → restart loop. Liveness should only check process health.

**No startup probe** — application with 30s startup gets liveness failure during normal startup → unnecessary restarts. Add a startup probe with longer initial delay.

**Health check modifies state** — writing a "last checked" timestamp to the database creates write contention on every health check call.

**Health check requires authentication** — load balancer cannot authenticate → marks instance as unhealthy. Remove auth from health check route.

---

## Failure Modes

**Restart loop from liveness/database dependency:** Liveness probe checks database → database is slow → liveness fails → pod restarts → new pod also has slow database → repeat. Detection: pod repeatedly restarts. Mitigation: liveness should only check process health; move dependency checks to readiness.

**False positive from stale cache:** Health check cache returns "healthy" for a component that actually failed 10 seconds ago. Detection: traffic routed to instance with failed dependency. Mitigation: keep cache TTL low (5s max); don't cache critical dependency checks.

**Startup probe never succeeds:** Migration or warmup takes longer than startup probe threshold. Detection: pod never becomes ready. Mitigation: set initial delay and period based on measured startup time.

---

## Ecosystem Usage

Laravel applications typically expose health endpoints via dedicated routes using `Route::get()`. Spatie Laravel Health provides a structured, configurable health check system with built-in checks for database, Redis, cache, queue, and more. Kubernetes probes (liveness, readiness, startup) configure the endpoint path and timing.

---

## Related Knowledge Units

### Prerequisites
- Laravel routing and middleware basics

### Related Topics
- Spatie Laravel Health (structured health check package)
- Deployment & Containerization (Kubernetes probe configuration)

### Advanced Follow-up Topics
- Graceful degradation patterns
- Circuit breaker patterns

---

## Research Notes

Liveness: lightweight, no dependencies. Readiness: includes dependency checks. Health endpoint must NOT require authentication. Cache health results for 5-10s max. Return component-level status in JSON. Liveness probes should never query database or external services. Startup probe prevents restart during slow initialization.
