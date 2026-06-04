# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 08-environment-secrets-management
**Knowledge Unit:** environment-secret-management
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `.env` file pattern understood and never committed to version control
- [ ] `.env.example` committed as a template with placeholder values
- [ ] Secrets storage method selected (Forge env, Vapor push/pull, Doppler, Vault, AWS SM)
- [ ] `config:cache` implications understood (env resolution timing)
- [ ] CI/CD secret injection configured (GitHub Secrets, GitLab Variables)
- [ ] Secret rotation strategy defined (DB passwords, APP_KEY, API keys)

---

# Architecture Checklist

- [ ] `.env` file lifecycle designed (creation, distribution, rotation, backup)
- [ ] `config:cache` mechanics understood (env resolved at cache build time)
- [ ] Vault integration architecture (Doppler, HashiCorp Vault, AWS Secrets Manager)
- [ ] CI/CD secret injection pattern (GitHub Secrets, GitLab masked variables)
- [ ] Platform-specific management (Forge env dashboard, Vapor env push, K8s External Secrets)
- [ ] Least-privilege access to secrets designed

---

# Implementation Checklist

- [ ] `.env.example` created with all required variables documented
- [ ] `.env` added to `.gitignore`
- [ ] `APP_KEY` generated (`php artisan key:generate`)
- [ ] Production `.env` values configured in Forge/Vapor/Dashboard
- [ ] CI/CD secrets added for deployment tokens and API keys
- [ ] `config:cache` tested in production (no env null returns)

---

# Performance Checklist

- [ ] `config:cache` verified to not break with vault-integrated env vars
- [ ] Config cache rebuilt on every deploy (cache:clear in deploy script)
- [ ] Vault/Doppler latency tested (sub-millisecond env resolution)
- [ ] AWS Secrets Manager rotation tested for zero-downtime
- [ ] Environment variable lookup avoided in hot path (use config cache)

---

# Security Checklist

- [ ] `.env` file permissions set to 600 on production servers
- [ ] Vault/Doppler integration encrypted in transit
- [ ] Secrets never logged (ensure no secret leakage in error logs)
- [ ] `APP_KEY` rotated on team member offboarding
- [ ] DB passwords rotated on regular schedule
- [ ] API keys stored in vault, not in code

---

# Reliability Checklist

- [ ] `.env.example` kept in sync with actual `.env` keys
- [ ] Missing env variable detected (Laravel throws `RuntimeException`)
- [ ] Vault/Doppler failover strategy defined (cached fallback)
- [ ] CI/CD secret migration tested (no hardcoded values)
- [ ] Secret rotation tested in staging before production

---

# Testing Checklist

- [ ] `.env.example` validated against config files (all keys present)
- [ ] `config:cache` tested and app functions correctly
- [ ] Vault/Doppler integration tested (env vars resolved)
- [ ] CI/CD secret injection verified (pipeline uses secrets)
- [ ] Secret rotation tested (APP_KEY, DB password change)

---

# Maintainability Checklist

- [ ] `.env.example` documented with descriptions for each variable
- [ ] Secret inventory maintained (which secrets, where stored, rotation cadence)
- [ ] Vault/Doppler config version-controlled
- [ ] Environment variable changes communicated to team
- [ ] Rotation runbook documented

---

# Anti-Pattern Prevention Checklist

- [ ] No `.env` file committed to Git
- [ ] No hardcoded secrets in config files
- [ ] No secret values in log output or error pages
- [ ] No `.env` file shared via insecure channels (email, chat)
- [ ] No environment variable injection without validation

---

# Production Readiness Checklist

- [ ] `.env` on production server verified (correct values, permissions 600)
- [ ] `config:cache` built and app serves correctly
- [ ] Vault/Doppler integration active and failover tested
- [ ] CI/CD secrets configured and masked in logs
- [ ] Rotation schedule documented and calendar reminders set
- [ ] Audit trail for secret access configured

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: secret storage method, vault integration chosen
- [ ] Security requirements satisfied: .env permissions, no secrets in repo, encryption
- [ ] Performance requirements satisfied: config cache tested, vault latency acceptable
- [ ] Testing requirements satisfied: .env.example coverage, integration, rotation tested
- [ ] Anti-pattern checks passed: no secrets committed, no hardcoded values, no log leakage
- [ ] Production readiness verified: production .env verified, rotation schedule set

---

# Related References

- Laravel Forge Provisioning (KU-001) -- env management in Forge
- Laravel Vapor (KU-015) -- Vapor env push/pull
- CI/CD Pipelines (KU-008/009) -- CI secrets injection
- Database Deployment & Migration (KU-019/020) -- DB credentials management
- Terraform for Laravel (KU-018) -- secrets in IaC state files
