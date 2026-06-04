# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.16 Connection failover behavior (transparent reconnect, connection string rotation)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use proxy-level failover as the primary strategy applied
- [ ] Implement application-level failover as a fallback applied
- [ ] Use retry with exponential backoff applied
- [ ] Test failover regularly applied
- [ ] Log failover events with context applied
- [ ] Primary failover strategy is defined (proxy, DNS, or application-level)
- [ ] Retry logic with exponential backoff is implemented for connection errors
- [ ] Failover has been tested in staging with actual primary failure
- [ ] DNS TTL is set to 30–60s (if using DNS failover)
- [ ] Proxy health check intervals are configured for fast failure detection
- [ ] No failover handling prevented
- [ ] DNS failover with long TTL prevented
- [ ] No retry after connection failure prevented
- [ ] Not purging after failover in app-level prevented
- [ ] Assuming proxy handles all failover prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Failover works without manual intervention
- [ ] Retry logic recovers from transient connection failures
- [ ] Failover tested in staging — recovery time measured

---

# Architecture Checklist

- [ ] Proxy failover architecture
- [ ] DNS failover architecture
- [ ] Application-level failover architecture

---

# Implementation Checklist

- [ ] Use proxy-level failover as the primary strategy applied
- [ ] Implement application-level failover as a fallback applied
- [ ] Use retry with exponential backoff applied
- [ ] Test failover regularly applied
- [ ] Log failover events with context applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Choose and implement failover strategy: completed
- [ ] Implement retry with exponential backoff: completed
- [ ] Test failover regularly in staging: completed
- [ ] Log failover events with context: completed
- [ ] Plan read replica failover separately: completed

---

# Performance Checklist

- [ ] Performance: Proxy failover: 1–10s detection + promotion time. Query latency during this window is increased (failed queries + retries).
- [ ] Performance: DNS failover: 30–300s propagation (TTL-dependent). During this window, some instances connect to the old (failed) host, some to the new host.
- [ ] Performance: Application-level failover: adds purge (~0.01ms) + reconnect (1–50ms) to the first retried query. Subsequent queries use the new connection.
- [ ] Performance: Retry adds latency proportional to the number of retries. 3 retries with exponential backoff: ~2.6s added latency.
- [ ] Performance: Octane workers that hold stale connections after failover must be restarted or purged. Rolling restart adds 10–60s to recovery time.

---

# Security Checklist

- [ ] Security: Failover to a new primary may involve different credentials. Ensure Credential rotation is handled during failover.
- [ ] Security: Multi-region failover must respect data residency requirements. The new primary must be in a compliant region.
- [ ] Security: Log all failover events — they may indicate an attack (database compromise, network partition).
- [ ] Security: DNS failover can be exploited by DNS spoofing. Use DNSSEC if using DNS-based failover.
- [ ] Security: Proxy failover must use TLS between proxy and backends to prevent man-in-the-middle attacks during the failover window.

---

# Reliability Checklist

- [ ] No failover handling prevented
- [ ] DNS failover with long TTL prevented
- [ ] No retry after connection failure prevented
- [ ] Not purging after failover in app-level prevented
- [ ] Assuming proxy handles all failover prevented

---

# Testing Checklist

- [ ] Primary failover strategy is defined (proxy, DNS, or application-level)
- [ ] Retry logic with exponential backoff is implemented for connection errors
- [ ] Failover has been tested in staging with actual primary failure
- [ ] DNS TTL is set to 30–60s (if using DNS failover)
- [ ] Proxy health check intervals are configured for fast failure detection
- [ ] Primary failover strategy defined (proxy, DNS, or application-level)
- [ ] Retry logic with exponential backoff implemented
- [ ] Failover tested in staging with actual primary failure
- [ ] DNS TTL set to 30–60s (if using DNS failover)
- [ ] Proxy health check intervals configured for fast detection
- [ ] Failover works without manual intervention
- [ ] Retry logic recovers from transient connection failures
- [ ] Failover tested in staging — recovery time measured
- [ ] Failover events logged with complete context
- [ ] Application returns errors only after all retries exhausted

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Single failover strategy prevented
- [ ] No failover handling â€” complete downtime when primary fails prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] No failover testing prevented
- [ ] No failover handling prevented
- [ ] DNS failover with long TTL prevented
- [ ] No retry after connection failure prevented
- [ ] Not purging after failover in app-level prevented
- [ ] Assuming proxy handles all failover prevented

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
