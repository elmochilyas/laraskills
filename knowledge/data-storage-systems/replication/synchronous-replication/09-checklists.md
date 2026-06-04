# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.13 Synchronous replication (Galera, Group Replication, quorum)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Galera for zero-data-loss clusters applied
- [ ] Group Replication for MySQL 8.0 applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Wide-area Galera cluster**: 3 nodes across 3 continents. Write latency = 300ms+. Use local sync for HA, async for cross-region. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] All nodes have identical data (zero divergence)
- [ ] Write latency within budget (same-AZ: <5ms additional)
- [ ] Cluster survives node failure without manual intervention

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Galera for zero-data-loss clusters applied
- [ ] Group Replication for MySQL 8.0 applied
- [ ] Always Monitor Replica Lag followed
- [ ] Provision nodes with identical hardware and database version completed
- [ ] Configure Galera/Group Replication: wsrep_cluster_name, wsrep_node_address, wsrep_cluster_address completed
- [ ] Bootstrap first node (`mysqld --wsrep-new-cluster`) completed
- [ ] Join remaining nodes to cluster completed
- [ ] Verify cluster size: `SHOW STATUS LIKE 'wsrep_cluster_size'` completed

---

# Performance Checklist

- [ ] Performance: Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Wide-area Galera cluster**: 3 nodes across 3 continents. Write latency = 300ms+. Use local sync for HA, async for cross-region. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Cluster size matches configured node count
- [ ] Write committed on all nodes simultaneously (zero data loss)
- [ ] Flow control pauses writes when slowest node exceeds threshold
- [ ] Node failure doesn't stop writes (quorum maintained)
- [ ] Network partition: minority nodes reject writes (split-brain prevention)
- [ ] All nodes have identical data (zero divergence)
- [ ] Write latency within budget (same-AZ: <5ms additional)
- [ ] Cluster survives node failure without manual intervention
- [ ] RPO = 0 (zero data loss) on any single-node failure
- [ ] All nodes rejoined and synced

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Write latency penalty: all writes wait for slowest node â€” avoid cross-region sync clusters prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Wide-area Galera cluster**: 3 nodes across 3 continents. Write latency = 300ms+. Use local sync for HA, async for cross-region. prevented

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
