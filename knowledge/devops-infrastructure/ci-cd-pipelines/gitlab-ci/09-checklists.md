# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** gitlab-ci
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `.gitlab-ci.yml` configured with stages (test, build, deploy)
- [ ] GitLab Runner registered with Docker executor
- [ ] Docker-in-Docker (DIND) configured for container image building
- [ ] Environment-specific CI/CD variables set in GitLab UI
- [ ] Multi-project pipelines evaluated for cross-repo dependencies
- [ ] GitLab Container Registry configured for Docker images

---

# Architecture Checklist

- [ ] Pipeline stages designed for Laravel workflow (lint, test, build, deploy)
- [ ] Runner type selected (shared or specific, Docker executor)
- [ ] DIND pattern validated for secure and efficient builds
- [ ] Environment-based deployment rules configured (branches map to envs)
- [ ] Multi-project pipeline architecture designed if needed (microservices)

---

# Implementation Checklist

- [ ] `.gitlab-ci.yml` written with lint job (Pint/PHP-CS-Fixer)
- [ ] Test job configured with PHPUnit/Pest and MySQL/PostgreSQL service
- [ ] Build job configured with Docker build to GitLab Registry
- [ ] Deploy job configured (Forge API, kubectl, or SSH deploy)
- [ ] Cache configured for Composer and npm across stages
- [ ] DIND service added (`docker:dind`) with TLS disabled

---

# Performance Checklist

- [ ] Composer caching configured (keyed on `composer.lock`)
- [ ] npm caching configured (keyed on `package-lock.json`)
- [ ] Docker layer caching for faster image builds
- [ ] Parallel execution of independent jobs
- [ ] Pipeline duration optimized (target under 10 min)

---

# Security Checklist

- [ ] CI/CD masked variables used for API tokens and secrets
- [ ] DIND runs in non-privileged mode if possible
- [ ] Container registry credentials not hardcoded
- [ ] Runner tags control which jobs run on specific runners
- [ ] Secret scanning enabled in repository settings

---

# Reliability Checklist

- [ ] Job retry configured for transient failures
- [ ] Pipeline timeout configured to prevent runaway jobs
- [ ] Test failure blocks subsequent stages
- [ ] Cache key includes lock files for proper invalidation
- [ ] Deployment has rollback procedure defined

---

# Testing Checklist

- [ ] Pipeline tested on feature branch before merging
- [ ] DIND integration verified (Docker commands succeed)
- [ ] Artifact passing between stages validated
- [ ] Cache hit ratio checked (aim for >80%)
- [ ] Multi-project pipeline tested if applicable

---

# Maintainability Checklist

- [ ] `.gitlab-ci.yml` uses YAML anchors for reusable definitions
- [ ] Pipeline templates stored in project for reproducibility
- [ ] CI/CD variable inventory maintained
- [ ] Runner maintenance documented
- [ ] Pipeline documentation updated with stage descriptions

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets in `.gitlab-ci.yml` (use CI/CD Settings)
- [ ] No privileged container mode unless required
- [ ] No monolithic job (break into stages)
- [ ] No hardcoded environment names (use variables)
- [ ] No cache that is never invalidated

---

# Production Readiness Checklist

- [ ] Pipeline status badge on README
- [ ] Manual approval gate for production deployment
- [ ] Rollback pipeline or job defined
- [ ] Pipeline timeout configured (60 min max)
- [ ] Runner queue depth monitored
- [ ] Notifications configured for pipeline failures

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: stages, runner, DIND configured
- [ ] Security requirements satisfied: masked variables, non-privileged DIND
- [ ] Performance requirements satisfied: caching, parallel jobs optimized
- [ ] Testing requirements satisfied: feature branch pipeline validated
- [ ] Anti-pattern checks passed: no secrets in config, no single-job pipeline
- [ ] Production readiness verified: badges, approval gates, notifications

---

# Related References

- GitHub Actions CI/CD (KU-008) -- primary alternative
- Docker-in-Docker patterns (cross-domain)
- Laravel Forge Provisioning (KU-001) -- Forge API integration
- Kubernetes for Laravel (KU-013) -- GitLab CI + K8s deployment
