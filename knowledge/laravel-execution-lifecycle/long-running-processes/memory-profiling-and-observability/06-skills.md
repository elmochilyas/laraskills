# Skill: Establish Memory Baseline and Trend Tracking

## Purpose
Set up per-request memory delta logging and baseline trend monitoring to detect memory accumulation in Octane or queue workers before it causes OOM crashes.

## When To Use
- Pre-Octane deployment to establish baseline
- Post-deployment continuous observability
- OOM incident response
- Queue worker optimization

## When NOT To Use
- PHP-FPM only apps (memory freed per-request)
- Development environments (worker lifecycle too short)
- Single-request profiling (no trend data)

## Prerequisites
- Laravel application deployed on Octane or queue workers
- Access to structured logging system (Laravel log, CloudWatch, ELK)
- Metrics system for baseline tracking (Grafana, Telescope, or custom)

## Inputs
- `config/octane.php` or queue worker configuration
- List of known singleton/static accumulators from binding audit
- `memory_limit` PHP configuration value

## Workflow
1. Register `RequestReceived` listener capturing `memory_get_usage()` and `memory_get_usage(true)` as request attributes
2. Register `RequestTerminated` listener computing delta (`memory_get_usage(false) - start_actual`) and OS-level baseline (`memory_get_usage(true)`)
3. Log delta, baseline, URL, method, and worker PID to a dedicated `memory` log channel
4. Register an `Octane::tick('memory-monitor', ...)` at 60-second interval that gauges `worker_memory_baseline`, `worker_memory_usage`, and `worker_gc_roots`
5. Configure alert: consistent delta > 5MB OR baseline > 20% increase over 1000 requests
6. Run static property scanner as artisan command to identify growing arrays in declared classes

## Validation Checklist
- [ ] `memory_get_usage()` logged before and after each request with delta calculated
- [ ] Baseline trend tracker logs baseline after every N requests (configurable)
- [ ] GC status monitored via `gc_status()['roots']` in tick callback
- [ ] Grafana dashboard panels for worker memory baseline, delta, GC roots
- [ ] Alerts configured for consistent positive deltas and baseline growth
- [ ] Static property scanner output identifies growing arrays and registries

## Common Failures
- False positive deltas from using `memory_get_usage(true)` for per-request delta
- Profiling tool itself accumulates data in static arrays (Telescope watchers)
- Metrics deluge: 100 workers x 500 req/min = 50,000 log entries/minute
- Combined profiling overhead (Blackfire + Telescope + custom logging) > 10%

## Decision Points
- Use `memory_get_usage(false)` for deltas (actual PHP usage) vs `true` for OS-level baseline
- Structured logging vs metrics-only approach (logs enable post-hoc correlation)
- Telescope vs Blackfire vs custom logging based on existing infrastructure
- Static scanner: run on every request (expensive) vs as background job

## Performance Considerations
- `memory_get_usage()`: ~0.001ms, safe to log freely
- Reflection-based static property scanning: 1-3s, run as artisan command not inline
- Blackfire continuous profiling: ~2% CPU overhead
- Telescope watchers: 1-5ms per request, enable only relevant ones
- GC collection: use only when root count is high

## Security Considerations
- Combined profiling tools add 10%+ overhead under load, pushing worker past memory_limit
- Memory spike from legitimate operation triggers false positive alert
- Profiling tool's own static arrays can become leak source
- Structured logging prevents metric deluge but must not log sensitive request data

## Related Rules
- Track per-request memory delta on every request (05-rules.md)
- Monitor baseline trend, not instantaneous memory (05-rules.md)
- Use `memory_get_usage(false)` for actual usage, `true` for OS allocation (05-rules.md)
- Use structured logging over ad-hoc metrics for memory data (05-rules.md)
- Inspect GC root counts as a leading leak indicator (05-rules.md)
- Cache static property reflection results (05-rules.md)

## Related Skills
- Identify Singleton State Leaks (singleton-state-leaks)
- Identify Static Property Accumulation (static-property-accumulation)
- Configure Octane Workers with max_requests (octane-configuration-and-workers)
- Register Octane Lifecycle Hooks (octane-lifecycle-hooks)

## Success Criteria
- Per-request memory delta is logged with zero false positives from measurement methodology
- Baseline trend over 1000 requests shows stable or predictably bounded memory
- GC root count does not grow monotonically across requests
- Alert fires before workers hit memory_limit, with sufficient lead time for investigation
- Static property scanner identifies any leaky registry before it causes OOM
