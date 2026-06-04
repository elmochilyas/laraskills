# Skill: Implement OpCache Warm-Up After Deployment

## Purpose

Pre-populate the OpCache after a deployment or reset to prevent users from experiencing cold-start latency during cache population.

## When To Use

- After every production deployment with opcache_reset()
- After PHP-FPM restart in high-traffic environments
- In containerized deployments where OpCache starts empty
- Before switching traffic in blue-green deployments

## When NOT To Use

- For development environments where cold-start is acceptable
- For low-traffic applications where warm-up overhead exceeds user impact
- When the deployment includes preloading (preloading compiles at startup, reducing warm-up need)

## Prerequisites

- OpCache enabled and configured
- Deployment pipeline with post-deploy script capability
- Access to the application's HTTP endpoints via CLI or curl
- List of endpoints covering the majority of application code paths

## Inputs

- List of critical application endpoints (homepage, API routes, admin pages)
- Number of PHP files and expected warm-up duration
- Current OpCache status (empty or partially populated)

## Workflow (numbered steps)

1. After opcache_reset() or container start, check OpCache is empty: `opcache_get_status(false)['opcache_statistics']['num_cached_scripts']` should be near zero
2. Execute HTTP GET requests against the critical endpoints list: homepage, key API routes, admin pages
3. Each request compiles and caches the PHP files executed during that request
4. Use a CLI script or curl loop to hit 10-20 representative endpoints covering different modules
5. Monitor cache population: check `num_cached_scripts` increasing after each request
6. Continue until the number of cached scripts stabilizes (most files are compiled)
7. Verify warm-up completion: hit rate from `opcache_get_status()['opcache_statistics']['hit_rate']` should be climbing
8. For blue-green deployments: warm the OpCache on the new environment BEFORE switching traffic
9. Document the warm-up endpoint list and procedure

## Validation Checklist

- [ ] OpCache verified empty before warm-up
- [ ] Warm-up endpoint list covers critical application paths
- [ ] Warm-up requests executed before user traffic
- [ ] Cached script count monitored and stabilized
- [ ] Hit rate confirmed climbing post-warmup
- [ ] Blue-green: warm-up completed before traffic switch
- [ ] Procedure documented

## Common Failures

- **Insufficient endpoint coverage**: Warming only the homepage leaves admin and API modules cold
- **Warming without authentication**: Admin endpoints return 302 redirect — PHP files still cached but 302/404 pages may not load all code
- **Not warming after container start**: Each container starts with empty OpCache — must warm individually
- **Warming after traffic switch**: Users hit cold cache while warm-up runs — defeats the purpose

## Decision Points

- For single-server deployment: warm sequentially, then enable traffic
- For blue-green: warm entire green environment before switching
- For containers: warm in startup health check before accepting traffic
- For rolling deployments: warm each new instance before removing old one

## Performance Considerations

- Each warm-up request compiles 50-500 PHP files (the ones executed for that endpoint)
- Total warm-up time: 30-120 seconds depending on application size and request latency
- During warm-up, the server may have increased CPU due to compilation — this is acceptable during the warm-up window
- Preloading reduces warm-up need by compiling framework classes at startup

## Security Considerations

- Warm-up requests should target read-only endpoints to avoid side effects
- Authentication tokens in warm-up scripts must be stored securely
- Warm-up scripts should not use production credentials — use staging with production-like data

## Related Rules (from 05-rules.md)

- Pre-warm JIT in Long-Running Processes
- Automate opcache_reset() in Every Deployment Pipeline
- Never Rely on validate_timestamps=1 for Deployment Cache Invalidation

## Related Skills

- OpCache Reset Strategies
- OpCache Monitoring and Hit Rate Analysis
- Preloading Script Design Patterns
- Blue-Green Deployment with OpCache

## Success Criteria

- OpCache warm-up procedure implemented in deployment pipeline
- Users never experience cold-start latency after deployment
- Warm-up completed before traffic switch (blue-green)
- Cached script count verified and monitored
- Procedure documented and tested
