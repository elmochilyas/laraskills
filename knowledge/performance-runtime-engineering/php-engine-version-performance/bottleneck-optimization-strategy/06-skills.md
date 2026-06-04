# Skill: Execute a Bottleneck-Driven Optimization Cycle

## Purpose

Systematically identify, prioritize, and resolve performance bottlenecks using profiling data and throughput analysis.

## When To Use

- Application response times exceed SLO targets
- CPU or memory usage is persistently high
- Preparing for a traffic scaling event or capacity review

## When NOT To Use

- For routine performance maintenance without identified symptoms
- When the bottleneck is already known and a fix is ready
- For greenfield applications not yet deployed

## Prerequisites

- Production profiling tool (Blackfire, Tideways, or SPX) configured
- Application performance monitoring (APM) in place with historical baselines
- Access to staging environment for validation
- Understanding of request lifecycle (bootstrap → routing → middleware → controller → response)

## Inputs

- APM data showing slowest endpoints by p95 latency
- Profiling flame graphs or call graphs
- CPU and memory utilization metrics during peak traffic
- Database query performance data (slow query log, query time distribution)

## Workflow (numbered steps)

1. Identify the slowest endpoints from APM data — sort by p95 latency × request frequency (biggest user impact first)
2. Profile the candidate endpoint in isolation using triggered profiling (X-Blackfire-Profile header)
3. Analyze the call graph to determine where wall time is spent: bootstrap, framework, database, external API, or rendering
4. Classify the bottleneck type: CPU-bound (computation, loops), I/O-bound (database, network), or memory-bound (allocation, GC)
5. Apply the appropriate optimization strategy: OpCache/preloading for bootstrap, query optimization for database, caching for external APIs, algorithm improvement for CPU
6. Implement the fix in a staging environment and re-profile to confirm improvement
7. Run a before/after benchmark comparison using the methodology from the benchmark skill
8. If improvement meets target (e.g., p95 latency reduced by 20%), deploy to production
9. Monitor APM data for 24-48 hours post-deployment to confirm improvement holds under real traffic
10. Document the bottleneck, analysis, fix, and improvement metrics

## Validation Checklist

- [ ] Slowest endpoints identified and prioritized by user impact
- [ ] Profiling completed before optimization (baseline capture)
- [ ] Bottleneck classified as CPU, I/O, or memory-bound
- [ ] Optimization strategy matched to bottleneck type
- [ ] Before/after benchmark shows measurable improvement
- [ ] APM data confirms improvement in production within 48 hours
- [ ] No regressions in other endpoints or system metrics

## Common Failures

- **Optimizing the wrong endpoint**: Improving a 50ms endpoint that gets 1 RPS while a 500ms endpoint at 100 RPS is ignored
- **Guessing without profiling**: Assuming the bottleneck without data leads to wasted effort on non-issues
- **Ignoring the bottleneck type**: Applying CPU optimization (JIT) to an I/O-bound problem (slow database queries) yields zero improvement
- **No baseline**: Without before measurements, improvement cannot be quantified

## Decision Points

- If bootstrap time >30% of request time, prioritize OpCache tuning and preloading
- If database query time >40%, prioritize query optimization, indexing, or caching
- If PHP execution time (excluding I/O wait) >50%, prioritize JIT or algorithm optimization
- If memory usage grows across requests in Octane, prioritize memory leak investigation and worker recycling

## Performance Considerations

- Profile in sampling mode to minimize overhead during data collection
- Single-endpoint optimization may shift bottleneck to another component — re-evaluate after each fix
- The bottleneck with the highest optimization ROI is usually the one consuming the most wall time proportionally

## Security Considerations

- Profiling data contains function names, file paths, and SQL queries — restrict dashboard access
- Production profiling must use triggered mode (header-based), never always-on
- Database profiling may expose query structure — use read replicas for profiling when possible

## Related Rules (from 05-rules.md)

- Profile Before Optimizing — Never Guess
- Measure Bootstrap Time Separately
- Match Optimization Type to Bottleneck Category
- Always Capture Before/After Benchmark Data

## Related Skills

- Flame Graph Generation and Interpretation
- Slow Query Identification
- JIT Workload Benefit Assessment

## Success Criteria

- Bottleneck correctly identified and classified
- Optimization produces measurable improvement (>=10% reduction in p95 latency or >=10% increase in throughput)
- No regressions introduced in other parts of the system
- Improvement sustained in production over 48-hour observation window
