# Skill: Distinguish Between Profiling and Monitoring for Performance Analysis

## Purpose

Apply the correct tool (profiling for deep investigation, monitoring for ongoing health) based on the performance question being asked.

## When To Use

- Determining whether to profile (deep dive) or monitor (track trends) for a given performance issue
- Setting up an observability stack that includes both profiling and monitoring capabilities
- Training team members on when to use each approach

## When NOT To Use

- When both profiling and monitoring are needed (they are complementary, not alternatives)
- For on-call incident response where only monitoring dashboards are available (profile after the incident)

## Prerequisites

- Understanding of profiling overhead and sampling vs instrumentation modes
- Monitoring tools (APM, metrics dashboard) configured
- Profiling tools (Blackfire, SPX, Xdebug) available for on-demand use

## Inputs

- Performance question: "Is the system slow?" (monitoring) vs "Why is the system slow?" (profiling)
- Current monitoring data showing symptoms (high latency, error rate, resource usage)
- Access permissions for profiling production traffic

## Workflow (numbered steps)

1. Start with monitoring: check APM dashboards for p50/p95/p99 latency, error rate, and throughput trends
2. If monitoring shows a regression (latency increased >10%), proceed to profiling — do not profile without monitoring first
3. Configure triggered profiling (Blackfire header or SPX cookie) on the affected endpoint
4. Capture 3-5 profiles of the slow endpoint on production (or staging with production-representative data)
5. Analyze the call graph to identify the specific function or I/O call causing the slowdown
6. Implement the fix based on profiling findings
7. Return to monitoring: verify the fix improved the metrics that triggered the investigation
8. Document the correlation between monitoring symptoms and profiling findings

## Validation Checklist

- [ ] Monitoring data reviewed before profiling
- [ ] Profiling triggered on the specific affected endpoint
- [ ] Profiling results identify specific root cause (function, query, API call)
- [ ] Fix implemented based on profiling findings
- [ ] Monitoring data confirms improvement post-fix
- [ ] Relationship between monitoring symptoms and profiling findings documented

## Common Failures

- **Profiling without monitoring**: Deep investigation without knowing whether the problem is real or persistent wastes time
- **Monitoring without profiling**: Dashboards show symptoms but cannot identify root cause — action items require profiling
- **Using profiler as monitor**: Continuous profiling adds overhead — use sampling and triggered mode, not always-on
- **Ignoring monitoring during profiling**: System load affects profile results — note current traffic conditions

## Decision Points

- If you need to know WHAT is slow: use monitoring (latency, throughput, error rate dashboards)
- If you need to know WHY it is slow: use profiling (call graph, flame graph, function-level timing)
- If you need both: use monitoring for ongoing health, triggered profiling for investigations
- If you need continuous insight: use canary profiling (0.1% of traffic) combined with monitoring dashboard

## Performance Considerations

- Sampling profiler overhead: 2-5% (production-safe for triggered mode)
- Instrumentation profiler overhead: 10-25% (staging only)
- Monitoring overhead: <1% when using metrics aggregation (statsd, Prometheus)
- Always-on profiling adds 2-5% overhead to every request — use triggered mode for production

## Security Considerations

- Profiling data contains function names, file paths, and SQL queries — restrict access to profiling dashboards
- Monitoring data should be aggregated and anonymized to avoid exposing individual request details
- Production profiling must use triggered mode (header/cookie) to prevent unintended data collection
- Ensure profiling credentials are stored in environment variables, not in code

## Related Rules (from 05-rules.md)

- Use Triggered Profiling for Production
- Profile Before Optimizing — Never Guess
- Monitor What Matters: p50, p95, Error Rate

## Related Skills

- Flame Graph Generation and Interpretation
- Callgraph Analysis Techniques
- Blackfire Installation and Triggered Profiling

## Success Criteria

- Monitoring detects performance regressions automatically
- Profiling identifies root cause within 15 minutes of starting investigation
- Fix validated by monitoring data within 24 hours of deployment
- Team consistently applies monitoring-first, profiling-second workflow
