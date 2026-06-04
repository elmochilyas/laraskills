# Skill: Diagnose and Handle Memory Limit Exceeded Errors

## Purpose

Respond to memory limit exceeded (MLE) errors systematically: profile the peak, determine the root cause (spike vs leak vs capacity), apply the correct fix (chunk, defer, stream, or raise), and prevent recurrence.

## When To Use

- Production OOM errors appearing in logs
- Endpoints that fail intermittently under load
- Designing new features that process large datasets
- Container OOM events (pod restart) linked to PHP

## When NOT To Use

- Stable endpoints with no MLE history
- Development environments where limits are intentionally high
- One-time scripts with no production impact

## Prerequisites

- Access to production error logs (or staging with representative traffic)
- `memory_get_peak_usage(true)` instrumentation
- Understanding of container resource limits (if containerized)
- Profiling tool for deeper investigation (Blackfire, Tideways, Xdebug)

## Inputs

- MLE error logs with peak memory, URL, and request parameters
- Container memory limits and PHP-FPM pool configuration
- Query execution plans for database-heavy endpoints
- Octane worker RSS trends (if applicable)

## Workflow (numbered steps)

1. Reproduce the MLE in staging with the same parameters. If not possible, use production debug mode briefly.
2. Determine the peak memory: `memory_get_peak_usage(true)` at the end of a representative request.
3. Classify the cause:
   - **Spike**: Single endpoint with legitimate peak > limit (report generation, export).
   - **Leak**: Memory grows across requests (Octane) or grows within a single request without freeing.
   - **Capacity**: Normal operations exceed available RAM due to misconfigured limits or insufficient resources.
4. For **spike**: chunk database queries, stream output, defer to queue. Set limit no higher than 2× the profiled peak.
5. For **leak**: find the leaking code — look for static caches, circular references, event subscribers holding references, or unclosed resources. Fix with unset() or WeakReference.
6. For **capacity**: adjust `memory_limit` based on profiled P99 peak. Verify `memory_limit × pm.max_children` fits within available RAM with 30% headroom.
7. If containerized: verify `memory_limit < container_limit`. Set PHP limit to 75-80% of cgroup limit.
8. Add per-endpoint memory monitoring to detect future regressions. Alert on P95 > 80% of limit.
9. Implement graceful degradation for near-OOM requests: serve cached or simplified responses.
10. Document the MLE incident, root cause, and fix in the team runbook.

## Validation Checklist

- [ ] Peak memory profiled for the failing endpoint
- [ ] Root cause classified (spike vs leak vs capacity)
- [ ] Fix applied: chunking, streaming, queue offloading, or limit adjustment
- [ ] Container/PHP limit alignment verified (if containerized)
- [ ] Per-endpoint monitoring implemented
- [ ] Graceful degradation strategy in place
- [ ] No recurrence in 7-day observation period

## Common Failures

- **Treating all MLE as capacity problems**: 60% of MLE events are spikes (unoptimized queries) or leaks (static caches, circular refs). Only 40% are genuinely undersized limits.
- **Raising limits without profiling**: Doubling `memory_limit` may hide a leak that will OOM at higher traffic volumes.
- **Not checking Octane cumulative memory**: A worker with 100MB per-request peak that grows to 500MB after 1,000 requests is a leak, not a spike. Check RSS trend, not single-request peak.
- **Ignoring queue workers**: Web pool limits are fine, but queue workers processing heavy jobs have the same limit. Queue pools must be configured separately.

## Decision Points

- Peak < 80% of current limit → Not an MLE issue. Look for other error causes.
- Peak 80-100% of current limit, constant per request → Spike. Apply chunking/streaming or raise limit modestly.
- Peak grows over time (Octane) → Leak. Find and nullify retained references.
- Peak > limit, single endpoint → Defer to queue or optimize data loading.
- Container OOM with no PHP MLE → PHP limit too close to container limit. Reduce PHP limit.
- Queue job MLE → Set queue pool `memory_limit` higher. Profile the job's peak.

## Performance Considerations

- Chunking database queries: reduces peak memory from dataset size × row size to chunk size × row size. Chunk of 1000 keeps peak ~10MB vs 1GB for 100k records.
- Streaming responses: keeps memory at ~1MB regardless of dataset size. The cost is slightly higher CPU (multiple write calls) — negligible at modern speeds.
- Queue offloading: adds latency (seconds to minutes) but reduces web worker peak memory by the full operation cost. The tradeoff is acceptable for operations > 100ms.
- Graceful degradation: serving cached data is faster (microseconds) and avoids allocation entirely. The tradeoff is stale data.

## Security Considerations

- Graceful degradation must not bypass authentication or authorization. A cached 503 is acceptable; a cached response that leaks data is not.
- Container OOM kills do not trigger shutdown functions. Infrastructure-level monitoring (Kubernetes events, Docker logs) is required for detection.
- Input size validation prevents memory exhaustion from crafted payloads. Set `post_max_size` and `max_input_vars` conservatively.

## Related Rules (from 05-rules.md)

- Defer memory-heavy operations to queue workers
- Set PHP memory_limit below container memory limit
- Monitor peak memory per endpoint and alert on thresholds
- Implement graceful degradation for near-memory-limit requests

## Related Skills

- Memory Limit Sizing
- Memory Leak Detection
- Chunking and Lazy Collections
- Queue Job Design

## Success Criteria

- Zero recurring MLE errors on any endpoint
- All memory-heavy endpoints identified and profiled
- Queue offloading for operations > 50% of web limit
- Container/PHP limit alignment documented
- Per-endpoint memory monitoring active and alerting
