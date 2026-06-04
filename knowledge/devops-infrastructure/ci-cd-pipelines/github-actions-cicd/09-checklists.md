# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** github-actions-cicd
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] GitHub Actions workflow created in `.github/workflows/laravel.yml`
- [ ] Linting configured (Pint or PHP-CS-Fixer) in CI pipeline
- [ ] Static analysis configured (PHPStan level 5+) in CI pipeline
- [ ] Testing configured with Pest/PHPUnit using matrix PHP versions
- [ ] Asset building configured (npm/Vite) in CI pipeline
- [ ] Deployment integrated via Forge API, Envoyer, Vapor CLI, Deployer, or Fly.io

---

# Architecture Checklist

- [ ] Pipeline trigger events defined (push, pull_request, tags)
- [ ] Matrix testing strategy designed (PHP 8.2, 8.3, 8.4 with dependencies)
- [ ] Service containers configured for database and Redis in test jobs
- [ ] Test -> Build -> Deploy pipeline pattern established
- [ ] Caching strategy designed for Composer, npm, and build artifacts
- [ ] Artifact passing defined between build and deploy stages

---

# Implementation Checklist

- [ ] `setup-php` action configured with PHP version and extensions
- [ ] Composer dependency caching configured with `actions/cache`
- [ ] npm/Yarn caching configured for asset build
- [ ] PHPStan configured to run in CI (level 5 minimum)
- [ ] Pest/PHPUnit configured with SQLite or MySQL service container
- [ ] Deployment step configured with appropriate API/webhook

---

# Performance Checklist

- [ ] Composer cache hit verified (restore on `composer.lock` unchanged)
- [ ] npm cache hit verified (skip install when `package-lock.json` unchanged)
- [ ] Matrix jobs run in parallel for faster feedback
- [ ] Workflow time measured and optimized (target under 5 minutes)
- [ ] Build artifact size minimized for download to deployment

---

# Security Checklist

- [ ] GitHub Secrets used for all sensitive values (actions secrets)
- [ ] `GITHUB_TOKEN` scoped minimally for the workflow
- [ ] OIDC authentication configured for cloud provider access
- [ ] Deployment API tokens stored as repository secrets
- [ ] Secret scanning enabled on repository

---

# Reliability Checklist

- [ ] Workflow retry configured on `schedule` event (cron fallback)
- [ ] Test failure blocks deployment (strict job dependency)
- [ ] Cache fallback configured (fresh install on cache miss)
- [ ] Workflow timeout configured (prevent zombie workflow runs)
- [ ] Deploy step has rollback action defined

---

# Testing Checklist

- [ ] Workflow tested on pull_request before merging to main
- [ ] Matrix testing verified (all PHP versions pass)
- [ ] Service container integration tested (database migrations in CI)
- [ ] Linting and static analysis run and pass
- [ ] Deployment step tested with a staging environment

---

# Maintainability Checklist

- [ ] Workflow organized with reusable workflows for stages
- [ ] Action versions pinned (e.g., `actions/checkout@v4`)
- [ ] Environment names documented in README
- [ ] Workflow badges added to README (passing/failing)
- [ ] Secrets inventory maintained in team documentation

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets committed to workflow files (use GitHub Secrets)
- [ ] No long-running single job (break into matrix or parallel jobs)
- [ ] No cache that is never invalidated on dependency changes
- [ ] No hardcoded environment names
- [ ] No `pull_request` trigger that would leak secrets from forks

---

# Production Readiness Checklist

- [ ] Workflow badge configured in README
- [ ] Deployment approval environment configured (production protection rules)
- [ ] Workflow timeout configured (60 min max)
- [ ] Slack/Discord notifications configured for failures
- [ ] Scheduled workflow set for nightly maintenance tasks
- [ ] Rollback step or workflow defined for failed deploys

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: pipeline triggers, matrix, services configured
- [ ] Security requirements satisfied: GitHub Secrets, OIDC, minimal GITHUB_TOKEN scope
- [ ] Performance requirements satisfied: caching, parallel matrix, optimized time
- [ ] Testing requirements satisfied: PR testing, matrix verification, linter passing
- [ ] Anti-pattern checks passed: no secrets in config, no fork-leaking triggers
- [ ] Production readiness verified: badges, notifications, approval gates configured

---

# Related References

- GitLab CI for Laravel (KU-009) -- alternative CI platform
- Deployer PHP (KU-008) -- deployment tool integrated via GitHub Actions
- Laravel Vapor (KU-015) -- deploy via Vapor CLI in GitHub Actions
- Envoyer Zero-Downtime (KU-003) -- deploy trigger via Envoyer API
- Database Migration in CI (KU-019)
