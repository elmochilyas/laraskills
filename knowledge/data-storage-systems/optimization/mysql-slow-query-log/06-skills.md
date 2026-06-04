# Skill: Configure and Analyze MySQL Slow Query Log

## Purpose
Enable, configure, and analyze the MySQL Slow Query Log to identify production query optimization targets.

## When To Use
- When setting up production MySQL monitoring
- When identifying queries to optimize
- During performance audits

## When NOT To Use
- When using APM tools that capture query performance (Datadog, New Relic)
- For development-only databases

## Prerequisites
- MySQL instance with SUPER or SYSTEM_VARIABLES_ADMIN privilege
- pt-query-digest or mysqldumpslow installed

## Inputs
- MySQL database access
- Slow query log file path

## Workflow
1. Enable slow query log: `SET GLOBAL slow_query_log = 1`
2. Set threshold: `SET GLOBAL long_query_time = 0.5` (500ms)
3. Log non-indexed queries: `SET GLOBAL log_queries_not_using_indexes = 1`
4. Collect log data over a representative period (24-48 hours)
5. Run `pt-query-digest /var/log/mysql/slow.log` for aggregated analysis
6. Rank queries by total time (frequency x avg duration) to prioritize

## Validation Checklist
- [ ] `long_query_time` set to appropriate threshold (0.5s default)
- [ ] `log_queries_not_using_indexes` enabled
- [ ] Slow log file is accessible and growing
- [ ] pt-query-digest report shows top queries by total time

## Common Failures
- Setting `long_query_time` too high (5s) — misses high-frequency moderate queries
- Analyzing raw log entries without aggregation tool
- Not running collection long enough for representative sample

## Decision Points
- Start with 0.5s threshold; lower to 0.2s for high-throughput systems
- Use pt-query-digest (Percona) for detailed analysis; mysqldumpslow for quick summary
- Focus on top 5 queries by total time, not single slowest

## Performance
- Slow query log overhead is negligible (~1-2% CPU)
- `log_queries_not_using_indexes` may log many fast queries — monitor disk space

## Security
- Slow query log may contain sensitive data in query parameters
- Restrict log file permissions to database admin users
- Rotate logs regularly to prevent disk full

## Related Rules
- 4-5-1: Always EXPLAIN Before Optimizing
- 4-5-4: Review And Apply Core Concepts

## Related Skills
- Configure PostgreSQL Slow Query Config
- Query Log Analysis
- Production Optimization Workflow

## Success Criteria
- Slow query log configured and collecting data
- Top queries by total time identified and ranked
- Optimization targets selected based on aggregate impact
