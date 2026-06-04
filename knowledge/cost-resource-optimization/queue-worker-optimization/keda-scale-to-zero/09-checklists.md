# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 03-queue-worker-optimization
**Knowledge Unit:** KEDA Scale-to-Zero Workers
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Set cooldown period to 300 seconds applied
- [ ] Configure target metric based on processing capacity applied
- [ ] Use SQS scaler for Laravel queue workers applied
- [ ] Pattern Without Enforcement prevented
- [ ] Inconsistent Application prevented

---

# Architecture Checklist

- [ ] Architecture guideline: KEDA requires Kubernetes (EKS, AKS, GKE, or self-managed K8s)
- [ ] Architecture guideline: For ECS/Fargate
- [ ] Architecture guideline: KEDA with SQS scaler for SQS-based queues
- [ ] Architecture guideline: KEDA with Redis scaler for Laravel Horizon (Redis) queues
- [ ] Architecture guideline: Deploy KEDA operator separately from application workloads
- [ ] Architecture guideline: Set min replicas based on acceptable message processing latency

---

# Implementation Checklist

- [ ] Best practice applied: Set cooldown period to 300 seconds
- [ ] Best practice applied: Configure target metric based on processing capacity
- [ ] Best practice applied: Use SQS scaler for Laravel queue workers
- [ ] Best practice applied: Ensure fast worker startup for scale-from-zero
- [ ] Workflow step completed: Inventory current Keda Scale To Zero resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure handling defined
- [ ] Timeouts configured

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
- [ ] Keda Scale To Zero configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Pattern Without Enforcement
- [ ] Anti-pattern prevented: Inconsistent Application
- [ ] Anti-pattern prevented: Missing Documentation

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
