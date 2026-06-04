# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 09-server-sizing-autoscaling
**Knowledge Unit:** Vertical Scaling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Database/cache: vertical scaling strategy defined
- [ ] Web tier: horizontal scaling preferred over vertical
- [ ] Right-sizing analysis done before scaling up
- [ ] Vertical scaling path documented (medium->large->xlarge...)
- [ ] Octane considered for CPU-intensive vertical scaling
- [ ] Prefer horizontal for web, vertical for databases applied
- [ ] Right-size before vertical scaling applied
- [ ] Consider Octane for vertical efficiency applied
- [ ] Prefer Horizontal Scaling for Web Tier, Vertical for Databases/Cache followed
- [ ] Right-Size Before Vertical Scaling Ã¢â‚¬â€ 2-Week Monitoring First followed
- [ ] Understand Vertical Limits Ã¢â‚¬â€ Plan Horizontal Migration Before Hitting Them followed
- [ ] Vertical-only architecture prevented
- [ ] Instances at 80%+ max size prevented
- [ ] Vertical scaling the web tier instead of horizontal prevented
- [ ] Skipping right-sizing before scaling up prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Database
- [ ] Architecture guideline: Cache
- [ ] Architecture guideline: Octane
- [ ] Architecture guideline: Web server
- [ ] Architecture guideline: Vertical scaling path
- [ ] Architecture guideline: No automatic vertical scaling
- [ ] Prefer Horizontal Scaling for Web Tier, Vertical for Databases/Cache followed
- [ ] Right-Size Before Vertical Scaling Ã¢â‚¬â€ 2-Week Monitoring First followed
- [ ] Understand Vertical Limits Ã¢â‚¬â€ Plan Horizontal Migration Before Hitting Them followed
- [ ] Consider Octane for CPU-Intensive Vertical Scaling followed
- [ ] Use Scripted Resizes Ã¢â‚¬â€ Never Manual Console Changes followed

---

# Implementation Checklist

- [ ] Best practice applied: Prefer horizontal for web, vertical for databases
- [ ] Best practice applied: Right-size before vertical scaling
- [ ] Best practice applied: Consider Octane for vertical efficiency
- [ ] Best practice applied: Use burstable instances for irregular vertical load
- [ ] Best practice applied: Plan for vertical limits
- [ ] Best practice applied: Use resize scripts for common sizes
- [ ] Prefer Horizontal Scaling for Web Tier, Vertical for Databases/Cache followed
- [ ] Right-Size Before Vertical Scaling Ã¢â‚¬â€ 2-Week Monitoring First followed
- [ ] Understand Vertical Limits Ã¢â‚¬â€ Plan Horizontal Migration Before Hitting Them followed
- [ ] Consider Octane for CPU-Intensive Vertical Scaling followed
- [ ] Use Scripted Resizes Ã¢â‚¬â€ Never Manual Console Changes followed
- [ ] Workflow step completed: Inventory current Vertical Scaling resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Instance size vs throughput
- [ ] Octane scaling
- [ ] EBS bandwidth scales with instance size; larger instances get more EBS throughput
- [ ] Network bandwidth scales with instance size; relevant for high-traffic API servers
- [ ] RDS vertical scaling

---

# Security Checklist

- [ ] Vertical scaling to larger instances inherits same security boundary (Nitro hypervisor)
- [ ] Larger instances may have different Trusted Platform Module (TPM) support
- [ ] Instance metadata service v2 settings persist across resize
- [ ] EBS encryption settings persist; no re-encryption needed
- [ ] KMS key policies may need updating for cross-service access at scale

---

# Reliability Checklist

- [ ] Mistake prevented: Vertical scaling the web tier instead of horizontal
- [ ] Mistake prevented: Skipping right-sizing before scaling up
- [ ] Mistake prevented: Vertical-only strategy
- [ ] Mistake prevented: Vertical scaling without considering Octane

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Database/cache: vertical scaling strategy defined
- [ ] Web tier: horizontal scaling preferred over vertical
- [ ] Right-sizing analysis done before scaling up
- [ ] Vertical scaling path documented (medium->large->xlarge...)
- [ ] Octane considered for CPU-intensive vertical scaling
- [ ] Instance limits understood and monitored
- [ ] No vertical-only architecture (no fault tolerance)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Vertical Scaling configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Prefer Horizontal Scaling for Web Tier, Vertical for Databases/Cache followed
- [ ] Right-Size Before Vertical Scaling Ã¢â‚¬â€ 2-Week Monitoring First followed
- [ ] Understand Vertical Limits Ã¢â‚¬â€ Plan Horizontal Migration Before Hitting Them followed
- [ ] Consider Octane for CPU-Intensive Vertical Scaling followed
- [ ] Use Scripted Resizes Ã¢â‚¬â€ Never Manual Console Changes followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Vertical-only architecture
- [ ] Anti-pattern prevented: Instances at 80%+ max size
- [ ] Anti-pattern prevented: Right-sizing to peak
- [ ] Anti-pattern prevented: Manual vertical scaling
- [ ] Common mistake prevented: Vertical scaling the web tier instead of horizontal
- [ ] Common mistake prevented: Skipping right-sizing before scaling up
- [ ] Common mistake prevented: Vertical-only strategy
- [ ] Common mistake prevented: Vertical scaling without considering Octane

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Database/cache: vertical scaling strategy defined
- [ ] Verification passed: Web tier: horizontal scaling preferred over vertical
- [ ] Verification passed: Right-sizing analysis done before scaling up

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
