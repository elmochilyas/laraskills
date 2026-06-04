---
id: ku-04
title: "Performance Optimization for Streaming"
subdomain: "streaming-real-time-ai"
ku-type: "optimization"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/streaming-real-time-ai/ku-04/04-standardized-knowledge.md"
---

# Performance Optimization for Streaming

## Overview

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

## When To Use

- User-facing streaming applications where responsiveness is critical.
- High-traffic streaming services that need to handle many concurrent connections.
- Applications with long prompts that benefit from TTFT optimization.
- Services where provider latency variability causes inconsistent streaming performance.

## When NOT To Use

- Low-traffic internal tools (optimization effort exceeds benefit).
- Applications where total completion time matters more than TTFT (batch processing).

## Best Practices

- **Profile TTFT separately from TPS.** They have different optimization levers (prompt length vs. model size).
- **Use connection pooling** to the LLM provider. Reuse HTTP connections across requests (cURL multi-handle or Guzzle pool).
- **Flush the output buffer early.** Send the first chunk as soon as possible (even if it's empty) to establish the connection.
- **Minimize PHP processing between chunks.** The time between receiving a chunk from the provider and sending it to the client should be <1ms.
- **Use a dedicated streaming server** (Swoole, RoadRunner) for high concurrency — PHP-FPM's process-per-request model doesn't scale for long-lived streams.
- **Monitor TTFF and TPS in production.** Track these metrics per provider and model to detect regressions.

## Architecture Guidelines

- Implement streaming with **reusable HTTP clients** — create the HTTP client once and reuse it across requests.
- For PHP-FPM, use **output buffering control** (`ob_implicit_flush()`, `ob_end_flush()`) to disable buffering for streaming endpoints.
- For high concurrency, use **RoadRunner** or **Swoole** — they keep PHP in memory between requests, avoiding process creation overhead.
- Use a **reverse proxy** (nginx) that supports streaming — configure `proxy_buffering off` for SSE endpoints.
- Implement **stream compression** at the nginx level (gzip) — compresses streamed content on the fly (saves bandwidth, adds CPU).

## Performance Considerations

- TTFT targets: <500ms for good UX, <200ms for excellent UX.
- TPS targets: >50 t/s for text generation, >200 t/s for streaming to feel instant.
- PHP-FPM overhead per streaming connection: one PHP process per connection. At 100 concurrent streams, that's 100 PHP-FPM workers.
- nginx buffering: with `proxy_buffering off`, nginx doesn't buffer — lower latency but higher memory for concurrent connections.
- Network latency to provider: each chunk travels provider → server → client. Minimize server processing time.
- TLS overhead: 100-300ms for initial handshake. Connection pooling eliminates this for subsequent requests.

## Optimization Techniques

```php
// 1. Connection pool (Guzzle)
$client = new Client([
    'handler' => HandlerStack::create(GuzzlePool::maxConnections(50)),
]);

// 2. Early flush for TTFT
public function stream(): void {
    ob_implicit_flush(true);
    ob_end_flush(); // Disable output buffering

    echo "event: start\n\n"; // Establish connection
    flush();

    foreach ($this->provider->stream($request) as $chunk) {
        echo "data: " . json_encode(['content' => $chunk->content]) . "\n\n";
        flush();
    }
}

// 3. Batch flush for TPS (flush every N tokens or every 50ms)
private function emit(array $tokens): void {
    static $buffer = [];
    static $lastFlush = 0;

    $buffer = array_merge($buffer, $tokens);
    $now = microtime(true);

    if (count($buffer) >= 5 || ($now - $lastFlush) > 0.05) {
        echo "data: " . json_encode(['tokens' => $buffer]) . "\n\n";
        flush();
        $buffer = [];
        $lastFlush = $now;
    }
}
```

## Common Mistakes

- Not disabling PHP output buffering — tokens accumulate in the buffer and arrive in large batches.
- Flushing after every single token — unnecessary overhead for fast models (GPT-4o-mini at 100+ t/s).
- Using PHP-FPM for high-concurrency streaming — each stream holds a PHP process, limiting concurrency to max_children.
- Not monitoring TTFT — the team thinks streaming works well but TTFT is 3 seconds.
- Ignoring network latency to the provider — deploying the server far from the nearest provider region increases TTFT.
- Over-optimizing TPS while TTFT is poor — TTFT is the more important user-facing metric.

## Anti-Patterns

- **Flush Spam:** Flushing the output buffer after every token for a slow model (3 t/s). Batched flushing reduces overhead.
- **Zero Buffering:** Transparently streaming each provider chunk directly to the client without any processing. The provider's chunk format may not match the client's expected format.
- **Synchronous Tool execution During Streaming:** Blocking the stream for 5 seconds while a tool executes. Execute tools asynchronously and inject results.
- **Process-Per-Stream:** Using one PHP process per streaming connection. Use non-blocking I/O (Swoole, RoadRunner) or async PHP for high concurrency.
- **Ignoring Client Capacity:** Streaming 200 t/s to a mobile client on a slow network. Implement client-side rate limiting or server-side throttling.

## Related Topics

- ku-01 (Streaming Fundamentals): Foundation for optimization.
- ku-02 (WebSockets & Real-Time Communication): WebSocket optimization.
- ku-05 (Scaling Streaming Connections): Concurrency optimization.
- llm-provider-abstraction/ku-04: Provider connection optimization.
- ai-middleware-gateway/ku-05: Monitoring streaming performance.

## AI Agent Notes

- When asked to optimize streaming performance, first check: TTFT and TPS metrics, PHP buffer configuration, and web server buffering.
- For streaming performance issues, check: PHP output buffering, nginx proxy buffering, connection pooling, and provider region proximity.
- Prefer reading the streaming middleware configuration before the provider adapter — the middleware layer handles buffering and flushing.
- When generating streaming optimization code, include: connection pooling, early flush, batched flush, and TTFT/TPS monitoring.

## Verification

- [ ] PHP output buffering is disabled for streaming endpoints (ob_implicit_flush, ob_end_flush).
- [ ] Connection pooling is configured (reusable HTTP client to provider).
- [ ] nginx proxy buffering is disabled for SSE endpoints (proxy_buffering off).
- [ ] TTFT and TPS are monitored in production per provider and model.
- [ ] Batched flushing is configured (flush every N tokens or interval).
- [ ] High-concurrency deployments use event-loop server (RoadRunner, Swoole) or dedicated streaming infrastructure.
- [ ] Provider region is geographically close to the deployment server.
