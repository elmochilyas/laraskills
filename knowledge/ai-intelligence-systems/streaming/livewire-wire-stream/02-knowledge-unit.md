# Knowledge Unit: Livewire wire:stream Integration

## Metadata

- **ID:** KU-046
- **Subdomain:** Streaming & Real-Time AI Responses
- **Slug:** livewire-wire-stream
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Livewire's `wire:stream` enables streaming AI responses directly into Livewire components. It works with Laravel AI SDK's streaming via the Vercel AI Data Protocol. The agent's streamed tokens are pushed to the frontend as they arrive, providing real-time response display without custom JavaScript EventSource handling. Limitation: incompatible with Laravel Octane.

## Core Concepts

- `wire:stream="$agent.stream($input)"`: Livewire directive that reads SSE stream from Laravel AI SDK
- **Vercel AI Data Protocol**: Standard SSE format that `wire:stream` consumes natively
- **Token appending**: Each SSE `text` event appends content to a Livewire property
- **Component streaming**: Livewire component state is preserved during stream
- **Stream indicators**: Show/hide streaming status based on Livewire event

## Mental Models

- **Livewire for real-time**: Like Livewire's real-time features (polling, events) but for AI — tokens stream into the component as they're generated.
- **AJAX on steroids**: Regular AJAX returns full response. wire:stream returns incrementally — each token updates the UI individually.

## Internal Mechanics

1. Livewire component calls `$agent->stream($input)` in method
2. Agent returns `StreamedAgentResponse` as SSE
3. Livewire sends `Content-Type: text/event-stream` response
4. Browser reads SSE stream via `EventSource`
5. Each SSE `text` event → Livewire updates `$response` property
6. Component re-renders with new content appended
7. On stream complete, `finish` event triggers final render

The interaction is synchronous (same HTTP request) — Livewire sends normal request, but response is streamed.

## Patterns

- **Appending stream**: `$response .= $token;` — accumulate tokens into display property
- **State management**: Use separate properties for streaming state — `$isStreaming`, `$streamComplete`
- **Abort handling**: `$this->streamCancel()` — stop mid-stream on user request
- **Error display**: Catch stream errors, display in component
- **Tool progress**: Show tool execution status via SSE annotations during stream

## Architectural Decisions

- **Decision**: wire:stream vs. custom JavaScript EventSource → wire:stream for Livewire apps (less JS). Custom EventSource for more control over streaming behavior.
- **Decision**: Synchronous vs. async wire:stream → wire:stream is synchronous by design. Async requires Reverb + queue (see KU-047).

## Tradeoffs

| Aspect | wire:stream | Custom EventSource | WebSocket (Reverb) |
|--------|-------------|-------------------|-------------------|
| Setup | Zero (Livewire built-in) | Medium (JS code) | High (Reverb server) |
| Octane compatibility | No | Yes | Yes |
| State management | Livewire handles | Manual JS | Livewire + reverb |
| Latency | Low | Low | Very low |

## Performance Considerations

- Same FPM worker considerations as SSE — worker held for stream duration
- Livewire component rendering for each token: lightweight diff
- Large responses: frequent re-renders may be costly — batch tokens into ~50ms windows
- Memory: Livewire component state grows with accumulated response

## Production Considerations

- Disable Octane for streaming endpoints, or use separated worker pools
- Configure Nginx `proxy_buffering off` for streaming paths
- Set PHP `max_execution_time` to accommodate longest expected stream
- Use `$this->skipRender()` during fast token generation to reduce overhead
- Handle component destruction mid-stream — clean up stream connection
- Test with long responses — verify Livewire doesn't exceed maximum render time

## Common Mistakes

- Using wire:stream with Octane — silently fails, response buffered until complete
- No proxy buffering configuration — tokens arrive in bursts, not real-time
- Not handling component reconnection — wire:stream doesn't auto-reconnect if connection drops
- Building UI-dependent state during stream — Livewire property changes trigger re-renders
- Over-aggressive rendering — Livewire re-renders on every token, causing jank

## Failure Modes

- **Octane incompatibility**: wire:stream broken with Octane — total response buffered, no streaming effect
- **Proxy buffering**: Nginx buffers SSE — user sees response only after complete
- **Component timeout**: Livewire request exceeds configured timeout — connection dropped
- **State corruption**: Livewire property manipulation during stream causes rendering issues
- **Memory growth**: Accumulated streaming response in component state causes memory pressure

## Ecosystem Usage

- Chat components with real-time token display
- AI-assisted form filling with live suggestions
- Code generation with incremental output
- Document drafting with streaming content

## Related Knowledge Units

- KU-045: SSE Streaming
- KU-047: WebSocket Broadcasting (Reverb)
- KU-048: Vercel AI SDK Protocol

## Research Notes

- Livewire 4.x introduced `wire:stream` specifically for AI use cases
- Vercel AI Data Protocol compatibility was added to support wire:stream's expected format
- Octane incompatibility is the most common production issue — documented in Laravel blog posts
- Livewire team is working on Octane compatibility for future versions
- wire:stream is the simplest streaming approach for Livewire applications
