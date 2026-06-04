---
id: ku-01
title: "Streaming Fundamentals"
subdomain: "streaming-real-time-ai"
ku-type: "foundation"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/streaming-real-time-ai/ku-01/04-standardized-knowledge.md"
---

# Streaming Fundamentals

## Overview

Streaming in AI systems refers to delivering LLM responses incrementally as tokens are generated, rather than waiting for the complete response. This dramatically improves perceived latency — users see the first token in 200-500ms instead of waiting 2-10 seconds for the full response. Streaming is essential for conversational interfaces, real-time applications, and any user-facing AI feature where responsiveness matters. In the Laravel AI ecosystem, streaming is implemented using Server-Sent Events (SSE), WebSockets (Laravel Reverb), or response streaming with the `laravel/ai` SDK.

## Core Concepts

- **Token Streaming:** The LLM emits tokens one at a time (or in small chunks) as they are generated. Each chunk contains incremental content.
- **Server-Sent Events (SSE):** A standard HTTP protocol where the server pushes events to the client over a single long-lived connection. Simpler than WebSockets for one-direction streaming.
- **WebSockets:** Bidirectional communication protocol. Used when the client needs to send data while receiving streamed responses (e.g., real-time chat).
- **Time-to-First-Token (TTFT):** The time from request submission to the first token received. Key metric for perceived responsiveness.
- **Tokens Per Second (TPS):** The rate at which tokens are delivered after TTFT. Higher TPS means faster completion.
- **Stream Chunk:** A single piece of streaming data — may contain a token fragment, metadata (finish reason, token count), or tool call delta.
- **Stream Buffering:** Accumulating tokens in a buffer before flushing to the client. Can improve throughput but increases perceived latency.
- **Backpressure:** When the client cannot consume tokens as fast as the provider produces them. Requires buffering or flow control.

## When To Use

- User-facing chat interfaces — streaming reduces perceived latency from 5s to 200ms (TTFT).
- Real-time applications (live translation, transcription, code completion).
- Long-running generation tasks (summarization, analysis) — users see progress.
- Any application where response time >2s would harm user experience.

## When NOT To Use

- Batch/background processing where the client doesn't need real-time updates.
- API-to-API communication where the caller expects a complete response.
- Applications built on Server-Sent Events without fallback for clients that don't support SSE (curl, some HTTP clients).
- When the provider's streaming API is unreliable or has poor throughput.

## Best Practices

- **Measure and optimize TTFT.** This is the most important streaming metric. Optimize prompt processing (prefill) at the provider and network level.
- **Use SSE for server-to-client streaming.** It's simpler than WebSockets, works over standard HTTP, and has broad client support.
- **Provide a fallback for non-streaming clients.** If the client can't stream, fall back to complete response delivery.
- **Handle client disconnection gracefully.** Detect when the client closes the connection and stop the LLM stream to save cost.
- **Send metadata events.** Emit events for token count, finish reason, and errors (not just content tokens).
- **Set appropriate timeouts.** Streaming connections are long-lived. Configure timeouts at the web server (nginx, Laravel) for 5-10 minute connections.

## Architecture Guidelines

- Implement streaming as a **response type** in the provider abstraction layer, returning an `Iterator` or `Generator` of `StreamChunk` objects.
- Use Laravel's **response streaming** (`response()->stream()`) or **SSE** for HTTP streaming. Use **Laravel Reverb** for bidirectional WebSocket streaming.
- Separate the **stream processor** (consuming LLM chunks) from the **stream emitter** (sending to client) — allows buffering, transformation, and backpressure handling.
- For high-concurrency streaming, use a **dedicated WebSocket server** (Reverb, Swoole, RoadRunner) instead of PHP-FPM.
- Implement **stream health checks** — detect stalled streams (no tokens received for N seconds) and abort gracefully.

## Performance Considerations

- TTFT is dominated by model processing (prefill), not network. Typically 200-1500ms depending on model and prompt length.
- TPS varies by model: GPT-4o ~50-80 t/s, Claude 3.5 Sonnet ~40-60 t/s, smaller models can achieve 100+ t/s.
- PHP streaming overhead: 5-15ms per flush (ob_flush, flush). Minimize flush frequency — flush every N tokens or every 50ms.
- Connection overhead: each streaming connection consumes a PHP-FPM worker. For high concurrency, use Swoole or RoadRunner (event loop, not process-per-request).
- Network buffering: ensure nginx/Apache doesn't buffer SSE responses (`X-Accel-Buffering: no`, `Cache-Control: no-cache`).

