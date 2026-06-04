# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 03-apm-performance-monitoring
**Knowledge Unit:** performance-profiling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Blackfire evaluated as primary profiling tool for Laravel
- [ ] Flame graph and call graph interpretation understood
- [ ] Sampling vs instrumenting profiler tradeoffs reviewed
- [ ] Wall-clock time vs CPU time measurement strategy defined
- [ ] Memory profiling conducted for memory leak detection
- [ ] CI performance regression detection configured with budgets

---

# Architecture Checklist

- [ ] Profiling strategy layered: APM for always-on, profiler for deep dives
- [ ] Profiling trigger strategy defined (manual, CI, on-demand)
- [ ] Performance budget established per critical endpoint
- [ ] Flame graph profiles mapped to known code paths
- [ ] Memory profiling integrated into staging pre-deployment checks
- [ ] Profiling access restricted to development and CI environments

---

# Implementation Checklist

- [ ] Blackfire agent installed and configured on profiling target
- [ ] Blackfire SDK installed via Composer for CLI profile triggers
- [ ] Profiling enabled on staging environment (not production by default)
- [ ] CI pipeline step configured for performance regression detection
- [ ] Performance budget assertions added to critical test paths
- [ ] Profiling trigger endpoints secured (admin-only access)

---

# Performance Checklist

- [ ] Profiling overhead measured (typically 10-15% on instrumented calls)
- [ ] Cold boot optimization identified via profile
- [ ] Database query hotspots identified from call graph
- [ ] Memory allocation hotspots flagged for optimization
- [ ] Object instantiation count reviewed in hot paths
- [ ] I/O wait time isolated from CPU time in profiles

---

# Security Checklist

- [ ] Profiling agent access restricted to authorized team members
- [ ] Profiling endpoint not exposed in production environment
- [ ] Profile data does not contain PII or secrets in stack frames
- [ ] CI profile upload authentication configured
- [ ] Profile data retention policy defined
- [ ] Blackfire probe code not committed to production autoload

---

# Reliability Checklist

- [ ] Profiler agent failure does not crash application
- [ ] Profiling not run on production without monitoring impact
- [ ] Profile buffer configured to prevent memory exhaustion
- [ ] CI profiler timeout set higher than standard test timeout
- [ ] Stale performance budget reviewed and updated quarterly
- [ ] Profiling results compared across deployments for regression detection

---

# Testing Checklist

- [ ] Unit test: performance assertion on critical function execution time
- [ ] Integration test: profiling trigger collects expected data
- [ ] CI test: performance budget regression detected and reported
- [ ] Comparison test: before/after profile for optimization verification
- [ ] Memory test: memory usage assertion on large data processing
- [ ] Stress test: profiling overhead under concurrent load

---

# Maintainability Checklist

- [ ] Profile baselines documented per endpoint with expected ranges
- [ ] Performance budget thresholds documented and version-controlled
- [ ] Profiling configuration stored in deployment scripts
- [ ] Optimizations linked to profile evidence in commit messages
- [ ] Regular profiling cadence established (pre-release, monthly review)
- [ ] Team trained on flame graph reading and bottleneck identification

---

# Anti-Pattern Prevention Checklist

- [ ] Profiling not run as replacement for APM monitoring
- [ ] Production profiling not done without explicit approval and monitoring
- [ ] Micro-optimization avoided without profile evidence
- [ ] Premature optimization prevented by profiling data-driven approach
- [ ] Profile data not shared outside authorized team
- [ ] CI budget not set so tight that normal variance triggers false failures

---

# Production Readiness Checklist

- [ ] Performance baseline captured before any profiling
- [ ] Staging environment performance comparable to production
- [ ] Blackfire environment token configured for CI integration
- [ ] Performance regression alerting configured in CI pipeline
- [ ] Profiling results accessible to team via dashboard or report
- [ ] Optimization deployment verified by re-profiling

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: layering strategy defined, trigger approach chosen, budget established
- [ ] Security requirements satisfied: agent access restricted, endpoint secured, profile data clean
- [ ] Performance requirements satisfied: overhead measured, hotspots identified, memory reviewed
- [ ] Testing requirements satisfied: assertions on critical paths, CI regression detection working, before/after verified
- [ ] Anti-pattern checks passed: not replacing APM, data-driven optimization, budget not too tight
- [ ] Production readiness verified: baseline captured, staging comparable, CI integration active

---

# Related References

- APM Tool Integration & Comparison (complementary always-on monitoring)
- N+1 Query Detection (common Laravel bottleneck found via profiling)
- OpenTelemetry PHP SDK (OTel profiling signal, emerging)
