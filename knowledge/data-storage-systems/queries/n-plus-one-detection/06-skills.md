# Skill: Detect and Eliminate N+1 Query Problems

## Purpose

Detect N+1 query problems using Telescope (per-request query grouping), Debugbar (in-browser query count), DB::listen (custom alerting), and query log analysis — identifying repeated queries with identical structure but different parameter values that indicate lazy loading in loops.

## When To Use

- Performance profiling during development
- Code review for relationship loading patterns
- Production monitoring for excessive query counts
- Debugging slow API endpoints

## When NOT To Use

- Development-only detection (use preventLazyLoading for hard enforcement)
- Simple queries with known loading patterns

## Prerequisites

- Understanding of N+1 pattern: N identical queries with different WHERE values
- Knowledge of eager loading via `with()`

## Inputs

- Request URL or command being analyzed
- Query log output
- Relationship loading patterns in code

## Workflow

1. Enable Telescope or Debugbar in development
2. Execute the endpoint or command
3. Check query count — if it's much higher than expected, look for repeated patterns
4. Identify the repeated query: `SELECT * FROM comments WHERE post_id = 1`, `... WHERE post_id = 2`, etc.
5. Add eager loading: `$posts->load('comments')` or `Post::with('comments')`
6. Re-test to verify query count is reduced

## Validation Checklist

- [ ] Query count per request is reasonable (< 10-20 for most endpoints)
- [ ] No repeated queries with different WHERE values
- [ ] All relationships used in the response are eager loaded
- [ ] preventLazyLoading enabled in non-production environments

## Common Failures

### Relying only on one tool
Telescope catches what Debugbar misses and vice versa. Use multiple tools in different environments.

### Ignoring production patterns
N+1 that only appears at production data volumes won't show in development. Monitor query counts in production.

## Decision Points

### Telescope vs Debugbar?
Telescope for deep analysis (query grouping, timing, duplicates). Debugbar for quick in-browser inspection.

### preventLazyLoading vs monitoring?
preventLazyLoading catches N+1 immediately in development. Monitoring catches issues that only appear at scale.

## Performance Considerations

N+1 turns 1 query into N+1 queries (where N can be 100s or 1000s). The fix is always eager loading or chunking. Monitor query counts in production.

## Security Considerations

Query logging may expose query patterns. Don't leave verbose logging enabled in production. Use threshold-based alerting instead.

## Related Rules

- Enable preventLazyLoading in non-production
- Eager load all relationships used in responses
- Monitor query counts in production

## Related Skills

- Process Large Datasets with Chunk and Cursor
- Shape API Responses with Resource Classes
- Configure Model Serialization

## Success Criteria

- Query count per endpoint is stable and reasonable
- No repeated identical queries in request logs
- preventLazyLoading enabled in development/staging
- Production monitoring alerts on excessive query counts