## Security Considerations

- **Connection authentication:** Streaming connections must be authenticated before tokens are sent. Don't start streaming for unauthenticated requests.
- **Rate limiting:** Streaming connections are long-lived and resource-intensive. Rate limit connection establishment, not throughput.
- **Data leakage in stream errors:** Error messages during streaming may reveal internal details. Sanitize before sending.
- **Client disconnection:** Always detect and handle client disconnects (`connection_aborted()`) to stop LLM streaming and save costs.
- **Stream injection:** Ensure streamed content goes through the same output sanitization as non-streamed responses (PII redaction, content moderation).

## Common Mistakes

- Buffering the entire response before sending — defeats the purpose of streaming.
- Not handling client disconnection — the LLM stream continues generating tokens that are never consumed.
- Using WebSockets when SSE would suffice — WebSockets are more complex to implement and scale.
- Not flushing the output buffer — PHP buffers output by default; streaming requires explicit flushing.
- Setting too-short timeouts — streaming connections can last 30+ seconds for long responses.

## Anti-Patterns

- **Stream-to-Buffer:** Collecting all chunks into a buffer and sending the complete response. Use streaming middleware that emits chunks immediately.
- **One-Stream-Fits-All:** Using the same streaming configuration for short responses (tokens come too fast) and long responses (timeout issues).
- **No Error Streaming:** Silently failing during streaming without sending an error event to the client.
- **Synchronous-Only Fallback:** Having separate code paths for streaming and non-streaming. Use a unified response DTO that can be streamed or returned as a complete response.
- **Memory-Unbounded Buffering:** Accumulating tokens in memory without limits. Set a maximum buffer size and flush or discard.

## Examples

### SSE Stream Response
```php
class StreamController {
    public function chat(Request $request): Response {
        return response()->stream(function () use ($request) {
            $stream = $this->llm->stream(new ChatRequest(
                messages: $request->input('messages'),
            ));

            foreach ($stream as $chunk) {
                if (connection_aborted()) break;

                echo "event: token\n";
                echo "data: " . json_encode([
                    'content' => $chunk->content,
                    'finish_reason' => $chunk->finishReason,
                ]) . "\n\n";

                ob_flush();
                flush();
            }

            echo "event: done\n";
            echo "data: {}\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
```

### Stream Chunk DTO
```php
class StreamChunk {
    public function __construct(
        public readonly ?string $content,       // token or empty for metadata events
        public readonly ?string $finishReason,  // null during streaming, set on last chunk
        public readonly ?array $toolCalls,      // tool call deltas
        public readonly ?Usage $usage,          // final token usage (last chunk only)
        public readonly ?string $error,         // error message (if any)
    ) {}
}
```

## Related Topics

- ku-02 (WebSockets & Real-Time Communication): Bidirectional streaming.
- ku-03 (Streaming with Tool Calls): Streaming tool call responses.
- ku-04 (Performance Optimization): TTFT and TPS optimization.
- ku-05 (Scaling Streaming Connections): High-concurrency streaming.
- llm-provider-abstraction/ku-06: Provider-specific streaming formats.

## AI Agent Notes

- When asked to implement streaming, first determine: client requirements (SSE vs. WebSocket), expected response length, and concurrency needs.
- For streaming issues, check: TTFT, PHP buffer flushing, nginx buffering, and client disconnection handling.
- Prefer reading the stream provider adapter before the stream controller — the provider determines the chunk format.
- When generating streaming code, include: SSE format, connection detection, error streaming, and cleanup on disconnect.

## Verification

- [ ] Streaming uses SSE or WebSockets (not buffered complete response).
- [ ] Time-to-first-token (TTFT) is measured and optimized.
- [ ] Client disconnection is detected and LLM stream is terminated.
- [ ] Output buffer is flushed at appropriate intervals (per token or batch).
- [ ] Nginx/Apache buffering is disabled for SSE endpoints.
- [ ] Streaming timeouts are configured for long-lived connections (30-300s).
- [ ] Error events are streamed to the client (not silent failures).
