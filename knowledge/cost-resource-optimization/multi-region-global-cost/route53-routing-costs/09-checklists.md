# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 10-multi-region-global-cost
**Knowledge Unit:** Route 53 Routing Costs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Choose routing policy based on requirements, not cost applied
- [ ] Use Route 53 health checks judiciously applied
- [ ] Set appropriate TTLs for failover applied
- [ ] Choose Routing Policy by Functional Need Ã¢â‚¬â€ Never by DNS Query Cost followed
- [ ] Always Use Alias Records for AWS Resources Ã¢â‚¬â€ Never Pay for CNAME or A Records followed
- [ ] Health Check the ALB, Not Individual Instances Ã¢â‚¬â€ Never Proliferate Health Checks followed
- [ ] Traffic Flow for simple setups prevented
- [ ] Geolocation for performance prevented
- [ ] Choosing routing policy based on cost prevented
- [ ] Health check proliferation prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Single-region
- [ ] Architecture guideline: Multi-region active-passive
- [ ] Architecture guideline: Multi-region active-active
- [ ] Architecture guideline: Compliance
- [ ] Architecture guideline: Canary deploys
- [ ] Architecture guideline: Use alias records for all AWS resources (free vs standard records)
- [ ] Choose Routing Policy by Functional Need Ã¢â‚¬â€ Never by DNS Query Cost followed
- [ ] Always Use Alias Records for AWS Resources Ã¢â‚¬â€ Never Pay for CNAME or A Records followed
- [ ] Health Check the ALB, Not Individual Instances Ã¢â‚¬â€ Never Proliferate Health Checks followed
- [ ] Use 60-Second TTL for Production Ã¢â‚¬â€ Never Default to 300-Second Without Consideration followed
- [ ] Consolidate Hosted Zones Ã¢â‚¬â€ Never Pay for Unnecessary Zones followed

---

# Implementation Checklist

- [ ] Best practice applied: Choose routing policy based on requirements, not cost
- [ ] Best practice applied: Use Route 53 health checks judiciously
- [ ] Best practice applied: Set appropriate TTLs for failover
- [ ] Best practice applied: Use alias records for AWS resources
- [ ] Best practice applied: Consolidate hosted zones
- [ ] Choose Routing Policy by Functional Need Ã¢â‚¬â€ Never by DNS Query Cost followed
- [ ] Always Use Alias Records for AWS Resources Ã¢â‚¬â€ Never Pay for CNAME or A Records followed
- [ ] Health Check the ALB, Not Individual Instances Ã¢â‚¬â€ Never Proliferate Health Checks followed
- [ ] Use 60-Second TTL for Production Ã¢â‚¬â€ Never Default to 300-Second Without Consideration followed
- [ ] Consolidate Hosted Zones Ã¢â‚¬â€ Never Pay for Unnecessary Zones followed
- [ ] Never Use Traffic Flow for Simple Setups Ã¢â‚¬â€ $50/Month Is Rarely Justified followed
- [ ] Workflow step completed: Inventory current Route53 Routing Costs resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Route 53 latency-based routing adds <10ms DNS resolution time; negligible
- [ ] DNS TTL
- [ ] Health check intervals
- [ ] Route 53 is an authoritative DNS service; does not cache; each query resolves at AWS edge
- [ ] Global DNS resolution time

---

# Security Checklist

- [ ] Route 53 supports DNSSEC for domain signing
- [ ] Route 53 Shield Advanced for DDoS protection on DNS queries ($3000/month)
- [ ] Health check traffic comes from AWS health check IP ranges; allow in security groups
- [ ] Route 53 Resolver DNS Firewall for filtering outbound DNS queries
- [ ] API-based changes to Route 53 should be logged via CloudTrail

---

# Reliability Checklist

- [ ] Mistake prevented: Choosing routing policy based on cost
- [ ] Mistake prevented: Health check proliferation
- [ ] Mistake prevented: Not using alias records
- [ ] Mistake prevented: Over-engineering routing for single-region apps

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
- [ ] Route53 Routing Costs configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Choose Routing Policy by Functional Need Ã¢â‚¬â€ Never by DNS Query Cost followed
- [ ] Always Use Alias Records for AWS Resources Ã¢â‚¬â€ Never Pay for CNAME or A Records followed
- [ ] Health Check the ALB, Not Individual Instances Ã¢â‚¬â€ Never Proliferate Health Checks followed
- [ ] Use 60-Second TTL for Production Ã¢â‚¬â€ Never Default to 300-Second Without Consideration followed
- [ ] Consolidate Hosted Zones Ã¢â‚¬â€ Never Pay for Unnecessary Zones followed
- [ ] Never Use Traffic Flow for Simple Setups Ã¢â‚¬â€ $50/Month Is Rarely Justified followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Traffic Flow for simple setups
- [ ] Anti-pattern prevented: Geolocation for performance
- [ ] Anti-pattern prevented: Low TTL on stable records
- [ ] Anti-pattern prevented: Health checking every instance
- [ ] Common mistake prevented: Choosing routing policy based on cost
- [ ] Common mistake prevented: Health check proliferation
- [ ] Common mistake prevented: Not using alias records
- [ ] Common mistake prevented: Over-engineering routing for single-region apps

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
