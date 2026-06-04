# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** flyio-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `fly launch` executed and Laravel auto-detected
- [ ] Production Dockerfile generated with PHP-FPM + Nginx (or FrankenPHP)
- [ ] `fly deploy` tested from local machine
- [ ] Fly Machines architecture understood (lightweight VMs per container)
- [ ] Database connection pooling configured (PostgreSQL/MySQL)
- [ ] Multi-region deployment evaluated for global latency

---

# Architecture Checklist

- [ ] Fly Machines architecture designed (VM lifecycle, scaling, regions, cold start)
- [ ] Multi-region architecture designed (anycast routing, active-passive DB, S3 storage)
- [ ] FrankenPHP on Fly.io evaluated (recommended runtime, single-container, Octane)
- [ ] Database management designed (managed PostgreSQL/MySQL, connection pooling)
- [ ] CI/CD pipeline with flyctl designed (secrets management, zero-downtime deploys)

---

# Implementation Checklist

- [ ] `fly launch` run to generate Dockerfile and fly.toml
- [ ] `fly.toml` customized with app name, regions, and services
- [ ] Production Dockerfile verified (multi-stage, PHP extensions, Nginx)
- [ ] `flyctl secrets set` used for environment variables
- [ ] Managed database created (`fly postgres create`)
- [ ] FrankenPHP deployment option evaluated

---

# Performance Checklist

- [ ] Multi-region deployment configured for low-latency global access
- [ ] Fly Machine sizing selected (CPU/memory per machine)
- [ ] Redis or managed DB cache configured
- [ ] Connection pooling via PgBouncer for database
- [ ] Cold start time measured (aim under 1 second)

---

# Security Checklist

- [ ] Secrets set via `flyctl secrets` (not in .env or config)
- [ ] Database private networking configured
- [ ] TLS auto-configured by Fly.io (Let's Encrypt)
- [ ] Health check endpoint configured for machine verification
- [ ] Fly API token stored in CI/CD as secret

---

# Reliability Checklist

- [ ] Health check endpoint returns 200 for healthy machines
- [ ] Machine auto-restart on failure (Fly.io restart policy)
- [ ] Multi-region failover tested for database
- [ ] Zero-downtime deployment verified (rolling update)
- [ ] Backup configured for managed database

---

# Testing Checklist

- [ ] `fly deploy` succeeds and app responds at fly.dev URL
- [ ] Health check endpoint returns 200
- [ ] Queue worker processes jobs on Fly machine
- [ ] Database connection via flycast private network
- [ ] Multi-region routing tested (curl from multiple locations)

---

# Maintainability Checklist

- [ ] `fly.toml` and Dockerfile version-controlled
- [ ] Secrets documented in team password manager
- [ ] Deployment commands documented in README
- [ ] Fly.io cost tracking configured
- [ ] Runtime (FrankenPHP vs Nginx+FPM) decision documented

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in `fly.toml` or Dockerfile
- [ ] No local file storage (use S3 or Fly Volumes)
- [ ] No single-region deployment for global apps
- [ ] No unoptimized Docker image without multi-stage build
- [ ] No database connection from every cold start without pooling

---

# Production Readiness Checklist

- [ ] `fly deploy` pipeline configured in CI/CD
- [ ] Managed database backups confirmed
- [ ] Health check endpoint integrated with Fly.io
- [ ] Multi-region active (if applicable)
- [ ] Rollback via `fly deploy --image <previous>`
- [ ] Monitoring (Fly.io metrics, Sentry/Flare) configured

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Fly Machines, regions, FrankenPHP or FPM
- [ ] Security requirements satisfied: secrets via flyctl, private DB, auto TLS
- [ ] Performance requirements satisfied: multi-region, sizing, connection pooling
- [ ] Testing requirements satisfied: deploy, health check, worker, DB, regions tested
- [ ] Anti-pattern checks passed: no secrets in config, no local storage, multi-region
- [ ] Production readiness verified: CI/CD deploy, backups, rollback, monitoring

---

# Related References

- Railway Laravel Deployment (KU-018) -- comparable Docker-based platform
- Platform.sh Laravel (KU-019) -- Git-push deployment model
- Laravel Cloud (KU-016) -- fully managed alternative
- Production Dockerfiles (KU-010) -- Dockerfile patterns for Fly.io
- Laravel Octane (KU-006) -- Octane on Fly.io
