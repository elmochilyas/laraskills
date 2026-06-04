# Skill: Implement LLM Response Streaming with SSE

## Purpose
Deliver LLM responses incrementally as tokens are generated using Server-Sent Events (SSE), achieving sub-500ms time-to-first-token (TTFT) with proper buffer flushing, client disconnection handling, and metadata events.

## When To Use
- User-facing chat interfaces where perceived latency matters
- Real-time applications (live translation, transcription, code completion)
- Long-running generation tasks where users need progress visibility
- Any application where response time >2s would harm user experience

## When NOT To Use
- Batch/background processing where the client doesn't need real-time updates
- API-to-API communication where the caller expects a complete response
- Applications needing bidirectional communication (use WebSockets instead)
- When the provider's streaming API is unreliable or has poor throughput

## Prerequisites
- KU-01 (Streaming Fundamentals) — understanding of tokens, TTFT, TPS, stream chunks
- Provider SDK or LLM abstraction layer with streaming support
- Laravel application with response streaming capability
- nginx (or similar) configured for streaming (proxy_buffering off)

## Inputs
- User messages array (chat history)
- LLM provider configuration (model, temperature, max tokens)
- Streaming preference (SSE format, event types)
- Connection timeout settings

## Workflow
1. **Configure the streaming endpoint**: Create a Laravel route returning `response()->stream(...)` with headers `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`.
2. **Disable PHP output buffering**: At the start of the stream callback, call `ob_implicit_flush(true)`, `ob_end_flush()`, and set `output_buffering = off`.
3. **Establish streaming connection**: Send an initial `event: start` event to confirm the connection is established, then flush immediately.
4. **Initialize the LLM stream**: Call the provider's streaming API (e.g., `$llm->stream($request)`) and iterate over the returned generator/iterator of `StreamChunk` objects.
5. **Emit content tokens**: For each chunk, echo an SSE-formatted `event: token` with JSON data containing `content`, `finish_reason`, and `tool_calls` if applicable.
6. **Flush at appropriate intervals**: Flush the output buffer every 3-5 tokens or every 50ms (whichever comes first) to balance TTFT and flush overhead.
7. **Handle client disconnection**: Check `connection_aborted()` in every loop iteration; break immediately if the client has disconnected, and clean up the provider-side stream.
8. **Emit completion event**: When the stream finishes (finish_reason = 'stop'), emit `event: done` with token usage data.
9. **Handle errors**: If the provider returns an error during streaming, emit `event: error` with the error message and finish gracefully.
10. **Provide non-streaming fallback**: If the client doesn't support SSE, fall back to returning the complete response as JSON.

## Validation Checklist
- [ ] Streaming uses SSE (not buffered complete response) — first token reaches client immediately
- [ ] TTFT is measured and <500ms (target <200ms for excellent UX)
- [ ] Client disconnection is detected and LLM stream is terminated (saves cost)
- [ ] PHP output buffer is flushed at appropriate intervals (every 3-5 tokens or 50ms)
- [ ] nginx buffering is disabled for SSE endpoints (X-Accel-Buffering: no)
- [ ] Streaming timeouts are configured for long-lived connections (120-300s)
- [ ] Metadata events are sent alongside content (start, token, error, done)

## Common Failures
- **Tokens arrive in bursts**: PHP output buffering is still enabled or nginx proxy buffering is on. Disable both.
- **TTFT is 3+ seconds**: Connection pooling is not configured (TLS handshake each time) or prompt is very long. Enable connection pooling and optimize prompt length.
- **Stream stalls mid-response**: PHP max_execution_time or nginx proxy_read_timeout is too short. Increase to 180-300 seconds.
- **Cost from orphaned streams**: Client disconnection not detected. Always check `connection_aborted()` and clean up.
- **Client can't parse stream**: SSE format is incorrect or missing event types. Follow the SSE spec (event:, data:, \n\n).

## Decision Points
- **SSE vs. WebSocket**: Use SSE for server-to-client only streaming (simpler, works through standard proxies). Use WebSocket when the client needs to send data during streaming (real-time chat, collaborative editing).
- **Flush frequency**: Balance TTFT (flush every token) vs. throughput overhead (batch flush every 50ms). Start with flush every 3-5 tokens, tune based on model speed.
- **Buffering vs. no buffering**: Zero buffering gives best TTFT but higher overhead. Small buffer (3-5 tokens) reduces overhead with minimal TTFT impact.

## Performance Considerations
- TTFT target: <500ms (good), <200ms (excellent). Dominated by provider prefill time, not network.
- TPS varies by model: GPT-4o ~50-80 t/s, Claude 3.5 ~40-60 t/s, smaller models 100+ t/s.
- PHP flush overhead: ~1-5ms per flush() call. Batch flushes reduce this.
- nginx buffering: adds up to 4KB of delay if not disabled.
- Connection pooling eliminates 100-300ms TLS handshake overhead.

## Security Considerations
- Authenticate streaming connections before starting the stream (not after)
- Sanitize streamed content for PII and harmful content (same as non-streamed)
- Rate limit connection establishment (streaming connections are resource-intensive)
- Detect and handle client disconnection to prevent orphaned streams (wasted cost)
- Error messages in stream may reveal internal details — sanitize before sending

## Related Rules
- Always flush output buffer immediately on first token
- Always detect and terminate stream on client disconnection
- Prefer SSE over WebSockets for unidirectional server-to-client streaming
- Always configure nginx buffering off for SSE streaming endpoints
- Set explicit streaming timeouts at every infrastructure layer
- Always send metadata events alongside content tokens in the stream
- Implement a unified streaming response DTO for both streaming and non-streaming

## Related Skills
- Skill: Implement WebSocket Streaming for Bidirectional AI Communication (ku-02)
- Skill: Stream Tool Calls and Agent Loops (ku-03)
- Skill: Optimize Streaming Performance (ku-04)
- Skill: Scale Streaming Connections to Production (ku-05)

## Success Criteria
- TTFT <500ms (p95) for production traffic
- Streaming tokens reach the client continuously (not in bursts)
- Client disconnection terminates the provider stream within 1 second
- Errors during streaming are communicated to the client (not silent failures)
- Non-streaming fallback works when SSE is not supported
- No orphaned streaming sessions consuming provider API costs