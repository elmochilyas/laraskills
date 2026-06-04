# Knowledge Unit: SSE Streaming

## Metadata

- **ID:** KU-045
- **Subdomain:** Streaming & Real-Time AI Responses
- **Slug:** sse-streaming
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Server-Sent Events (SSE) enable real-time token-by-token streaming of AI responses. Laravel AI SDK's `->stream()` method returns a `StreamedAgentResponse` that handles SSE format, including the Vercel AI Data Protocol for Livewire and Inertia compatibility. SSE avoids blank-screen waits during multi-second LLM generation, but requires specific infrastructure configuration (Nginx, PHP-FPM, worker pool).

## Core Concepts

- `->stream()`: Agent method returning synchronous stream of tokens via SSE
- `StreamedAgentResponse`: Object with `text`, `events`, and `usage` properties
- SSE format: `Content-Type: text/event-stream`, `data: {"type":"text","text":"..."}\n\n`
- Vercel AI Data Protocol: Standardized SSE format for AI streaming — compatible with Livewire `wire:stream`
- Connection persistence: HTTP connection held open during generation
- PHP-FPM worker: Occupied for entire streaming duration

## Mental Models

- **HTTP + real-time**: Like downloading a large file — connection stays open while data arrives. Each token is a "chunk" of the response.
- **Progressive rendering**: Like old-school terminal output — characters appear as they're generated, not all at once.

## Internal Mechanics

When `->stream()` is called:
1. SDK sends request to LLM provider with `stream: true`
2. Provider returns response as chunked HTTP stream (SSE format or server-sent JSON lines)
3. SDK parses each chunk, extracts token text
4. Token written to PHP output buffer via `ob_flush()`, `flush()`
5. Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
6. Stream continues until LLM finishes or `MaxSteps` is reached
7. Final chunk includes usage metadata

The Vercel AI Data Protocol adds structured SSE events: `text` (token), `error` (error), `annotations` (tool calls, citations), `finish` (done with usage).

## Patterns

- **Async/stream in controller**: Return stream directly from route — `return (new Agent)->stream($input)`
- **Progressive UI updates**: Frontend receives tokens, appends to growing response text
- **Stream abort**: Client disconnects → PHP detects `connection_aborted()` → stops streaming
- **Tool call during stream**: Tool results sent as SSE annotations — frontend can show tool execution inline

## Architectural Decisions

- **Decision**: Built-in SSE vs. manual stream → SDK handles SSE format automatically. Reason: Provider differences in streaming format are abstracted; developer gets unified `StreamedAgentResponse`.
- **Decision**: Synchronous (PHP-FPM) vs. async (queue + WebSocket) → Synchronous SSE for simplest case. Async for long streams (>30s) or when PHP-FPM worker count is constrained.

## Tradeoffs

| Factor | SSE (PHP-FPM) | WebSocket (Reverb) | Livewire wire:stream |
|--------|---------------|-------------------|---------------------|
| Latency | Low (token arrives immediately) | Low | Low |
| Worker usage | Occupies FPM worker | Worker-free (event-driven) | Occupies FPM worker |
| Infrastructure | Nginx config required | Reverb server required | Same as SSE |
| Complexity | Low | Medium | Low |
| Client support | Native EventSource API | WebSocket client | Livewire component |

## Performance Considerations

- PHP-FPM worker held for entire streaming duration — limits concurrent users to worker count
- 10-second stream: 1 FPM worker blocked for 10 seconds
- With 10 workers: only 10 concurrent streaming users
- Long-running streams (>30s) should use queue + WebSocket fallback
- Output buffering must be disabled — `ob_end_flush()` in stream initialization
- Memory: token-by-token accumulation, not full response in memory

## Production Considerations

- **Nginx**: `proxy_buffering off;` and `X-Accel-Buffering: no` to prevent buffering SSE
- **PHP-FPM**: Dedicated worker pool for streaming endpoints (`pm.max_children` sizing)
- **Response timeout**: Set `max_execution_time` higher for streaming endpoints (60-120s)
- **Client disconnect**: Always check `connection_aborted()` — clean up resources
- **Error handling in stream**: Send error as SSE event, don't break connection mid-stream
- **Logging**: Stream requests are long-lived — ensure access logs capture final response time
- **Octane**: Livewire `wire:stream` is incompatible with Octane (state persists across requests)

## Common Mistakes

- No Nginx SSE configuration — proxy buffers stream, user sees nothing until complete
- Using SSE for very long responses (>60s) without queue fallback — worker timeout kills stream
- Not checking `connection_aborted()` — stream continues after client disconnects (wasted tokens)
- Output buffering enabled — tokens arrive in bursts instead of real-time
- No CORS headers on SSE endpoint — browser blocks EventSource from different origin
- Forgetting `Content-Type: text/event-stream` header — browser doesn't recognize stream

## Failure Modes

- **Buffering proxy**: Nginx/Apache buffers response — user sees nothing until generation completes. Fix: `proxy_buffering off;`
- **Worker exhaustion**: All FPM workers streaming → new requests queued. Fix: dedicated stream worker pool.
- **Client timeout**: Browser/proxy timeout kills connection mid-stream. Fix: keepalive, heartbeat SSE events.
- **Mid-stream error**: Provider error after partial generation → send error SSE event, don't drop connection.
- **Memory leak**: Output buffer accumulates without flush — PHP memory exhaustion. Fix: flush after each token.

## Ecosystem Usage

- Chat interfaces with real-time token display
- Document generation with progress indication
- Interactive coding assistants showing code as it's generated
- Livewire components using `wire:stream` for model responses
- Inertia applications using Vercel AI SDK protocol

## Related Knowledge Units

- KU-046: Livewire wire:stream Integration
- KU-047: WebSocket Broadcasting (Reverb)
- KU-048: Vercel AI SDK Protocol
- KU-049: Nginx Proxy Buffering for SSE

## Research Notes

- SSE streaming added in Laravel AI SDK v0.1.0
- Vercel AI Data Protocol support added in v0.3.0 for Livewire/Inertia compatibility
- PHP-FPM streaming is the simplest but least scalable approach for high-concurrency apps
- Dedicated worker pools for streaming endpoints are the recommended production pattern
- Octane incompatibility with Livewire wire:stream is a known limitation — use Reverb for Octane deployments
