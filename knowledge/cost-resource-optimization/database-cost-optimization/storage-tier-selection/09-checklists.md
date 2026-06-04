# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** Storage Tier Selection
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] gp3 storage type selected (not gp2)
- [ ] Storage size appropriate for actual data (20% headroom)
- [ ] Aurora I/O costs monitored (billing alarm)
- [ ] EBS encryption enabled
- [ ] Deletion protection enabled
- [ ] Use gp3 as default for MySQL/PostgreSQL applied
- [ ] Set storage allocation to 20% above current usage applied
- [ ] Monitor I/O credit balance for gp3 applied
- [ ] gp3 with 0 IOPS baseline prevented
- [ ] io2 for all databases prevented
- [ ] Using gp2 instead of gp3 prevented
- [ ] Under-estimating Aurora I/O costs prevented

---

# Architecture Checklist

- [ ] Architecture guideline: RDS MySQL
- [ ] Architecture guideline: Aurora MySQL/PostgreSQL
- [ ] Architecture guideline: Always enable deletion protection on production databases
- [ ] Architecture guideline: Use provisioned IOPS only if CloudWatch shows IOPS consistently > 3000
- [ ] Architecture guideline: Separate storage for logs/system data from database data volume
- [ ] Architecture guideline: Enable Performance Insights to track storage-bottleneck queries

---

# Implementation Checklist

- [ ] Best practice applied: Use gp3 as default for MySQL/PostgreSQL
- [ ] Best practice applied: Set storage allocation to 20% above current usage
- [ ] Best practice applied: Monitor I/O credit balance for gp3
- [ ] Best practice applied: Choose Aurora for multi-AZ + replication needs
- [ ] Best practice applied: Watch Aurora I/O costs
- [ ] Best practice applied: Use RDS Storage Auto Scaling with max cap
- [ ] Workflow step completed: Inventory current Storage Tier Selection resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] gp3 baseline 3000 IOPS
- [ ] gp3 burst
- [ ] Aurora
- [ ] io2
- [ ] Storage queue depth
- [ ] EBS-optimized instances

---

# Security Checklist

- [ ] Enable EBS encryption by default (enforce at account level)
- [ ] Aurora storage is encrypted at rest by default
- [ ] Snapshot encryption uses KMS; cross-region snapshot sharing requires KMS key sharing
- [ ] Disable public accessibility on database instances
- [ ] Deletion protection prevents accidental database deletion

---

# Reliability Checklist

- [ ] Mistake prevented: Using gp2 instead of gp3
- [ ] Mistake prevented: Under-estimating Aurora I/O costs
- [ ] Mistake prevented: Over-provisioning storage "just in case"

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] gp3 storage type selected (not gp2)
- [ ] Storage size appropriate for actual data (20% headroom)
- [ ] Aurora I/O costs monitored (billing alarm)
- [ ] EBS encryption enabled
- [ ] Deletion protection enabled
- [ ] Storage auto-scaling configured with max cap
- [ ] Backup storage within free tier (100% of DB storage)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Storage Tier Selection configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: gp3 with 0 IOPS baseline
- [ ] Anti-pattern prevented: io2 for all databases
- [ ] Anti-pattern prevented: Aurora without I/O monitoring
- [ ] Anti-pattern prevented: Manual storage scaling
- [ ] Common mistake prevented: Using gp2 instead of gp3
- [ ] Common mistake prevented: Under-estimating Aurora I/O costs
- [ ] Common mistake prevented: Over-provisioning storage "just in case"

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: gp3 storage type selected (not gp2)
- [ ] Verification passed: Storage size appropriate for actual data (20% headroom)
- [ ] Verification passed: Aurora I/O costs monitored (billing alarm)

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
