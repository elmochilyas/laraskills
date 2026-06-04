# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** zero-downtime-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Octane worker architecture understood (persistent processes, request lifecycle)
- [ ] Server runtime selected (FrankenPHP recommended, RoadRunner or Swoole evaluated)
- [ ] `octane:reload` pattern validated for graceful zero-downtime restart
- [ ] Memory management configured (max_requests, RSS monitoring, OOM prevention)
- [ ] Production configuration tuned (worker count, max_request_time, health checks)
- [ ] Comparison with Envoyer/Deployer (Octane replaces traditional ZDD tools)

---

# Architecture Checklist

- [ ] Worker architecture designed (persistent processes, state reset via Sandbox)
- [ ] Server runtime comparison documented (FrankenPHP vs RoadRunner vs Swoole)
- [ ] Zero-downtime reload mechanics understood (graceful shutdown, in-flight handling)
- [ ] PHP-FPM to Octane migration path defined
- [ ] Prometheus metrics endpoint configured for worker monitoring

---

# Implementation Checklist

- [ ] Octane installed and configured via `config/octane.php`
- [ ] FrankenPHP deployed as standalone binary or Docker image
- [ ] `octane:reload` integrated into deployment script
- [ ] Worker count set based on CPU cores (2-4 workers per core)
- [ ] Health check endpoint created for Octane worker pool
- [ ] max_requests configured to cycle workers periodically

---

# Performance Checklist

- [ ] Worker count calculated via CPU core count (not memory)
- [ ] max_request_time set (30-60s) to kill long-running requests
- [ ] max_requests set (500-1000) to prevent memory leaks
- [ ] RSS monitoring threshold configured (alert at 80% of memory limit)
- [ ] OOM prevention via supervisor auto-restart and worker recycling

---

# Security Checklist

- [ ] Octane server port restricted to reverse proxy or internal network
- [ ] Sandbox state reset verified (no data leaks between requests)
- [ ] Environment variables injected correctly for long-lived processes
- [ ] Health check endpoint does not expose internal state
- [ ] FrankenPHP Caddy TLS configured if exposed directly

---

# Reliability Checklist

- [ ] Graceful shutdown tested (in-flight requests complete before worker kill)
- [ ] `octane:reload` tested under load (zero dropped requests)
- [ ] Worker auto-restart configured (supervisor or systemd)
- [ ] Memory leak alerting configured (worker RSS exceeds threshold)
- [ ] Health check monitored with alert on consecutive failures

---

# Testing Checklist

- [ ] Request state isolation tested (shared-nothing between requests verified)
- [ ] Reload under load tested with traffic simulation
- [ ] Memory leak detection tested (deploy with known leak, verify alert)
- [ ] Health check endpoint verified (200 pass, 500 fail)
- [ ] Runtime comparison benchmarks completed (FrankenPHP vs RoadRunner vs Swoole)

---

# Maintainability Checklist

- [ ] Octane configuration documented with tuning rationale
- [ ] Supervisor/systemd unit file version-controlled
- [ ] Memory monitoring scripts stored in `ops/` directory
- [ ] Deployment runbook updated for Octane reload workflow
- [ ] Runtime upgrade guide documented (e.g., FrankenPHP version migration)

---

# Anti-Pattern Prevention Checklist

- [ ] No static state stored in services (use constructor-only for dependencies)
- [ ] No blocking I/O without queue offloading in request lifecycle
- [ ] No unbounded collection growth (memory leak)
- [ ] No reliance on `$_SERVER` or `$_GET` superglobals
- [ ] No deployment without `octane:reload` step

---

# Production Readiness Checklist

- [ ] Worker RSS monitoring integrated and alerting active
- [ ] Health check endpoint connected to load balancer or orchestrator
- [ ] `octane:reload` tested under production-grade traffic
- [ ] Supervisor process monitoring verified
- [ ] Prometheus/OpenMetrics endpoint active for Octane workers
- [ ] Memory threshold alerts configured (warn at 80%, critical at 95%)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Octane worker model and runtime selected
- [ ] Security requirements satisfied: state isolation, port firewall, env injection
- [ ] Performance requirements satisfied: worker count, max_requests, memory tuned
- [ ] Testing requirements satisfied: reload, state reset, memory leak detection tested
- [ ] Anti-pattern checks passed: no static state, no blocking I/O, no superglobals
- [ ] Production readiness verified: Prometheus, health check, RSS alerts configured

---

# Related References

- FrankenPHP (preferred runtime)
- Envoyer (replaced by Octane)
- K8s (Octane on K8s)
