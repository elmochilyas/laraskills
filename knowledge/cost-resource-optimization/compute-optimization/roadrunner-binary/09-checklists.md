# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** RoadRunner Binary
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] RoadRunner binary used for Octane (not Swoole unless specific need)
- [ ] .rr.yaml configured with appropriate worker pool settings
- [ ] max_jobs set to prevent memory leaks
- [ ] Health check endpoint configured
- [ ] Static files served via RoadRunner `static` plugin
- [ ] Use RoadRunner for Octane over Swoole applied
- [ ] Configure worker pool size applied
- [ ] Serve static files from RoadRunner applied
- [ ] Nginx in front of RoadRunner prevented
- [ ] Running RoadRunner as root prevented
- [ ] Not configuring max_jobs prevented
- [ ] Over-allocating workers prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Single Docker image with `rr` binary + PHP code; no Nginx or Apache
- [ ] Architecture guideline: Expose port 8080 (RoadRunner default) and point ALB to it
- [ ] Architecture guideline: Use `supervisord` or Kubernetes sidecar for RoadRunner process management
- [ ] Architecture guideline: Configure `max_jobs
- [ ] Architecture guideline: Enable `logs` plugin for structured JSON logging (easier log aggregation)
- [ ] Architecture guideline: For static assets, enable `static` plugin; for dynamic content, use `http` plugin

---

# Implementation Checklist

- [ ] Best practice applied: Use RoadRunner for Octane over Swoole
- [ ] Best practice applied: Configure worker pool size
- [ ] Best practice applied: Serve static files from RoadRunner
- [ ] Best practice applied: Monitor RoadRunner metrics
- [ ] Best practice applied: Use .env per environment
- [ ] Workflow step completed: Inventory current Roadrunner Binary resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] RoadRunner memory overhead
- [ ] vs Nginx+FPM
- [ ] Request throughput
- [ ] Worker restart cost
- [ ] Static file serving

---

# Security Checklist

- [ ] RoadRunner binary should be scanned for vulnerabilities (Go dependencies)
- [ ] Run RoadRunner as non-root user (create `rr` user in Dockerfile)
- [ ] Restrict `.rr.yaml` file permissions (contains server settings)
- [ ] Enable TLS at ALB level; RoadRunner behind ALB terminates at edge
- [ ] Monitor for process restarts (frequent restarts may indicate attempts to exploit memory limits)

---

# Reliability Checklist

- [ ] Mistake prevented: Not configuring max_jobs
- [ ] Mistake prevented: Over-allocating workers
- [ ] Mistake prevented: No health check for RoadRunner

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] RoadRunner binary used for Octane (not Swoole unless specific need)
- [ ] .rr.yaml configured with appropriate worker pool settings
- [ ] max_jobs set to prevent memory leaks
- [ ] Health check endpoint configured
- [ ] Static files served via RoadRunner `static` plugin
- [ ] Docker image is single-process (no Nginx sidecar)
- [ ] Metrics enabled via Prometheus plugin

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Roadrunner Binary configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Nginx in front of RoadRunner
- [ ] Anti-pattern prevented: Running RoadRunner as root
- [ ] Anti-pattern prevented: Using RoadRunner for legacy Laravel 7/8
- [ ] Common mistake prevented: Not configuring max_jobs
- [ ] Common mistake prevented: Over-allocating workers
- [ ] Common mistake prevented: No health check for RoadRunner

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: RoadRunner binary used for Octane (not Swoole unless specific need)
- [ ] Verification passed: .rr.yaml configured with appropriate worker pool settings
- [ ] Verification passed: max_jobs set to prevent memory leaks

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
