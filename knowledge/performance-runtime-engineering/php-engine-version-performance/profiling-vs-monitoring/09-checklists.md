# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Profiling vs Monitoring â€” Deterministic Snapshots vs Continuous Aggregation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Profile first, then monitor**: Use profiling to identify the root cause of a regression; deploy monitoring to ensure it stays fixed. Never guess at bottlenecks.
- [ ] **Use sampling profilers in production**: Xdebug is for development only. Blackfire (2-5%) and Tideways (1-3%) are safe for production.
- [ ] **Monitor the right metrics**: p50/p95/p99 latency, error rate, CPU utilization, memory usage, FPM listen queue, OpCache hit rate.
- [ ] **Correlate profiling with monitoring**: When monitoring detects a regression, trigger a profiling session to identify the root cause.
- [ ] Monitoring system in place for key metrics (latency, error rate, CPU, memory)
- [ ] Sampling profiler available for production use (Blackfire, Tideways, or SPX)
- [ ] Xdebug used only in development/staging environments
- [ ] Profiling workflow defined for incident response
- [ ] Monitoring alerts trigger profiling sessions for root cause analysis
- [ ] Monitoring detects performance regressions automatically
- [ ] Profiling identifies root cause within 15 minutes of starting investigation
- [ ] Fix validated by monitoring data within 24 hours of deployment
- [ ] Team consistently applies monitoring-first, profiling-second workflow
- [ ] Monitoring data reviewed before profiling
- [ ] Profiling triggered on the specific affected endpoint
- [ ] Profiling results identify specific root cause (function, query, API call)
- [ ] Fix implemented based on profiling findings
- [ ] Monitoring data confirms improvement post-fix
- [ ] Relationship between monitoring symptoms and profiling findings documented
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] **Camera model**: Profiling is taking slow-motion video of your code. Flame graphs are the video frames. Inclusive time is the actor's total screen time including supporting cast. Exclusive time is the actor's solo performance.
- [ ] **Tiered profiling workflow**: 1) Production monitoring -> identify slow endpoints via APM, 2) Flame graph generation -> identify wide frames, 3) Call graph analysis -> follow the hot path, 4) Source-level profiling -> inspect specific functions, 5) Fix -> deploy -> verify.
- [ ] Document and follow through on architectural decision: Profiling vs monitoring for a performance question
- [ ] Document and follow through on architectural decision: Which profiling tool to use in production
- [ ] Ensure architecture aligns with core concept: **Profiling tools**: Xdebug (cachegrind output), Blackfire (triggered production profiling), Tideways (sampled continuous profiling), SPX (self-hosted), XHProf (legacy).
- [ ] Ensure architecture aligns with core concept: **Monitoring tools**: APM agents (New Relic, Datadog), server metrics (CPU, RAM, disk I/O), application metrics (request rate, latency percentiles, error rate).
- [ ] Ensure architecture aligns with core concept: **Profiling granularity**: Function-level inclusive/exclusive time, memory allocation per call, call count.
- [ ] Ensure architecture aligns with core concept: **Monitoring granularity**: Aggregated metrics over time windows (1s, 1m, 5m), percentile distributions, threshold-based alerts.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Profile first, then monitor**: Use profiling to identify the root cause of a regression; deploy monitoring to ensure it stays fixed. Never guess at bottlenecks.
- [ ] **Use sampling profilers in production**: Xdebug is for development only. Blackfire (2-5%) and Tideways (1-3%) are safe for production.
- [ ] **Monitor the right metrics**: p50/p95/p99 latency, error rate, CPU utilization, memory usage, FPM listen queue, OpCache hit rate.
- [ ] **Correlate profiling with monitoring**: When monitoring detects a regression, trigger a profiling session to identify the root cause.
- [ ] Start with monitoring: check APM dashboards for p50/p95/p99 latency, error rate, and throughput trends
- [ ] If monitoring shows a regression (latency increased >10%), proceed to profiling â€” do not profile without monitoring first
- [ ] Configure triggered profiling (Blackfire header or SPX cookie) on the affected endpoint
- [ ] Capture 3-5 profiles of the slow endpoint on production (or staging with production-representative data)
- [ ] Analyze the call graph to identify the specific function or I/O call causing the slowdown
- [ ] Implement the fix based on profiling findings
- [ ] Return to monitoring: verify the fix improved the metrics that triggered the investigation
- [ ] Document the correlation between monitoring symptoms and profiling findings

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Profiling data reveals internal code paths and function names â€” restrict access to authorized personnel
- [ ] Production profiling data should be stored with the same sensitivity as logs
- [ ] Never expose raw profiling files on public endpoints
- [ ] eBPF profiling requires CAP_BPF or root â€” restrict access accordingly

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Monitoring system in place for key metrics (latency, error rate, CPU, memory)
- [ ] Sampling profiler available for production use (Blackfire, Tideways, or SPX)
- [ ] Xdebug used only in development/staging environments
- [ ] Profiling workflow defined for incident response
- [ ] Monitoring alerts trigger profiling sessions for root cause analysis
- [ ] Profiling data access restricted to authorized personnel
- [ ] Monitoring detects performance regressions automatically
- [ ] Profiling identifies root cause within 15 minutes of starting investigation
- [ ] Fix validated by monitoring data within 24 hours of deployment
- [ ] Team consistently applies monitoring-first, profiling-second workflow
- [ ] Monitoring data reviewed before profiling
- [ ] Profiling triggered on the specific affected endpoint
- [ ] Profiling results identify specific root cause (function, query, API call)
- [ ] Fix implemented based on profiling findings
- [ ] Monitoring data confirms improvement post-fix
- [ ] Relationship between monitoring symptoms and profiling findings documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Profile first, then monitor**: Use profiling to identify the root cause of a regression; deploy monitoring to ensure it stays fixed. Never guess at bottlenecks.
- [ ] **Use sampling profilers in production**: Xdebug is for development only. Blackfire (2-5%) and Tideways (1-3%) are safe for production.
- [ ] **Monitor the right metrics**: p50/p95/p99 latency, error rate, CPU utilization, memory usage, FPM listen queue, OpCache hit rate.
- [ ] **Correlate profiling with monitoring**: When monitoring detects a regression, trigger a profiling session to identify the root cause.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using Xdebug in production
- [ ] Avoid: Only monitoring, never profiling
- [ ] Avoid: Profiling without a hypothesis
- [ ] Avoid: Ignoring profiling overhead
- [ ] Avoid anti-pattern: **Relying solely on monitoring**: p95 spikes tell you something is wrong but not what. Always pair monitoring with profiling capability.
- [ ] Avoid anti-pattern: **Using profiling as monitoring**: Profiling every request in production is too expensive. Profile selectively (triggered or sampled).
- [ ] Avoid anti-pattern: **Guessing at bottlenecks**: Without profiling data, optimization targets are guesses. Measure first, optimize second.
- [ ] Guard against anti-pattern: Using Xdebug in Production
- [ ] Guard against anti-pattern: Only Monitoring Without Profiling Capability
- [ ] Guard against anti-pattern: Profiling Without a Hypothesis
- [ ] Guard against anti-pattern: Using Profiling as Monitoring (Always-On Heavy Profiling)
- [ ] Guard against anti-pattern: Guessing at Bottlenecks Without Profiling Data
- [ ] Xdebug extension not loaded in production (php -m shows no xdebug)
- [ ] Production-safe profiler (Blackfire, Tideways, SPX, eBPF) used instead

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Profiling tools**: Xdebug (cachegrind output), Blackfire (triggered production profiling), Tideways (sampled continuous profiling), SPX (self-hosted), XHProf (legacy)., **Monitoring tools**: APM agents (New Relic, Datadog), server metrics (CPU, RAM, disk I/O), application metrics (request rate, latency percentiles, error rate)., **Profiling granularity**: Function-level inclusive/exclusive time, memory allocation per call, call count., **Monitoring granularity**: Aggregated metrics over time windows (1s, 1m, 5m), percentile distributions, threshold-based alerts.
**Skills:** Flame Graph Generation and Interpretation, Callgraph Analysis Techniques, Blackfire Installation and Triggered Profiling
**Decision Trees:** Profiling vs monitoring for a performance question, Which profiling tool to use in production
**Anti-Patterns:** Using Xdebug in Production, Only Monitoring Without Profiling Capability, Profiling Without a Hypothesis, Using Profiling as Monitoring (Always-On Heavy Profiling), Guessing at Bottlenecks Without Profiling Data
**Related Topics:** Flame Graph Interpretation, Callgraph Analysis Techniques, Inclusive vs Exclusive Time Analysis, Production Guardrails for Profiling, APM Integration Patterns

