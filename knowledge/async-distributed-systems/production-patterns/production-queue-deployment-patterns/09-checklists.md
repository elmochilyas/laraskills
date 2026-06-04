# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Production Patterns
**Knowledge Unit:** Production Queue Deployment Patterns
**Generated:** 2026-06-03
**Based on:** 05-rules.md, 06-skills.md, 08-anti-patterns.md
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md)

---

# Quick Checklist

- [ ] `horizon:terminate` called before code deploy
- [ ] `stopwaitsecs` configured to `retry_after + 10` in supervisor config
- [ ] Supervisor `autorestart=true` for automatic restart after termination
- [ ] Always run php artisan horizon:terminate during every deployment. followed
- [ ] Always test queue job execution in a staging environment before production. followed
- [ ] Prefer canary deployments for destructive job changes. followed
- [ ] Always monitor the failed jobs count intensively for 30 minutes after each deploy. followed
- [ ] Skipping horizon:terminate on Deploy â€” Old Code Runs Indefinitely prevented
- [ ] Not Testing Queue Jobs in Staging â€” CLI vs Web Context Mismatch prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always run php artisan horizon:terminate during every deployment. followed
- [ ] Always test queue job execution in a staging environment before production. followed
- [ ] Prefer canary deployments for destructive job changes. followed
- [ ] Always monitor the failed jobs count intensively for 30 minutes after each deploy. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Skipping horizon:terminate on Deploy â€” Old Code Runs Indefinitely prevented
- [ ] Not Testing Queue Jobs in Staging â€” CLI vs Web Context Mismatch prevented
- [ ] Global Rollout of Destructive Job Changes â€” Mass Data Corruption prevented
- [ ] No Post-Deploy Monitoring â€” Silent Failure Blindness prevented
- [ ] Deploying During Queue Processing Peak â€” Maximum Impact prevented
- [ ] stopwaitsecs Too Short â€” Workers Killed Mid-Job prevented
- [ ] Always run php artisan horizon:terminate during every deployment. followed
- [ ] Always test queue job execution in a staging environment before production. followed
- [ ] Prefer canary deployments for destructive job changes. followed
- [ ] Always monitor the failed jobs count intensively for 30 minutes after each deploy. followed

---

# Testing Checklist

- [ ] `horizon:terminate` called before code deploy
- [ ] `stopwaitsecs` configured to `retry_after + 10` in supervisor config
- [ ] Supervisor `autorestart=true` for automatic restart after termination
- [ ] Canary deployment used for destructive job changes

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Skipping horizon:terminate on Deploy â€” Old Code Runs Indefinitely prevented
- [ ] Not Testing Queue Jobs in Staging â€” CLI vs Web Context Mismatch prevented
- [ ] Global Rollout of Destructive Job Changes â€” Mass Data Corruption prevented
- [ ] No Post-Deploy Monitoring â€” Silent Failure Blindness prevented
- [ ] Deploying During Queue Processing Peak â€” Maximum Impact prevented
- [ ] stopwaitsecs Too Short â€” Workers Killed Mid-Job prevented
- [ ] Assuming HTTP Tests Cover Queue Behavior prevented
- [ ] No Rollback Plan for Queue-Breaking Deploys prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- Prerequisites and related topics from domain docs

---


