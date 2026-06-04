# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Lambda vs EC2 Breakeven Analysis
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Model your specific workload applied
- [ ] Include operational overhead in comparison applied
- [ ] Use 90-day Cost Explorer analysis applied
- [ ] Lambda-only architecture at scale prevented
- [ ] EC2 over-provisioned "for safety" prevented
- [ ] Comparing peak-only Lambda cost to average EC2 cost prevented
- [ ] Forgetting EC2 includes OS overhead prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Lambda for
- [ ] Architecture guideline: Use EC2/Fargate for
- [ ] Architecture guideline: Use Fargate Spot for
- [ ] Architecture guideline: Provisioned Concurrency should trigger EC2/Fargate evaluation (if you need it, EC2 may be cheaper)
- [ ] Architecture guideline: Monitor cost per request monthly; set alerts when approaching breakeven thresholds

---

# Implementation Checklist

- [ ] Best practice applied: Model your specific workload
- [ ] Best practice applied: Include operational overhead in comparison
- [ ] Best practice applied: Use 90-day Cost Explorer analysis
- [ ] Best practice applied: Consider Fargate as compromise
- [ ] Best practice applied: Test with Provisioned Concurrency
- [ ] Workflow step completed: Inventory current Lambda Ec2 Breakeven resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Lambda cold starts add 200-1000ms for PHP (Bref/Laravel) Ã¢â‚¬â€ problematic for user-facing endpoints
- [ ] EC2 gives full CPU control; Lambda shares CPU proportional to memory allocation
- [ ] Memory cap of 10,240MB per Lambda function; EC2 instances offer up to 768GB
- [ ] Fargate tasks have 30-120s startup time but no cold starts once running
- [ ] Lambda duration at 128MB is much slower than at 1769MB (1 full vCPU); cost-optimal memory may not be performance-optimal

---

# Security Checklist

- [ ] Lambda VPC functions need NAT Gateway for internet access (~$32/month + $0.045/GB) Ã¢â‚¬â€ shifts breakeven
- [ ] EC2 security groups provide network isolation; Lambda functions share AWS-managed infrastructure
- [ ] Lambda function IAM roles are per-function; EC2 instance profiles apply to all processes on the instance
- [ ] Both support encryption at rest and in transit; Lambda has simpler key management
- [ ] EC2 provides more granular network controls (VPC endpoints, subnet routing, NACLs)

---

# Reliability Checklist

- [ ] Mistake prevented: Comparing peak-only Lambda cost to average EC2 cost
- [ ] Mistake prevented: Forgetting EC2 includes OS overhead
- [ ] Mistake prevented: Not factoring Lambda VPC networking costs
- [ ] Mistake prevented: Ignoring Compute Savings Plans discounts

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
- [ ] Lambda Ec2 Breakeven configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Lambda-only architecture at scale
- [ ] Anti-pattern prevented: EC2 over-provisioned "for safety"
- [ ] Anti-pattern prevented: Vapor lock-in without breakeven review
- [ ] Anti-pattern prevented: Ignoring Fargate option
- [ ] Common mistake prevented: Comparing peak-only Lambda cost to average EC2 cost
- [ ] Common mistake prevented: Forgetting EC2 includes OS overhead
- [ ] Common mistake prevented: Not factoring Lambda VPC networking costs
- [ ] Common mistake prevented: Ignoring Compute Savings Plans discounts

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
