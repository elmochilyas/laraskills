# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Read Replicas Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Queries optimized and cache added before considering replicas
- [ ] Read/write splitting configured in Laravel (if replica added)
- [ ] ReplicaLag monitored (CloudWatch alarm)
- [ ] Aurora readers preferred over RDS replicas (for cost)
- [ ] Replica instance size appropriate for read workload
- [ ] Optimize queries before adding replicas applied
- [ ] Use Aurora replicas for cost-effective read scaling applied
- [ ] Implement read/write splitting in Laravel applied
- [ ] Single replica for everything prevented
- [ ] Cross-region replica for active-active writes prevented
- [ ] Read replica for query optimization instead of fixing queries prevented
- [ ] No read/write splitting code prevented

---

# Architecture Checklist

- [ ] Architecture guideline: For RDS
- [ ] Architecture guideline: For Aurora
- [ ] Architecture guideline: Place replica in different AZ for HA (same region, avoid cross-region latency)
- [ ] Architecture guideline: Maximum replicas
- [ ] Architecture guideline: Use Aurora Auto Scaling for reader fleet (scale readers based on CPU/connections)
- [ ] Architecture guideline: For heavy reporting, create a dedicated read replica (not shared with production reads)

---

# Implementation Checklist

- [ ] Best practice applied: Optimize queries before adding replicas
- [ ] Best practice applied: Use Aurora replicas for cost-effective read scaling
- [ ] Best practice applied: Implement read/write splitting in Laravel
- [ ] Best practice applied: Monitor replication lag
- [ ] Best practice applied: Scale down replica size
- [ ] Best practice applied: Use cross-region replicas for disaster recovery
- [ ] Workflow step completed: Inventory current Read Replicas Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Replication lag
- [ ] Read capacity
- [ ] Aurora reader scaling
- [ ] Replication overhead
- [ ] Sticky reads

---

# Security Checklist

- [ ] Enable encryption in-transit for replication (TLS between primary and replica)
- [ ] Cross-region replicas need VPC peering or VPN for encryption
- [ ] Replicas inherit IAM roles and security groups from primary
- [ ] Replicas can be promoted to primary; test promotion procedures
- [ ] Log replication status via CloudTrail for auditing

---

# Reliability Checklist

- [ ] Mistake prevented: Read replica for query optimization instead of fixing queries
- [ ] Mistake prevented: No read/write splitting code
- [ ] Mistake prevented: Using RDS replicas (not Aurora) for small reads

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Queries optimized and cache added before considering replicas
- [ ] Read/write splitting configured in Laravel (if replica added)
- [ ] ReplicaLag monitored (CloudWatch alarm)
- [ ] Aurora readers preferred over RDS replicas (for cost)
- [ ] Replica instance size appropriate for read workload
- [ ] No cross-region active-active writes

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Read Replicas Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Single replica for everything
- [ ] Anti-pattern prevented: Cross-region replica for active-active writes
- [ ] Anti-pattern prevented: Replica without monitoring
- [ ] Common mistake prevented: Read replica for query optimization instead of fixing queries
- [ ] Common mistake prevented: No read/write splitting code
- [ ] Common mistake prevented: Using RDS replicas (not Aurora) for small reads

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Queries optimized and cache added before considering replicas
- [ ] Verification passed: Read/write splitting configured in Laravel (if replica added)
- [ ] Verification passed: ReplicaLag monitored (CloudWatch alarm)

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
