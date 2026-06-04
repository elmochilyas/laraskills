# Skill: Analyze Production Query Logs

## Purpose
Analyze production query logs to identify the most expensive queries by total time (frequency × average duration), not just individual slow queries.

## When To Use
- When prioritizing optimization efforts
- When setting up query monitoring
- During production performance audits

## When NOT To Use
- When APM tools already provide query-level breakdowns

## Prerequisites
- Access to slow query log or pg_stat_statements
- Log analysis tool (pt-query-digest for MySQL)

## Inputs
- Slow query log file or pg_stat_statements query output

## Workflow
1. Collect slow query log over a representative period (24-48 hours)
2. Normalize queries by removing parameter values
3. Group by normalized query shape
4. Calculate total time = average duration × frequency
5. Rank by total time descending
6. Select top 5-10 queries for optimization

## Validation Checklist
- [ ] Queries grouped by normalized shape (parameters removed)
- [ ] Ranked by total time (not just individual query duration)
- [ ] Top 5 queries by total time identified for optimization
- [ ] Baseline metrics captured before making changes

## Common Failures
- Fixing the slowest individual query instead of highest total time
- Not normalizing query shapes — treating same query with different params as separate
- Not collecting data long enough for representative sample

## Decision Points
- High frequency + moderate time: optimize first (high total cost)
- Low frequency + high time: optimize second (lower total cost)
- High frequency + low time: skip (unless can batch or cache)

## Performance
- Query log analysis: negligible overhead (uses existing logs)
- pt-query-digest processing: fast for typical log sizes

## Security
- Query logs contain query text with potential PII
- Restrict access to log files and analysis output
- Mask sensitive parameters in reports

## Related Rules
- 4-26-1: Always EXPLAIN Before Optimizing
- 4-26-4: Review And Apply Core Concepts

## Related Skills
- Configure MySQL Slow Query Log
- Configure PostgreSQL Slow Query Config
- Use Profiling Tools

## Success Criteria
- Top queries by total time identified and ranked
- Optimization targets selected based on impact, not outliers
- Baseline metrics established before making changes
