# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 10-multi-region-global-cost
**Knowledge Unit:** Multi-Region Database
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Multi-region database strategy documented (Aurora Global vs RDS replica vs app-level)
- [ ] Single writer region; all others read-only
- [ ] Replication lag monitored (alarm > 2s for Aurora, > 10s for RDS)
- [ ] Route53 geo-routing directs reads to local region
- [ ] DR failover tested quarterly
- [ ] Use Aurora Global Database for read-heavy global apps applied
- [ ] Write locally, replicate asynchronously applied
- [ ] Set up DR with Aurora Global Database applied
- [ ] Always Use a Single Writer Region Ã¢â‚¬â€ Never Write from Multiple Regions followed
- [ ] Prefer Aurora Global Database Over RDS Cross-Region Replicas for Read-Heavy Global Apps followed
- [ ] Use Smaller Instances in Read Regions Ã¢â‚¬â€ Never Match Writer Instance Size followed
- [ ] Active-active multi-region databases prevented
- [ ] Synchronous cross-region writes prevented
- [ ] Multi-region writes without conflict resolution prevented
- [ ] Using RDS cross-region replicas for global reads prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Write region
- [ ] Architecture guideline: Read regions
- [ ] Architecture guideline: Aurora Global
- [ ] Architecture guideline: Each region
- [ ] Architecture guideline: Only primary region has write access; secondary regions are promoted only during failover
- [ ] Architecture guideline: Cache (Redis) per region
- [ ] Architecture guideline: Queue (SQS) per region
- [ ] Always Use a Single Writer Region Ã¢â‚¬â€ Never Write from Multiple Regions followed
- [ ] Prefer Aurora Global Database Over RDS Cross-Region Replicas for Read-Heavy Global Apps followed
- [ ] Use Smaller Instances in Read Regions Ã¢â‚¬â€ Never Match Writer Instance Size followed
- [ ] Monitor Replication Lag Ã¢â‚¬â€ Never Assume It's Under 1 Second followed
- [ ] Use Local Cache Per Region Ã¢â‚¬â€ Never Share a Cross-Region Cache followed

---

# Implementation Checklist

- [ ] Best practice applied: Use Aurora Global Database for read-heavy global apps
- [ ] Best practice applied: Write locally, replicate asynchronously
- [ ] Best practice applied: Set up DR with Aurora Global Database
- [ ] Best practice applied: Use RDS cross-region replica for DR only
- [ ] Best practice applied: Monitor replication lag
- [ ] Best practice applied: Route read traffic per region
- [ ] Always Use a Single Writer Region Ã¢â‚¬â€ Never Write from Multiple Regions followed
- [ ] Prefer Aurora Global Database Over RDS Cross-Region Replicas for Read-Heavy Global Apps followed
- [ ] Use Smaller Instances in Read Regions Ã¢â‚¬â€ Never Match Writer Instance Size followed
- [ ] Monitor Replication Lag Ã¢â‚¬â€ Never Assume It's Under 1 Second followed
- [ ] Use Local Cache Per Region Ã¢â‚¬â€ Never Share a Cross-Region Cache followed
- [ ] Test DR Failover Quarterly Ã¢â‚¬â€ Never Assume It Works followed
- [ ] Workflow step completed: Inventory current Multi Region Database resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Aurora Global replication lag
- [ ] RDS cross-region replication lag
- [ ] Local region read latency
- [ ] Cross-region write latency
- [ ] Cache per region

---

# Security Checklist

- [ ] Cross-region replication data encrypted (AWS backbone + KMS)
- [ ] Each region's database has separate security groups
- [ ] IAM roles for cross-region replication (Aurora manages automatically)
- [ ] Data residency
- [ ] Encryption keys (KMS) per region for data isolation

---

# Reliability Checklist

- [ ] Mistake prevented: Multi-region writes without conflict resolution
- [ ] Mistake prevented: Using RDS cross-region replicas for global reads
- [ ] Mistake prevented: Cross-region database for all data

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Multi-region database strategy documented (Aurora Global vs RDS replica vs app-level)
- [ ] Single writer region; all others read-only
- [ ] Replication lag monitored (alarm > 2s for Aurora, > 10s for RDS)
- [ ] Route53 geo-routing directs reads to local region
- [ ] DR failover tested quarterly
- [ ] Per-region cache (Redis) for local read performance
- [ ] Cross-region replication cost analyzed and monitored

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Multi Region Database configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Use a Single Writer Region Ã¢â‚¬â€ Never Write from Multiple Regions followed
- [ ] Prefer Aurora Global Database Over RDS Cross-Region Replicas for Read-Heavy Global Apps followed
- [ ] Use Smaller Instances in Read Regions Ã¢â‚¬â€ Never Match Writer Instance Size followed
- [ ] Monitor Replication Lag Ã¢â‚¬â€ Never Assume It's Under 1 Second followed
- [ ] Use Local Cache Per Region Ã¢â‚¬â€ Never Share a Cross-Region Cache followed
- [ ] Test DR Failover Quarterly Ã¢â‚¬â€ Never Assume It Works followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Active-active multi-region databases
- [ ] Anti-pattern prevented: Synchronous cross-region writes
- [ ] Anti-pattern prevented: No DR testing
- [ ] Anti-pattern prevented: Same instance size in all regions
- [ ] Common mistake prevented: Multi-region writes without conflict resolution
- [ ] Common mistake prevented: Using RDS cross-region replicas for global reads
- [ ] Common mistake prevented: Cross-region database for all data

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Multi-region database strategy documented (Aurora Global vs RDS replica vs app-level)
- [ ] Verification passed: Single writer region; all others read-only
- [ ] Verification passed: Replication lag monitored (alarm > 2s for Aurora, > 10s for RDS)

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
