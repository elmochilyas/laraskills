# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 10-multi-region-global-cost
**Knowledge Unit:** Data Transfer Costs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] App and database in same AZ (avoid cross-AZ costs)
- [ ] VPC Endpoints used for S3, SQS, SNS (not NAT Gateway)
- [ ] CloudFront used for global content delivery
- [ ] No synchronous cross-region database calls
- [ ] Cross-region data compressed (gzip)
- [ ] Keep app and database in same AZ applied
- [ ] Use VPC Endpoints for AWS services applied
- [ ] Use CloudFront for global content delivery applied
- [ ] Always Deploy App and Database in the Same AZ Ã¢â‚¬â€ Never Pay Cross-AZ Transfer followed
- [ ] Always Use VPC Endpoints Over NAT Gateway for AWS Services followed
- [ ] Always Minimize Cross-Region Writes Ã¢â‚¬â€ Never Use Synchronous Calls followed
- [ ] Hub-and-spoke database prevented
- [ ] No data compression before transfer prevented
- [ ] Cross-region database queries prevented
- [ ] Ignoring cross-AZ transfer costs prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Default
- [ ] Architecture guideline: Multi-region
- [ ] Architecture guideline: Avoid synchronous cross-region API calls in request path
- [ ] Architecture guideline: Use CloudFront as entry point for all global applications
- [ ] Architecture guideline: Compress data before transfer (gzip reduces text size by 70%+)
- [ ] Architecture guideline: Route53 latency-based routing directs users to nearest region
- [ ] Always Deploy App and Database in the Same AZ Ã¢â‚¬â€ Never Pay Cross-AZ Transfer followed
- [ ] Always Use VPC Endpoints Over NAT Gateway for AWS Services followed
- [ ] Always Minimize Cross-Region Writes Ã¢â‚¬â€ Never Use Synchronous Calls followed
- [ ] Always Use CloudFront for Global Egress Ã¢â‚¬â€ Never Serve Directly from EC2/ALB followed
- [ ] Monitor DataTransfer in Cost Explorer Monthly Ã¢â‚¬â€ Never Let It Surprise You followed

---

# Implementation Checklist

- [ ] Best practice applied: Keep app and database in same AZ
- [ ] Best practice applied: Use VPC Endpoints for AWS services
- [ ] Best practice applied: Use CloudFront for global content delivery
- [ ] Best practice applied: Minimize cross-region writes
- [ ] Best practice applied: Use Aurora Global Database for cross-region replication
- [ ] Best practice applied: Monitor DataTransfer costs in Cost Explorer
- [ ] Always Deploy App and Database in the Same AZ Ã¢â‚¬â€ Never Pay Cross-AZ Transfer followed
- [ ] Always Use VPC Endpoints Over NAT Gateway for AWS Services followed
- [ ] Always Minimize Cross-Region Writes Ã¢â‚¬â€ Never Use Synchronous Calls followed
- [ ] Always Use CloudFront for Global Egress Ã¢â‚¬â€ Never Serve Directly from EC2/ALB followed
- [ ] Monitor DataTransfer in Cost Explorer Monthly Ã¢â‚¬â€ Never Let It Surprise You followed
- [ ] Keep Regional Data Local Ã¢â‚¬â€ Never Share Cache or Session Across Regions followed
- [ ] Workflow step completed: Inventory current Data Transfer Costs resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Cross-region latency
- [ ] Cross-AZ latency
- [ ] VPC Endpoint latency
- [ ] Compression benefit
- [ ] CloudFront

---

# Security Checklist

- [ ] Encrypt cross-region data transfer (TLS; AWS backbone encrypts by default)
- [ ] VPC peering traffic stays within AWS network (no public internet)
- [ ] Cross-region replication must comply with data residency regulations
- [ ] CloudFront origin access control (OAC) prevents direct S3 access
- [ ] Monitor DataTransfer for anomalies (potential data exfiltration)

---

# Reliability Checklist

- [ ] Mistake prevented: Cross-region database queries
- [ ] Mistake prevented: Ignoring cross-AZ transfer costs
- [ ] Mistake prevented: Using NAT Gateway for all outbound traffic

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] App and database in same AZ (avoid cross-AZ costs)
- [ ] VPC Endpoints used for S3, SQS, SNS (not NAT Gateway)
- [ ] CloudFront used for global content delivery
- [ ] No synchronous cross-region database calls
- [ ] Cross-region data compressed (gzip)
- [ ] DataTransfer costs monitored (Cost Explorer budget)
- [ ] Cross-region replication uses AWS backbone (not internet)

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Data Transfer Costs configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Deploy App and Database in the Same AZ Ã¢â‚¬â€ Never Pay Cross-AZ Transfer followed
- [ ] Always Use VPC Endpoints Over NAT Gateway for AWS Services followed
- [ ] Always Minimize Cross-Region Writes Ã¢â‚¬â€ Never Use Synchronous Calls followed
- [ ] Always Use CloudFront for Global Egress Ã¢â‚¬â€ Never Serve Directly from EC2/ALB followed
- [ ] Monitor DataTransfer in Cost Explorer Monthly Ã¢â‚¬â€ Never Let It Surprise You followed
- [ ] Keep Regional Data Local Ã¢â‚¬â€ Never Share Cache or Session Across Regions followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Hub-and-spoke database
- [ ] Anti-pattern prevented: No data compression before transfer
- [ ] Anti-pattern prevented: Cross-region cache eviction
- [ ] Common mistake prevented: Cross-region database queries
- [ ] Common mistake prevented: Ignoring cross-AZ transfer costs
- [ ] Common mistake prevented: Using NAT Gateway for all outbound traffic

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: App and database in same AZ (avoid cross-AZ costs)
- [ ] Verification passed: VPC Endpoints used for S3, SQS, SNS (not NAT Gateway)
- [ ] Verification passed: CloudFront used for global content delivery

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
