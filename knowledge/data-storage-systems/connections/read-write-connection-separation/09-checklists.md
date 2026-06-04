# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.9 Read/write connection separation (dedicated read connections vs. merged)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Asymmetric pool sizing applied
- [ ] Enable sticky writes applied
- [ ] Read fallback to write pool applied
- [ ] Separate health check thresholds applied
- [ ] Tag connections by purpose applied
- [ ] Read and write connections have asymmetric pool configurations
- [ ] `sticky` is set to `true` for connections with read/write separation
- [ ] Read fallback to write connection is configured (or ProxySQL handles this)
- [ ] Health check timeouts differ between read (lenient) and write (aggressive) pools
- [ ] Connections are tagged by purpose (read, write) in monitoring
- [ ] Same pool config for read and write prevented
- [ ] Sticky writes disabled prevented
- [ ] No read fallback on replica failure prevented
- [ ] Identical health checks for read/write prevented
- [ ] Read replicas in different regions with high latency prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Asymmetric pool sizing matches traffic patterns
- [ ] Sticky writes prevent stale-read bugs
- [ ] Read fallback handles replica failures gracefully

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Asymmetric pool sizing applied
- [ ] Enable sticky writes applied
- [ ] Read fallback to write pool applied
- [ ] Separate health check thresholds applied
- [ ] Tag connections by purpose applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Configure asymmetric pool sizes in `config/database.php`: completed
- [ ] Enable sticky writes: completed
- [ ] Configure read fallback to write pool: completed
- [ ] Differentiate health check thresholds: completed
- [ ] Tag connections by purpose: completed

---

# Performance Checklist

- [ ] Performance: Read pool should be 2–4× larger than write pool for typical web applications.
- [ ] Performance: Write pool should be sized for peak write concurrency, not sustained load.
- [ ] Performance: Sticky writes add overhead (reads go to primary after writes). Acceptable for write-heavy endpoints.
- [ ] Performance: Read replica lag can be 100ms–10s. Stale read tolerance depends on application requirements.
- [ ] Performance: Each replica connection consumes DB memory. Total read pool across all replicas should be distributed proportionally to replica sizing.

---

# Security Checklist

- [ ] Security: Read replicas may have different security requirements (e.g., less sensitive data accessible). Ensure the read connection user has appropriate priv...
- [ ] Security: Write connection user should have minimal privileges (INSERT, UPDATE, DELETE on application tables only).
- [ ] Security: Sticky writes route reads to the primary after a write, bypassing replicas. This is expected behavior, not a security concern.
- [ ] Security: Tag read and write connections separately in audit logs.

---

# Reliability Checklist

- [ ] Same pool config for read and write prevented
- [ ] Sticky writes disabled prevented
- [ ] No read fallback on replica failure prevented
- [ ] Identical health checks for read/write prevented
- [ ] Read replicas in different regions with high latency prevented

---

# Testing Checklist

- [ ] Read and write connections have asymmetric pool configurations
- [ ] `sticky` is set to `true` for connections with read/write separation
- [ ] Read fallback to write connection is configured (or ProxySQL handles this)
- [ ] Health check timeouts differ between read (lenient) and write (aggressive) pools
- [ ] Connections are tagged by purpose (read, write) in monitoring
- [ ] Read and write connections have asymmetric pool configurations
- [ ] `sticky` is set to `true` for connections with read/write separation
- [ ] Read fallback to write connection is configured
- [ ] Health check timeouts differ between read (lenient) and write (aggressive)
- [ ] Connections are tagged by purpose in monitoring
- [ ] Asymmetric pool sizing matches traffic patterns
- [ ] Sticky writes prevent stale-read bugs
- [ ] Read fallback handles replica failures gracefully
- [ ] Health check thresholds differentiate read vs write criticality
- [ ] Connection tags distinguish read vs write traffic in monitoring

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Single connection pool for read/write merged traffic prevented
- [ ] Same pool config for read and write â€” copy-paste between arrays prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Write pool used for reporting queries prevented
- [ ] Same pool config for read and write prevented
- [ ] Sticky writes disabled prevented
- [ ] No read fallback on replica failure prevented
- [ ] Identical health checks for read/write prevented
- [ ] Read replicas in different regions with high latency prevented

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
