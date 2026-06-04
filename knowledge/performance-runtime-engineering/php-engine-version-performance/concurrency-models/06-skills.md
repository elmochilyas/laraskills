# Skill: Select the Appropriate Concurrency Model for a PHP Workload

## Purpose

Match PHP's available concurrency models (process-per-request, coroutine, thread, goroutine) to the workload's I/O profile and latency requirements.

## When To Use

- Choosing between PHP-FPM, Octane, Swoole, RoadRunner, or FrankenPHP
- Designing a new application that requires high concurrency
- Migrating from PHP-FPM to a memory-resident runtime

## When NOT To Use

- For legacy applications where migration cost exceeds performance benefit
- When the team lacks operational expertise for the chosen model
- For simple CRUD applications where PHP-FPM already meets SLOs

## Prerequisites

- Understanding of synchronous vs asynchronous I/O
- Application's I/O profile characterized (average query latency, external API call frequency)
- Throughput and latency requirements documented
- Team familiarity with candidate runtime options

## Inputs

- Average request wall time and I/O wait percentage
- Peak concurrent request volume
- Database query latency distribution
- External API call frequency and latency

## Workflow (numbered steps)

1. Measure the application's I/O wait percentage — profile with Blackfire or Tideways to determine PHP execution vs I/O time
2. If I/O wait <30% of wall time and throughput requirement <1000 RPS, stay with PHP-FPM (process-per-request is simplest)
3. If I/O wait >30% or throughput requirement >1000 RPS, evaluate memory-resident models
4. For high-latency I/O (database queries >50ms, external API calls), select Swoole (coroutine-based, auto-hooks PDO/MySQLi/Redis/cURL)
5. For mixed I/O with moderate latency, select RoadRunner (goroutine scheduler + PHP workers, no PHP extension required)
6. For maximum operational simplicity (single binary, HTTP/3, automatic HTTPS), select FrankenPHP (thread-based, Caddy module)
7. For Laravel applications, select RoadRunner as default (best Octane integration) unless specific I/O profile dictates otherwise
8. Validate selection with a 24-hour soak test under production-representative traffic
9. Document concurrency model, worker count, connection pooling, and expected throughput

## Validation Checklist

- [ ] I/O wait percentage measured and documented
- [ ] Throughput and latency requirements defined
- [ ] Candidate runtime(s) benchmarked with production workload
- [ ] 24-hour soak test completed with no memory leaks or degradation
- [ ] Rollback plan documented (parallel FPM deployment)
- [ ] Team trained on runtime operations and troubleshooting

## Common Failures

- **Choosing by blog benchmarks**: Published comparisons use different hardware, workloads, and frameworks — always test your workload
- **Ignoring operational complexity**: Swoole requires a PHP extension; FrankenPHP requires ZTS; RoadRunner has no extension requirement
- **Skipping soak tests**: Memory leaks surface after hours, not minutes — short benchmarks miss the most critical failure mode
- **Expecting universal speedup**: Each model has I/O profiles where it excels and profiles where it matches or underperforms FPM

## Decision Points

- If database queries average >50ms: Swoole's coroutine model yields the highest gain
- If queries average <10ms: RoadRunner's goroutine scheduler provides better efficiency
- If team has no PHP extension compilation experience: prefer RoadRunner or FrankenPHP
- If container simplicity is priority: FrankenPHP (single binary) simplifies Docker images

## Performance Considerations

- RoadRunner: 41-111% throughput improvement over FPM with efficient goroutine scheduler
- Swoole: best for high-latency I/O; coroutine overhead ~1µs per yield point
- FrankenPHP: CGO boundary adds 5-10% overhead vs pure Go/PHP; thread model has higher per-worker memory
- PHP-FPM: process-per-request provides complete isolation with per-request bootstrap cost (10-40ms)

## Security Considerations

- Swoole's C extension must be compiled from trusted sources
- RoadRunner's process isolation provides strongest security boundaries
- FrankenPHP's CGO bridge and ZTS requirements introduce memory safety considerations
- All runtimes require regular security updates

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Start with RoadRunner for Laravel Octane
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Runtime Selection Decision Tree
- Octane Architecture and Execution Model
- PHP-FPM Process Manager Mode Selection

## Success Criteria

- Concurrency model matches workload I/O profile
- 24-hour soak test passes with stable RSS and no degradation
- Throughput improvement over PHP-FPM measured and meets expectations
- Team trained and deployment pipeline configured for chosen runtime
