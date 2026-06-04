# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 03-ci-cd-pipelines
**Knowledge Unit:** deployment-automation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] GitLab CI pipeline defined in `.gitlab-ci.yml` with test, build, deploy stages
- [ ] GitLab Runner configured (Docker executor, DIND for container builds)
- [ ] Environment-specific variables configured in GitLab CI/CD settings
- [ ] Deployment job configured for Forge API, Envoyer, Vapor, or K8s integration
- [ ] Docker-in-Docker (DIND) verified for container image building
- [ ] Multi-project pipelines evaluated for microservice Laravel apps

---

# Architecture Checklist

- [ ] Pipeline stage structure designed (test -> build -> deploy)
- [ ] Runner architecture determined (shared vs specific, Docker executor)
- [ ] Docker-in-Docker pattern validated for secure container builds
- [ ] Environment-based deployment designed (staging vs production rules)
- [ ] Container registry configured (GitLab built-in or external)

---

# Implementation Checklist

- [ ] `.gitlab-ci.yml` created with test stage (Pest/PHPUnit, PHPStan, Pint)
- [ ] Docker build stage configured with `docker build` and `docker push`
- [ ] Deploy stage configured (Forge API, Envoyer webhook, or kubectl)
- [ ] DIND service configured (`services: [docker:dind]`)
- [ ] Cache configured for Composer and npm dependencies
- [ ] Artifact passing configured between stages

---

# Performance Checklist

- [ ] Composer dependency caching configured with CI cache
- [ ] npm/Yarn build caching to skip rebuild on unchaged assets
- [ ] Docker layer caching for faster image builds
- [ ] Parallel job execution configured where possible (test matrix)
- [ ] Pipeline time measured and optimized (target under 10 minutes)

---

# Security Checklist

- [ ] GitLab CI variables used for secrets (not committed in yml)
- [ ] DIND security context configured (avoid privileged mode if possible)
- [ ] Docker registry credentials stored as CI variables
- [ ] Deployment API tokens stored as masked CI variables
- [ ] Runner tags used to control job execution environment

---

# Reliability Checklist

- [ ] Pipeline retry configured for transient failures (network, Docker pulls)
- [ ] Test stage blocks deploy stage on failure
- [ ] Deployment rollback step defined in pipeline
- [ ] Pipeline timeout configured to prevent runaway jobs
- [ ] Cache key invalidated on `composer.lock` or `package-lock.json` changes

---

# Testing Checklist

- [ ] Pipeline tested on a feature branch before merging to main
- [ ] DIND service verified (Docker commands run in pipeline)
- [ ] Artifact passing verified between build and deploy stages
- [ ] Cache hit/miss behavior validated
- [ ] Environment variable injection verified per environment

---

# Maintainability Checklist

- [ ] `.gitlab-ci.yml` organized with YAML anchors for reusability
- [ ] Pipeline templates created for common Laravel patterns
- [ ] Runner registration and maintenance documented
- [ ] CI/CD variable inventory maintained (which vars for which env)
- [ ] Pipeline documentation updated with stage descriptions

---

# Anti-Pattern Prevention Checklist

- [ ] No secrets committed in `.gitlab-ci.yml` (use CI variables)
- [ ] No privileged Docker mode unless absolutely necessary
- [ ] No single stage doing everything (test/build/deploy separated)
- [ ] No hardcoded environment names (use GitLab environments)
- [ ] No cache that persists across branches without invalidation

---

# Production Readiness Checklist

- [ ] Pipeline badge configured (status visible in README)
- [ ] Deployment approval gates configured for production (manual approval)
- [ ] Rollback pipeline defined or deployment revert step added
- [ ] Pipeline timeout configured (e.g., 30 min max)
- [ ] Runner availability monitored (queue depth, failure rate)
- [ ] Slack/email notifications configured for pipeline failures

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: pipeline stages and runner configured
- [ ] Security requirements satisfied: secrets in CI variables, DIND security reviewed
- [ ] Performance requirements satisfied: caching, parallel jobs, pipeline time optimized
- [ ] Testing requirements satisfied: feature branch pipeline validated
- [ ] Anti-pattern checks passed: no secrets in config, no privileged Docker
- [ ] Production readiness verified: badges, notifications, deployment gates configured

---

# Related References

- GitHub Actions CI/CD (KU-008) -- primary alternative
- Docker-in-Docker patterns (cross-domain)
- Laravel Forge Provisioning (KU-001) -- Forge API integration
- Kubernetes for Laravel (KU-013) -- GitLab CI + K8s deployment
