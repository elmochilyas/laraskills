# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.19 Shard proxy considerations (ProxySQL, Vitess)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] ProxySQL for connection pooling + routing applied
- [ ] Vitess for multi-shard queries applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Proxy as single point of failure**: Proxy must be highly available (ProxySQL cluster, Vitess with multiple VTGates). Proxy failure = total database outage. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Proxy routes all queries to correct shards
- [ ] Connection pooling reduces backend connection count
- [ ] Proxy is not a performance bottleneck

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] ProxySQL for connection pooling + routing applied
- [ ] Vitess for multi-shard queries applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Evaluate ProxySQL: completed
- [ ] Evaluate Vitess: completed
- [ ] Evaluate pgcat: completed
- [ ] Compare against requirements and team expertise completed
- [ ] Deploy chosen proxy in front of database shards completed

---

# Performance Checklist

- [ ] Performance: Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must ac...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Proxy as single point of failure**: Proxy must be highly available (ProxySQL cluster, Vitess with multiple VTGates). Proxy failure = total database outage. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Proxy correctly routes queries to shards
- [ ] Connection pooling works as expected
- [ ] Failover behavior tested
- [ ] Performance overhead acceptable
- [ ] Team can operate the proxy
- [ ] Proxy routes all queries to correct shards
- [ ] Connection pooling reduces backend connection count
- [ ] Proxy is not a performance bottleneck
- [ ] Team can operate and troubleshoot proxy
- [ ] All queries with shard key route to correct shard

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Choose High-Cardinality Shard Key prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Proxy not designed for shard routing (routes to wrong shard) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Proxy as single point of failure**: Proxy must be highly available (ProxySQL cluster, Vitess with multiple VTGates). Proxy failure = total database outage. prevented

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
