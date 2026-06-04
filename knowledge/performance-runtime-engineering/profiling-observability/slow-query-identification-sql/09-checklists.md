# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Slow Query Identification Through Profiling Tool SQL Analysis
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always check total cost, not per-query time**: A 5ms query called 200 times = 1000ms. Prioritize by total cost = execution_time Ã— call_count.
- [ ] **Cross-reference with MySQL slow query log**: Profiling tools see all queries. Slow query log sees only queries over threshold. Use both for complete picture.
- [ ] **Prioritize N+1 queries first**: They are invisible in slow query logs (each query is fast individually) but have the highest total cost. Fix N+1 with eager loading.
- [ ] **Group by query fingerprint**: Normalize query text (remove parameters) to identify the same query pattern across different requests. This reveals the most expensive query patterns overall.
- [ ] **Look at the stack trace, not just the SQL**: A slow query might be acceptable in one context but catastrophic in another. The call stack tells you where it's called from.
- [ ] Profiling tool configured to capture SQL queries (Tideways/Blackfire tracepoints)
- [ ] Profile generated for the slow endpoint under investigation
- [ ] Queries sorted by total cost (execution_time Ã— call_count) descending
- [ ] N+1 patterns identified (same fingerprint, many calls, different parameters)
- [ ] Top 3 queries by total cost identified for optimization
- [ ] Top 3-5 queries identified by total cost (duration Ã— call count)
- [ ] N+1 patterns detected and prioritized for eager loading fix
- [ ] Profiling data cross-referenced with MySQL slow query log
- [ ] Row count assessed for data volume issues
- [ ] Optimization validated with before/after profile showing reduced total cost
- [ ] Profiling tool configured to capture SQL queries
- [ ] Queries sorted by total cost (execution_time Ã— call_count)
- [ ] N+1 patterns identified and prioritized
- [ ] MySQL slow query log cross-referenced
- [ ] Call stack reviewed for query context

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Query capture pipeline**: PDO/mysqli layer â†’ profiler hook â†’ capture query text, params, duration, stack trace â†’ aggregate by fingerprint â†’ display in profiling dashboard
- [ ] **Fingerprinting**: Normalize SQL by replacing parameters with placeholders (`SELECT * FROM users WHERE id = ?`). Group by fingerprint for cost analysis.
- [ ] **Integration with APM**: Tideways and Blackfire show slow queries alongside the transaction trace â€” click from a slow endpoint directly to its SQL queries.
- [ ] Document and follow through on architectural decision: Slow query detection approach
- [ ] Document and follow through on architectural decision: Query optimization strategy
- [ ] Ensure architecture aligns with core concept: **SQL capture**: Blackfire and Tideways automatically capture database queries with duration, row count, and parameter values. Xdebug requires explicit PDO/mysqli tracing extension.
- [ ] Ensure architecture aligns with core concept: **Query cost analysis**: Total query cost = sum(execution_time Ã— call_count) for each unique query. Grouped by query fingerprint (normalized query text without parameters).
- [ ] Ensure architecture aligns with core concept: **N+1 detection**: Same query fingerprint with different parameters, executed many times from the same stack trace. Blackfire highlights N+1 queries automatically in the dashboard.
- [ ] Ensure architecture aligns with core concept: **Slow query log cross-reference**: Compare profiling tool's slow queries with MySQL's slow query log. Not all slow queries appear in the log (threshold-based) but all are visible in profiles.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always check total cost, not per-query time**: A 5ms query called 200 times = 1000ms. Prioritize by total cost = execution_time Ã— call_count.
- [ ] **Cross-reference with MySQL slow query log**: Profiling tools see all queries. Slow query log sees only queries over threshold. Use both for complete picture.
- [ ] **Prioritize N+1 queries first**: They are invisible in slow query logs (each query is fast individually) but have the highest total cost. Fix N+1 with eager loading.
- [ ] **Group by query fingerprint**: Normalize query text (remove parameters) to identify the same query pattern across different requests. This reveals the most expensive query patterns overall.
- [ ] **Look at the stack trace, not just the SQL**: A slow query might be acceptable in one context but catastrophic in another. The call stack tells you where it's called from.

