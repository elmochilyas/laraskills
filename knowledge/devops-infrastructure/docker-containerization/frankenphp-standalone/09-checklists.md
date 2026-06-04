# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** frankenphp-standalone
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] FrankenPHP binary or Docker image obtained (standalone Go binary with embedded PHP + Caddy)
- [ ] Single-binary deployment architecture understood (replaces Nginx + PHP-FPM stack)
- [ ] Caddy integration verified for automatic HTTPS and HTTP/3 support
- [ ] Laravel Octane configured with FrankenPHP as the server runtime
- [ ] Environment variables injected correctly for FrankenPHP process
- [ ] Mercure hub integration evaluated if needed for real-time features

---

# Architecture Checklist

- [ ] Single-binary architecture validated (Caddy HTTP server + PHP interpreter in one process)
- [ ] Octane worker pool management designed for FrankenPHP
- [ ] Traditional Nginx + PHP-FPM vs FrankenPHP tradeoffs evaluated
- [ ] Container deployment strategy determined (single container vs split)
- [ ] HTTPS strategy confirmed (Caddy automatic TLS, no separate cert-manager needed)

---

# Implementation Checklist

- [ ] FrankenPHP Docker image built with multi-stage Dockerfile
- [ ] PHP extensions compiled into FrankenPHP binary as needed
- [ ] Caddyfile or `frankenphp` config created for application routing
- [ ] Octane FrankenPHP server installed (`composer require laravel/octane`)
- [ ] Supervisor or Docker restart policy configured for FrankenPHP
- [ ] Health check endpoint implemented and accessible

---

# Performance Checklist

- [ ] Worker pool size tuned based on CPU cores (2-4 workers per core)
- [ ] max_requests configured (1000) to cycle workers and prevent memory leaks
- [ ] OPcache configured in FrankenPHP Dockerfile
- [ ] HTTP/2 and HTTP/3 enabled via Caddy for reduced latency
- [ ] Static file serving delegated to Caddy (not via PHP)

---

# Security Checklist

- [ ] Caddy automatic HTTPS verified (Let's Encrypt or internal CA)
- [ ] Non-root user configured for FrankenPHP process
- [ ] PHP extensions minimal set for attack surface reduction
- [ ] Mercure hub authenticated if enabled
- [ ] Environment variables not baked into Docker image

---

# Reliability Checklist

- [ ] FrankenPHP graceful shutdown tested (SIGTERM handling)
- [ ] Worker auto-restart on crash configured (Docker restart policy)
- [ ] Health check endpoint returns 200 when workers are healthy
- [ ] Memory leak detection configured (RSS monitoring per worker)
- [ ] Rollback by redeploying previous Docker image tag

---

# Testing Checklist

- [ ] FrankenPHP binary serves Laravel app correctly
- [ ] Octane connection to FrankenPHP validated
- [ ] Auto HTTPS via Caddy verified
- [ ] Health check endpoint tested
- [ ] Docker build of FrankenPHP image tested in CI

---

# Maintainability Checklist

- [ ] FrankenPHP version pinned in Dockerfile or configuration
- [ ] Caddyfile version-controlled with application code
- [ ] Deployment documentation updated for single-binary architecture
- [ ] PHP extension list maintained with rationale
- [ ] Upgrade procedure documented for FrankenPHP version bumps

---

# Anti-Pattern Prevention Checklist

- [ ] No FrankenPHP without process supervision (always use Docker or systemd)
- [ ] No hardcoded secrets in Caddyfile or FrankenPHP config
- [ ] No `root` user running FrankenPHP in production
- [ ] No unnecessary PHP extensions compiled into binary
- [ ] No deployment without health check verification

---

# Production Readiness Checklist

- [ ] FrankenPHP image pushed to container registry
- [ ] Health check endpoint integrated with orchestrator
- [ ] Container resource limits set (CPU, memory)
- [ ] Worker RSS monitoring configured
- [ ] Caddy access logs configured with structured logging
- [ ] Rollback procedure by reverting image tag

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: single-binary FrankenPHP replaces Nginx+FPM
- [ ] Security requirements satisfied: automatic HTTPS, non-root user, minimal extensions
- [ ] Performance requirements satisfied: worker pool, HTTP/2/3, OPcache configured
- [ ] Testing requirements satisfied: app serving, Octane, health check verified
- [ ] Anti-pattern checks passed: no root user, no hardcoded secrets, no missing supervision
- [ ] Production readiness verified: registry, health check integration, resource limits set

---

# Related References

- Laravel Octane Deployment (KU-006) -- Octane runtime options including FrankenPHP
- Production Dockerfiles (KU-010) -- multi-stage builds for FrankenPHP
- Kubernetes for Laravel (KU-013) -- single-container FrankenPHP on K8s
- Environment & Secret Management (KU-021) -- env injection for FrankenPHP
