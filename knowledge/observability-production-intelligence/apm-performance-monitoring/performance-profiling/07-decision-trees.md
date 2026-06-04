# Skill: Profile Laravel Applications and Detect Bottlenecks

## Purpose
Profile Laravel applications to identify performance bottlenecks, verify optimizations, and enforce performance budgets in CI using tools like Blackfire, XHProf, and Tideways.

## When To Use
- Investigating slow endpoints identified by APM or user reports
- Pre-deployment performance validation
- Memory leak investigation in queue workers
- Framework/library upgrade performance validation

## When NOT To Use
- Simple, known performance issues better diagnosed via query log
- Continuous production monitoring (use APM for that)

## Prerequisites
- Profiling tool access (Blackfire, XHProf, or Tideways)
- Staging environment matching production specs
- Load generation tool for realistic profile capture

## Inputs
- APM-identified slow endpoints
- Known slow code paths from team reports
- CI pipeline for automated profiling
- Performance budget thresholds

## Workflow
1. **Set up profiling tool**: Install Blackfire agent or XHProf extension. Verify profiler loads and captures profiles.
2. **Establish baselines**: Profile critical endpoints under load. Record wall-clock time, CPU time, memory, I/O wait, query count.
3. **Identify bottlenecks**: Analyze flame graphs for widest blocks (highest inclusive time). Compare wall-clock vs CPU time to classify I/O vs CPU bound.
4. **Implement optimization**: Target the highest-inclusive-time function. Apply optimization (caching, query reduction, algorithm change).
5. **Verify improvement**: Re-profile the same endpoint. Compare before/after metrics. Confirm improvement within margin.
6. **Set CI budget**: Add performance budget to CI pipeline. Fail build if metrics exceed thresholds.
7. **Monitor for regression**: Schedule periodic profiling. Compare against baseline. Flag regressions.

## Validation Checklist
- [ ] Profiling tool installed and verified
- [ ] Baselines captured for critical endpoints
- [ ] Flame graphs analyzed for widest blocks
- [ ] Wall-clock vs CPU time compared
- [ ] Optimization verified by before/after comparison
- [ ] CI performance budgets configured
- [ ] Regression monitoring scheduled
- [ ] Profiling endpoints secured
- [ ] Production profiling uses sampling mode only

## Common Failures
- **Profile without load:** Captured single-request profile misses contention, GC, connection pool effects.
- **Optimizing exclusive time:** Focus on functions with low exclusive time but high call count drives minimal improvement.
- **No before profile:** Optimization done without baseline — cannot measure impact.
- **CI budget too tight:** 5% budget triggered by normal variance. Allow 20% headroom.

## Decision Points
- **Sampling vs instrumenting:** Sampling for production; instrumenting for development/staging.
- **Blackfire vs XHProf vs Tideways:** Blackfire for best CI integration; XHProf for free sampling; Tideways for production-safe profiling.
- **Wall-clock vs CPU focus:** Wall-clock when investigating user-facing latency; CPU when optimizing compute-heavy operations.

## Performance Considerations
- Sampling profiler: 1-3% overhead — production-safe
- Instrumenting profiler: 5-15% overhead — staging only
- Profile data: 50-500KB per request, 50-500MB for CI suite
- Memory overhead: 10-50MB during profiling

## Security Considerations
- Profile data may contain SQL queries with bound parameters
- Secure profiling endpoints with admin auth
- Authenticate all profile uploads
- Production profiling requires explicit approval

## Related Skills
- APM Tool Integration & Comparison
- N+1 Query Detection
- Blackfire CI Integration

## Success Criteria
- Performance bottlenecks identified by inclusive time analysis
- Before/after profiling confirms optimization impact
- CI performance budgets catch regressions before deployment
- Production profiling limited to sampling mode in approved sessions only
- Weekly flame graph reviews identify optimization candidates
