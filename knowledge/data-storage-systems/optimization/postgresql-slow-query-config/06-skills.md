# Skill: Configure PostgreSQL Slow Query Logging

## Purpose
Set up PostgreSQL slow query logging with `log_min_duration_statement`, `auto_explain`, and `pg_stat_statements` for production query analysis.

## When To Use
- When setting up production PostgreSQL monitoring
- When capturing query plans for slow queries that occur intermittently
- When identifying top queries by total time

## When NOT To Use
- When using external APM that captures all query performance data

## Prerequisites
- PostgreSQL instance with superuser access for extension installation
- `auto_explain` and `pg_stat_statements` extensions available

## Inputs
- PostgreSQL database access
- Configuration file (postgresql.conf) or ALTER SYSTEM access

## Workflow
1. Set `log_min_duration_statement = 500` in postgresql.conf
2. Load `auto_explain` via `shared_preload_libraries`
3. Configure `auto_explain.log_min_duration = 500` and `auto_explain.log_analyze = on`
4. Install `pg_stat_statements` via `CREATE EXTENSION`
5. Query `pg_stat_statements` for top queries: `SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10`
6. Analyze auto_explain logs for query plans of slow queries

## Validation Checklist
- [ ] `log_min_duration_statement` set to appropriate value
- [ ] `auto_explain` is loaded and logging plans
- [ ] `pg_stat_statements` is installed and queryable
- [ ] Slow query plans are captured with execution times

## Common Failures
- Not installing `auto_explain` — losing query plan context for slow queries
- Setting `log_min_duration_statement` on replicas incorrectly
- Not resetting `pg_stat_statements` after major deployment

## Decision Points
- Use `pg_stat_statements` for top-N time analysis
- Use `auto_explain` for plan capture on slow queries
- Use `log_min_duration_statement` for duration-based logging

## Performance
- `pg_stat_statements` overhead is ~2-5%
- `auto_explain` adds plan generation cost only for slow queries
- Log volume depends on threshold — 500ms is safe for most OLTP systems

## Security
- Query logs may contain PII — ensure log files are access-restricted
- `pg_stat_statements` shows query text but not parameter values (by default)

## Related Rules
- 4-6-1: Always EXPLAIN Before Optimizing
- 4-6-4: Review And Apply Core Concepts

## Related Skills
- Configure MySQL Slow Query Log
- Query Log Analysis
- Production Optimization Workflow

## Success Criteria
- PostgreSQL configured to log slow queries with plans
- `pg_stat_statements` providing top-N query rankings
- Auto-captured plans available for intermittent slow queries
