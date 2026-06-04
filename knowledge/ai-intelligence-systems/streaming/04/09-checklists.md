# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Flush the output buffer early.
- [ ] Minimize PHP processing between chunks.
- [ ] Monitor TTFF and TPS in production.
- [ ] Profile TTFT separately from TPS.
- [ ] Use a dedicated streaming server
- [ ] Batched flushing is configured (flush every N tokens or interval).
- [ ] Connection pooling is configured (reusable HTTP client to provider).
- [ ] High-concurrency deployments use event-loop server (RoadRunner, Swoole) or dedicated streaming infrastructure.
- [ ] Rules for Performance Optimization for Streaming
- [ ] Batched flushing is configured (flush every 3-5 tokens or every 50ms)
- [ ] Connection pooling is configured (reusable HTTP client to provider)
- [ ] High-concurrency deployments use event-loop server (RoadRunner, Swoole) or dedicated streaming infrastructure
- [ ] **Choose optimal provider region**: Deploy the application server close to the nearest LLM provider region to minimize network latency for each chunk.
- [ ] **Configure connection pooling**: Create a singleton HTTP client (Guzzle) with connection pooling enabled. Set `CURLOPT_TCP_KEEPALIVE` and `CURLOPT_TCP_KEEPIDLE` for persistent connections. This eliminates 100-300ms TLS handshake overhead per request.
- [ ] **Consider event-loop server for high concurrency**: If expecting >50 concurrent streams, deploy Laravel Octane with RoadRunner or Swoole. Each worker handles thousands of concurrent connections vs. PHP-FPM's one-per-process model.
- [ ] Connection pooling eliminates >90% of TLS handshake overhead for repeated requests
- [ ] Flush overhead is <5% of total streaming CPU time
- [ ] nginx buffering is confirmed disabled at the location block level

---

# Architecture Checklist

- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement immediate secret management improvements
- [ ] Implement input validation and output sanitization layers
- [ ] Implement reconnection logic with last-event-id tracking

---

# Implementation Checklist

- [ ] Flush the output buffer early.
- [ ] Minimize PHP processing between chunks.
- [ ] Monitor TTFF and TPS in production.
- [ ] Profile TTFT separately from TPS.
- [ ] Use a dedicated streaming server
- [ ] Use connection pooling
- [ ] **Choose optimal provider region**: Deploy the application server close to the nearest LLM provider region to minimize network latency for each chunk.
- [ ] **Configure connection pooling**: Create a singleton HTTP client (Guzzle) with connection pooling enabled. Set `CURLOPT_TCP_KEEPALIVE` and `CURLOPT_TCP_KEEPIDLE` for persistent connections. This eliminates 100-300ms TLS handshake overhead per request.
- [ ] **Consider event-loop server for high concurrency**: If expecting >50 concurrent streams, deploy Laravel Octane with RoadRunner or Swoole. Each worker handles thousands of concurrent connections vs. PHP-FPM's one-per-process model.
- [ ] **Disable nginx proxy buffering**: Add `proxy_buffering off; proxy_cache off;` to the nginx location block for streaming endpoints. Add `X-Accel-Buffering: no` header in the Laravel response.
- [ ] **Disable PHP output buffering**: Set `output_buffering = off` in php.ini or call `ob_implicit_flush(true)` and `ob_end_flush()` at the start of each streaming controller.
- [ ] **Implement batched flushing**: Instead of flushing after every token, accumulate 3-5 tokens or flush every 50ms (whichever comes first). This reduces flush overhead for fast models (100+ t/s).

---

# Performance Checklist

- [ ] Network latency to provider: each chunk travels provider â†’ server â†’ client. Minimize server processing time.
- [ ] nginx buffering: with `proxy_buffering off`, nginx doesn't buffer â€” lower latency but higher memory for concurrent connections.
- [ ] PHP-FPM overhead per streaming connection: one PHP process per connection. At 100 concurrent streams, that's 100 PHP-FPM workers.
- [ ] TLS overhead: 100-300ms for initial handshake. Connection pooling eliminates this for subsequent requests.
- [ ] TPS targets: >50 t/s for text generation, >200 t/s for streaming to feel instant.
- [ ] TTFT targets: <500ms for good UX, <200ms for excellent UX.
- [ ] Batched flushing may batch sensitive content â€” ensure per-token sanitization, not per-batch
- [ ] Connection pooling must respect provider authentication â€” refresh tokens as needed, don't reuse expired auth

---

# Security Checklist

- [ ] Batched flushing may batch sensitive content â€” ensure per-token sanitization, not per-batch
- [ ] Connection pooling must respect provider authentication â€” refresh tokens as needed, don't reuse expired auth
- [ ] Connection pooling saves 100-300ms per request (TLS handshake)
- [ ] Output buffering disabled means error output may also flush immediately â€” sanitize before streaming

---

# Reliability Checklist

- [ ] Flushing after every single token â€” unnecessary overhead for fast models (GPT-4o-mini at 100+ t/s).
- [ ] Ignoring network latency to the provider â€” deploying the server far from the nearest provider region increases TTFT.
- [ ] Not disabling PHP output buffering â€” tokens accumulate in the buffer and arrive in large batches.
- [ ] Not monitoring TTFT â€” the team thinks streaming works well but TTFT is 3 seconds.
- [ ] Over-optimizing TPS while TTFT is poor â€” TTFT is the more important user-facing metric.
- [ ] Using PHP-FPM for high-concurrency streaming â€” each stream holds a PHP process, limiting concurrency to max_children.

---

# Testing Checklist

- [ ] Batched flushing is configured (flush every 3-5 tokens or every 50ms)
- [ ] Batched flushing is configured (flush every N tokens or interval).
- [ ] Connection pooling eliminates >90% of TLS handshake overhead for repeated requests
- [ ] Connection pooling is configured (reusable HTTP client to provider)
- [ ] Connection pooling is configured (reusable HTTP client to provider).
- [ ] Flush overhead is <5% of total streaming CPU time
- [ ] High-concurrency deployments use event-loop server (RoadRunner, Swoole) or dedicated streaming infrastructure
- [ ] High-concurrency deployments use event-loop server (RoadRunner, Swoole) or dedicated streaming infrastructure.
- [ ] nginx buffering is confirmed disabled at the location block level
- [ ] nginx proxy buffering is disabled for SSE endpoints

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [PHP-FPM for High-Concurrency Streaming â€” Worker Pool Exhaustion]
- [ ] [No Keep-Alive on Streaming Connections]
- [ ] [Streaming Without Compression â€” Higher Bandwidth Usage]
- [ ] [Head-of-Line Blocking â€” One Slow Stream Delays Others]
- [ ] [No Connection Pool for Provider HTTP Clients]
- [ ] Flush Spam:
- [ ] Ignoring Client Capacity:
- [ ] Process-Per-Stream:
- [ ] Synchronous Tool execution During Streaming:
- [ ] Zero Buffering:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


