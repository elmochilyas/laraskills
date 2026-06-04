# Skill: Manage OpCache Lifecycle Through Invalidation Events

## Purpose

Understand and execute OpCache invalidation across its lifecycle stages: population, steady state, eviction, reset, and restart.

## When To Use

- Planning deployment cache invalidation strategy
- Troubleshooting stale or mixed code after deployment
- Understanding how OpCache behaves across different lifecycle stages
- Setting up monitoring for each lifecycle stage

## When NOT To Use

- When OpCache is not enabled
- For development environments with validate_timestamps=1
- Without first understanding the application's deployment pattern

## Prerequisites

- OpCache enabled and configured
- Understanding of validate_timestamps setting
- Deployment pipeline access

## Inputs

- Current OpCache configuration (validate_timestamps, memory_consumption)
- Deployment frequency and pattern (rolling, blue-green, in-place)
- Monitoring data for hit rate and memory usage

## Workflow (numbered steps)

1. Identify the current lifecycle stage: population (hit rate climbing), steady state (hit rate >99%), or eviction (hit rate dropping)
2. For population stage (post-deployment or reset): warm the cache using warm-up requests before accepting traffic
3. For steady state: ensure monitoring detects when hit rate drops below 99%
4. For eviction (cache_full): increase memory_consumption by 50% and restart PHP-FPM to reset
5. For planned deployments: use validate_timestamps=0 with explicit opcache_reset() in deployment pipeline
6. For unplanned invalidation (opcache_reset() during traffic): expect 30-120 seconds of increased latency as cache repopulates
7. For preloading changes: note that opcache_reset() does not invalidate preloaded classes — full PHP-FPM restart required
8. In containerized environments: each new container starts in population stage — use file cache and warm-up to accelerate
9. Document the lifecycle management procedure for the team

## Validation Checklist

- [ ] Current lifecycle stage identified
- [ ] Population stage management (warm-up) configured
- [ ] Steady state monitoring in place
- [ ] Eviction detection with alert configured
- [ ] Deployment pipeline includes appropriate invalidation
- [ ] Preloading change procedure documented (full restart required)
- [ ] Container deployment lifecycle managed

## Common Failures

- **opcache_reset() during peak traffic**: Cache repopulation increases CPU and latency — schedule during low traffic
- **Not invalidating preloaded classes**: opcache_reset() does not refresh preloaded classes — requires full restart
- **Ignoring population stage latency**: First users after deployment experience slow response times
- **Multiple resets in short succession**: Each reset clears the entire cache — CPU spikes with each reset

## Decision Points

- validate_timestamps=0: explicit lifecycle management required — opcache_reset() in deployment pipeline
- validate_timestamps=1: passive lifecycle — OpCache detects changes based on revalidate_freq
- Preloading changes: always require full PHP-FPM restart
- Container deployment: lifecycle is per-container — manage at container level, not individual invalidation

## Performance Considerations

- Population stage: 30-120 seconds of increased CPU as files compile
- Steady state: minimal CPU for cache lookups
- Eviction stage: increasing CPU as more files are recompiled — the longer eviction continues, the worse it gets
- Reset: immediate 100% miss rate, then exponential recovery as frequently-accessed files are cached first

## Security Considerations

- Deployment invalidation timing should not be predictable by external actors (avoid timing attacks based on cache state)
- opcache_reset() web endpoints must be protected (internal network, authentication)
- validate_timestamps=0 prevents accidental exposure of new code before deployment is complete

## Related Rules (from 05-rules.md)

- Automate opcache_reset() in Every Deployment Pipeline
- Never Rely on validate_timestamps=1 for Deployment Cache Invalidation
- Plan Cache Invalidation for Every Caching Layer

## Related Skills

- OpCache Reset Strategies
- PHP-FPM Graceful Reload Patterns
- Preloading Update Procedure
- CI/CD Cache Invalidation Steps

## Success Criteria

- OpCache lifecycle stages understood and managed
- Deployment pipeline includes appropriate invalidation steps
- Population stage managed with warm-up
- Monitoring detects lifecycle transitions (eviction, low hit rate)
- Preloading changes handled with full restart
