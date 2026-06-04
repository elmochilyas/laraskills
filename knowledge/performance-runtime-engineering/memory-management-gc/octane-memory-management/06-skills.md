# Skill: Manage Memory in Laravel Octane Workers

## Purpose

Prevent memory growth, fragmentation, and state leaks in Octane long-running workers through proper configuration, monitoring, and code practices.

## When To Use

- Running Laravel Octane in production
- Memory usage grows over worker lifetime
- Debugging state leaks between requests
- Configuring worker recycling and connection pooling

## When NOT To Use

- For PHP-FPM where memory resets per request
- When Octane is not deployed
- Without first profiling and understanding the application's memory profile

## Prerequisites

- Laravel Octane deployed and running
- Worker RSS monitoring in place
- Understanding of Octane's sandbox pattern
- Profiling data showing memory per request

## Inputs

- Worker RSS trend over time (hourly)
- max_requests configuration
- Service provider list (config/app.php)
- Connection pool configuration (database, Redis)

## Workflow (numbered steps)

1. Monitor per-worker RSS over 24 hours — establish baseline growth rate
2. Set max_requests to 500-1000 to recycle workers before fragmentation accumulates
3. Configure connection pooling: set `DB::pool()` or configure database max_connections per worker count
4. Audit service providers: move request-scoped bindings from singleton() to scoped()
5. Replace static properties with instance properties or container bindings
6. Use `Octane::booted()` for per-worker initialization instead of provider boot()
7. Explicitly unset() large variables at the end of request handling
8. Enable `octane:watch` during development to detect state leaks automatically
9. Run a 24-hour soak test with production traffic — RSS should grow <2% per hour
10. Document the memory management configuration

## Validation Checklist

- [ ] Worker RSS growth baseline established
- [ ] max_requests set to 500-1000
- [ ] Connection pooling configured
- [ ] Service providers audited (no request-scoped singletons)
- [ ] Static properties refactored
- [ ] Octane::booted() used for per-worker init
- [ ] unset() called for large request-scoped variables
- [ ] 24-hour soak test passed (RSS growth <2%/hour)
- [ ] Configuration documented

## Common Failures

- **Setting max_requests too low (50-100)**: Negates Octane's benefit (bootstrap runs too frequently)
- **Not auditing providers**: Singletons holding request-scoped data cause the most critical Octane failures
- **Ignoring connection pool limits**: N workers × M connections may exhaust database/Redis connection limits
- **Not running soak tests**: Memory issues surface over hours, not minutes — 30-minute tests are insufficient

## Decision Points

- RSS growth <2%/hour over 24 hours: healthy — maintain current configuration
- RSS growth 2-5%/hour: investigate — may need lower max_requests or leak fix
- RSS growth >5%/hour: critical — fix memory leaks or increase recycling frequency
- No max_requests set: workers run until OOM — always set max_requests

## Performance Considerations

- Per-request Application cloning overhead: 0.5-2ms
- Worker recycling: 0.1-0.2% overhead at 500-1000 max_requests
- Connection pooling: reduces connection establishment overhead by 50-80%
- Memory fragmentation accumulates over 1000+ requests — recycling clears it
- Octane throughput drops 40-60% when swap is triggered — ensure adequate RAM

## Security Considerations

- State leaks between requests can expose User A's data to User B
- Singleton misuse (request-scoped data in singletons) causes privilege escalation
- Static properties bypass sandbox isolation entirely
- Third-party packages using global state introduce data integrity vulnerabilities
- Treat all state leaks as security incidents

## Related Rules (from 05-rules.md)

- Audit All Service Providers Before Deploying Octane
- Never Use Static Properties for Request-Scoped Data
- Set max_requests to 500-1000
- Use Octane::booted() for Per-Worker Initialization
- Always Audit Service Providers Before Octane Deployment

## Related Skills

- Octane Architecture and Execution Model
- Service Provider Optimization
- State Management and Leak Prevention
- Connection Pooling Strategies

## Success Criteria

- Worker RSS stable over 24 hours (<2% per hour growth)
- max_requests configured for optimal balance
- Connection pooling prevents resource exhaustion
- No state leaks detected (tested with concurrent requests)
- Memory management configuration documented
