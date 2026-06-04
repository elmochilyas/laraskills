# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 10-multi-region-global-cost
**Knowledge Unit:** Active-Passive Multi-Region Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use headless Aurora clusters for DR region applied
- [ ] Put CloudFront in front of single-region origin applied
- [ ] Use Route 53 health checks for automated failover applied
- [ ] Always Prefer Active-Passive Over Active-Active for DR followed
- [ ] Use Headless Aurora for DR Region Ã¢â‚¬â€ No Compute Until Failover followed
- [ ] Put CloudFront Before Considering Multi-Region followed
- [ ] Active-active by default prevented
- [ ] No failover testing prevented
- [ ] Running active-active when active-passive suffices prevented
- [ ] Not using CloudFront before multi-region prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Active-passive as default multi-region pattern for Laravel apps
- [ ] Architecture guideline: CloudFront with single-region origin before considering multi-region
- [ ] Architecture guideline: Aurora Global Database for storage-level replication (1-2s lag)
- [ ] Architecture guideline: Route 53 latency-based or failover routing for traffic management
- [ ] Architecture guideline: Headless DR clusters for maximum cost savings on standby
- [ ] Architecture guideline: For Laravel Cloud, multi-region requires manual VPC and Route 53 configuration
- [ ] Always Prefer Active-Passive Over Active-Active for DR followed
- [ ] Use Headless Aurora for DR Region Ã¢â‚¬â€ No Compute Until Failover followed
- [ ] Put CloudFront Before Considering Multi-Region followed
- [ ] Right-Size the Standby Region Ã¢â‚¬â€ Never Match Primary Capacity followed
- [ ] Test Failover Monthly Ã¢â‚¬â€ Never Assume It Works followed

---

# Implementation Checklist

- [ ] Best practice applied: Use headless Aurora clusters for DR region
- [ ] Best practice applied: Put CloudFront in front of single-region origin
- [ ] Best practice applied: Use Route 53 health checks for automated failover
- [ ] Best practice applied: Test failover monthly
- [ ] Best practice applied: Right-size standby region
- [ ] Always Prefer Active-Passive Over Active-Active for DR followed
- [ ] Use Headless Aurora for DR Region Ã¢â‚¬â€ No Compute Until Failover followed
- [ ] Put CloudFront Before Considering Multi-Region followed
- [ ] Right-Size the Standby Region Ã¢â‚¬â€ Never Match Primary Capacity followed
- [ ] Test Failover Monthly Ã¢â‚¬â€ Never Assume It Works followed
- [ ] Never Deploy Multi-Region Without Route 53 Health Checks followed
- [ ] Use Smaller Instances in Standby Ã¢â‚¬â€ Scale Up Is Part of Failover followed
- [ ] Workflow step completed: Inventory current Active Passive Multi Region resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Cross-region latency
- [ ] Aurora Global DB replication lag
- [ ] Route 53 latency-based routing adds <10ms DNS resolution time
- [ ] CloudFront edge response time
- [ ] Failover time

---

# Security Checklist

- [ ] Cross-region data replication must comply with data residency requirements
- [ ] Aurora Global Database encrypts data in transit across regions
- [ ] Route 53 DNS failover is susceptible to DNS caching; use low TTL for critical records
- [ ] CloudFront WAF provides edge security before traffic reaches origin region
- [ ] Store encryption keys in each region (KMS multi-Region keys)

---

# Reliability Checklist

- [ ] Mistake prevented: Running active-active when active-passive suffices
- [ ] Mistake prevented: Not using CloudFront before multi-region
- [ ] Mistake prevented: Over-provisioning standby region
- [ ] Mistake prevented: Ignoring headless DR option

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
- [ ] Active Passive Multi Region configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Prefer Active-Passive Over Active-Active for DR followed
- [ ] Use Headless Aurora for DR Region Ã¢â‚¬â€ No Compute Until Failover followed
- [ ] Put CloudFront Before Considering Multi-Region followed
- [ ] Right-Size the Standby Region Ã¢â‚¬â€ Never Match Primary Capacity followed
- [ ] Test Failover Monthly Ã¢â‚¬â€ Never Assume It Works followed
- [ ] Never Deploy Multi-Region Without Route 53 Health Checks followed
- [ ] Use Smaller Instances in Standby Ã¢â‚¬â€ Scale Up Is Part of Failover followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Active-active by default
- [ ] Anti-pattern prevented: No failover testing
- [ ] Anti-pattern prevented: Multi-region without CloudFront first
- [ ] Anti-pattern prevented: Same-size standby
- [ ] Common mistake prevented: Running active-active when active-passive suffices
- [ ] Common mistake prevented: Not using CloudFront before multi-region
- [ ] Common mistake prevented: Over-provisioning standby region
- [ ] Common mistake prevented: Ignoring headless DR option

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
