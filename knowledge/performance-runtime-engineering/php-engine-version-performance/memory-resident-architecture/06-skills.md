# Skill: Migrate from PHP-FPM to a Memory-Resident Architecture

## Purpose

Eliminate per-request bootstrap overhead by transitioning from PHP-FPM's shared-nothing model to a memory-resident architecture (Octane, Swoole, RoadRunner, FrankenPHP).

## When To Use

- Bootstrap overhead exceeds 20% of request time for high-throughput endpoints
- Current PHP-FPM deployment cannot meet throughput requirements
- Team has operational capacity to manage memory-resident runtime

## When NOT To Use

- For legacy applications where migration risk outweighs performance benefit
- When team lacks debugging skills for state leak and memory issues
- For applications with heavy reliance on non-thread-safe PHP extensions
- When regulatory compliance requires per-request process isolation

## Prerequisites

- Profiling data showing bootstrap time as percentage of request wall time
- Audit of all service providers and static properties for state leakage
- Staging environment for testing
- Rollback plan with parallel FPM deployment

## Inputs

- Current FPM configuration (pm.max_children, pm mode, request times)
- List of all installed PHP extensions
- Service provider registry (config/app.php providers)
- Static property usage report (grep -rn "static \$" app/)

## Workflow (numbered steps)

1. Profile the application to measure bootstrap time — if <20% of request time, migration benefit is minimal
2. Audit all service providers: ensure no request-scoped singletons — change to scoped() bindings
3. Audit all static properties: grep for "static $" — refactor to instance properties or container bindings
4. Select target runtime: RoadRunner for default, Swoole for high-latency I/O, FrankenPHP for simplicity
5. Install the runtime and configure Octane (if Laravel): `composer require laravel/octane` then `php artisan octane:install`
6. Configure worker count, max_requests, and connection pooling for the selected runtime
7. Run a 24-hour soak test with production-representative traffic — monitor RSS growth every hour
8. If RSS grows >10% per hour, investigate memory leaks and adjust max_requests for more frequent recycling
9. Deploy using blue-green strategy with parallel FPM deployment for instant rollback
10. Monitor production for 48 hours: track RSS, request latency, error rate, and connection pool usage

## Validation Checklist

- [ ] Bootstrap time measured and confirmed >20% of request time
- [ ] All service providers audited (no request-scoped singletons)
- [ ] All static properties refactored or confirmed safe
- [ ] 24-hour soak test passed with stable RSS
- [ ] Rollback plan in place with parallel FPM deployment
- [ ] Connection pooling configured for database and Redis
- [ ] Team trained on runtime operations and debugging

## Common Failures

- **Assuming drop-in replacement**: Octane requires significant code audit — providers, statics, and global state must be addressed
- **Skipping soak tests**: Memory leaks surface after hours — 30-minute tests miss critical failure modes
- **Forgetting connection limits**: Persistent connections multiply — N workers × M connections may exhaust database pool
- **No rollback plan**: If runtime fails at hour 6, restoring FPM from scratch takes hours without parallel deployment

## Decision Points

- If Laravel: use Octane as the migration path (abstracts runtime differences)
- If high-latency I/O (>50ms DB): prefer Swoole
- If operational simplicity is priority: prefer FrankenPHP
- If team avoids PHP extensions: prefer RoadRunner

## Performance Considerations

- 2.5-3.1x throughput gain for mixed workloads, 15-20x for API workloads (sub-50ms responses)
- Bootstrap elimination saves 10-40ms per request
- Per-request Application cloning overhead: 0.5-2ms (negligible vs bootstrap)
- Throughput drops 40-60% when memory pressure triggers swap — ensure adequate RAM

## Security Considerations

- State leaks between requests can expose User A's data to User B — this is the most critical security risk
- Singleton misuse (request-scoped data in singletons) causes privilege escalation
- Static properties bypass sandbox isolation — any code using `public static $var` can leak data
- Third-party packages using global state introduce data integrity vulnerabilities

## Related Rules (from 05-rules.md)

- Audit All Service Providers Before Deploying Octane
- Never Use Static Properties for Request-Scoped Data
- Set max_requests to 500-1000
- Use Octane::booted() for Per-Worker Initialization
- Run 24-Hour Soak Tests Before Production

## Related Skills

- Octane Architecture and Execution Model
- Service Provider Optimization
- State Management and Leak Prevention
- Worker Configuration by Driver

## Success Criteria

- Memory-resident architecture deployed with stable RSS over 24+ hours
- Throughput improvement meets or exceeds projections
- No data leakage between requests detected
- Rollback capability maintained for at least 2 weeks
- Team can operate and troubleshoot the new runtime independently
