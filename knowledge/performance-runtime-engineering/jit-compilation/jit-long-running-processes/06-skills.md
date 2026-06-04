# Skill: Optimize JIT for Long-Running PHP Processes

## Purpose

Configure JIT pre-warming, buffer sizing, and compilation triggers specifically for Octane, Swoole, RoadRunner, or FrankenPHP workers that handle thousands of requests per process.

## When To Use

- Running Laravel Octane, Swoole, RoadRunner, or FrankenPHP in production
- Workers handle 500+ requests per process lifetime
- Cold-start latency after worker restart is measurably higher than steady-state latency

## When NOT To Use

- For PHP-FPM where workers recycle frequently (pm.max_requests < 100)
- For short-lived CLI scripts (<100 requests or <1 minute runtime)
- When JIT is not enabled for the workload

## Prerequisites

- JIT enabled with tracing mode (1254) or higher
- Memory-resident runtime (Octane, Swoole, RoadRunner, FrankenPHP) deployed
- Monitoring of worker startup latency and steady-state latency
- List of representative endpoints to pre-warm

## Inputs

- Current JIT configuration (php.ini)
- Worker startup latency vs steady-state latency delta
- List of critical endpoints to pre-warm
- Worker max_requests configuration

## Workflow (numbered steps)

1. Measure cold-start latency: time the first 10 requests on a fresh worker vs requests 500-510 on a warm worker
2. If cold-start latency is >20% higher than steady-state, JIT pre-warming is needed
3. Create a pre-warm endpoint list: 3-5 endpoints covering critical application paths
4. Implement pre-warming in the worker boot sequence using Octane::booted() or equivalent
5. For Octane: add `Octane::booted(function () { /* hit warmup endpoints */ })` in AppServiceProvider
6. For Swoole: use `onWorkerStart` callback to execute warmup requests
7. For RoadRunner: implement a warmup plugin or execute requests in the worker initialization
8. Configure max_requests to balance JIT amortization with memory safety (500-1000 for most applications)
9. Benchmark: compare cold-start latency with and without pre-warming
10. Document the pre-warming configuration and its measured impact

## Validation Checklist

- [ ] Cold-start vs steady-state latency measured
- [ ] Pre-warming implemented using per-worker initialization hook
- [ ] Pre-warm endpoints cover critical application paths
- [ ] max_requests configured appropriately (500-1000)
- [ ] JIT buffer utilization monitored after warmup
- [ ] Cold-start latency reduced compared to baseline
- [ ] Documentation created for pre-warming setup

## Common Failures

- **Too few warmup requests**: A single request may not trigger JIT on all hot paths — execute multiple representative requests
- **Pre-warming during traffic**: Execute warmup before accepting traffic, not after — otherwise cold-start latency affects real users
- **Not configuring max_requests**: Workers that run forever without recycling may accumulate buffer fragmentation
- **Assuming JIT compiles instantly**: JIT triggers only after hot path thresholds are crossed (64 loop iterations or 100 function calls)

## Decision Points

- If latency delta >20%: implement pre-warming immediately
- If latency delta 10-20%: pre-warming beneficial but not critical
- If latency delta <10%: pre-warming may not be worth implementation effort
- If max_requests <100: JIT never amortizes — consider raising max_requests

## Performance Considerations

- Each pre-warm request triggers JIT compilation of hot paths (~50-500µs per function)
- Total pre-warm overhead: 50-500ms per worker at startup — negligible compared to hours of steady-state operation
- Pre-warmed workers reach steady-state performance from the first user request
- Without pre-warming, first 100-1000 requests per worker are 20-50% slower

## Security Considerations

- Pre-warm requests may trigger side effects if they hit mutation endpoints — use GET requests to read-only endpoints
- Ensure pre-warm endpoints do not create database records or send emails
- Pre-warming executes application code with whatever permissions the worker has

## Related Rules (from 05-rules.md)

- Pre-warm JIT in Long-Running Processes
- Set max_requests to 500-1000
- Enable JIT Universally, Then Benchmark
- Monitor JIT Buffer Utilization

## Related Skills

- Octane Architecture and Execution Model
- Worker Configuration by Driver
- JIT Configuration for Production

## Success Criteria

- Pre-warming configured and verified to reduce cold-start latency
- Latency delta between cold-start and steady-state <10%
- max_requests set appropriately for JIT amortization
- Pre-warm endpoints documented and maintained
- JIT buffer utilization stays within acceptable range
