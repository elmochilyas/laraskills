# Knowledge Unit: Performance Optimization for Streaming

## Metadata

- **ID:** ku-04
- **Subdomain:** Streaming & Real-Time AI
- **Slug:** performance-optimization-for-streaming
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Performance optimization for streaming AI focuses on minimizing Time-to-First-Token (TTFT), maximizing Tokens-Per-Second (TPS), and efficiently handling concurrent streaming connections. Unlike traditional API optimization (where total response time is the metric), streaming optimization balances TTFT (perceived responsiveness) with TPS (throughput) while managing server resources for long-lived connections. In the Laravel ecosystem, optimization spans the provider connection, the PHP runtime, the web server, and the client.

## Core Concepts

- **TTFT (Time-to-First-Token):** The time from request submission to receiving the first content token. The most important user-facing metric.
- **TPS (Tokens-Per-Second):** The rate of token delivery after TTFT. Higher TPS = faster complete response.
- **Prefill Optimization:** The provider processes the entire prompt before generating the first token. Prompt length directly impacts TTFT.
- **Output Buffer Flushing:** PHP buffers output; streaming requires explicit flushing. Frequency of flushing impacts perceived TTFT.
- **Connection Pooling:** Reusing HTTP connections to the LLM provider reduces TLS handshake overhead (100-300ms saved).
- **Stream Chunk Size:** Balancing chunk size (one token vs. multiple tokens) against flush overhead.
- **Backpressure Management:** Handling the case where the client consumes tokens slower than the provider generates them.
- **Concurrent Stream Limits:** Maximum number of simultaneous streaming connections the server can handle.

## Mental Models

- **TTFT (Time-to-First-Token):** The time from request submission to receiving the first content token. The most important user-facing metric.
- **TPS (Tokens-Per-Second):** The rate of token delivery after TTFT. Higher TPS = faster complete response.
- **Prefill Optimization:** The provider processes the entire prompt before generating the first token. Prompt length directly impacts TTFT.


## Internal Mechanics

The internal mechanics of Performance Optimization for Streaming follow established patterns within the Streaming & Real-Time AI domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Profile TTFT separately from TPS.** They have different optimization levers (prompt length vs. model size).
- **Use connection pooling** to the LLM provider. Reuse HTTP connections across requests (cURL multi-handle or Guzzle pool).
- **Flush the output buffer early.** Send the first chunk as soon as possible (even if it's empty) to establish the connection.
- **Minimize PHP processing between chunks.** The time between receiving a chunk from the provider and sending it to the client should be <1ms.
- **Use a dedicated streaming server** (Swoole, RoadRunner) for high concurrency â€” PHP-FPM's process-per-request model doesn't scale for long-lived streams.
- **Monitor TTFF and TPS in production.** Track these metrics per provider and model to detect regressions.

## Patterns

- **Profile TTFT separately from TPS.** They have different optimization levers (prompt length vs. model size).
- **Use connection pooling** to the LLM provider. Reuse HTTP connections across requests (cURL multi-handle or Guzzle pool).
- **Flush the output buffer early.** Send the first chunk as soon as possible (even if it's empty) to establish the connection.
- **Minimize PHP processing between chunks.** The time between receiving a chunk from the provider and sending it to the client should be <1ms.
- **Use a dedicated streaming server** (Swoole, RoadRunner) for high concurrency â€” PHP-FPM's process-per-request model doesn't scale for long-lived streams.
- **Monitor TTFF and TPS in production.** Track these metrics per provider and model to detect regressions.

## Architectural Decisions

- Implement streaming with **reusable HTTP clients** â€” create the HTTP client once and reuse it across requests.
- For PHP-FPM, use **output buffering control** (`ob_implicit_flush()`, `ob_end_flush()`) to disable buffering for streaming endpoints.
- For high concurrency, use **RoadRunner** or **Swoole** â€” they keep PHP in memory between requests, avoiding process creation overhead.
- Use a **reverse proxy** (nginx) that supports streaming â€” configure `proxy_buffering off` for SSE endpoints.
- Implement **stream compression** at the nginx level (gzip) â€” compresses streamed content on the fly (saves bandwidth, adds CPU).

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- TTFT targets: <500ms for good UX, <200ms for excellent UX.
- TPS targets: >50 t/s for text generation, >200 t/s for streaming to feel instant.
- PHP-FPM overhead per streaming connection: one PHP process per connection. At 100 concurrent streams, that's 100 PHP-FPM workers.
- nginx buffering: with `proxy_buffering off`, nginx doesn't buffer â€” lower latency but higher memory for concurrent connections.
- Network latency to provider: each chunk travels provider â†’ server â†’ client. Minimize server processing time.
- TLS overhead: 100-300ms for initial handshake. Connection pooling eliminates this for subsequent requests.

## Production Considerations



## Common Mistakes

- Not disabling PHP output buffering â€” tokens accumulate in the buffer and arrive in large batches.
- Flushing after every single token â€” unnecessary overhead for fast models (GPT-4o-mini at 100+ t/s).
- Using PHP-FPM for high-concurrency streaming â€” each stream holds a PHP process, limiting concurrency to max_children.
- Not monitoring TTFT â€” the team thinks streaming works well but TTFT is 3 seconds.
- Ignoring network latency to the provider â€” deploying the server far from the nearest provider region increases TTFT.
- Over-optimizing TPS while TTFT is poor â€” TTFT is the more important user-facing metric.

## Failure Modes

- **Flush Spam:** Flushing the output buffer after every token for a slow model (3 t/s). Batched flushing reduces overhead.
- **Zero Buffering:** Transparently streaming each provider chunk directly to the client without any processing. The provider's chunk format may not match the client's expected format.
- **Synchronous Tool execution During Streaming:** Blocking the stream for 5 seconds while a tool executes. Execute tools asynchronously and inject results.
- **Process-Per-Stream:** Using one PHP process per streaming connection. Use non-blocking I/O (Swoole, RoadRunner) or async PHP for high concurrency.
- **Ignoring Client Capacity:** Streaming 200 t/s to a mobile client on a slow network. Implement client-side rate limiting or server-side throttling.

## Ecosystem Usage

Laravel AI SDK and community packages provide implementations.

## Related Knowledge Units

- ku-01 (Streaming Fundamentals): Foundation for optimization.
- ku-02 (WebSockets & Real-Time Communication): WebSocket optimization.
- ku-05 (Scaling Streaming Connections): Concurrency optimization.
- llm-provider-abstraction/ku-04: Provider connection optimization.
- ai-middleware-gateway/ku-05: Monitoring streaming performance.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

