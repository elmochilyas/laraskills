# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Laravel Horizon Decision Matrix
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Redis is the queue driver (Horizon does not manage non-Redis queues)
- [ ] Horizon dashboard authenticated in production

---

# Architecture Checklist

- [ ] Supervisors separated by workload type (webhooks, notifications, default, long-running)
- [ ] `balance` strategy matches workload pattern (`auto` for bursty, `simple` for steady)
- [ ] Memory and timeout limits configured per supervisor matching job characteristics
- [ ] Horizon Redis prefix isolated (different prefix per app if sharing Redis)

---

# Implementation Checklist

- [ ] Workflow step completed: Supervisor configuration defined with separate supervisors per workload
- [ ] Workflow step completed: Horizon dashboard authentication configured (Gate or role-based)
- [ ] Workflow step completed: Job `tries` set in ONE place (job attribute preferred over Horizon config)
- [ ] Workflow step completed: Tags defined on job classes for dashboard filtering
- [ ] Workflow step completed: `horizon:terminate` added to deployment script
- [ ] Workflow step completed: Redis memory usage monitored after Horizon enabled
- [ ] Workflow step completed: Failed job payloads reviewed for PII and sensitive data

---

# Performance Checklist

- [ ] Redis memory overhead budgeted (50-100MB at 100K jobs/day, 200-400MB at 1M jobs/day)
- [ ] `balance: 'simple'` used for steady workloads (reduces auto-balancing overhead)
- [ ] Dashboard polling impact understood (only open dashboard pages poll, lightweight ~2-5ms)
- [ ] Redis `maxmemory` configured to account for Horizon data

---

# Security Checklist

- [ ] Horizon dashboard authentication mandatory in production
- [ ] Failed job payloads reviewed — no unprotected PII, API tokens, or secrets
- [ ] Horizon dashboard restricted to senior engineers who understand data sensitivity
- [ ] Redis key prefix unique per application (prevents cross-app data leakage in shared Redis)

---

# Reliability Checklist

- [ ] Failure addressed: Using Horizon with non-Redis queues expecting supervisor management:
- [ ] Failure addressed: No Horizon authentication in production:
- [ ] Failure addressed: One supervisor for all queues:
- [ ] Failure addressed: `tries` set in both Horizon config and job attribute:
- [ ] Failure addressed: Missing `horizon:terminate` in deployment:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Redis is the queue driver (Horizon doesn't manage non-Redis queues)
- [ ] Supervisors are separated by workload type (webhooks, notifications, default, long-running)
- [ ] Horizon dashboard is authenticated in production
- [ ] `balance` strategy matches workload pattern (`auto` for bursty, `simple` for steady)
- [ ] Redis memory usage is monitored after Horizon is enabled
- [ ] `horizon:terminate` is called during deployment
- [ ] Job `tries` is set in ONE place (job attribute or Horizon config, not both)
- [ ] Tags are used on jobs for dashboard filtering
- [ ] Escape hatch plan exists for non-Redis queue migration
- [ ] Failed job payloads don't contain unprotected PII or secrets

### Success Criteria
- [ ] Horizon dashboard only accessible to authorized users in production
- [ ] Supervisor separation prevents slow jobs from starving fast jobs
- [ ] Redis OOM never caused by Horizon data accumulation
- [ ] Deployments never kill running jobs mid-execution

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Horizon as primary monitoring tool (doesn't replace Sentry/Datadog/Grafana)
- [ ] Anti-pattern prevented: Horizon dashboard open to all developers (PII in failed job payloads)
- [ ] Anti-pattern prevented: Running Horizon without Redis memory monitoring
- [ ] Anti-pattern prevented: Horizon for cron-based tasks (metrics designed for continuous throughput)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Redis memory exceeded due to Horizon data:
- [ ] Failure scenario handled: Horizon process crashes (supervisor auto-restart):
- [ ] Failure scenario handled: Queue driver migrates from Redis to SQS:

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
