# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.5 Dynamic connection configuration (config in middleware, runtime connection switching)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always purge after config change applied
- [ ] Use middleware for tenant connection switching applied
- [ ] Prefer `DB::reconnect()` for failover applied
- [ ] Tag connections for observability applied
- [ ] Handle connection failures gracefully applied
- [ ] `config()->set()` is always followed by `DB::purge()` for the same connection name
- [ ] Dynamic connections have unique names (not overriding `mysql` or `pgsql`)
- [ ] Model's `getConnectionName()` returns valid connection names
- [ ] No stale connection errors after dynamic switches
- [ ] Credentials for dynamic connections come from secure sources (env, secrets manager, encrypted DB)
- [ ] Config change without purge prevented
- [ ] Per-request purge in shared-table tenant prevented
- [ ] Purging wrong connection name prevented
- [ ] Not reconnecting after failover config change prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Config changes are immediately reflected in new connections
- [ ] No stale connection bugs in multi-tenant or sharded environments
- [ ] Dynamic connection names are unique and descriptive

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Always purge after config change applied
- [ ] Use middleware for tenant connection switching applied
- [ ] Prefer `DB::reconnect()` for failover applied
- [ ] Tag connections for observability applied
- [ ] Handle connection failures gracefully applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Define a base connection template in `config/database.php`: completed
- [ ] In middleware, resolve the tenant/shard and set config: completed
- [ ] Purge the connection after config change: completed
- [ ] Optionally run initialization queries on the new connection: completed
- [ ] For model-based shard routing, override `getConnectionName()`: completed

---

# Performance Checklist

- [ ] Performance: `DB::purge()` + reconnect adds ~1–50ms latency per switch, depending on network and SSL.
- [ ] Performance: Avoid purging/reconnecting on every request in shared-table tenancy — only needed for database-per-tenant or per-shard routing.
- [ ] Performance: Dynamic config reads from the config array are in-memory and fast (<0.01ms).
- [ ] Performance: In Octane, frequent purge/reconnect defeats the purpose of persistent connections. Minimize dynamic switches in Octane or use higher-level routing ...
- [ ] Performance: Connection initialization queries (SET NAMES, SET search_path, SET timezone) add ~5–20ms per connection. Batch these into the PDO options or Octane...

---

# Security Checklist

- [ ] Security: Dynamic config often modifies `database`, `username`, and `password` at runtime. Ensure these values come from trusted sources (authenticated tenan...
- [ ] Security: Never accept raw database credentials from user input. Resolve tenant/shard credentials from a secure mapping service.
- [ ] Security: After purge, the old PDO object is garbage collected. No sensitive data remains accessible.
- [ ] Security: Log all dynamic connection changes for audit trails, especially credential rotations and failover events.

---

# Reliability Checklist

- [ ] Config change without purge prevented
- [ ] Per-request purge in shared-table tenant prevented
- [ ] Purging wrong connection name prevented
- [ ] Not reconnecting after failover config change prevented

---

# Testing Checklist

- [ ] `config()->set()` is always followed by `DB::purge()` for the same connection name
- [ ] Dynamic connections have unique names (not overriding `mysql` or `pgsql`)
- [ ] Model's `getConnectionName()` returns valid connection names
- [ ] No stale connection errors after dynamic switches
- [ ] Credentials for dynamic connections come from secure sources (env, secrets manager, encrypted DB)
- [ ] `config()->set()` is always followed by `DB::purge()` for the same connection name
- [ ] Dynamic connections have unique names (not overriding `mysql` or `pgsql`)
- [ ] Model's `getConnectionName()` returns valid connection names
- [ ] No stale connection errors after dynamic switches
- [ ] Credentials for dynamic connections come from secure sources
- [ ] Config changes are immediately reflected in new connections
- [ ] No stale connection bugs in multi-tenant or sharded environments
- [ ] Dynamic connection names are unique and descriptive
- [ ] Credential rotation works without application restart

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] Reconfiguring the `default` connection at runtime prevented
- [ ] Config change without purge â€” old PDO reused, wrong database accessed prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Hardcoding credentials in config()-set() prevented
- [ ] Config change without purge prevented
- [ ] Per-request purge in shared-table tenant prevented
- [ ] Purging wrong connection name prevented
- [ ] Not reconnecting after failover config change prevented

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
