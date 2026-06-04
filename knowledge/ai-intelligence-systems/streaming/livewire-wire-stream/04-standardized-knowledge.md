---
id: KU-046
title: "Livewire wire:stream Integration"
subdomain: "streaming"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/07-streaming/livewire-wire-stream/04-standardized-knowledge.md"
---

# Livewire wire:stream Integration

## Overview

Livewire's `wire:stream` enables streaming AI responses directly into Livewire components. It works with Laravel AI SDK's streaming via the Vercel AI Data Protocol. The agent's streamed tokens are pushed to the frontend as they arrive, providing real-time response display without custom JavaScript EventSource handling. Limitation: incompatible with Laravel Octane.

## Core Concepts

- `wire:stream="$agent.stream($input)"`: Livewire directive that reads SSE stream from Laravel AI SDK
- **Vercel AI Data Protocol**: Standard SSE format that `wire:stream` consumes natively
- **Token appending**: Each SSE `text` event appends content to a Livewire property
- **Component streaming**: Livewire component state is preserved during stream
- **Stream indicators**: Show/hide streaming status based on Livewire event

## When To Use

- Production applications requiring Livewire wire:stream Integration functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Appending stream**: `$response .= $token;` â€” accumulate tokens into display property
- **State management**: Use separate properties for streaming state â€” `$isStreaming`, `$streamComplete`
- **Abort handling**: `$this->streamCancel()` â€” stop mid-stream on user request
- **Error display**: Catch stream errors, display in component
- **Tool progress**: Show tool execution status via SSE annotations during stream

- **Livewire for real-time**: Like Livewire's real-time features (polling, events) but for AI â€” tokens stream into the component as they're generated.
- **AJAX on steroids**: Regular AJAX returns full response. wire:stream returns incrementally â€” each token updates the UI individually.

## Architecture Guidelines

- **Decision**: wire:stream vs. custom JavaScript EventSource â†’ wire:stream for Livewire apps (less JS). Custom EventSource for more control over streaming behavior.
- **Decision**: Synchronous vs. async wire:stream â†’ wire:stream is synchronous by design. Async requires Reverb + queue (see KU-047).

## Performance Considerations

- Same FPM worker considerations as SSE â€” worker held for stream duration
- Livewire component rendering for each token: lightweight diff
- Large responses: frequent re-renders may be costly â€” batch tokens into ~50ms windows
- Memory: Livewire component state grows with accumulated response

| Aspect | wire:stream | Custom EventSource | WebSocket (Reverb) |
|--------|-------------|-------------------|-------------------|
| Setup | Zero (Livewire built-in) | Medium (JS code) | High (Reverb server) |
| Octane compatibility | No | Yes | Yes |
| State management | Livewire handles | Manual JS | Livewire + reverb |
| Latency | Low | Low | Very low |

## Security Considerations

- Disable Octane for streaming endpoints, or use separated worker pools
- Configure Nginx `proxy_buffering off` for streaming paths
- Set PHP `max_execution_time` to accommodate longest expected stream
- Use `$this->skipRender()` during fast token generation to reduce overhead
- Handle component destruction mid-stream â€” clean up stream connection
- Test with long responses â€” verify Livewire doesn't exceed maximum render time

## Common Mistakes

- Using wire:stream with Octane â€” silently fails, response buffered until complete
- No proxy buffering configuration â€” tokens arrive in bursts, not real-time
- Not handling component reconnection â€” wire:stream doesn't auto-reconnect if connection drops
- Building UI-dependent state during stream â€” Livewire property changes trigger re-renders
- Over-aggressive rendering â€” Livewire re-renders on every token, causing jank

## Anti-Patterns

- **Octane incompatibility**: wire:stream broken with Octane â€” total response buffered, no streaming effect
- **Proxy buffering**: Nginx buffers SSE â€” user sees response only after complete
- **Component timeout**: Livewire request exceeds configured timeout â€” connection dropped
- **State corruption**: Livewire property manipulation during stream causes rendering issues
- **Memory growth**: Accumulated streaming response in component state causes memory pressure

## Examples

The following ecosystem packages provide reference implementations:

- Chat components with real-time token display
- AI-assisted form filling with live suggestions
- Code generation with incremental output
- Document drafting with streaming content

## Related Topics

- KU-045: SSE Streaming
- KU-047: WebSocket Broadcasting (Reverb)
- KU-048: Vercel AI SDK Protocol

## AI Agent Notes

- When asked about Livewire wire:stream Integration, first determine the specific use case and requirements.
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

