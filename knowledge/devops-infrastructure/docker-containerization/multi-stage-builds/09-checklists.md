# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** multi-stage-builds
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] FrankenPHP single-binary architecture understood (Caddy embedded PHP server)
- [ ] Octane worker pool management via FrankenPHP confirmed
- [ ] Caddy automatic HTTPS and TLS configuration validated
- [ ] Docker deployment with FrankenPHP as single container
- [ ] Environment variables injected for FrankenPHP configuration
- [ ] Mercure hub integration evaluated if needed

---

# Architecture Checklist

- [ ] Single-binary architecture designed (Caddy + PHP in one process)
- [ ] Octane + FrankenPHP worker pool strategy defined
- [ ] Traditional Nginx/FPM vs FrankenPHP tradeoff documented
- [ ] Single-container vs multi-container architecture decided
- [ ] Caddy HTTPS strategy confirmed (auto TLS, on-demand TLS)

---

# Implementation Checklist

- [ ] FrankenPHP installed via Docker or binary download
- [ ] Caddyfile configured for Laravel routing and static files
- [ ] Octane configured with FrankenPHP server (`server: frankenphp`)
- [ ] PHP extensions configured in FrankenPHP build
- [ ] Supervisor or Docker restart policy for process management
- [ ] Health check endpoint created

---

# Performance Checklist

- [ ] Worker count determined by CPU cores
- [ ] max_requests configured for memory leak prevention
- [ ] HTTP/2 and HTTP/3 enabled via Caddy
- [ ] OPcache configured for production
- [ ] Static file serving routed through Caddy

---

# Security Checklist

- [ ] Caddy automatic HTTPS configured and verified
- [ ] Non-root user for FrankenPHP process
- [ ] Minimal PHP extensions in binary
- [ ] Env vars injected at runtime, not in image
- [ ] Mercure endpoint authenticated if enabled

---

# Reliability Checklist

- [ ] Graceful shutdown tested (SIGTERM)
- [ ] Worker auto-restart on crash
- [ ] Health check endpoint active
- [ ] Memory monitoring for worker RSS
- [ ] Rollback via previous Docker image

---

# Testing Checklist

- [ ] FrankenPHP serves Laravel app correctly
- [ ] Octane-FrankenPHP integration tested
- [ ] Caddy TLS auto-certificate creation verified
- [ ] Health check endpoint returns 200
- [ ] Docker image built in CI

---

# Maintainability Checklist

- [ ] FrankenPHP version pinned
- [ ] Caddyfile version-controlled
- [ ] Deployment docs updated for single-binary
- [ ] PHP extension list maintained
- [ ] Upgrade procedure documented

---

# Anti-Pattern Prevention Checklist

- [ ] No FrankenPHP without supervision (Docker or systemd)
- [ ] No secrets in Caddyfile or config
- [ ] No root user in production
- [ ] No unnecessary PHP extensions
- [ ] No deploy without health check

---

# Production Readiness Checklist

- [ ] Image pushed to container registry
- [ ] Health check integrated with orchestrator
- [ ] Resource limits set (CPU, memory)
- [ ] Worker RSS monitoring configured
- [ ] Caddy access logs structured
- [ ] Rollback procedure ready

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: single-binary FrankenPHP replacing Nginx+FPM
- [ ] Security requirements satisfied: auto HTTPS, non-root, minimal extensions
- [ ] Performance requirements satisfied: worker pool, HTTP/2/3, OPcache tuned
- [ ] Testing requirements satisfied: app serving, TLS, health check validated
- [ ] Anti-pattern checks passed: no root, no secrets in image, supervision configured
- [ ] Production readiness verified: registry, resource limits, rollback ready

---

# Related References

- Laravel Octane Deployment (KU-006) -- Octane runtime options including FrankenPHP
- Production Dockerfiles (KU-010) -- multi-stage builds for FrankenPHP
- Kubernetes for Laravel (KU-013) -- single-container FrankenPHP on K8s
- Environment & Secret Management (KU-021) -- env injection for FrankenPHP
