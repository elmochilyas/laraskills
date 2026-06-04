# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** laravel-octane-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Octane installed via Composer (`composer require laravel/octane`)
- [ ] Server runtime selected and configured (FrankenPHP, RoadRunner, or Swoole)
- [ ] `octane:reload` validated for graceful worker restart (zero-downtime built in)
- [ ] Memory management configured (max_requests, RSS monitoring, OOM prevention)
- [ ] FrankenPHP evaluated as preferred runtime (single binary, Caddy, automatic HTTPS)
- [ ] Nginx dependency eliminated (Octane serves directly or via Caddy/FrankenPHP)

---

# Architecture Checklist

- [ ] Persistent application state understood (in-memory across requests vs PHP-FPM)
- [ ] Sandbox pattern for request state reset validated (prevent state leakage)
- [ ] Worker pool architecture designed (worker count, supervisor, recycling)
- [ ] Octane server runtime compared (FrankenPHP recommended vs RoadRunner vs Swoole)
- [ ] Envoyer replacement confirmed (Octane handles zero-downtime natively)
- [ ] Dockerfile pattern adapted for Octane (no separate Nginx container needed)

---

# Implementation Checklist

- [ ] Octane installed and configured (`php artisan octane:install`)
- [ ] Server runtime configuration validated in `config/octane.php`
- [ ] FrankenPHP binary or Docker image deployed
- [ ] `octane:reload` hook added to deployment script
- [ ] Supervisor or systemd configured to manage Octane process
- [ ] Health check endpoint implemented for Octane (returns 200)

---

# Performance Checklist

- [ ] Worker count calculated based on CPU cores (2-4 workers per core typical)
- [ ] max_requests configured (500-1000) to prevent memory leaks
- [ ] max_request_time configured (30-60s) to kill stuck requests
- [ ] RSS monitoring configured for worker memory growth detection
- [ ] OPcache revalidated on reload for fresh opcode cache
- [ ] Swoole short-names disabled if using Swoole runtime

---

# Security Checklist

- [ ] Octane server port firewalled (reverse proxy only)
- [ ] FrankenPHP automatic HTTPS verified (Caddy TLS)
- [ ] Worker state isolation confirmed (no data leaks between requests)
- [ ] Environment variables injected correctly for long-running processes
- [ ] Health check endpoint restricted (internal network or authenticated)

---

# Reliability Checklist

- [ ] Graceful shutdown tested (in-flight requests complete before worker stops)
- [ ] OOM prevention configured (worker supervisor auto-restarts crashed workers)
- [ ] `octane:reload` tested during active traffic (zero dropped requests)
- [ ] Memory leak detection configured (alert on worker RSS > threshold)
- [ ] Supervisor process monitoring configured (auto-restart on crash)

---

# Testing Checklist

- [ ] Octane request lifecycle tested (application state reset between requests)
- [ ] Reload tested under load (simulate traffic, trigger reload, verify zero drops)
- [ ] Memory leak detection tested (deploy with intentional leak, confirm alert)
- [ ] Health check endpoint tested (200 on healthy, 500 on degraded)
- [ ] Runtime comparison benchmarks completed (FrankenPHP vs RoadRunner vs Swoole)

---

# Maintainability Checklist

- [ ] Octane configuration documented with worker count rationale
- [ ] Supervisor/systemd unit file version-controlled
- [ ] Deployment script updated to use `octane:reload` instead of `php-fpm restart`
- [ ] Memory monitoring scripts maintained in repository
- [ ] Runtime upgrade procedure documented (e.g., FrankenPHP version bumps)

---

# Anti-Pattern Prevention Checklist

- [ ] No static state stored in application (use sandbox or service container reset)
- [ ] No blocking I/O in request lifecycle without queue offloading
- [ ] No memory leaks from unbounded collection growth
- [ ] No reliance on `$_SERVER`, `$_GET`, `$_POST` superglobals (use request object)
- [ ] No deployment without `octane:reload` in deployment script

---

# Production Readiness Checklist

- [ ] Octane worker RSS monitoring configured and alerting
- [ ] Health check endpoint integrated into load balancer
- [ ] `octane:reload` tested in production-like traffic conditions
- [ ] Supervisor process count and auto-restart verified
- [ ] Rollback procedure documented (`octane:reload` to previous deploy)
- [ ] Prometheus metrics configured for Octane (workers, requests, memory)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Octane worker model and runtime selected
- [ ] Security requirements satisfied: port firewalled, state isolation verified
- [ ] Performance requirements satisfied: worker count, max_requests, memory tuned
- [ ] Testing requirements satisfied: reload under load, state reset, memory tested
- [ ] Anti-pattern checks passed: no static state, no blocking I/O in request lifecycle
- [ ] Production readiness verified: monitoring, health check, supervisor ready

---

# Related References

- Envoyer Zero-Downtime Deployments (KU-003) -- Octane replaces the need for Envoyer
- FrankenPHP Standalone Deployments (KU-012) -- preferred Octane runtime
- Production Dockerfiles (KU-010) -- Dockerfile patterns for Octane
- Kubernetes for Laravel (KU-013) -- Octane on K8s
- Performance optimization (cross-domain)
