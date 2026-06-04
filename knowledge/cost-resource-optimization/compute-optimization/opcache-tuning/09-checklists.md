# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** OPcache Tuning
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] opcache.memory_consumption >= 128MB
- [ ] opcache.max_accelerated_files >= 10000
- [ ] opcache.validate_timestamps = 0 in production
- [ ] Deploy script includes opcache_reset()
- [ ] OPcache hit rate >99% (verified via opcache_status())
- [ ] Set opcache.memory_consumption to 128MB applied
- [ ] Set opcache.max_accelerated_files to 10000 applied
- [ ] Disable validate_timestamps in production applied
- [ ] Disabling OPcache for "debugging" prevented
- [ ] Insufficient max_accelerated_files prevented
- [ ] Default OPcache memory (64MB) prevented
- [ ] validate_timestamps enabled in production prevented

---

# Architecture Checklist

- [ ] Architecture guideline: OPcache memory
- [ ] Architecture guideline: Deploy script must clear OPcache
- [ ] Architecture guideline: For Octane
- [ ] Architecture guideline: Monitor OPcache
- [ ] Architecture guideline: Set `opcache.revalidate_freq = 0` if validate_timestamps = 1 (immediate file change detection during development)

---

# Implementation Checklist

- [ ] Best practice applied: Set opcache.memory_consumption to 128MB
- [ ] Best practice applied: Set opcache.max_accelerated_files to 10000
- [ ] Best practice applied: Disable validate_timestamps in production
- [ ] Best practice applied: Enable JIT for CPU-bound tasks
- [ ] Best practice applied: Enable OPcache for CLI workers
- [ ] Workflow step completed: Inventory current Opcache Tuning resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] OPcache reduces PHP execution time by 50-70% (compilation skipped)
- [ ] JIT adds 20-30% gain for CPU-bound code paths
- [ ] OPcache memory exhaustion causes entries to be evicted via Least Recently Used (LRU); subsequent requests recompile
- [ ] `opcache.max_accelerated_files` exhaustion silently fails with no warning; entries simply not cached
- [ ] Hit rate target

---

# Security Checklist

- [ ] OPcache shared memory is owned by the PHP process user; not directly accessible by others
- [ ] JIT buffer contains compiled native code; potential attack surface if attacker controls PHP code execution
- [ ] Clear OPcache on deploy to prevent stale compiled code with known vulnerabilities
- [ ] Do not enable `opcache.file_cache` (file-based fallback) without securing the cache directory

---

# Reliability Checklist

- [ ] Mistake prevented: Default OPcache memory (64MB)
- [ ] Mistake prevented: validate_timestamps enabled in production
- [ ] Mistake prevented: No OPcache reset on deploy

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] opcache.memory_consumption >= 128MB
- [ ] opcache.max_accelerated_files >= 10000
- [ ] opcache.validate_timestamps = 0 in production
- [ ] Deploy script includes opcache_reset()
- [ ] OPcache hit rate >99% (verified via opcache_status())
- [ ] JIT enabled for CPU-bound workloads
- [ ] opcache.enable_cli = 1 for queue workers

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Opcache Tuning configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Disabling OPcache for "debugging"
- [ ] Anti-pattern prevented: Insufficient max_accelerated_files
- [ ] Anti-pattern prevented: JIT on I/O-bound workloads
- [ ] Common mistake prevented: Default OPcache memory (64MB)
- [ ] Common mistake prevented: validate_timestamps enabled in production
- [ ] Common mistake prevented: No OPcache reset on deploy

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: opcache.memory_consumption >= 128MB
- [ ] Verification passed: opcache.max_accelerated_files >= 10000
- [ ] Verification passed: opcache.validate_timestamps = 0 in production

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
