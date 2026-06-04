# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** platformsh-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Platform.sh project created and Git repository connected
- [ ] Three YAML configs created (`.platform.app.yaml`, `routes.yaml`, `services.yaml`)
- [ ] Branch-as-environment model understood (each branch = full infra copy)
- [ ] Build hook configured (Composer install, npm build, artisan optimize)
- [ ] Deploy hook configured (artisan migrate --force)
- [ ] Laravel config-reader package installed

---

# Architecture Checklist

- [ ] `.platform.app.yaml` designed (PHP version, dependencies, build hooks, relationships, mounts)
- [ ] `routes.yaml` designed (HTTP routes, TLS, redirects)
- [ ] `services.yaml` designed (database, Redis, Elasticsearch, worker containers)
- [ ] Branch-as-environment model designed (each branch gets isolated services)
- [ ] Hook lifecycle designed (build for dependencies, deploy for migrations, post_deploy for restarts)

---

# Implementation Checklist

- [ ] `.platform.app.yaml` created with PHP 8.2/8.3, Composer install, npm build
- [ ] `routes.yaml` created with application routes and HTTPS enforcement
- [ ] `services.yaml` created with PostgreSQL/MySQL and Redis services
- [ ] `config-reader` added (`composer require platformsh/config-reader`)
- [ ] Build hook includes `php artisan optimize`
- [ ] Deploy hook includes `php artisan migrate --force`

---

# Performance Checklist

- [ ] Build hook optimized (composer --no-dev, config:cache, route:cache)
- [ ] Deploy hook execution timed (<30s)
- [ ] Worker container count tuned for queue workload
- [ ] Redis for cache and session optimization
- [ ] Elasticsearch index strategy for search

---

# Security Checklist

- [ ] Environment variables in Platform.sh dashboard
- [ ] TLS via routes.yaml
- [ ] DB credentials auto-generated per environment
- [ ] Production environment access controlled
- [ ] No secrets in YAML config files

---

# Reliability Checklist

- [ ] Deploy hook migration idempotent (--force)
- [ ] Post_deploy hook for queue restart
- [ ] Worker container auto-restart
- [ ] Platform.sh database backups
- [ ] Rollback via Git revert

---

# Testing Checklist

- [ ] Platform.sh environment deploys successfully
- [ ] Build hook completes (Composer, npm, artisan optimize)
- [ ] Deploy hook runs migration
- [ ] Worker processes queue job
- [ ] Preview environment from PR branch works

---

# Maintainability Checklist

- [ ] YAML config files version-controlled
- [ ] Environment variables documented
- [ ] Hook scripts documented in README
- [ ] Platform.sh CLI commands documented
- [ ] PHP version upgrade process documented

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in YAML files
- [ ] No deploy hook without idempotent migration
- [ ] No production data cloned to preview environments
- [ ] No post_deploy hook depending on build artifacts
- [ ] No worker without monitoring

---

# Production Readiness Checklist

- [ ] Production environment confirmed
- [ ] Build and deploy hooks verified
- [ ] TLS active on custom domain
- [ ] Database backups scheduled
- [ ] Worker containers running
- [ ] Rollback via Git revert tested

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: three-file config, hooks, services, branch-env
- [ ] Security requirements satisfied: TLS, auto-generated creds, no secrets in YAML
- [ ] Performance requirements satisfied: build optimization, hook timing, Redis cache
- [ ] Testing requirements satisfied: deploy, hooks, worker, preview env tested
- [ ] Anti-pattern checks passed: no secrets in YAML, no prod data in preview
- [ ] Production readiness verified: backups, TLS, workers, Git revert rollback

---

# Related References

- Fly.io Deployment (KU-017) -- Docker-based alternative
- Railway Laravel Deployment (KU-018) -- simpler Git-push alternative
- Laravel Cloud (KU-016) -- managed K8s-based alternative
- Laravel Forge Provisioning (KU-001) -- server-level alternative
- Database Migration in CI (KU-019) -- deploy hook migrations
