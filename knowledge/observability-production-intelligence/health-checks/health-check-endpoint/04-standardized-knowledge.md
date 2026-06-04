# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 06-health-checks
**Knowledge Unit:** health-check-endpoint
**Difficulty:** Intermediate
**Category:** Application Health
**Last Updated:** 2026-06-03

# Overview

A health check endpoint (`/health`, `/healthz`, `/readyz`) is a standardized HTTP endpoint that reports whether an application is running, ready to serve traffic, and able to connect to its dependencies (database, cache, queue). It is consumed by load balancers, container orchestrators (Kubernetes liveness/readiness probes), service meshes, and monitoring systems.

Laravel applications typically expose a health check endpoint via a dedicated route or middleware. The endpoint returns HTTP 200 when healthy and 503 when unhealthy, often with a JSON body containing detailed component status.

Engineers should care because health checks separate application-level failures from infrastructure failures. When a database goes down, the health check endpoint reports it, and the orchestrator can stop routing traffic to that instance — without manual intervention.

# Core Concepts

**Liveness Probe:** Checks if the application is alive (not stuck or deadlocked). If liveness fails, the orchestrator restarts the container. Liveness checks should be lightweight — typically just checking that the process is responsive.

**Readiness Probe:** Checks if the application is ready to serve traffic (dependencies available, migrations run, cache warm). If readiness fails, the orchestrator stops routing traffic to the instance but does NOT restart it.

**Startup Probe:** Checks if the application has completed initialization (migrations, warmup). Used for applications with slow startup. Only runs once at startup, unlike liveness/readiness which run continuously.

**Component Check:** A single dependency health check within the overall health endpoint. Examples: database connection, Redis ping, queue connection, S3 bucket accessible. Each component has a status (healthy, degraded, unhealthy).

**Degraded State:** Application is functional but one or more non-critical dependencies are unavailable. Returns HTTP 200 but reports degraded status for affected components. Example: cache is down but database is up — application still serves traffic.

**Graceful Degradation:** The application's ability to continue functioning in a degraded state, possibly with reduced functionality. Health checks should report degradation without causing unnecessary container restarts.

# When To Use

- **Containerized deployments** (Kubernetes, Docker Swarm, ECS) requiring liveness/readiness probes
- **Load-balanced environments** where traffic should be routed away from unhealthy instances
- **Multi-service architectures** where dependency health affects routing decisions

# When NOT To Use

- **Single-instance development environments** — health checks add complexity without value
- **External monitoring as health check** — health checks are for orchestration, not user-facing monitoring

# Best Practices

**Keep liveness probes lightweight.** Liveness checks should only verify the PHP process is responsive. Making database queries in a liveness check creates a dependency — if the database is slow, liveness fails, and the orchestrator restarts the pod unnecessarily.

**Include dependency checks in readiness.** Readiness probes should check database connectivity, cache availability, queue connection, and critical external services. These validate that the instance can serve traffic.

**Use separate probes for liveness and readiness.** Liveness: lightweight PHP ping. Readiness: comprehensive dependency check with 200/503 status. Kubernetes uses both.

**Return structured health data.** JSON response with component-level status enables debugging and automation:
```json
{"status": "healthy", "components": {"database": "healthy", "cache": "healthy"}}
```

**Cache health results.** Health endpoints are called every 10-30 seconds. Cache component check results for 5-10 seconds to avoid hammering dependencies.

# Architecture Guidelines

Health endpoint should be on a separate route, not behind authentication middleware. Orchestrators and load balancers call the health endpoint without auth tokens. Use a dedicated route group or middleware that skips auth.

Health checks should not modify application state. No database writes, no cache writes, no queue pushes. Health checking must be read-only.

# Performance Considerations

- **Health check overhead:** Each health check call executes 1-10 dependency checks. Target <100ms total response time
- **Check frequency:** Kubernetes defaults to probe every 10-30 seconds per pod. 100 pods × 30s = 200 health checks/minute
- **Dependency hammering:** Without caching, health checks can overload dependencies. Cache database ping results for 5-10s

# Security Considerations

- **Health endpoint exposure:** Health endpoints reveal internal infrastructure information (which services, connection strings not returned but presence of services is exposed)
- **No authentication on health routes:** Orchestrators cannot provide auth tokens. Accept this risk but keep health responses minimal
- **Rate limiting:** Health endpoints should not be rate-limited. Load balancers may call health check aggressively during incidents

# Common Mistakes

**Database queries in liveness probes.** Liveness probe fails when database is slow → orchestrator restarts container → new container also has slow database → restart loop. Liveness should only check process health.

**No startup probe.** Application with 30s startup time gets liveness failure during normal startup → unnecessary restarts. Add a startup probe with longer initial delay.

**Health check modifies state.** Health check writes a "last checked" timestamp to the database. Under load, this creates write contention on every health check call.

**Health check requires authentication.** Load balancer cannot authenticate → marks instance as unhealthy. Remove auth from health check route.

# Anti-Patterns

**Monolithic health check.** A single "everything is fine" response with no component breakdown. Cannot distinguish between database outage and cache miss. Always return component-level health.

**Health check that never fails.** Health check that catches all exceptions and returns HTTP 200. This defeats the purpose of a health check — the orchestrator never knows the application is degraded.

**Stale health cache.** Caching health check results for 60+ seconds. Orchestrator expects near-real-time health data. A pod with a dead database can serve traffic for 60 seconds before health check responds.

# Examples

**Basic Laravel health route:**
```php
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json(['status' => 'healthy'], 200);
    } catch (\Exception $e) {
        return response()->json(['status' => 'unhealthy', 'reason' => 'database'], 503);
    }
});
```

# Related Topics

**Prerequisites:**
- Laravel routing and middleware basics

**Closely Related Topics:**
- Spatie Laravel Health (structured health check package)
- Deployment & Containerization (Kubernetes probe configuration)

**Advanced Follow-Up Topics:**
- Graceful degradation patterns
- Circuit breaker patterns

**Cross-Domain Connections:**
- DevOps & Infrastructure — container orchestration probe configuration

# AI Agent Notes

- Liveness: lightweight, no dependencies. Readiness: includes dependency checks
- Health endpoint must NOT require authentication
- Cache health results for 5-10s max. Never cache for 60s+
- Return component-level status in JSON
- Liveness probes should never query database or external services
- Startup probe prevents restart during slow initialization
