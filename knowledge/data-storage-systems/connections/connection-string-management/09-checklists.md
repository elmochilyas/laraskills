# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.11 Connection string management (environment variables, dynamic password rotation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Never hardcode database credentials applied
- [ ] Use `DATABASE_URL` for simplicity applied
- [ ] Implement credential rotation without downtime applied
- [ ] Encrypt credentials at rest applied
- [ ] Validate connection strings before use applied
- [ ] All database credentials come from environment variables or secrets manager
- [ ] `.env` file is in `.gitignore` and not committed
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation flow is implemented and tested (config-set → purge → reconnect)
- [ ] Per-tenant credentials are encrypted at rest in the database
- [ ] Hardcoded credentials in config/database.php prevented
- [ ] Logging connection strings prevented
- [ ] Not purging after runtime credential change prevented
- [ ] Storing tenant credentials unencrypted prevented
- [ ] `.env` file committed to git prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation works without application restart
- [ ] Per-tenant credentials encrypted at rest

---

# Architecture Checklist

- [ ] Simple deployments
- [ ] Secrets manager integration
- [ ] Multi-tenant connection strings
- [ ] Sharded connection strings
- [ ] Failover connection strings

---

# Implementation Checklist

- [ ] Never hardcode database credentials applied
- [ ] Use `DATABASE_URL` for simplicity applied
- [ ] Implement credential rotation without downtime applied
- [ ] Encrypt credentials at rest applied
- [ ] Validate connection strings before use applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Store credentials in environment variables only: completed
- [ ] Use `DATABASE_URL` for single-source-of-truth: completed
- [ ] Implement runtime credential rotation: completed
- [ ] For per-tenant credentials, encrypt at rest: completed
- [ ] Protect the `.env` file and never commit it: completed

---

# Performance Checklist

- [ ] Performance: Reading from environment variables at boot is free (in-memory).
- [ ] Performance: Reading from secrets manager at boot adds 20–200ms depending on the provider.
- [ ] Performance: Runtime credential rotation adds purge/reconnect latency (1–50ms) but only during rotation events.
- [ ] Performance: For high-traffic applications, cache secret manager results locally with a TTL (e.g., 5 minutes) to avoid fetching secrets on every connection switch.
- [ ] Performance: Decrypting per-tenant credentials adds <1ms overhead per request.

---

# Security Checklist

- [ ] Data access controls reviewed
- [ ] Input validation in place
- [ ] Secrets properly managed

---

# Reliability Checklist

- [ ] Hardcoded credentials in config/database.php prevented
- [ ] Logging connection strings prevented
- [ ] Not purging after runtime credential change prevented
- [ ] Storing tenant credentials unencrypted prevented
- [ ] `.env` file committed to git prevented

---

# Testing Checklist

- [ ] All database credentials come from environment variables or secrets manager
- [ ] `.env` file is in `.gitignore` and not committed
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation flow is implemented and tested (config-set → purge → reconnect)
- [ ] Per-tenant credentials are encrypted at rest in the database
- [ ] All database credentials come from environment variables or secrets manager
- [ ] `.env` file is in `.gitignore` and not committed
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation flow is implemented (config-set → purge → reconnect)
- [ ] Per-tenant credentials are encrypted at rest
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation works without application restart
- [ ] Per-tenant credentials encrypted at rest
- [ ] Connection strings never appear in logs
- [ ] `.env` file properly protected and git-ignored

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Single `.env` for multi-environment prevented
- [ ] Hardcoded credentials in config/database.php â€” security breach prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Config files with hardcoded fallbacks prevented
- [ ] Hardcoded credentials in config/database.php prevented
- [ ] Logging connection strings prevented
- [ ] Not purging after runtime credential change prevented
- [ ] Storing tenant credentials unencrypted prevented
- [ ] `.env` file committed to git prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
