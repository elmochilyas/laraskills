# Skill: Use Laravel Profiling Tools

## Purpose
Use Telescope, Debugbar, and Clockwork to capture query counts, durations, N+1 detection, and request timelines for performance analysis.

## When To Use
- When debugging slow endpoints locally
- When monitoring staging/production query patterns
- When identifying N+1 and excessive query counts

## When NOT To Use
- Telescope in production without pruning (watch disk space)
- Debugbar in production (exposes config and query data)

## Prerequisites
- Composer and Laravel package installation
- Understanding of query count impact

## Inputs
- Laravel application with profiling tools installed

## Workflow
1. Install Telescope for staging/limited production: `composer require laravel/telescope`
2. Install Debugbar for local development: `composer require barryvdh/laravel-debugbar --dev`
3. Run the target endpoint and review:
   - Query count and individual durations
   - N+1 warnings
   - Duplicate queries
   - Request timeline
4. Identify the most expensive operation
5. Optimize and re-profile to compare

## Validation Checklist
- [ ] Telescope installed and configured with access gate
- [ ] `telescope:prune` scheduled for production pruning
- [ ] Debugbar only installed as dev dependency
- [ ] No profiling tools active in production without monitoring

## Common Failures
- Telescope in production without pruning — storage fills up
- Debugbar in production — exposes sensitive data
- Not using tools during development to catch issues early

## Decision Points
- Telescope: staging and limited production monitoring
- Debugbar: local development only
- Clockwork: lightweight alternative when Debugbar conflicts

## Performance
- Telescope overhead: minimal for query capturing (stores to database)
- Debugbar overhead: ~10-50ms per request in debug mode
- Clockwork overhead: <10ms per request

## Security
- Debugbar exposes environment config, query data, and route params — dev only
- Telescope has built-in gate for access authorization
- Restrict Telescope access in production to specific users

## Related Rules
- 4-27-1: Always EXPLAIN Before Optimizing
- 4-27-4: Review And Apply Core Concepts

## Related Skills
- Analyze Production Query Logs
- Detect Lazy Loading in Production
- Govern Endpoint Queries

## Success Criteria
- Profiling tools installed in appropriate environments
- Slow endpoints identified with query-level breakdown
- Performance improvements verified by re-profiling
