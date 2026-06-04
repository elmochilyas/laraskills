# Skill: Optimize Streaming Performance

## Purpose
Optimize LLM response streaming by minimizing Time-to-First-Token (TTFT), maximizing Tokens-Per-Second (TPS), and reducing server overhead through connection pooling, output buffer management, and batched flushing.

## When To Use
- User-facing streaming applications where responsiveness is critical
- High-traffic streaming services needing to handle many concurrent connections
- Applications with long prompts where TTFT optimization significantly improves UX
- Services where provider latency variability causes inconsistent streaming performance

## When NOT To Use
- Low-traffic internal tools where optimization effort exceeds benefit
- Applications where total completion time matters more than TTFT (batch processing)
- Systems being replaced before performance optimization is justified

## Prerequisites
- KU-01 (Streaming Fundamentals) — understanding of TTFT, TPS, flush mechanics
- KU-04 (Performance Optimization) — concepts in this KU
- Profiling tools (Telescope, Prometheus, or similar) for measuring TTFT and TPS
- Access to modify PHP and nginx configuration
- Provider connection details (region, streaming support, rate limits)

## Inputs
- Current TTFT and TPS measurements (per provider, per model)
- Provider region and connection details
- PHP configuration (output_buffering, max_execution_time)
- nginx configuration for the streaming endpoint
- Current concurrent streaming connection count and server resources
- Prompt lengths and response length distributions

## Workflow
1. **Profile current streaming performance**: Measure TTFT (time to first content token), TPS (average over the stream), and p95/p99 TTFT. Track these as separate metrics. Identify the dominant bottleneck.
2. **Disable PHP output buffering**: Set `output_buffering = off` in php.ini or call `ob_implicit_flush(true)` and `ob_end_flush()` at the start of each streaming controller.
3. **Configure connection pooling**: Create a singleton HTTP client (Guzzle) with connection pooling enabled. Set `CURLOPT_TCP_KEEPALIVE` and `CURLOPT_TCP_KEEPIDLE` for persistent connections. This eliminates 100-300ms TLS handshake overhead per request.
4. **Disable nginx proxy buffering**: Add `proxy_buffering off; proxy_cache off;` to the nginx location block for streaming endpoints. Add `X-Accel-Buffering: no` header in the Laravel response.
5. **Implement batched flushing**: Instead of flushing after every token, accumulate 3-5 tokens or flush every 50ms (whichever comes first). This reduces flush overhead for fast models (100+ t/s).
6. **Optimize TTFT specifically**: Reduce prompt length if possible (shorter system prompts, fewer history messages). Consider using prompt caching (if provider supports it) to reduce prefill time.
7. **Choose optimal provider region**: Deploy the application server close to the nearest LLM provider region to minimize network latency for each chunk.
8. **Set appropriate timeouts**: Configure `max_execution_time` (PHP), `proxy_read_timeout` (nginx), and provider-side timeout to match the longest expected stream (120-300s).
9. **Consider event-loop server for high concurrency**: If expecting >50 concurrent streams, deploy Laravel Octane with RoadRunner or Swoole. Each worker handles thousands of concurrent connections vs. PHP-FPM's one-per-process model.
10. **Monitor and iterate**: Track TTFT and TPS per provider/model in production. Set alerts for TTFT >500ms (p95) and TPS <30 for text generation models.

## Validation Checklist
- [ ] PHP output buffering is disabled for streaming endpoints
- [ ] Connection pooling is configured (reusable HTTP client to provider)
- [ ] nginx proxy buffering is disabled for SSE endpoints
- [ ] TTFT and TPS are monitored in production per provider and model
- [ ] Batched flushing is configured (flush every 3-5 tokens or every 50ms)
- [ ] High-concurrency deployments use event-loop server (RoadRunner, Swoole) or dedicated streaming infrastructure
- [ ] Provider region is geographically close to the deployment server

## Common Failures
- **TTFT remains high despite optimization**: Prompt prefill time dominates. Solution: use prompt caching (Anthropic, Gemini), reduce system prompt length, or switch to a provider with faster prefill.
- **Flush overhead limits throughput**: Flushing every token for a 120 t/s model means 120 flush() calls per second — significant overhead. Solution: batch flush (every 3-5 tokens or 50ms).
- **PHP-FPM worker exhaustion under streaming load**: Each stream holds a PHP process. Solution: use Octane/RoadRunner/Swoole for event-loop streaming.
- **TTFT and TPS optimization conflict**: Reducing TTFT (flush immediately) increases overhead, reducing TPS. Solution: find the balance by measuring both metrics and tuning flush interval.

## Decision Points
- **Flush every token vs. batch flush**: Every-token for very slow models (<10 t/s) or when TTFT is critical. Batch flush for fast models (>50 t/s) to reduce overhead.
- **PHP-FPM vs. Octane**: PHP-FPM for <50 concurrent streams. Octane (RoadRunner/Swoole) for >50 concurrent streams — event-loop architecture handles 1000+ connections per worker.
- **Connection pooling config**: Persistent connections (keepalive) for high-throughput providers. Fresh connections per request for low-traffic or when provider enforces per-connection rate limits.

## Performance Considerations
- TTFT target: <500ms (p95). Dominated by provider prefill + network latency
- TPS target: >50 t/s for text generation, >200 t/s for instant feel
- PHP flush() overhead: ~1-5ms per call. Batch flushing reduces calls by 5-20x
- Connection pooling saves 100-300ms per request (TLS handshake)
- nginx buffering adds up to 4KB delay if not disabled
- Octane/RoadRunner: 1000-5000 concurrent streams per worker vs. PHP-FPM's 50-200 max_children
- Provider region proximity: each chunk travels provider → server → client. Every 100ms of network latency adds to TTFT and reduces TPS

## Security Considerations
- Connection pooling must respect provider authentication — refresh tokens as needed, don't reuse expired auth
- Output buffering disabled means error output may also flush immediately — sanitize before streaming
- Batched flushing may batch sensitive content — ensure per-token sanitization, not per-batch
- High-concurrency servers need connection limits to prevent resource exhaustion

## Related Rules
- Profile TTFT and TPS as separate metrics with distinct optimization strategies
- Always disable PHP output buffering for streaming endpoints before emitting chunks
- Use connection pooling for provider HTTP clients to eliminate TLS handshake overhead
- Batch flush tokens at timed intervals rather than flushing every token
- Use event-loop server (Octane/RoadRunner/Swoole) for high-concurrency streaming workloads

## Related Skills
- Skill: Implement LLM Response Streaming with SSE (ku-01)
- Skill: Implement WebSocket Streaming for Bidirectional AI Communication (ku-02)
- Skill: Stream Tool Calls and Agent Loops (ku-03)
- Skill: Scale Streaming Connections to Production (ku-05)

## Success Criteria
- TTFT <500ms (p95) for production traffic at all prompt lengths
- TPS >40 for text generation models in production
- Connection pooling eliminates >90% of TLS handshake overhead for repeated requests
- PHP output buffering is confirmed disabled for all streaming endpoints
- nginx buffering is confirmed disabled at the location block level
- Flush overhead is <5% of total streaming CPU time
- Streaming endpoints handle target concurrent connections without worker pool exhaustion