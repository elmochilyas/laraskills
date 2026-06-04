# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 05-cdn-storage-optimization
**Knowledge Unit:** S3 Lifecycle Policies
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Logs Ã¢â€ â€™ IA at 14d, Glacier at 60d, delete at 365d applied
- [ ] User uploads Ã¢â€ â€™ IA at 30d, Glacier at 180d applied
- [ ] Backups Ã¢â€ â€™ Glacier Deep Archive at 7d applied
- [ ] Pattern Without Enforcement prevented
- [ ] Inconsistent Application prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Best practice applied: Logs Ã¢â€ â€™ IA at 14d, Glacier at 60d, delete at 365d
- [ ] Best practice applied: User uploads Ã¢â€ â€™ IA at 30d, Glacier at 180d
- [ ] Best practice applied: Backups Ã¢â€ â€™ Glacier Deep Archive at 7d
- [ ] Best practice applied: Build artifacts Ã¢â€ â€™ delete after 7d
- [ ] Best practice applied: Use Intelligent-Tiering for unpredictable access patterns
- [ ] Workflow step completed: Inventory current S3 Lifecycle Policies resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure handling defined
- [ ] Timeouts configured

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
- [ ] S3 Lifecycle Policies configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Pattern Without Enforcement
- [ ] Anti-pattern prevented: Inconsistent Application
- [ ] Anti-pattern prevented: Missing Documentation

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
