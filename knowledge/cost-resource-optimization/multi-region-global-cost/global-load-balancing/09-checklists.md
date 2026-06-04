# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 10-multi-region-global-cost
**Knowledge Unit:** Global Load Balancing
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Global load balancing strategy defined (single region, active-active, active-passive)
- [ ] Route53 routing configured (latency/geolocation/failover based on need)
- [ ] Health checks configured for all regions
- [ ] DNS TTL appropriate (60s for production)
- [ ] Multi-region deployment has local database per region
- [ ] Use Route53 latency routing for multi-region apps applied
- [ ] Prefer active-passive for DR cost savings applied
- [ ] Combine with CloudFront for edge caching applied
- [ ] Always Start with Single Region + CloudFront Ã¢â‚¬â€ Never Multi-Region by Default followed
- [ ] Always Use Route53 Latency Routing for Multi-Region Ã¢â‚¬â€ Never Geolocation for Performance followed
- [ ] Always Use Health Checks on All Regional Endpoints Ã¢â‚¬â€ Never Route to Unhealthy Regions followed
- [ ] Multi-region without monitoring prevented
- [ ] Identical capacity in all regions prevented
- [ ] Latency routing without regional infrastructure prevented
- [ ] Active-active without addressing cross-region data sync prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Default
- [ ] Architecture guideline: Multi-region
- [ ] Architecture guideline: DR
- [ ] Architecture guideline: Route53 health checks
- [ ] Architecture guideline: DNS TTL
- [ ] Architecture guideline: Global Accelerator
- [ ] Architecture guideline: Each region
- [ ] Always Start with Single Region + CloudFront Ã¢â‚¬â€ Never Multi-Region by Default followed
- [ ] Always Use Route53 Latency Routing for Multi-Region Ã¢â‚¬â€ Never Geolocation for Performance followed
- [ ] Always Use Health Checks on All Regional Endpoints Ã¢â‚¬â€ Never Route to Unhealthy Regions followed
- [ ] Never Use Global Accelerator for Simple HTTP Ã¢â‚¬â€ CloudFront Is Cheaper and Better followed
- [ ] Use Appropriate DNS TTL Ã¢â‚¬â€ Never Use 1-Second TTL Everywhere followed

---

# Implementation Checklist

- [ ] Best practice applied: Use Route53 latency routing for multi-region apps
- [ ] Best practice applied: Prefer active-passive for DR cost savings
- [ ] Best practice applied: Combine with CloudFront for edge caching
- [ ] Best practice applied: Set health checks on Route53 routing
- [ ] Best practice applied: Use weighted routing for canary deployments
- [ ] Best practice applied: Monitor Route53 query costs
- [ ] Always Start with Single Region + CloudFront Ã¢â‚¬â€ Never Multi-Region by Default followed
- [ ] Always Use Route53 Latency Routing for Multi-Region Ã¢â‚¬â€ Never Geolocation for Performance followed
- [ ] Always Use Health Checks on All Regional Endpoints Ã¢â‚¬â€ Never Route to Unhealthy Regions followed
- [ ] Never Use Global Accelerator for Simple HTTP Ã¢â‚¬â€ CloudFront Is Cheaper and Better followed
- [ ] Use Appropriate DNS TTL Ã¢â‚¬â€ Never Use 1-Second TTL Everywhere followed
- [ ] Use Weighted Routing for Canary Deployments Ã¢â‚¬â€ Never Cut Over All at Once followed
- [ ] Workflow step completed: Inventory current Global Load Balancing resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Route53 DNS caching
- [ ] Global Accelerator
- [ ] CloudFront
- [ ] Latency routing
- [ ] DNS queries

---

# Security Checklist

- [ ] Route53 DNS queries are logged in CloudTrail
- [ ] Shield Advanced integrates with Route53 for DDoS protection at DNS level
- [ ] DNSSEC signing for Route53 zones (prevents DNS spoofing)
- [ ] Health check requests can be a vector; restrict health check IP ranges
- [ ] Cross-region traffic should be encrypted (TLS between regions)

---

# Reliability Checklist

- [ ] Mistake prevented: Latency routing without regional infrastructure
- [ ] Mistake prevented: Active-active without addressing cross-region data sync
- [ ] Mistake prevented: Global Accelerator for simple HTTP app
- [ ] Mistake prevented: Short TTL everywhere

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Global load balancing strategy defined (single region, active-active, active-passive)
- [ ] Route53 routing configured (latency/geolocation/failover based on need)
- [ ] Health checks configured for all regions
- [ ] DNS TTL appropriate (60s for production)
- [ ] Multi-region deployment has local database per region
- [ ] CloudFront used for edge caching regardless of routing strategy
- [ ] DR failover tested quarterly

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Global Load Balancing configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Start with Single Region + CloudFront Ã¢â‚¬â€ Never Multi-Region by Default followed
- [ ] Always Use Route53 Latency Routing for Multi-Region Ã¢â‚¬â€ Never Geolocation for Performance followed
- [ ] Always Use Health Checks on All Regional Endpoints Ã¢â‚¬â€ Never Route to Unhealthy Regions followed
- [ ] Never Use Global Accelerator for Simple HTTP Ã¢â‚¬â€ CloudFront Is Cheaper and Better followed
- [ ] Use Appropriate DNS TTL Ã¢â‚¬â€ Never Use 1-Second TTL Everywhere followed
- [ ] Use Weighted Routing for Canary Deployments Ã¢â‚¬â€ Never Cut Over All at Once followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Multi-region without monitoring
- [ ] Anti-pattern prevented: Identical capacity in all regions
- [ ] Anti-pattern prevented: No Route53 health checks
- [ ] Anti-pattern prevented: Forgetting CloudFront
- [ ] Common mistake prevented: Latency routing without regional infrastructure
- [ ] Common mistake prevented: Active-active without addressing cross-region data sync
- [ ] Common mistake prevented: Global Accelerator for simple HTTP app
- [ ] Common mistake prevented: Short TTL everywhere

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Global load balancing strategy defined (single region, active-active, active-passive)
- [ ] Verification passed: Route53 routing configured (latency/geolocation/failover based on need)
- [ ] Verification passed: Health checks configured for all regions

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
