# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Apply least privilege:
- [ ] Audit all secret access.
- [ ] Implement emergency revocation
- [ ] Never commit secrets to version control.
- [ ] Rotate secrets regularly
- [ ] Each environment (dev, staging, production) has unique secrets.
- [ ] Emergency revocation process exists and is tested.
- [ ] No secrets are committed to version control (verified with scanning tools).
- [ ] Rules for PII Pseudonymization
- [ ] Each environment (dev, staging, production) has unique secrets
- [ ] Emergency revocation process exists and is tested
- [ ] No secrets are committed to version control (verified with scanning tools)
- [ ] **Audit secret access**: Enable access logging on the secrets manager. Monitor for unusual access patterns (off-hours reads, unexpected services, high frequency). Set up alerts.
- [ ] **Configure automated rotation**: Set up key rotation every 90 days. Generate new key â†’ validate against provider â†’ update vault â†’ wait for cache TTL â†’ revoke old key. Use secrets manager's built-in rotation if available.
- [ ] **Implement emergency revocation**: Create a runbook for secret compromise: revoke immediately at provider â†’ update vault â†’ force cache refresh on all instances (short TTL) â†’ verify old key is no longer used â†’ rotate all related keys.
- [ ] 100% of production secrets stored in secrets manager with encryption at rest
- [ ] Automated rotation runs on schedule (every 90 days) with zero downtime
- [ ] Emergency revocation completes in <5 minutes (compromise â†’ revoke â†’ propagate)

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Apply least privilege:
- [ ] Audit all secret access.
- [ ] Implement emergency revocation
- [ ] Never commit secrets to version control.
- [ ] Rotate secrets regularly
- [ ] Use a dedicated secrets manager
- [ ] **Audit secret access**: Enable access logging on the secrets manager. Monitor for unusual access patterns (off-hours reads, unexpected services, high frequency). Set up alerts.
- [ ] **Configure automated rotation**: Set up key rotation every 90 days. Generate new key â†’ validate against provider â†’ update vault â†’ wait for cache TTL â†’ revoke old key. Use secrets manager's built-in rotation if available.
- [ ] **Implement emergency revocation**: Create a runbook for secret compromise: revoke immediately at provider â†’ update vault â†’ force cache refresh on all instances (short TTL) â†’ verify old key is no longer used â†’ rotate all related keys.
- [ ] **Implement least privilege access**: Each environment (dev, staging, production) has separate keys. Each service has its own credentials with minimum required permissions. Document who can access which secrets.
- [ ] **Implement secret fetching at startup**: Create a service provider that fetches all secrets at application startup and caches them in-memory with a 5-15 minute TTL. Never fetch from vault on the request path.
- [ ] **Inventory all secrets**: List every credential in the system: LLM provider keys, vector DB credentials, monitoring service tokens, database passwords, encryption keys, signing secrets. Classify by sensitivity.

---

# Performance Checklist

- [ ] Batch secret fetching: fetch all secrets at startup in a single API call rather than individual fetches.
- [ ] Cache invalidation on rotation must be near-instant (<1s). Use pub/sub or short TTLs.
- [ ] Encryption/decryption overhead is negligible (<1ms) for symmetric keys.
- [ ] For high-availability, cache secrets in local memory with a fallback to fetch on cache miss.
- [ ] Secrets manager API calls add 5-50ms latency. Cache aggressively with 5-15 minute TTL.
- [ ] Batch secret fetching: fetch all secrets in one API call at startup rather than individual fetches
- [ ] Cache refresh: scheduled TTL expiry, not per-request vault calls
- [ ] Encryption/decryption overhead: negligible (<1ms) for symmetric keys

---

# Security Checklist

- [ ] Developer access:
- [ ] Incident response:
- [ ] Leak detection:
- [ ] Secret sprawl:
- [ ] Shared secrets:
- [ ] Batch secret fetching: fetch all secrets in one API call at startup rather than individual fetches
- [ ] Encryption/decryption overhead: negligible (<1ms) for symmetric keys
- [ ] Environment isolation: dev key leak shouldn't affect production (separate keys, separate vault paths)

---

# Reliability Checklist

- [ ] Hardcoding fallback values in config files when the vault is unreachable â€” creates a leak vector.
- [ ] Logging secrets in application logs or error messages.
- [ ] Not rotating secrets â€” a year-old secret is almost certainly compromised.
- [ ] Storing secrets in `.env` files that are committed to git or shared via email/chat.
- [ ] Using the same API key across all environments (dev, staging, production).

---

# Testing Checklist

- [ ] 100% of production secrets stored in secrets manager with encryption at rest
- [ ] Automated rotation runs on schedule (every 90 days) with zero downtime
- [ ] Each environment (dev, staging, production) has unique secrets
- [ ] Each environment (dev, staging, production) has unique secrets.
- [ ] Emergency revocation completes in <5 minutes (compromise â†’ revoke â†’ propagate)
- [ ] Emergency revocation process exists and is tested
- [ ] Emergency revocation process exists and is tested.
- [ ] No secrets are committed to version control (verified with scanning tools)
- [ ] No secrets are committed to version control (verified with scanning tools).
- [ ] Production secrets are stored in a dedicated secrets manager (not env vars or config files)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Config Files as Secrets](#1-config-files-as-secrets)]
- [ ] [[Hardcoded Fallback Defaults](#2-hardcoded-fallback-defaults)]
- [ ] [[Shared Service Account Credentials](#3-shared-service-account-credentials)]
- [ ] [[Vault as a File System](#4-vault-as-a-file-system)]
- [ ] [[No Offboarding Process](#5-no-offboarding-process)]
- [ ] Config Files as Secrets:
- [ ] Hardcoded Defaults:
- [ ] No Offboarding:
- [ ] Shared Service Account:
- [ ] Vault as a File System:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Never log secrets â€” implement secret pattern redaction in log formatter
- [ ] Runbook for compromise: immediate revocation â†’ audit log review â†’ rotate all related keys â†’ notify stakeholders

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


