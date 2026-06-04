# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** forge
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Fly.io account created and `flyctl` CLI installed
- [ ] `fly launch` detected Laravel and generated Dockerfile
- [ ] Fly Machines architecture understood (VM lifecycle, scaling, regions)
- [ ] Multi-region deployment design evaluated for global apps
- [ ] FrankenPHP integration evaluated as preferred runtime
- [ ] CI/CD pipeline with flyctl configured (GitHub Actions)

---

# Architecture Checklist

- [ ] Fly Machines architecture designed (lifecycle, scale, cold start, region selection)
- [ ] Multi-region architecture designed (anycast routing, active-passive DB, S3 storage, regional Redis)
- [ ] FrankenPHP on Fly.io architecture (single-container, Octane integration)
- [ ] Database management architecture (managed PostgreSQL/MySQL, connection pooling, multi-region replication)
- [ ] CI/CD pipeline with flyctl designed (secrets management, zero-downtime deploys)

---

# Implementation Checklist

- [ ] `fly.toml` created with app configuration
- [ ] Dockerfile generated and customized (multi-stage, PHP extensions)
- [ ] Managed PostgreSQL database created (`fly postgres create`)
- [ ] Redis created via Upstash Redis or Fly Redis
- [ ] Environment secrets set via `flyctl secrets`
- [ ] Health check endpoint created and configured in fly.toml

---

# Performance Checklist

- [ ] Fly Machine CPU/memory sized for workload
- [ ] Multi-region deployment for global user base
- [ ] FrankenPHP+Octane for high throughput
- [ ] Connection pooling (PgBouncer) configured for DB
- [ ] Redis cache for sessions and rate limiting

---

# Security Checklist

- [ ] Secrets managed via `flyctl secrets` (not in files)
- [ ] Database private networking (flycast)
- [ ] TLS auto-configured by Fly.io
- [ ] Health check endpoint restricted
- [ ] API tokens stored in CI/CD secrets

---

# Reliability Checklist

- [ ] Health check endpoint for machine verification
- [ ] Machine auto-restart on failure
- [ ] Multi-region database failover
- [ ] Zero-downtime deployment (rolling)
- [ ] Managed database backups confirmed

---

# Testing Checklist

- [ ] `fly deploy` succeeds and app responds
- [ ] Health check returns 200
- [ ] Database connection via private network
- [ ] Queue worker processes jobs
- [ ] Multi-region request routing tested

---

# Maintainability Checklist

- [ ] `fly.toml` and Dockerfile version-controlled
- [ ] Secrets documented
- [ ] Deployment commands in README
- [ ] Cost tracking configured
- [ ] Runtime decision (FrankenPHP vs FPM) documented

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in `fly.toml` or Dockerfile
- [ ] No local file storage (use S3)
- [ ] No single-region for global app
- [ ] No Docker image without multi-stage build
- [ ] No cold-start without connection pool warmup

---

# Production Readiness Checklist

- [ ] CI/CD deploy pipeline configured
- [ ] Database backup confirmed
- [ ] Health check integrated with platform
- [ ] Multi-region configured (if global)
- [ ] Rollback via previous image tag
- [ ] Monitoring configured (Sentry, Fly metrics)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Machines, regions, runtime, DB architecture
- [ ] Security requirements satisfied: secrets via flyctl, private networking, TLS
- [ ] Performance requirements satisfied: sizing, multi-region, connection pooling
- [ ] Testing requirements satisfied: deploy, health, DB, worker, regions verified
- [ ] Anti-pattern checks passed: no secrets in config, no local storage
- [ ] Production readiness verified: CI/CD, backups, monitoring, rollback ready

---

# Related References

- Railway (simpler Docker)
- Platform.sh (different model)
- Vapor (AWS)
