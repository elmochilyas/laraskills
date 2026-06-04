# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 08-environment-secrets-management
**Knowledge Unit:** vault-secrets-management
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] `.env` lifecycle defined (creation, distribution, rotation, backup)
- [ ] `config:cache` mechanics understood (env resolved at build, null return risks)
- [ ] Vault integration selected and configured (Doppler, HashiCorp Vault, AWS SM)
- [ ] CI/CD secret injection configured (GitHub Secrets, GitLab masked variables)
- [ ] Secret rotation strategy defined (DB passwords, APP_KEY, API keys)
- [ ] Platform-specific management configured (Forge, Vapor, K8s External Secrets)

---

# Architecture Checklist

- [ ] `.env` lifecycle designed per environment (local, staging, production)
- [ ] `config:cache` timing understood (env resolved at cache build, not per-request)
- [ ] Vault integration pattern selected (Doppler for SaaS, Vault for self-hosted, AWS SM for AWS)
- [ ] CI/CD secret injection architecture (masked variables, environment-specific)
- [ ] Rotation strategy per secret type (DB rotation, APP_KEY rotation, API key renewal)
- [ ] Platform-specific integration (Forge env dashboard, Vapor push, K8s External Secrets Operator)

---

# Implementation Checklist

- [ ] `.env.example` maintained with all required variables
- [ ] `.env` in .gitignore, permissions 600 on production
- [ ] Doppler/Vault/AWS SM integrated via provider package or script
- [ ] CI/CD secrets configured in GitHub/GitLab dashboard
- [ ] Secret rotation script created for DB passwords and APP_KEY
- [ ] Forge env management or Vapor env push/pull configured

---

# Performance Checklist

- [ ] `config:cache` tested with vault-integrated env (no null returns)
- [ ] Vault/Doppler resolution latency measured (<10ms overhead)
- [ ] AWS Secrets Manager rotation tested during off-peak
- [ ] Env variable lookup avoided in hot request path
- [ ] Config cache rebuilt on every deploy

---

# Security Checklist

- [ ] `.env` file access restricted to deployment user and root
- [ ] Vault transit encryption verified
- [ ] Secrets never appear in log files or error pages
- [ ] APP_KEY rotation tested and documented
- [ ] DB password rotation scheduled regularly
- [ ] API keys stored in vault, never in code or config files

---

# Reliability Checklist

- [ ] `.env.example` keys kept in sync with production keys
- [ ] Missing env variable detection (RuntimeException handling)
- [ ] Vault/Doppler failover strategy (cached config file fallback)
- [ ] Secret rotation tested in staging before production
- [ ] Rotation window communicated to team

---

# Testing Checklist

- [ ] `.env.example` covers all keys in config files
- [ ] `config:cache` with vault integration passes
- [ ] Vault/Doppler connection tested (env vars resolve correctly)
- [ ] CI/CD secret masking verified (secrets not shown in logs)
- [ ] APP_KEY rotation tested (old key still decrypts existing data)

---

# Maintainability Checklist

- [ ] `.env.example` documented with descriptions
- [ ] Secret inventory maintained with rotation schedule
- [ ] Vault configuration version-controlled
- [ ] Rotation runbook documented step-by-step
- [ ] Team notified of secret rotation schedule

---

# Anti-Pattern Prevention Checklist

- [ ] No `.env` committed to git (ever)
- [ ] No secrets in config files or source code
- [ ] No secrets in logs, debug output, or error pages
- [ ] No `.env` sent via email, Slack, or chat
- [ ] No hardcoded fallback values in config that leak secrets

---

# Production Readiness Checklist

- [ ] Production `.env` verified (correct values, 600 permissions)
- [ ] `config:cache` works with vault integration
- [ ] Vault/Doppler failover tested (network outage scenario)
- [ ] CI/CD secrets masked in pipeline logs
- [ ] Rotation schedule documented with calendar reminders
- [ ] Secret access audit trail enabled (vault audit log)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: .env lifecycle, vault integration, rotation designed
- [ ] Security requirements satisfied: permissions, encryption, no secrets in logs
- [ ] Performance requirements satisfied: config cache, vault latency, rotation timing
- [ ] Testing requirements satisfied: .env coverage, vault, rotation tested
- [ ] Anti-pattern checks passed: no secrets in repo, no hardcoded values, no log leakage
- [ ] Production readiness verified: prod .env, failover, audit trail, rotation schedule

---

# Related References

- Forge (env dashboard)
- Vapor (env push/pull)
- CI/CD (secret injection)
- K8s (External Secrets)
