# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** blue-green-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Blue-green deployment strategy understood (atomic symlink swap for zero downtime)
- [ ] Health check verification configured as release gate after symlink swap
- [ ] Rollback procedure defined (instant revert by pointing symlink to previous release)
- [ ] GitHub/GitLab/Bitbucket integration configured for deployment triggers
- [ ] Multi-server deployment orchestration planned for load-balanced environments
- [ ] Database migration ordered correctly relative to deployment flow

---

# Architecture Checklist

- [ ] Symlink-swap mechanism implemented (current -> releases/N)
- [ ] Deployment pipeline hooks defined (clone, install, build, migrate, swap)
- [ ] Health check endpoint designed to gate the release (fail swap if unhealthy)
- [ ] Multi-server orchestration strategy determined (sequential or parallel)
- [ ] Rollback architecture validated (revert current symlink to previous release)
- [ ] Alternative tools evaluated (Envoyer vs Deployer PHP vs Octane)

---

# Implementation Checklist

- [ ] Deployment directory structure created (`releases/`, `current`, `shared/`)
- [ ] Health check endpoint implemented (return 200 on success, 500 on failure)
- [ ] Envoyer project created and connected to Git repository
- [ ] Deployment hooks configured (artisan migrate, queue restart, cache clear)
- [ ] Slack/email notifications configured for deployment results
- [ ] Server SSH keys added to Envoyer for secure access

---

# Performance Checklist

- [ ] Release preparation (composer install, npm build) optimized for speed
- [ ] Artifact caching considered to speed up subsequent deployments
- [ ] Health check timeout configured to avoid false negatives during slow startup
- [ ] Symlink swap transaction kept atomic and minimal (no I/O during swap)

---

# Security Checklist

- [ ] SSH key-based authentication enforced for deployment connections
- [ ] Deployment secrets stored in Envoyer dashboard (not in repository)
- [ ] Health check endpoint does not expose sensitive application details
- [ ] Envoyer API token scoped with minimal required permissions
- [ ] Previous releases retained for rollback, cleaned after retention period

---

# Reliability Checklist

- [ ] Health check failure triggers automatic rollback to previous release
- [ ] Deployment lock configured to prevent concurrent deployments
- [ ] Database migration ordering validated (run before or after symlink swap)
- [ ] Rollback tested end-to-end (simulate failure, verify revert)
- [ ] Multi-server deployments verified (all servers receive same release)

---

# Testing Checklist

- [ ] Health check endpoint tested with valid and invalid application states
- [ ] Deployment pipeline tested on staging environment (same directory layout)
- [ ] Rollback tested by deploying bad code and triggering revert
- [ ] Concurrent deployment prevention tested (deploy lock verified)
- [ ] Notification integration tested (Slack/email on deploy and failure)

---

# Maintainability Checklist

- [ ] Deployment script version-controlled in application repository
- [ ] Release retention policy documented (number of releases kept, cleanup schedule)
- [ ] Health check criteria documented for operators
- [ ] Envoyer project configuration backed up
- [ ] Deployment runbook maintained for incident response

---

# Anti-Pattern Prevention Checklist

- [ ] No migration run during low-traffic without verifying backward compatibility
- [ ] No deployment without health check gate (never force-swap unhealthy release)
- [ ] No manual symlink changes outside deployment tool
- [ ] No concurrent deploys to same server without lock
- [ ] No shared filesystem mutexes that block the symlink swap

---

# Production Readiness Checklist

- [ ] Health check monitoring integrated (alert on failed health checks)
- [ ] Deployment notification configured (team alerted on each deploy)
- [ ] Rollback test completed and documented
- [ ] Envoyer API token stored securely in CI/CD variables
- [ ] Previous release cleanup configured (retain last 3-5 releases)
- [ ] Blue-green deployment verified for zero packet loss during swap

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: symlink-swap and health check gate designed
- [ ] Security requirements satisfied: SSH keys, secrets, API tokens secured
- [ ] Performance requirements satisfied: release preparation optimized
- [ ] Testing requirements satisfied: deploy, health check, rollback tested
- [ ] Anti-pattern checks passed: no manual symlink changes, no deploy without health gate
- [ ] Production readiness verified: monitoring, notifications, retention policy ready

---

# Related References

- Laravel Octane Deployment (KU-006) -- replaces need for Envoyer
- Deployer PHP (KU-008) -- open-source alternative
- Database Migration in CI (KU-019)
- Laravel Forge Provisioning (KU-001) -- server layer for Envoyer
