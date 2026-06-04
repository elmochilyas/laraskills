# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** Region Data Affinity
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] App servers and database in same AZ (primary traffic)
- [ ] VPC Endpoints configured for S3, SQS, DynamoDB
- [ ] No NAT Gateway used for AWS service access
- [ ] Cross-AZ data transfer costs monitored in Cost Explorer
- [ ] AZ affinity documented and maintained
- [ ] Deploy app and database in same AZ applied
- [ ] Use VPC Endpoints for AWS services applied
- [ ] Place cache and database in same AZ as web servers applied
- [ ] Deploy Application and Database in the Same AZ followed
- [ ] Use VPC Endpoints Instead of NAT Gateway for AWS Service Access followed
- [ ] Place Cache and Database in Same AZ as Web Servers followed
- [ ] Single-AZ with no multi-region prevented
- [ ] All services in public subnets prevented
- [ ] Random AZ deployment prevented
- [ ] Using NAT Gateway for AWS services prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Deploy ALB + EC2 Web + ElastiCache + RDS Primary all in AZ-a (primary traffic zone)
- [ ] Architecture guideline: Deploy RDS Standby in AZ-b (for failover only)
- [ ] Architecture guideline: Use ASG with AZ balancing disabled (keep all instances in AZ-a)
- [ ] Architecture guideline: For HA cross-AZ
- [ ] Architecture guideline: Use VPC Endpoints instead of NAT Gateway for S3, SQS, DynamoDB access
- [ ] Architecture guideline: Monitor DataTransfer metrics in Cost Explorer to track cross-AZ charges
- [ ] Deploy Application and Database in the Same AZ followed
- [ ] Use VPC Endpoints Instead of NAT Gateway for AWS Service Access followed
- [ ] Place Cache and Database in Same AZ as Web Servers followed
- [ ] Configure RDS Proxy in Same AZ as Application followed
- [ ] Monitor Cross-AZ/Region DataTransfer in Cost Explorer followed

---

# Implementation Checklist

- [ ] Best practice applied: Deploy app and database in same AZ
- [ ] Best practice applied: Use VPC Endpoints for AWS services
- [ ] Best practice applied: Place cache and database in same AZ as web servers
- [ ] Best practice applied: Use Multi-AZ for availability, not for cost
- [ ] Best practice applied: Configure RDS Proxy in same AZ as app
- [ ] Deploy Application and Database in the Same AZ followed
- [ ] Use VPC Endpoints Instead of NAT Gateway for AWS Service Access followed
- [ ] Place Cache and Database in Same AZ as Web Servers followed
- [ ] Configure RDS Proxy in Same AZ as Application followed
- [ ] Monitor Cross-AZ/Region DataTransfer in Cost Explorer followed
- [ ] Workflow step completed: Inventory current Region Data Affinity resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Same-AZ
- [ ] Cross-AZ
- [ ] Cross-region
- [ ] NAT Gateway latency
- [ ] Placement groups

---

# Security Checklist

- [ ] VPC Endpoints keep traffic within AWS network (never traverses internet)
- [ ] NAT Gateway provides outbound internet for private subnets with elastic IP
- [ ] VPC Flow Logs capture data transfer between AZs/regions for audit
- [ ] Cross-region traffic should be encrypted (VPC Peering or Transit Gateway encrypts)
- [ ] Security groups by AZ

---

# Reliability Checklist

- [ ] Mistake prevented: Random AZ deployment
- [ ] Mistake prevented: Using NAT Gateway for AWS services
- [ ] Mistake prevented: Cross-region database for global app

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] App servers and database in same AZ (primary traffic)
- [ ] VPC Endpoints configured for S3, SQS, DynamoDB
- [ ] No NAT Gateway used for AWS service access
- [ ] Cross-AZ data transfer costs monitored in Cost Explorer
- [ ] AZ affinity documented and maintained
- [ ] Multi-AZ deployment has primary zone optimized for cost

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Region Data Affinity configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Deploy Application and Database in the Same AZ followed
- [ ] Use VPC Endpoints Instead of NAT Gateway for AWS Service Access followed
- [ ] Place Cache and Database in Same AZ as Web Servers followed
- [ ] Configure RDS Proxy in Same AZ as Application followed
- [ ] Monitor Cross-AZ/Region DataTransfer in Cost Explorer followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Single-AZ with no multi-region
- [ ] Anti-pattern prevented: All services in public subnets
- [ ] Anti-pattern prevented: Cross-region synchronous calls
- [ ] Anti-pattern prevented: Ignoring DataTransfer costs
- [ ] Common mistake prevented: Random AZ deployment
- [ ] Common mistake prevented: Using NAT Gateway for AWS services
- [ ] Common mistake prevented: Cross-region database for global app

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: App servers and database in same AZ (primary traffic)
- [ ] Verification passed: VPC Endpoints configured for S3, SQS, DynamoDB
- [ ] Verification passed: No NAT Gateway used for AWS service access

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
