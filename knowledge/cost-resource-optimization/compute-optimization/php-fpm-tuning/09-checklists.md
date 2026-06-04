# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** PHP-FPM Tuning
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] pm.max_children calculated from available memory
- [ ] pm.max_requests set to 500-1000
- [ ] pm.status_path enabled and monitored
- [ ] Worker memory usage tracked and averaged
- [ ] Load test performed to validate configuration
- [ ] Calculate max_children from available memory applied
- [ ] Set pm.max_requests to 500-1000 applied
- [ ] Monitor real memory per worker applied
- [ ] Static pool with large max_children prevented
- [ ] On-demand for production traffic prevented
- [ ] Setting max_children too high prevented
- [ ] No pm.max_requests limit prevented

---

# Architecture Checklist

- [ ] Architecture guideline: For 2GB RAM server
- [ ] Architecture guideline: For 4GB RAM server
- [ ] Architecture guideline: For 8GB RAM server
- [ ] Architecture guideline: These are starting points; measure with Load Testing (k6, locust) and adjust
- [ ] Architecture guideline: When using Octane

---

# Implementation Checklist

- [ ] Best practice applied: Calculate max_children from available memory
- [ ] Best practice applied: Set pm.max_requests to 500-1000
- [ ] Best practice applied: Monitor real memory per worker
- [ ] Best practice applied: Set pm.start_servers to peak average count
- [ ] Best practice applied: Use pm.process_idle_timeout of 10-30s
- [ ] Workflow step completed: Inventory current Php Fpm Tuning resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] More workers does not always mean more throughput
- [ ] Monitor CPU queue length; if consistently > 2x vCPUs, max_children is too high
- [ ] Each idle worker still consumes ~20MB memory; don't over-allocate idle servers
- [ ] Worker creation (fork) costs ~50-200ms CPU time; dynamic pool pre-creates to avoid this latency
- [ ] pm.max_requests 500 = workers restart ~every 50 seconds at 10 req/s; too frequent means constant boot overhead

---

# Security Checklist

- [ ] Run PHP-FPM as dedicated user (www-data), not root
- [ ] chroot/chdir to application root to limit file system access
- [ ] Set `security.limit_extensions` to `.php` only (prevent arbitrary file execution)
- [ ] PHP-FPM socket should be file-system protected or listen on localhost only
- [ ] Monitor for slow request logs (`request_slowlog_timeout`) as security indicator

---

# Reliability Checklist

- [ ] Mistake prevented: Setting max_children too high
- [ ] Mistake prevented: No pm.max_requests limit
- [ ] Mistake prevented: Dynamic pool with very short idle timeout

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] pm.max_children calculated from available memory
- [ ] pm.max_requests set to 500-1000
- [ ] pm.status_path enabled and monitored
- [ ] Worker memory usage tracked and averaged
- [ ] Load test performed to validate configuration
- [ ] pm.process_idle_timeout set to 30s

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Php Fpm Tuning configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Static pool with large max_children
- [ ] Anti-pattern prevented: On-demand for production traffic
- [ ] Anti-pattern prevented: No monitoring of FPM metrics
- [ ] Common mistake prevented: Setting max_children too high
- [ ] Common mistake prevented: No pm.max_requests limit
- [ ] Common mistake prevented: Dynamic pool with very short idle timeout

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: pm.max_children calculated from available memory
- [ ] Verification passed: pm.max_requests set to 500-1000
- [ ] Verification passed: pm.status_path enabled and monitored

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