# Performance Checklist (from 04/06)
- [ ] SQL capture overhead: <1% for sampling profilers (Tideways, SPX) that capture query metadata only for sampled requests
- [ ] Blackfire SQL instrumentation: 10-25% overhead (instrumented, not sampling) â€” staging only
- [ ] Query fingerprinting: CPU cost is negligible â€” done in post-processing, not at runtime
- [ ] Data volume: Each profile may contain hundreds of queries â€” storage scales with traffic and sample rate
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] SQL query parameters may contain sensitive data (user IDs, emails, PII) â€” ensure profiling tool masks or excludes parameter values in dashboards
- [ ] Tideways and Blackfire support parameter redaction â€” configure this before production profiling
- [ ] Never expose raw query logs containing parameter values on public dashboards
- [ ] Database credentials should never appear in captured SQL (use parameterized queries)
- [ ] Query fingerprints (without parameters) are safe to share and store

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
- [ ] Profiling tool configured to capture SQL queries (Tideways/Blackfire tracepoints)
- [ ] Profile generated for the slow endpoint under investigation
- [ ] Queries sorted by total cost (execution_time Ã— call_count) descending
- [ ] N+1 patterns identified (same fingerprint, many calls, different parameters)
- [ ] Top 3 queries by total cost identified for optimization
- [ ] Call stack reviewed for each flagged query to understand calling context
- [ ] MySQL slow query log cross-referenced with profiling data
- [ ] Optimization applied (eager loading, index, query rewrite) and verified with new profile
- [ ] Top 3-5 queries identified by total cost (duration Ã— call count)
- [ ] N+1 patterns detected and prioritized for eager loading fix
- [ ] Profiling data cross-referenced with MySQL slow query log
- [ ] Row count assessed for data volume issues
- [ ] Optimization validated with before/after profile showing reduced total cost
- [ ] Profiling tool configured to capture SQL queries
- [ ] Queries sorted by total cost (execution_time Ã— call_count)
- [ ] N+1 patterns identified and prioritized
- [ ] MySQL slow query log cross-referenced
- [ ] Call stack reviewed for query context
- [ ] Row count checked for data volume issues
- [ ] Optimization validated with before/after profile

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always check total cost, not per-query time**: A 5ms query called 200 times = 1000ms. Prioritize by total cost = execution_time Ã— call_count.
- [ ] **Cross-reference with MySQL slow query log**: Profiling tools see all queries. Slow query log sees only queries over threshold. Use both for complete picture.
- [ ] **Prioritize N+1 queries first**: They are invisible in slow query logs (each query is fast individually) but have the highest total cost. Fix N+1 with eager loading.
- [ ] **Group by query fingerprint**: Normalize query text (remove parameters) to identify the same query pattern across different requests. This reveals the most expensive query patterns overall.
- [ ] **Look at the stack trace, not just the SQL**: A slow query might be acceptable in one context but catastrophic in another. The call stack tells you where it's called from.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Fixing slow queries without profiling
- [ ] Avoid: Optimizing the wrong query
- [ ] Avoid: Not checking the call stack
- [ ] Avoid: Ignoring row count
- [ ] Avoid anti-pattern: **Index-only optimization**: Adding indexes fixes many slow queries but doesn't fix N+1 patterns. Always profile to distinguish between slow queries and too-many-queries.
- [ ] Avoid anti-pattern: **Single-query analysis**: Optimizing a query without checking if it's called in a loop. A 2ms query called 1000 times = 2000ms. Eager loading or batching may be more effective than query optimization.
- [ ] Avoid anti-pattern: **Profiling without query context**: Looking at flame graphs without correlating to SQL queries. A wide I/O frame (blue) might be database, Redis, or HTTP â€” always drill into SQL queries to confirm.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)
- [ ] Sampling rate <= 10%
- [ ] Profiler CPU < 3%

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **SQL capture**: Blackfire and Tideways automatically capture database queries with duration, row count, and parameter values. Xdebug requires explicit PDO/mysqli tracing extension., **Query cost analysis**: Total query cost = sum(execution_time Ã— call_count) for each unique query. Grouped by query fingerprint (normalized query text without parameters)., **N+1 detection**: Same query fingerprint with different parameters, executed many times from the same stack trace. Blackfire highlights N+1 queries automatically in the dashboard., **Slow query log cross-reference**: Compare profiling tool's slow queries with MySQL's slow query log. Not all slow queries appear in the log (threshold-based) but all are visible in profiles.
**Skills:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, Database Query Benchmarking Integration, N+1 Detection and Prevention
**Decision Trees:** Slow query detection approach, Query optimization strategy
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, Database Query Benchmarking Integration, N+1 Detection and Prevention, Production Guardrails and Profiling Cost

