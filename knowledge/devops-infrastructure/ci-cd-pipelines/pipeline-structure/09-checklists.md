# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** pipeline-structure
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Workflow triggers configured (push, pull_request, tags) for appropriate branches
- [ ] Matrix testing configured for PHP version and dependency combinations
- [ ] Service containers configured for database and Redis in test jobs
- [ ] Caching configured for Composer and npm dependencies
- [ ] Artifact passing set up between build and deploy jobs
- [ ] Deployment pipeline pattern established (test -> build -> deploy)

---

# Architecture Checklist

- [ ] Pipeline stage structure designed (lint, test, build, deploy, post-deploy)
- [ ] Trigger filter strategy defined (which branches trigger which stages)
- [ ] Matrix testing dimension defined (PHP versions, dependency sets)
- [ ] Service container topology designed (DB, Redis, Mailpit for test)
- [ ] Artifact and cache architecture designed for stage progression

---

# Implementation Checklist

- [ ] Lint job configured (Pint or PHP-CS-Fixer)
- [ ] Static analysis job configured (PHPStan target level 5+)
- [ ] Test job configured with matrix (PHP 8.2/8.3/8.4)
- [ ] Service containers defined for test job (MySQL/PostgreSQL, Redis)
- [ ] Build job configured for asset compilation (npm/Vite)
- [ ] Deploy job integrated with Forge API, Envoyer, Vapor CLI, or Deployer

---

# Performance Checklist

- [ ] Composer cache keyed on `composer.lock` for optimal hit rate
- [ ] npm cache keyed on `package-lock.json`
- [ ] Matrix jobs run in parallel for fastest feedback
- [ ] Workflow duration target set and monitored
- [ ] Artifact size minimized (only deployable files)

---

# Security Checklist

- [ ] GitHub Secrets used for all sensitive values
- [ ] `GITHUB_TOKEN` scoped minimally
- [ ] OIDC configured for cloud provider deployment auth
- [ ] Deployment tokens stored as repository secrets
- [ ] Pull request workflows from forks restricted

---

# Reliability Checklist

- [ ] Job dependency chain enforced (deploy waits for test)
- [ ] Retry configured for transient failures
- [ ] Timeout configured per job and per workflow
- [ ] Cache invalidation on lock file changes
- [ ] Rollback step defined in deploy job

---

# Testing Checklist

- [ ] Workflow execution verified on pull request
- [ ] Matrix test results verified across all PHP versions
- [ ] Service container integration tested
- [ ] Artifact passing between build and deploy verified
- [ ] Cache hit/miss behavior validated

---

# Maintainability Checklist

- [ ] Workflow files organized with reusable actions
- [ ] Action versions pinned for reproducibility
- [ ] Environment configuration documented
- [ ] Secrets inventory maintained
- [ ] Pipeline documentation in project wiki

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in workflow YAML (use secrets store)
- [ ] No monolithic single-job pipeline
- [ ] No cache without invalidation strategy
- [ ] No hardcoded environment names
- [ ] No fork-unfriendly triggers (pull_request_target requires careful review)

---

# Production Readiness Checklist

- [ ] Workflow status badge on README
- [ ] Deployment approval environment configured
- [ ] Workflow timeout configured (60 min)
- [ ] Notifications configured for pipeline failures
- [ ] Scheduled workflow for nightly maintenance
- [ ] Rollback workflow tested

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: triggers, matrix, services, stages configured
- [ ] Security requirements satisfied: secrets, OIDC, token scoping configured
- [ ] Performance requirements satisfied: caching, parallel execution, optimized workflow
- [ ] Testing requirements satisfied: matrix tests, artifact passing, integration verified
- [ ] Anti-pattern checks passed: no secrets in YAML, no monolithic pipeline
- [ ] Production readiness verified: badges, approval gates, notifications configured

---

# Related References

- GitLab CI for Laravel (KU-009) -- alternative CI platform
- Deployer PHP (KU-008) -- deployment tool integrated via GitHub Actions
- Laravel Vapor (KU-015) -- deploy via Vapor CLI in GitHub Actions
- Envoyer Zero-Downtime (KU-003) -- deploy trigger via Envoyer API
- Database Migration in CI (KU-019)
