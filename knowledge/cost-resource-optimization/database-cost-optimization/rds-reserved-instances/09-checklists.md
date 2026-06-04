# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 02-database-cost-optimization
**Knowledge Unit:** RDS Reserved Instances
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Right-size instances before purchasing RIs applied
- [ ] Start with 1-year Partial Upfront for new workloads applied
- [ ] Use Regional (not Zonal) scope for most databases applied
- [ ] 3-year All Upfront for untested workload prevented
- [ ] Zonal RIs without capacity planning prevented
- [ ] Buying RIs before right-sizing instances prevented
- [ ] 3-year commitment on uncertain growth patterns prevented

---

# Architecture Checklist

- [ ] Architecture guideline: RIs for steady production databases running 24/7
- [ ] Architecture guideline: On-Demand for variable workloads, dev/test, burst capacity
- [ ] Architecture guideline: Database Savings Plans for multi-instance fleets with flexibility needs
- [ ] Architecture guideline: Serverless v2 for workloads with >3:1 peak-to-trough ratio
- [ ] Architecture guideline: Let existing RIs expire and migrate to Database Savings Plans for new commitments
- [ ] Architecture guideline: Multi-AZ doubles RI benefit since both primary and standby consume compute

---

# Implementation Checklist

- [ ] Best practice applied: Right-size instances before purchasing RIs
- [ ] Best practice applied: Start with 1-year Partial Upfront for new workloads
- [ ] Best practice applied: Use Regional (not Zonal) scope for most databases
- [ ] Best practice applied: Consider Convertible RIs for growing workloads
- [ ] Best practice applied: Combine RIs with On-Demand for burst
- [ ] Workflow step completed: Inventory current Rds Reserved Instances resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] RIs are purely billing mechanism Ã¢â‚¬â€ no performance impact
- [ ] Zonal RIs guarantee capacity in specific AZ (helps with large instance availability)
- [ ] Convertible RIs allow newer generation instances for better performance
- [ ] RIs do not cover performance-related features (Performance Insights, Enhanced Monitoring)
- [ ] Storage and I/O costs are billed separately regardless of RI coverage

---

# Security Checklist

- [ ] RIs don't affect database security posture
- [ ] IAM database authentication works identically under RI or On-Demand
- [ ] Encryption at rest/in-transit unchanged
- [ ] RI purchase does not grant additional access or change security boundaries
- [ ] RIs apply to both single-AZ and Multi-AZ deployments equally

---

# Reliability Checklist

- [ ] Mistake prevented: Buying RIs before right-sizing instances
- [ ] Mistake prevented: 3-year commitment on uncertain growth patterns
- [ ] Mistake prevented: Buying RIs for Serverless v2
- [ ] Mistake prevented: 100% RI coverage with no On-Demand buffer

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Rds Reserved Instances configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 3-year All Upfront for untested workload
- [ ] Anti-pattern prevented: Zonal RIs without capacity planning
- [ ] Anti-pattern prevented: Standard RIs for expected Graviton migration
- [ ] Anti-pattern prevented: RI for dev/staging
- [ ] Common mistake prevented: Buying RIs before right-sizing instances
- [ ] Common mistake prevented: 3-year commitment on uncertain growth patterns
- [ ] Common mistake prevented: Buying RIs for Serverless v2
- [ ] Common mistake prevented: 100% RI coverage with no On-Demand buffer

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

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
