# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** envoyer
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Platform.sh project created and connected to Git repository
- [ ] Three YAML configuration files created (`.platform.app.yaml`, `routes.yaml`, `services.yaml`)
- [ ] Branch-as-environment model understood (each Git branch = full infrastructure copy)
- [ ] Hook lifecycle defined (build, deploy, post_deploy)
- [ ] Laravel config-reader package installed for service configuration
- [ ] Preview environment workflow evaluated for PR review

---

# Architecture Checklist

- [ ] Configuration model designed (`.platform.app.yaml` for app, `routes.yaml` for routing, `services.yaml` for backing services)
- [ ] Branch-as-environment model designed (Git branch mapping, data cloning, isolation)
- [ ] Hook lifecycle designed (build: Composer/npm; deploy: migrate; post_deploy: queue restart)
- [ ] Service management designed (database, Redis, Elasticsearch, worker containers)
- [ ] Laravel integration design (config-reader package, mounts, env vars, optimized build)

---

# Implementation Checklist

- [ ] `.platform.app.yaml` created with PHP version, dependencies, build hooks, relationships
- [ ] `routes.yaml` created with HTTP routes and TLS configuration
- [ ] `services.yaml` created with database, Redis, and search services
- [ ] `config-reader` package installed (`composer require platformsh/config-reader`)
- [ ] Build hook configured (Composer install, npm build, artisan optimize)
- [ ] Deploy hook configured (artisan migrate --force)

---

# Performance Checklist

- [ ] Build hook optimized (composer --no-dev, cache build)
- [ ] Deploy hook execution time measured (<30 seconds)
- [ ] Worker container count tuned for queue workload
- [ ] Redis cache configured for sessions and cache
- [ ] Elasticsearch index strategy for search

---

# Security Checklist

- [ ] Environment variables stored in Platform.sh dashboard (not in code)
- [ ] TLS enforced via routes.yaml
- [ ] Database credentials auto-generated per environment
- [ ] Access control for production environment
- [ ] No secrets in YAML configuration files

---

# Reliability Checklist

- [ ] Deploy hook migration tested (idempotent, --force)
- [ ] Post_deploy hook for queue restart
- [ ] Worker container auto-restart on failure
- [ ] Database backup configured in Platform.sh
- [ ] Rollback via Git revert

---

# Testing Checklist

- [ ] Platform.sh environment deploys and serves Laravel
- [ ] Build hook runs successfully (Composer, npm)
- [ ] Deploy hook runs migrations
- [ ] Worker container processes queue jobs
- [ ] Preview environment created from PR branch

---

# Maintainability Checklist

- [ ] YAML config files version-controlled in repository root
- [ ] Environment variable inventory maintained
- [ ] Hook script documentation in README
- [ ] Platform.sh CLI commands documented
- [ ] Upgrade notes tracked (Platform.sh PHP version changes)

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in YAML config files
- [ ] No database changes without deploy hook migration
- [ ] No production data cloned into preview environments
- [ ] No post_deploy hook that depends on build artifacts
- [ ] No worker container without health check

---

# Production Readiness Checklist

- [ ] Production environment configured in Platform.sh
- [ ] Build and deploy hooks verified
- [ ] TLS active on custom domain
- [ ] Database backup schedule confirmed
- [ ] Worker containers processing jobs
- [ ] Rollback via Git revert tested

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: three-file config, hooks, services, branch-as-env
- [ ] Security requirements satisfied: TLS, auto-generated credentials, no secrets in YAML
- [ ] Performance requirements satisfied: build optimization, hook timing, Redis cache
- [ ] Testing requirements satisfied: deploy, hook execution, worker, preview env tested
- [ ] Anti-pattern checks passed: no secrets in YAML, no prod data in preview
- [ ] Production readiness verified: TLS, backups, worker config, Git revert rollback

---

# Related References

- Fly.io (Docker alternative)
- Railway (simpler)
- Forge (VPS alternative)
