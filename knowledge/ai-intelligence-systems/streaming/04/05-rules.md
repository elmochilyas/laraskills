---
id: ku-04
title: "Performance Optimization for Streaming - Rules"
subdomain: "streaming-real-time-ai"
ku-type: "optimization"
date-created: "2026-06-02"
---

## Rules for Performance Optimization for Streaming

### R1: Profile TTFT and TPS as separate metrics with distinct optimization strategies
- **Category:** Observability
- **Rule:** Measure Time-to-First-Token (TTFT) and Tokens-Per-Second (TPS) as independent metrics; optimize TTFT by reducing prompt length and prefill time, optimize TPS by choosing faster models and reducing per-chunk overhead.
- **Reason:** TTFT and TPS have different levers and trade-offs. Optimizing one without measuring both can degrade the other. A low TTFT but low TPS stream provides a poor experience (fast start but slow finish).
- **Bad Example:** Tracking only "total response time" and assuming streaming is fast enough without measuring TTFT separately.
- **Good Example:** Prometheus counters `ai_ttft_ms{provider,model}` and `ai_tps{provider,model}` tracked per-request, with SLOs like `ttft_p95 < 500ms` and `tps_mean > 40`.
- **Exceptions:** Batch processing where total completion time is the only relevant metric.
- **Consequences of Violation:** Optimization efforts target the wrong bottleneck; users experience poor TTFT despite good average TPS, or vice versa.

### R2: Always disable PHP output buffering for streaming endpoints before emitting chunks
- **Category:** Performance
- **Rule:** Call `ob_implicit_flush(true)` and `ob_end_clean()` at the start of every streaming controller; never rely on default PHP buffering behavior.
- **Reason:** PHP buffers output by default (4096 bytes or `output_buffering` setting). Without explicit flushing, tokens accumulate in the buffer and arrive in large batches, degrading TTFT.
- **Bad Example:** A streaming endpoint that calls `echo json_encode($chunk)` without disabling output buffering, wondering why all chunks arrive at once.
- **Good Example:** Helper function called once per streaming request: `@ini_set('output_buffering', 'off'); @ini_set('zlib.output_compression', false); ob_implicit_flush(true); ob_end_flush();`.
- **Exceptions:** Non-streaming responses where buffering improves performance.
- **Consequences of Violation:** TTFT in the 2-10 second range (instead of 200-500ms), users seeing no improvement over non-streaming responses, and wasted infrastructure investment in streaming.

### R3: Use connection pooling for provider HTTP clients to eliminate TLS handshake overhead
- **Category:** Performance
- **Rule:** Configure HTTP client connection pooling (using Guzzle connection pool or cURL multi-handle) to reuse TCP/TLS connections to the LLM provider across streaming requests.
- **Reason:** TLS handshakes add 100-300ms to every new connection. For streaming requests that already have low TTFT targets, this overhead is a significant proportion of the total latency budget.
- **Bad Example:** Creating a new Guzzle client instance for every streaming request without configuring `curl.options[CURLOPT_FRESH_CONNECT] => false`.
- **Good Example:** Binding a singleton HTTP client in the service provider with `'curl' => [CURLOPT_TCP_KEEPALIVE => 1, CURLOPT_TCP_KEEPIDLE => 30]`.
- **Exceptions:** Requests to multiple different providers that require different TLS configurations (separate pools per provider).
- **Consequences of Violation:** Every streaming request incurs 100-300ms TLS overhead, increasing TTFT by 50-100% for short prompts.

### R4: Batch flush tokens at timed intervals rather than flushing every token
- **Category:** Performance
- **Rule:** Accumulate 3-5 tokens or flush every 50ms, whichever comes first; avoid flushing after every single token for fast models.
- **Reason:** Each `flush()` call has overhead (~1-5ms PHP + nginx processing). For models generating 100+ t/s, flushing every token spends more time flushing than generating.
- **Bad Example:** A foreach loop that calls `echo $token; flush();` for every token of a GPT-4o-mini stream at 120 t/s.
- **Good Example:** A buffered emitter that collects tokens and flushes when count >= 5 or 50ms have elapsed since last flush.
- **Exceptions:** Very slow models (<10 t/s) or models with highly variable inter-token latency where real-time display matters more than throughput.
- **Consequences of Violation:** Streaming throughput is artificially limited by flush overhead; CPU utilization increases due to excessive PHP buffer management calls.

### R5: Use event-loop server (Octane/RoadRunner/Swoole) for high-concurrency streaming workloads
- **Category:** Architecture
- **Rule:** Deploy streaming endpoints on Laravel Octane with RoadRunner or Swoole when expecting more than 50 concurrent streaming connections; never rely on PHP-FPM for high-concurrency streaming.
- **Reason:** PHP-FPM uses one process per connection. At 100 concurrent streams, 100 workers are consumed, starving other requests. Event-loop servers handle 1000+ connections per process.
- **Bad Example:** Configuring `pm.max_children = 200` in PHP-FPM for a streaming application expecting 150 concurrent users.
- **Good Example:** Running Octane with 4 RoadRunner workers, each handling up to 500 concurrent streaming connections (2000 total capacity).
- **Exceptions:** Low-traffic internal tools (<50 concurrent streams) where PHP-FPM is sufficient.
- **Consequences of Violation:** Under load, all PHP-FPM workers get consumed by streaming connections, causing non-streaming API requests to queue or fail with 503 errors.
