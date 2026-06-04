# Skill: Execute Production Optimization Workflow

## Purpose
Follow a systematic closed-loop optimization workflow: Profile → Identify → Measure → Fix → Verify → Monitor.

## When To Use
- When beginning a production query optimization initiative
- When addressing a performance incident
- During regular performance review cycles

## When NOT To Use
- For emergency hotfixes (skip documentation, still do before/after measurement)
- When the fix is trivial and proven (adding missing FK index)

## Prerequisites
- Access to production monitoring tools
- Understanding of slow query log and EXPLAIN

## Inputs
- Production performance data (slow query log, pg_stat_statements, APM traces)

## Workflow
1. **Profile**: Collect raw performance data from production
2. **Identify**: Rank queries by total cost (frequency × avg duration) — fix highest total cost first
3. **Measure**: Capture baseline p50/p95/p99 duration, rows examined, call frequency
4. **Fix**: Apply optimization (index, query rewrite, schema change, eager loading)
5. **Verify**: Compare post-fix metrics against baseline under production-like concurrency
6. **Monitor**: Track over time for regression from data growth or pattern changes

## Validation Checklist
- [ ] Queries ranked by total time, not individual duration
- [ ] Baseline metrics captured before optimization
- [ ] EXPLAIN plan stored before and after
- [ ] Post-fix metrics show improvement under load
- [ ] Monitoring alerts configured for regression detection

## Common Failures
- Optimizing the wrong query — 100ms at 100 req/s is worse than 5s at 1 req/s
- No baseline before fix — can't prove the fix worked
- Optimizing in development only — dev 10K rows vs production 10M rows
- Skipping verification — adding index without verifying plan change

## Decision Points
- Profile: pg_stat_statements (PG) or performance_schema (MySQL)
- Identify: pt-query-digest for MySQL, custom queries for PG
- Fix order: top 5 by total cost first; skip low-cost queries even if individually slow

## Performance
- Profiling overhead: pg_stat_statements ~2-5%, performance_schema ~10-15%
- Optimization impact: measured as reduction in total time (ms/day)

## Security
- Profiling tools may capture query text with PII — restrict access
- Store optimization plans and results in secure documentation

## Related Rules
- 4-30-1: Always EXPLAIN Before Optimizing
- 4-30-4: Review And Apply Core Concepts

## Related Skills
- Configure MySQL Slow Query Log
- Configure PostgreSQL Slow Query Config
- Maintain Database Statistics
- Govern Endpoint Query Budgets

## Success Criteria
- Closed-loop workflow executed for each optimization target
- Measurable reduction in total query time for fixed queries
- Regression monitoring in place to detect future degradation
- Before/after plans documented for team reference
