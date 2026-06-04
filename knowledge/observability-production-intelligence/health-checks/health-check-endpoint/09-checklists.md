# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 06-health-checks
**Knowledge Unit:** health-check-endpoint
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Liveness vs readiness vs startup probe distinction understood
- [ ] `/health`, `/up`, `/ready` endpoints designed for each probe type
- [ ] Laravel 11+ built-in `/up` endpoint evaluated
- [ ] `DiagnosingHealth` event listened to for custom logic
- [ ] Shallow vs deep health check strategy defined per probe
- [ ] Kubernetes/Docker Swarm probe configuration determined

---

# Architecture Checklist

- [ ] Liveness probe: shallow check (process alive, port responding)
- [ ] Readiness probe: deep check (DB, Redis, queue connectivity)
- [ ] Startup probe: initial dependency verification for slow-starting services
- [ ] Probe endpoint response format standardised (HTTP 200 vs 503)
- [ ] `DiagnosingHealth` event dispatched for custom maintenance window logic
- [ ] Health endpoint aggregation layer for multi-service health view

---

# Implementation Checklist

- [ ] Route registered for `/health` returning 200 with OK status
- [ ] Route registered for `/ready` checking database and cache connectivity
- [ ] Route registered for `/up` (Laravel built-in or custom)
- [ ] `DiagnosingHealth` listener registered in `EventServiceProvider`
- [ ] Health check response JSON structure defined: `{status, checks: [], timestamp}`
- [ ] Each dependency check wrapped in try-catch for graceful degradation

---

# Performance Checklist

- [ ] Liveness probe response time < 100ms (lightweight)
- [ ] Readiness probe timeout configured (default 5s for DB check)
- [ ] Deep health checks not blocking liveness probe
- [ ] Health endpoint caching evaluated for read-heavy orchestration
- [ ] Database connection check performed with fast query (`SELECT 1`)
- [ ] Health check endpoint excluded from rate limiting and APM tracing

---

# Security Checklist

- [ ] Health endpoints not exposed on public network
- [ ] Health check response does not leak internal topology (IPs, versions)
- [ ] Health endpoint access restricted via middleware (internal subnet)
- [ ] `DiagnosingHealth` event does not log sensitive maintenance data
- [ ] Health check does not authenticate against external services with shared secrets
- [ ] Probe endpoints not subject to CSRF protection

---

# Reliability Checklist

- [ ] Readiness probe fails gracefully during queue worker restart
- [ ] Database connection failure returns 503, not 500
- [ ] Health check timeout shorter than orchestrator probe interval
- [ ] Consecutive failure threshold configured for orchestration
- [ ] Pod not terminated on single readiness failure (Kubernetes threshold)
- [ ] Health endpoint returns consistent response under load

---

# Testing Checklist

- [ ] Unit test: liveness endpoint returns 200
- [ ] Unit test: readiness endpoint returns 503 when DB down
- [ ] Integration test: `DiagnosingHealth` event dispatched on check
- [ ] Integration test: orchestrator probe interval matches health timeout
- [ ] Stress test: health endpoint handles concurrent orchestrator requests
- [ ] Failure test: dependency down returns correct HTTP status

---

# Maintainability Checklist

- [ ] Health check endpoints documented in deployment runbook
- [ ] Dependency check logic abstracted in `App\Health\Checks` namespace
- [ ] Health response schema version-controlled
- [ ] New dependency health checks added with minimal boilerplate
- [ ] Probe configuration documented in Kubernetes/Docker Compose files
- [ ] `DiagnosingHealth` listeners documented by purpose

---

# Anti-Pattern Prevention Checklist

- [ ] Liveness probe not doing deep dependency checks (causes restart loops)
- [ ] Readiness probe not blocking startup indefinitely
- [ ] Health endpoint not used for application business logic
- [ ] Health check not failing on external dependency without timeout
- [ ] Probe failure not silenced without alerting escalation
- [ ] Single health endpoint not used for all three probe types incorrectly

---

# Production Readiness Checklist

- [ ] Orchestrator probe configuration validated in staging
- [ ] Health check integrated into deployment pipeline (readiness gates)
- [ ] Health monitoring dashboard showing probe status over time
- [ ] Alerting configured for repeated readiness probe failures
- [ ] Health endpoint rate limit exemption configured in reverse proxy
- [ ] On-call runbook includes health check troubleshooting steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: liveness/readiness/startup probes distinguished, DiagnosingHealth event handled, shallow vs deep strategy defined
- [ ] Security requirements satisfied: endpoints not public, topology not leaked, middleware restricted
- [ ] Performance requirements satisfied: liveness < 100ms, timeouts configured, caching evaluated
- [ ] Testing requirements satisfied: liveness returns 200, readiness returns 503 on failure, event dispatched, stress tested
- [ ] Anti-pattern checks passed: liveness not deep, readiness not blocking startup, probe not used for business logic
- [ ] Production readiness verified: staging validated, deployment integration done, alerts configured, runbook ready

---

# Related References

- Spatie Laravel Health (full dependency health framework)
- Laravel Pulse (health metrics visualization)
