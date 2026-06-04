# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Lambda Pricing Breakdown
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Always use ARM/Graviton architecture applied
- [ ] Right-size memory allocation applied
- [ ] Use Compute Savings Plans for Lambda applied
- [ ] Runaway recursion prevented
- [ ] Unthrottled event sources prevented
- [ ] Not enabling ARM/Graviton architecture prevented
- [ ] Over-allocating memory without testing prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Lambda for event-driven, short-lived, variable-load workloads
- [ ] Architecture guideline: EC2/Fargate for long-running, steady-state, latency-sensitive workloads
- [ ] Architecture guideline: Tag Lambda functions by environment, team, and endpoint for cost allocation
- [ ] Architecture guideline: Use AWS Lambda Powertools for structured logging and cost attribution
- [ ] Architecture guideline: Implement idempotency in all Lambda functions to handle retry-induced cost spikes

---

# Implementation Checklist

- [ ] Best practice applied: Always use ARM/Graviton architecture
- [ ] Best practice applied: Right-size memory allocation
- [ ] Best practice applied: Use Compute Savings Plans for Lambda
- [ ] Best practice applied: Avoid Provisioned Concurrency as default
- [ ] Best practice applied: Set reserved concurrency per function
- [ ] Workflow step completed: Inventory current Lambda Pricing Breakdown resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Memory allocation directly impacts CPU
- [ ] 15-minute timeout limit; use Step Functions for orchestrating longer workflows
- [ ] Response streaming (2025+) reduces time-to-first-byte for large payloads
- [ ] Cold starts
- [ ] Higher memory = faster execution but higher per-second cost; find cost-optimal point

---

# Security Checklist

- [ ] Lambda@Edge executes at CloudFront edge locations; data in transit through AWS backbone
- [ ] VPC-connected Lambda requires NAT Gateway for internet access (adds cost and complexity)
- [ ] Lambda function IAM roles should follow least privilege per function
- [ ] Environment variables can be encrypted with KMS at no additional Lambda cost
- [ ] Lambda function URL exposes HTTPS endpoint; configure auth (IAM or resource-based policy)

---

# Reliability Checklist

- [ ] Mistake prevented: Not enabling ARM/Graviton architecture
- [ ] Mistake prevented: Over-allocating memory without testing
- [ ] Mistake prevented: Ignoring VPC networking costs
- [ ] Mistake prevented: Not factoring Lambda@Edge cost

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
- [ ] Lambda Pricing Breakdown configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Runaway recursion
- [ ] Anti-pattern prevented: Unthrottled event sources
- [ ] Anti-pattern prevented: Lambda for everything
- [ ] Anti-pattern prevented: Vapor cost trap
- [ ] Common mistake prevented: Not enabling ARM/Graviton architecture
- [ ] Common mistake prevented: Over-allocating memory without testing
- [ ] Common mistake prevented: Ignoring VPC networking costs
- [ ] Common mistake prevented: Not factoring Lambda@Edge cost

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
