# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** canary-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Deployer PHP installed via Composer (`composer require deployer/deployer`)
- [ ] `deploy.php` recipe created with Laravel-specific tasks (`artisan:cache`, `migrate`)
- [ ] Symlink-swap atomic cutover implemented with zero-downtime directory layout
- [ ] Multi-server parallel deployment configured for load-balanced environments
- [ ] Rollback tested (atomic revert to previous release via symlink)
- [ ] CI/CD integration configured (GitHub Actions, GitLab CI, or custom)

---

# Architecture Checklist

- [ ] Recipe-based deployment approach adopted (deploy.php with hosts, tasks, hooks)
- [ ] Directory structure created (`releases/`, `current`, `shared/`, `.dep/`)
- [ ] Task hooks ordered correctly (build: clone, install, build; deploy: migrate, swap)
- [ ] Multi-server parallel deployment strategy designed
- [ ] Rollback architecture validated (atomic revert to previous release via `deploy:rollback`)

---

# Implementation Checklist

- [ ] Hosts defined in `deploy.php` with SSH connection parameters
- [ ] Laravel recipe tasks customized (`artisan:migrate`, `artisan:queue:restart`)
- [ ] Shared files and directories configured (`storage/`, `.env`)
- [ ] Writable directories defined for persistent storage
- [ ] Deployment lock verified (`deploy:lock` prevents concurrent deploys)

---

# Performance Checklist

- [ ] Composer install optimized (`--no-dev --optimize-autoloader --no-interaction`)
- [ ] npm/Yarn build step configured to run during release preparation
- [ ] Asset build caching configured to skip rebuild on unchanged assets
- [ ] Deployment time measured and optimized (target under 2 minutes)
- [ ] Release directory cleanup automated (keep last 3 releases)

---

# Security Checklist

- [ ] SSH keys deployed for Deployer authentication (no password auth)
- [ ] `.env` file created in shared directory with correct permissions (600)
- [ ] deploy.php credentials excluded from version control
- [ ] Deployer API tokens stored as CI/CD secrets
- [ ] Access to `dep` CLI restricted in production (ops team only)

---

# Reliability Checklist

- [ ] Deployment lock tested (concurrent deploy attempt fails gracefully)
- [ ] Rollback tested (deploy:rollback reverts to previous release)
- [ ] Failed release handling defined (skip symlink update, keep release for debugging)
- [ ] Migration ordering validated (run before symlink swap for new code compat)
- [ ] Deployment timeout configured for slow server scenarios

---

# Testing Checklist

- [ ] deploy.php syntax validated (`dep list` shows all tasks)
- [ ] Deployment tested on staging with same recipe
- [ ] Rollback tested by deploying bad code and running `dep rollback`
- [ ] Concurrent deployment lock tested (parallel deploys from two terminals)
- [ ] CI/CD integration tested (Deployer command in GitHub Actions workflow)

---

# Maintainability Checklist

- [ ] deploy.php stored in repository root with documentation
- [ ] Task hooks commented with purpose (before/after/success/failure)
- [ ] Host inventory maintained in a separate `.yaml` or `.env` file
- [ ] Deployment runbook documented with common commands
- [ ] Deployer version pinned in `composer.json` to avoid breaking changes

---

# Anti-Pattern Prevention Checklist

- [ ] No `composer install` done on production server (must be in release prep)
- [ ] No `.env` file committed to repository (use shared directory)
- [ ] No deployment without migration strategy for zero-downtime
- [ ] No concurrent deployments allowed (lock must be enabled)
- [ ] No manual file modification in releases directories (managed by Deployer)

---

# Production Readiness Checklist

- [ ] Rollback tested end-to-end and documented
- [ ] Deployment notifications configured (Slack webhook via Deployer)
- [ ] Release retention policy configured (keep at least 3 releases)
- [ ] Deployment timeout configured appropriate for app size (default 5min)
- [ ] Deployer version locked in composer.json
- [ ] CI/CD pipeline integration verified (auto-deploy on branch merge)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: recipe-based deploy and symlink swap validated
- [ ] Security requirements satisfied: SSH keys, .env permissions, secrets secured
- [ ] Performance requirements satisfied: composer/npm optimized, deploy time measured
- [ ] Testing requirements satisfied: staging deploy, rollback, lock tested
- [ ] Anti-pattern checks passed: no manual edits, no concurrent deploys
- [ ] Production readiness verified: notifications, retention, CI/CD integration ready

---

# Related References

- Envoyer Zero-Downtime Deployments (KU-003) -- paid alternative
- GitHub Actions CI/CD (KU-008) -- CI integration with Deployer
- Laravel Forge Provisioning (KU-001) -- servers deployable by Deployer
- Database Migration in CI (KU-019) -- migration strategy with Deployer
