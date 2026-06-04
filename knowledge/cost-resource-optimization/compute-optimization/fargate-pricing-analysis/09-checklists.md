# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Fargate Pricing Analysis
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Use ARM/Graviton for all Fargate tasks applied
- [ ] Right-size task memory applied
- [ ] Combine Fargate with ECS Service Auto Scaling applied
- [ ] Task-per-PHP-worker prevented
- [ ] Always-on for dev/staging prevented
- [ ] Using Fargate for background workers without Spot prevented
- [ ] Over-allocating task memory prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Fargate for containerized Laravel apps when team size < 5 DevOps engineers
- [ ] Architecture guideline: Combine Fargate with Compute Savings Plans for baseline (up to 66% off on-demand)
- [ ] Architecture guideline: Use Fargate Spot for all queue workers and batch processing tasks
- [ ] Architecture guideline: Distribute tasks across multiple AZs for high availability
- [ ] Architecture guideline: Use smaller, more tasks for variable traffic; fewer, larger tasks for steady traffic
- [ ] Architecture guideline: Monitor Fargate task-level resource utilization via CloudWatch Container Insights

---

# Implementation Checklist

- [ ] Best practice applied: Use ARM/Graviton for all Fargate tasks
- [ ] Best practice applied: Right-size task memory
- [ ] Best practice applied: Combine Fargate with ECS Service Auto Scaling
- [ ] Best practice applied: Use FireLens for log routing
- [ ] Best practice applied: Prefer ECS over EKS
- [ ] Workflow step completed: Inventory current Fargate Pricing Analysis resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Task startup
- [ ] CPU bursting
- [ ] Network throughput scales with task size; larger tasks get better network performance
- [ ] Graviton4 tasks offer up to 30% better performance than Graviton3 at same vCPU count
- [ ] Cross-AZ data transfer costs apply between Fargate tasks and RDS in different AZs

---

# Security Checklist

- [ ] Fargate tasks run in isolated AWS-managed infrastructure
- [ ] No SSH access to underlying hosts; reduces attack surface
- [ ] IAM task roles for least-privilege permissions
- [ ] Container images should be scanned for vulnerabilities before deployment
- [ ] Use AWS KMS for ECR image encryption at rest

---

# Reliability Checklist

- [ ] Mistake prevented: Using Fargate for background workers without Spot
- [ ] Mistake prevented: Over-allocating task memory
- [ ] Mistake prevented: Running 24/7 Fargate tasks without scale-to-zero
- [ ] Mistake prevented: Not factoring cross-AZ data transfer

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
- [ ] Fargate Pricing Analysis configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Task-per-PHP-worker
- [ ] Anti-pattern prevented: Always-on for dev/staging
- [ ] Anti-pattern prevented: EKS for single-service Fargate
- [ ] Common mistake prevented: Using Fargate for background workers without Spot
- [ ] Common mistake prevented: Over-allocating task memory
- [ ] Common mistake prevented: Running 24/7 Fargate tasks without scale-to-zero
- [ ] Common mistake prevented: Not factoring cross-AZ data transfer

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
