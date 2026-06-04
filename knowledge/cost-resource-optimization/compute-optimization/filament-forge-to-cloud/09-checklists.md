# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Filament Forge to Cloud Cost Reduction
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Measure before and after applied
- [ ] Migrate runtime first, platform second applied
- [ ] Target fewer, larger replicas applied
- [ ] Rip-and-replace migration prevented
- [ ] Cloud as silver bullet prevented
- [ ] Assuming Filament's results apply universally prevented
- [ ] Migrating platform and runtime simultaneously prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Start with Octane on existing Forge/EC2 deployment for validation
- [ ] Architecture guideline: Migrate one environment (staging) and run for 48h before production
- [ ] Architecture guideline: Use Cloud's auto-hibernation for non-production environments
- [ ] Architecture guideline: Configure Cloud spending limits (50/75/90% alerts) before migration
- [ ] Architecture guideline: Maintain rollback plan

---

# Implementation Checklist

- [ ] Best practice applied: Measure before and after
- [ ] Best practice applied: Migrate runtime first, platform second
- [ ] Best practice applied: Target fewer, larger replicas
- [ ] Best practice applied: Enable auto-scaling after migration
- [ ] Best practice applied: Budget for migration TCO
- [ ] Workflow step completed: Inventory current Filament Forge To Cloud resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Octane throughput gains are largest for CPU-bound requests (API responses, view rendering)
- [ ] I/O bound requests (DB queries, external API calls) see smaller throughput improvements
- [ ] Cloud's auto-hibernation adds 500ms wake time for cold containers
- [ ] Filament's 3x gain may not apply to all Laravel applications; benchmark your workload
- [ ] Memory usage per Octane worker is typically 30-50% higher than PHP-FPM

---

# Security Checklist

- [ ] Cloud platform manages OS and runtime patching; reduces attack surface
- [ ] Container isolation between tenants on Fargate is AWS-managed
- [ ] Ensure Cloud deployment uses least-privilege IAM roles
- [ ] Review Cloud's data residency and encryption configuration
- [ ] Monitor Cloud deployment for unexpected auto-scaling events

---

# Reliability Checklist

- [ ] Mistake prevented: Assuming Filament's results apply universally
- [ ] Mistake prevented: Migrating platform and runtime simultaneously
- [ ] Mistake prevented: Ignoring auto-hibernation wake time
- [ ] Mistake prevented: Not accounting for Cloud premium

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
- [ ] Filament Forge To Cloud configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Rip-and-replace migration
- [ ] Anti-pattern prevented: Cloud as silver bullet
- [ ] Anti-pattern prevented: No rollback plan
- [ ] Anti-pattern prevented: Over-provisioning on Cloud
- [ ] Common mistake prevented: Assuming Filament's results apply universally
- [ ] Common mistake prevented: Migrating platform and runtime simultaneously
- [ ] Common mistake prevented: Ignoring auto-hibernation wake time
- [ ] Common mistake prevented: Not accounting for Cloud premium

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
