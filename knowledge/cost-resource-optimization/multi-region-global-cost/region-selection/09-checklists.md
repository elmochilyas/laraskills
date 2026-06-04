# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 10-multi-region-global-cost
**Knowledge Unit:** Region Selection
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Region selected based on user location + cost + compliance
- [ ] Service availability verified in chosen region
- [ ] Pricing compared across candidate regions
- [ ] Single region for <100K MAU; multi-region for global scale
- [ ] Data residency/compliance requirements met
- [ ] Default to us-east-1 for cost optimization applied
- [ ] Use region cost comparison before choosing applied
- [ ] Select region based on user latency + compliance applied
- [ ] Default to us-east-1 for Cost Optimization Ã¢â‚¬â€ Never Choose a Region Without Cost Comparison followed
- [ ] Compare Service Availability Before Choosing Ã¢â‚¬â€ Never Assume Every Region Has All Services followed
- [ ] Use Single Region for <100K MAU Ã¢â‚¬â€ Never Deploy Multi-Region Prematurely followed
- [ ] 3+ regions for small app prevented
- [ ] No cost comparison across regions prevented
- [ ] Choosing region by "closest to me" prevented
- [ ] Ignoring service availability prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Single-region
- [ ] Architecture guideline: Two-region
- [ ] Architecture guideline: Three-region
- [ ] Architecture guideline: Each region
- [ ] Architecture guideline: Cross-region
- [ ] Architecture guideline: Route53
- [ ] Default to us-east-1 for Cost Optimization Ã¢â‚¬â€ Never Choose a Region Without Cost Comparison followed
- [ ] Compare Service Availability Before Choosing Ã¢â‚¬â€ Never Assume Every Region Has All Services followed
- [ ] Use Single Region for <100K MAU Ã¢â‚¬â€ Never Deploy Multi-Region Prematurely followed
- [ ] Avoid sa-east-1 (Sao Paulo) Unless Brazil-Specific Ã¢â‚¬â€ Never Default to It followed
- [ ] Choose Region Based on User Latency + Compliance + Cost Ã¢â‚¬â€ Never Any Single Factor Alone followed

---

# Implementation Checklist

- [ ] Best practice applied: Default to us-east-1 for cost optimization
- [ ] Best practice applied: Use region cost comparison before choosing
- [ ] Best practice applied: Select region based on user latency + compliance
- [ ] Best practice applied: Use Route53 latency routing for multi-region
- [ ] Best practice applied: Plan for multi-region from the start if global
- [ ] Default to us-east-1 for Cost Optimization Ã¢â‚¬â€ Never Choose a Region Without Cost Comparison followed
- [ ] Compare Service Availability Before Choosing Ã¢â‚¬â€ Never Assume Every Region Has All Services followed
- [ ] Use Single Region for <100K MAU Ã¢â‚¬â€ Never Deploy Multi-Region Prematurely followed
- [ ] Avoid sa-east-1 (Sao Paulo) Unless Brazil-Specific Ã¢â‚¬â€ Never Default to It followed
- [ ] Choose Region Based on User Latency + Compliance + Cost Ã¢â‚¬â€ Never Any Single Factor Alone followed
- [ ] Plan for Multi-Region from Start if Global Ã¢â‚¬â€ Never Retrofitted followed
- [ ] Workflow step completed: Inventory current Region Selection resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] us-east-1 to Europe
- [ ] us-east-1 to Asia
- [ ] eu-west-1 to Africa
- [ ] ap-southeast-1 to Australia
- [ ] Same-region latency

---

# Security Checklist

- [ ] GDPR
- [ ] Brazil
- [ ] Japan
- [ ] AWS Artifact
- [ ] Cross-region data transfer must comply with data sovereignty laws

---

# Reliability Checklist

- [ ] Mistake prevented: Choosing region by "closest to me"
- [ ] Mistake prevented: Ignoring service availability
- [ ] Mistake prevented: Single region for global app
- [ ] Mistake prevented: sa-east-1 for "South American users"

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Region selected based on user location + cost + compliance
- [ ] Service availability verified in chosen region
- [ ] Pricing compared across candidate regions
- [ ] Single region for <100K MAU; multi-region for global scale
- [ ] Data residency/compliance requirements met
- [ ] CloudFront used for global edge caching regardless of region

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Region Selection configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Default to us-east-1 for Cost Optimization Ã¢â‚¬â€ Never Choose a Region Without Cost Comparison followed
- [ ] Compare Service Availability Before Choosing Ã¢â‚¬â€ Never Assume Every Region Has All Services followed
- [ ] Use Single Region for <100K MAU Ã¢â‚¬â€ Never Deploy Multi-Region Prematurely followed
- [ ] Avoid sa-east-1 (Sao Paulo) Unless Brazil-Specific Ã¢â‚¬â€ Never Default to It followed
- [ ] Choose Region Based on User Latency + Compliance + Cost Ã¢â‚¬â€ Never Any Single Factor Alone followed
- [ ] Plan for Multi-Region from Start if Global Ã¢â‚¬â€ Never Retrofitted followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: 3+ regions for small app
- [ ] Anti-pattern prevented: No cost comparison across regions
- [ ] Anti-pattern prevented: Choosing region by AWS certification lab
- [ ] Anti-pattern prevented: Hoping compliance doesn't apply
- [ ] Common mistake prevented: Choosing region by "closest to me"
- [ ] Common mistake prevented: Ignoring service availability
- [ ] Common mistake prevented: Single region for global app
- [ ] Common mistake prevented: sa-east-1 for "South American users"

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Region selected based on user location + cost + compliance
- [ ] Verification passed: Service availability verified in chosen region
- [ ] Verification passed: Pricing compared across candidate regions

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
