# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.15 ProxySQL query rules and connection handling
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use query rules for read/write splitting, not Laravel's config applied
- [ ] Disable multiplexing if Laravel uses session state applied
- [ ] Set appropriate query cache TTLs applied
- [ ] Always configure health monitoring applied
- [ ] Use `SELECT ... FOR UPDATE` rules to route to primary applied
- [ ] Query rules are configured for read/write splitting (FOR UPDATE → primary, SELECT → replicas)
- [ ] Multiplexing is disabled or tested with Laravel's application behavior
- [ ] Query cache is configured with appropriate TTLs for low-cardinality queries
- [ ] Admin interface credentials are changed from defaults
- [ ] TLS is configured between app and ProxySQL
- [ ] Multiplexing enabled with session-state app prevented
- [ ] No query rule for FOR UPDATE prevented
- [ ] Default admin credentials prevented
- [ ] Cache without invalidation prevented
- [ ] Monitor not configured prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Query rules correctly route SELECTs → replicas, writes → primary
- [ ] FOR UPDATE queries go to primary (never replicas)
- [ ] Admin credentials changed from defaults

---

# Architecture Checklist

- [ ] ProxySQL cluster
- [ ] Admin interface
- [ ] Runtime vs. disk config
- [ ] Application connection
- [ ] For sharded MySQL

---

# Implementation Checklist

- [ ] Use query rules for read/write splitting, not Laravel's config applied
- [ ] Disable multiplexing if Laravel uses session state applied
- [ ] Set appropriate query cache TTLs applied
- [ ] Always configure health monitoring applied
- [ ] Use `SELECT ... FOR UPDATE` rules to route to primary applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Connect to ProxySQL admin interface: completed
- [ ] Configure hostgroups: completed
- [ ] Insert query rules (lower rule_id = higher priority): completed
- [ ] Load rules to runtime and save to disk: completed
- [ ] Configure query caching for frequent low-cardinality queries: completed

---

# Performance Checklist

- [ ] Performance: ProxySQL is extremely fast — adds <0.1ms per query in proxy mode.
- [ ] Performance: Query caching can reduce database load by 50–90% for read-heavy workloads with repeated queries.
- [ ] Performance: Connection multiplexing reduces backend connections by 5–10×.
- [ ] Performance: ProxySQL memory usage: scales with connection count and query cache size. Rule processing is constant time (hash-based matching).
- [ ] Performance: Monitor ProxySQL metrics: `stats_mysql_processlist`, `stats_mysql_query_rules`, `stats_mysql_connection_pool`. Key metrics: `ConnPool_get_conn_late...

---

# Security Checklist

- [ ] Security: ProxySQL can enforce query-level access control (some users can only SELECT, others can INSERT/UPDATE/DELETE).
- [ ] Security: All traffic between Laravel and ProxySQL must use TLS. ProxySQL supports `mysql-have_ssl=true`.
- [ ] Security: ProxySQL's admin interface (port 6032) must be restricted to localhost or internal networks. Default credentials (`admin`/`admin`) must be changed.
- [ ] Security: Query rewriting can be used to redact sensitive data from queries before they reach the database or logs.
- [ ] Security: ProxySQL can log all queries passing through it — configure selectively (high volume).

---

# Reliability Checklist

- [ ] Multiplexing enabled with session-state app prevented
- [ ] No query rule for FOR UPDATE prevented
- [ ] Default admin credentials prevented
- [ ] Cache without invalidation prevented
- [ ] Monitor not configured prevented

---

# Testing Checklist

- [ ] Query rules are configured for read/write splitting (FOR UPDATE → primary, SELECT → replicas)
- [ ] Multiplexing is disabled or tested with Laravel's application behavior
- [ ] Query cache is configured with appropriate TTLs for low-cardinality queries
- [ ] Admin interface credentials are changed from defaults
- [ ] TLS is configured between app and ProxySQL
- [ ] Query rules configured for read/write splitting
- [ ] FOR UPDATE queries correctly routed to primary
- [ ] Multiplexing disabled or tested with Laravel
- [ ] Query cache configured with appropriate TTLs
- [ ] Admin interface credentials changed from defaults
- [ ] Query rules correctly route SELECTs → replicas, writes → primary
- [ ] FOR UPDATE queries go to primary (never replicas)
- [ ] Admin credentials changed from defaults
- [ ] Monitoring detects dead backends automatically
- [ ] Laravel connects to ProxySQL without read/write arrays

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] All queries routed to one hostgroup prevented
- [ ] Multiplexing enabled with session-state app â€” session leaks between clients prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Overly broad query rules prevented
- [ ] Multiplexing enabled with session-state app prevented
- [ ] No query rule for FOR UPDATE prevented
- [ ] Default admin credentials prevented
- [ ] Cache without invalidation prevented
- [ ] Monitor not configured prevented

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
