# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** deployer-php
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Deployer PHP installed via Composer (`composer require deployer/deployer`)
- [ ] `deploy.php` recipe created with Laravel recipe included (`recipe/laravel.php`)
- [ ] Hosts configured in recipe with SSH connection settings
- [ ] Symlink-swap atomic deployment verified (zero-downtime directory layout)
- [ ] Tasks customized for project needs (migrate, queue:restart, npm:build)
- [ ] CI/CD integration configured (GitHub Actions, GitLab CI, Jenkins)

---

# Architecture Checklist

- [ ] Recipe-based deployment architecture adopted (deploy.php with tasks, hosts, hooks)
- [ ] Directory structure validated (`releases/`, `current`, `shared/`, `.dep/`)
- [ ] Deployment hooks ordered correctly (`deploy:info`, `deploy:setup`, `deploy:lock`)
- [ ] Multi-server parallel deployment designed in recipe
- [ ] Rollback mechanism validated (`deploy:rollback` reverts to previous release)

---

# Implementation Checklist

- [ ] Hosts defined with correct SSH connection parameters (user, port, forward agent)
- [ ] Shared files configured (`.env`, `storage/` directory)
- [ ] Writable directories defined for Laravel storage
- [ ] `artisan:migrate` task placed after symlink swap (or before with `--force`)
- [ ] Deployment lock enabled to prevent concurrent deploys
- [ ] Slack notification hook configured for deploy success/failure

---

# Performance Checklist

- [ ] Composer install optimized with `--no-dev --optimize-autoloader --prefer-dist`
- [ ] npm build step cached (skip if node_modules unchanged)
- [ ] Deploy time measured and optimized (target under 3 minutes)
- [ ] Release cleanup configured (keep 3-5 releases to limit disk usage)
- [ ] OPcache cleared after symlink swap (`opcache_reset()` or artisan command)

---

# Security Checklist

- [ ] SSH key-based auth enforced (no password, agent forwarding enabled)
- [ ] `.env` file permissions set to 600 in shared directory
- [ ] deploy.php excluded from public version control if containing sensitive info
- [ ] Deployment user has sudo-only access where needed
- [ ] CI/CD deployment key scoped to deploy-only permissions

---

# Reliability Checklist

- [ ] Deployment lock tested (concurrent deploy returns "locked" error)
- [ ] Rollback tested (`dep rollback` reverts to previous working release)
- [ ] Failed release handling tested (skip symlink update on failure)
- [ ] Deployment timeout configured (default 5 minutes, tune for large apps)
- [ ] Migration ordering validated for zero-downtime deployments

---

# Testing Checklist

- [ ] Syntax check of deploy.php (`dep list` shows all tasks)
- [ ] Staging deployment tested with same recipe
- [ ] Rollback tested end-to-end (deploy bad code, rollback, confirm revert)
- [ ] Lock prevention tested (concurrent deploy attempts)
- [ ] CI/CD integration tested (trigger deploy via CI, verify result)

---

# Maintainability Checklist

- [ ] deploy.php version-controlled with clear commit history
- [ ] Host inventory maintained separately from recipe (inventory file)
- [ ] Task hooks documented (before/after/success/failure blocks)
- [ ] Deployment runbook created with common Deployer commands
- [ ] Deployer version pinned in `composer.json`

---

# Anti-Pattern Prevention Checklist

- [ ] No dependency install on production server (must be in release build step)
- [ ] No `.env` file committed to git repository
- [ ] No deployment without rollback capability tested
- [ ] No concurrent deployments on same server
- [ ] No file modifications inside release directories outside Deployer

---

# Production Readiness Checklist

- [ ] Rollback tested and documented in runbook
- [ ] Slack notifications configured for deploy results
- [ ] Release retention policy configured (keep 3 releases)
- [ ] Timeout configured for slow deployments (e.g., 10 min for large apps)
- [ ] Deployer version locked to avoid breaking API changes
- [ ] Deployment tested from CI/CD pipeline end-to-end

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: recipe, hosts, tasks, hooks configured
- [ ] Security requirements satisfied: SSH keys, .env, secrets secured
- [ ] Performance requirements satisfied: composer/npm optimized, deploy time measured
- [ ] Testing requirements satisfied: deploy, rollback, lock tested on staging
- [ ] Anti-pattern checks passed: no manual edits, no concurrent deploys
- [ ] Production readiness verified: notifications, retention, CI/CD integration ready

---

# Related References

- Envoyer Zero-Downtime Deployments (KU-003) -- paid alternative
- GitHub Actions CI/CD (KU-008) -- CI integration with Deployer
- Laravel Forge Provisioning (KU-001) -- servers deployable by Deployer
- Database Migration in CI (KU-019) -- migration strategy with Deployer
