# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Server Provisioning
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] gp3 volumes used (not gp2)
- [ ] EBS volume sizes based on actual monitoring data
- [ ] Separate root and data volumes
- [ ] Swap configured on all application servers
- [ ] AMI creation automated (Packer/Image Builder)
- [ ] Use gp3 as default EBS volume applied
- [ ] Right-size EBS volumes applied
- [ ] Use separate volumes for data applied
- [ ] Manual server provisioning prevented
- [ ] Instances with public IPs prevented
- [ ] Using gp2 instead of gp3 prevented
- [ ] Over-provisioning disk "just in case" prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Root volume
- [ ] Architecture guideline: Data volume
- [ ] Architecture guideline: Log volume
- [ ] Architecture guideline: AMI
- [ ] Architecture guideline: Use lifecycle manager (DLM) for EBS snapshots

---

# Implementation Checklist

- [ ] Best practice applied: Use gp3 as default EBS volume
- [ ] Best practice applied: Right-size EBS volumes
- [ ] Best practice applied: Use separate volumes for data
- [ ] Best practice applied: Automate AMI creation
- [ ] Best practice applied: Configure adequate swap
- [ ] Workflow step completed: Inventory current Server Provisioning resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] EBS gp3 baseline
- [ ] EBS burst
- [ ] Snapshot performance
- [ ] Instance store

---

# Security Checklist

- [ ] Encrypt all EBS volumes with KMS (enforce at account level via SCP)
- [ ] Use IMDSv2 (disable IMDSv1) to prevent SSRF-based credential theft
- [ ] Harden AMI
- [ ] Automate security patching
- [ ] Store secrets in Secrets Manager, not on instance disk or AMI

---

# Reliability Checklist

- [ ] Mistake prevented: Using gp2 instead of gp3
- [ ] Mistake prevented: Over-provisioning disk "just in case"
- [ ] Mistake prevented: No swap configuration

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] gp3 volumes used (not gp2)
- [ ] EBS volume sizes based on actual monitoring data
- [ ] Separate root and data volumes
- [ ] Swap configured on all application servers
- [ ] AMI creation automated (Packer/Image Builder)
- [ ] EBS encryption enabled with KMS
- [ ] EBS snapshots configured via DLM

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Server Provisioning configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Manual server provisioning
- [ ] Anti-pattern prevented: Instances with public IPs
- [ ] Anti-pattern prevented: Shared volumes across instances
- [ ] Anti-pattern prevented: No backups on data volumes
- [ ] Common mistake prevented: Using gp2 instead of gp3
- [ ] Common mistake prevented: Over-provisioning disk "just in case"
- [ ] Common mistake prevented: No swap configuration

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: gp3 volumes used (not gp2)
- [ ] Verification passed: EBS volume sizes based on actual monitoring data
- [ ] Verification passed: Separate root and data volumes

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
