---
id: KU-045
title: "SSE Streaming"
subdomain: "streaming"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/07-streaming/sse-streaming/04-standardized-knowledge.md"
---

# SSE Streaming

## Overview

Server-Sent Events (SSE) enable real-time token-by-token streaming of AI responses. Laravel AI SDK's `->stream()` method returns a `StreamedAgentResponse` that handles SSE format, including the Vercel AI Data Protocol for Livewire and Inertia compatibility. SSE avoids blank-screen waits during multi-second LLM generation, but requires specific infrastructure configuration (Nginx, PHP-FPM, worker pool).

## Core Concepts

- `->stream()`: Agent method returning synchronous stream of tokens via SSE
- `StreamedAgentResponse`: Object with `text`, `events`, and `usage` properties
- SSE format: `Content-Type: text/event-stream`, `data: {"type":"text","text":"..."}\n\n`
- Vercel AI Data Protocol: Standardized SSE format for AI streaming â€” compatible with Livewire `wire:stream`
- Connection persistence: HTTP connection held open during generation
- PHP-FPM worker: Occupied for entire streaming duration

## When To Use

- Production applications requiring SSE Streaming functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Async/stream in controller**: Return stream directly from route â€” `return (new Agent)->stream($input)`
- **Progressive UI updates**: Frontend receives tokens, appends to growing response text
- **Stream abort**: Client disconnects â†’ PHP detects `connection_aborted()` â†’ stops streaming
- **Tool call during stream**: Tool results sent as SSE annotations â€” frontend can show tool execution inline

- **HTTP + real-time**: Like downloading a large file â€” connection stays open while data arrives. Each token is a "chunk" of the response.
- **Progressive rendering**: Like old-school terminal output â€” characters appear as they're generated, not all at once.

## Architecture Guidelines

- **Decision**: Built-in SSE vs. manual stream â†’ SDK handles SSE format automatically. Reason: Provider differences in streaming format are abstracted; developer gets unified `StreamedAgentResponse`.
- **Decision**: Synchronous (PHP-FPM) vs. async (queue + WebSocket) â†’ Synchronous SSE for simplest case. Async for long streams (>30s) or when PHP-FPM worker count is constrained.

## Performance Considerations

- PHP-FPM worker held for entire streaming duration â€” limits concurrent users to worker count
- 10-second stream: 1 FPM worker blocked for 10 seconds
- With 10 workers: only 10 concurrent streaming users
- Long-running streams (>30s) should use queue + WebSocket fallback
- Output buffering must be disabled â€” `ob_end_flush()` in stream initialization
- Memory: token-by-token accumulation, not full response in memory

| Factor | SSE (PHP-FPM) | WebSocket (Reverb) | Livewire wire:stream |
|--------|---------------|-------------------|---------------------|
| Latency | Low (token arrives immediately) | Low | Low |
| Worker usage | Occupies FPM worker | Worker-free (event-driven) | Occupies FPM worker |
| Infrastructure | Nginx config required | Reverb server required | Same as SSE |
| Complexity | Low | Medium | Low |
| Client support | Native EventSource API | WebSocket client | Livewire component |

## Security Considerations

- **Nginx**: `proxy_buffering off;` and `X-Accel-Buffering: no` to prevent buffering SSE
- **PHP-FPM**: Dedicated worker pool for streaming endpoints (`pm.max_children` sizing)
- **Response timeout**: Set `max_execution_time` higher for streaming endpoints (60-120s)
- **Client disconnect**: Always check `connection_aborted()` â€” clean up resources
- **Error handling in stream**: Send error as SSE event, don't break connection mid-stream
- **Logging**: Stream requests are long-lived â€” ensure access logs capture final response time
- **Octane**: Livewire `wire:stream` is incompatible with Octane (state persists across requests)

## Common Mistakes

- No Nginx SSE configuration â€” proxy buffers stream, user sees nothing until complete
- Using SSE for very long responses (>60s) without queue fallback â€” worker timeout kills stream
- Not checking `connection_aborted()` â€” stream continues after client disconnects (wasted tokens)
- Output buffering enabled â€” tokens arrive in bursts instead of real-time
- No CORS headers on SSE endpoint â€” browser blocks EventSource from different origin
- Forgetting `Content-Type: text/event-stream` header â€” browser doesn't recognize stream

## Anti-Patterns

- **Buffering proxy**: Nginx/Apache buffers response â€” user sees nothing until generation completes. Fix: `proxy_buffering off;`
- **Worker exhaustion**: All FPM workers streaming â†’ new requests queued. Fix: dedicated stream worker pool.
- **Client timeout**: Browser/proxy timeout kills connection mid-stream. Fix: keepalive, heartbeat SSE events.
- **Mid-stream error**: Provider error after partial generation â†’ send error SSE event, don't drop connection.
- **Memory leak**: Output buffer accumulates without flush â€” PHP memory exhaustion. Fix: flush after each token.

## Examples

The following ecosystem packages provide reference implementations:

- Chat interfaces with real-time token display
- Document generation with progress indication
- Interactive coding assistants showing code as it's generated
- Livewire components using `wire:stream` for model responses
- Inertia applications using Vercel AI SDK protocol

## Related Topics

- KU-046: Livewire wire:stream Integration
- KU-047: WebSocket Broadcasting (Reverb)
- KU-048: Vercel AI SDK Protocol
- KU-049: Nginx Proxy Buffering for SSE

## AI Agent Notes

- When asked about SSE Streaming, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

