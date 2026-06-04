# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.6 Connection purging and reconnection (DB::purge, DB::reconnect)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always pair config()->set() with purge() applied
- [ ] Use `DB::reconnect()` for simplicity applied
- [ ] Re-hydrate models after purge applied
- [ ] Handle purge failure gracefully applied
- [ ] Avoid purging in transactional context applied
- [ ] Every `config()->set()` on database config is followed by `DB::purge()` or `DB::reconnect()`
- [ ] Purge/reconnect calls are wrapped in try-catch for error handling
- [ ] No active transactions when purge is called
- [ ] Models loaded before purge are re-queried after switching connections
- [ ] Log entries show connection switches with tenant/shard identifiers
- [ ] Config change without purge prevented
- [ ] Purging but not reconnecting prevented
- [ ] Purging wrong connection name prevented
- [ ] Purging inside transaction prevented
- [ ] Not re-hydrating models after purge prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] All config changes are immediately reflected in new connections
- [ ] No stale connection errors after switches
- [ ] Failover retry logic recovers from connection failures

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always pair config()->set() with purge() applied
- [ ] Use `DB::reconnect()` for simplicity applied
- [ ] Re-hydrate models after purge applied
- [ ] Handle purge failure gracefully applied
- [ ] Avoid purging in transactional context applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Change config parameters if needed: completed
- [ ] Purge the stale connection from the resolver: completed
- [ ] Reconnect using either method: completed
- [ ] Handle purge failure gracefully — wrap in try-catch: completed
- [ ] Re-hydrate any model instances loaded before the purge: completed

---

# Performance Checklist

- [ ] Performance: `DB::purge()` itself is fast (<0.01ms) — it just removes a key from an array.
- [ ] Performance: `DB::reconnect()` adds full connection latency (TCP handshake, auth, SSL: 1–50ms).
- [ ] Performance: Frequent purge/reconnect in Octane creates connection churn that reduces the benefit of persistent workers.
- [ ] Performance: On PHP-FPM, purge/reconnect happens per-request anyway (connections don't persist between requests), so the overhead is negligible.
- [ ] Performance: Total overhead estimate: 10 middleware-purge cycles per second = 10–500ms of connection time per second.

---

# Security Checklist

- [ ] Security: Purging removes the PDO object from scope, allowing garbage collection. No sensitive data (credentials) remains accessible in PHP memory after the ...
- [ ] Security: After credential rotation, purge ensures the new credentials are used immediately, closing the window of exposure for compromised credentials.
- [ ] Security: If purge fails (new connection can't be established), the application should fail closed (reject requests) rather than silently using old cached cr...

---

# Reliability Checklist

- [ ] Config change without purge prevented
- [ ] Purging but not reconnecting prevented
- [ ] Purging wrong connection name prevented
- [ ] Purging inside transaction prevented
- [ ] Not re-hydrating models after purge prevented

---

# Testing Checklist

- [ ] Every `config()->set()` on database config is followed by `DB::purge()` or `DB::reconnect()`
- [ ] Purge/reconnect calls are wrapped in try-catch for error handling
- [ ] No active transactions when purge is called
- [ ] Models loaded before purge are re-queried after switching connections
- [ ] Log entries show connection switches with tenant/shard identifiers
- [ ] Every `config()->set()` on database config is followed by purge or reconnect
- [ ] Purge/reconnect calls are wrapped in try-catch
- [ ] No active transactions when purge is called
- [ ] Models loaded before purge are re-queried after switching
- [ ] Log entries show connection switches with identifiers
- [ ] All config changes are immediately reflected in new connections
- [ ] No stale connection errors after switches
- [ ] Failover retry logic recovers from connection failures
- [ ] Purge/reconnect is never called inside active transactions
- [ ] Models correctly use the new connection after re-hydration

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Purge-reconnect in every model accessor prevented
- [ ] Config change without purge â€” stale PDO reused silently prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Purge without config change prevented
- [ ] Config change without purge prevented
- [ ] Purging but not reconnecting prevented
- [ ] Purging wrong connection name prevented
- [ ] Purging inside transaction prevented
- [ ] Not re-hydrating models after purge prevented

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
