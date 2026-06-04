# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** envoyer-zero-downtime
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Envoyer project created and connected to GitHub/GitLab/Bitbucket repository
- [ ] Symlink-swap zero-downtime deployment strategy understood
- [ ] Health check verification configured as a release gate
- [ ] Rollback tested (instant revert via Envoyer dashboard or API)
- [ ] Multi-server deployment configured for load-balanced environments
- [ ] Deployment hooks configured (migrate, queue restart, cache clear)

---

# Architecture Checklist

- [ ] Atomic symlink-swap mechanism validated (`current` symlink points to active release)
- [ ] Deployment pipeline hooks designed (clone, install, build, migrate, swap)
- [ ] Health check verification architecture defined (200=pass, 500=fail)
- [ ] Multi-server orchestration strategy determined (sequential or parallel)
- [ ] Rollback architecture designed (symlink revert to previous release)
- [ ] Comparison with Octane (replaces need for Envoyer) and Deployer PHP evaluated

---

# Implementation Checklist

- [ ] Envoyer connected to Git repository with deploy key
- [ ] Servers added to Envoyer with SSH key authentication
- [ ] Deployment hooks configured (artisan migrate --force, queue:restart, cache:clear)
- [ ] Health check endpoint URL configured for release validation
- [ ] Slack/email notifications configured for deploy results
- [ ] Multi-server setup verified (all servers receive same release)

---

# Performance Checklist

- [ ] Release preparation (composer install, npm build) measured and optimized
- [ ] OPcache cleared on symlink swap for fresh opcode cache
- [ ] Health check timeout configured (avoid false negatives on slow boot)
- [ ] Asset build caching configured to skip on unchanged code

---

# Security Checklist

- [ ] SSH keys stored in Envoyer for server access (scoped to deployment user)
- [ ] Envoyer API token stored in CI/CD as secret (if using external pipeline)
- [ ] Health check endpoint restricted (no sensitive data leaked)
- [ ] Environment variables stored in Envoyer, not in repository
- [ ] Deployment notification restricted to team members only

---

# Reliability Checklist

- [ ] Health check fail triggers automatic rollback to previous release
- [ ] Deployment lock configured to prevent concurrent deployments
- [ ] Rollback tested end-to-end (simulate failure, verify revert)
- [ ] Multi-server validation verified (all servers on same release)
- [ ] Previous releases cleaned up (retention policy configured)

---

# Testing Checklist

- [ ] Health check endpoint tested with valid/invalid app states
- [ ] Deployment pipeline tested on staging environment
- [ ] Rollback tested by deploying faulty code and triggering revert
- [ ] Multi-server verification tested (all servers respond after deploy)
- [ ] Notification integration tested (Slack/email alerts on deploy)

---

# Maintainability Checklist

- [ ] Envoyer project configuration documented in runbook
- [ ] Release retention policy documented (number of releases kept)
- [ ] Health check criteria documented for operational team
- [ ] Deployment runbook created for incident response
- [ ] SSH key rotation procedure documented

---

# Anti-Pattern Prevention Checklist

- [ ] No migration run without verifying backward compatibility
- [ ] No deployment without health check gate (never force-swap)
- [ ] No manual symlink changes outside Envoyer
- [ ] No concurrent deployments to same server
- [ ] No shared .env across different server types in multi-server

---

# Production Readiness Checklist

- [ ] Health check monitoring configured (alert on failed checks)
- [ ] Deployment notification integrated (Slack, email)
- [ ] Rollback tested and documented
- [ ] Envoyer API token secured in CI/CD secrets
- [ ] Previous release cleanup configured (retain 3-5 releases)
- [ ] Zero-downtime deployment verified (no connection drops during swap)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: symlink-swap and health check gate validated
- [ ] Security requirements satisfied: SSH keys, API tokens, secrets secured
- [ ] Performance requirements satisfied: release preparation optimized
- [ ] Testing requirements satisfied: deploy, health check, rollback tested
- [ ] Anti-pattern checks passed: no manual symlink changes, health check enforced
- [ ] Production readiness verified: monitoring, notifications, retention ready

---

# Related References

- Laravel Octane Deployment (KU-006) -- replaces need for Envoyer
- Deployer PHP (KU-008) -- open-source alternative
- Database Migration in CI (KU-019)
- Laravel Forge Provisioning (KU-001) -- server layer for Envoyer
