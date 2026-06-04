# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.19 RDS Proxy / Aurora (serverless connection multiplexing)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] RDS Proxy + Lambda applied
- [ ] Aurora Auto Scaling applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] RDS Proxy cost**: RDS Proxy has ~$15/month cost per instance. For a single small database, direct connection may be cheaper. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Aurora connection count reduced by 10x or more
- [ ] Zero connection errors during traffic spikes
- [ ] Transparent Aurora failover (zero application downtime)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] RDS Proxy + Lambda applied
- [ ] Aurora Auto Scaling applied
- [ ] Always Monitor Replica Lag followed
- [ ] Create RDS Proxy via AWS Console/CLI, selecting target Aurora cluster completed
- [ ] Configure IAM authentication (optional but recommended) or use Secrets Manager for DB credentials completed
- [ ] Set max connections: typically 80% of Aurora cluster's max_connections completed
- [ ] Configure connection pool: idle timeout, max connection pool size completed
- [ ] Update application: use RDS Proxy endpoint instead of direct Aurora endpoint completed

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

- [ ] RDS Proxy cost**: RDS Proxy has ~$15/month cost per instance. For a single small database, direct connection may be cheaper. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Application connects through RDS Proxy endpoint
- [ ] Connection count to Aurora shows only proxy connections (much fewer than app connections)
- [ ] Failover test: manually failover Aurora, verify app reconnects without errors
- [ ] IAM authentication works (if configured)
- [ ] RDS Proxy CloudWatch metrics show healthy connection pool utilization
- [ ] Aurora connection count reduced by 10x or more
- [ ] Zero connection errors during traffic spikes
- [ ] Transparent Aurora failover (zero application downtime)
- [ ] Lambda cold start connection latency < 20ms
- [ ] Read replica count adjusts automatically to match load within 5 minutes

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
- [ ] RDS Proxy cost ($15-20/month) exceeds benefit for small deployments prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] RDS Proxy cost**: RDS Proxy has ~$15/month cost per instance. For a single small database, direct connection may be cheaper. prevented

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
