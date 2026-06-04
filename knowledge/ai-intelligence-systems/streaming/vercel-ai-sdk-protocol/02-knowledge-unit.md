# Knowledge Unit: Vercel AI SDK Protocol

## Metadata

- **ID:** KU-048
- **Subdomain:** Streaming & Real-Time AI Responses
- **Slug:** vercel-ai-sdk-protocol
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Vercel AI Data Protocol is a standardized SSE format for AI responses that enables cross-framework compatibility. The Laravel AI SDK natively supports this protocol, meaning streamed responses work with Livewire, Inertia, and frontend libraries built for the Vercel AI SDK. This eliminates the need for custom SSE format negotiation.

## Core Concepts

- **Standardized event types**: `text`, `error`, `annotations`, `finish`, `data`
- **JSON-encoded events**: Each SSE event is a JSON object with `type` and payload fields
- **Cross-framework**: Same format works with Livewire `wire:stream`, Inertia, and JavaScript Vercel AI SDK client
- **Tool annotations**: Tool calls and results sent as `annotations` events during stream
- **Finish event**: Signals stream completion with usage metadata

## Mental Models

- **JSON:API for streaming**: Like JSON:API standardizes REST responses — Vercel AI Data Protocol standardizes AI stream format. One format, many consumers.
- **Universal stream format**: The "HTML of AI streaming" — any frontend can consume it, any backend can produce it.

## Internal Mechanics

SSE event stream format:
```
event: data
data: {"type":"text","text":"Hello"}

event: data
data: {"type":"text","text":" world"}

event: data
data: {"type":"annotations","annotations":[{"type":"tool_call","tool":"search","args":{...}}]}

event: data
data: {"type":"finish","usage":{"input_tokens":50,"output_tokens":25}}
```

The `data` event type with `type` field differentiates content types. The `finish` event indicates stream complete. The `annotations` event carries tool calls, citations, or custom metadata.

## Patterns

- **Frontend-agnostic backend**: Server streams Vercel protocol — any frontend framework can consume
- **Livewire + EventSource**: Livewire's `wire:stream` reads Vercel protocol natively
- **JavaScript client**: Vercel AI SDK's `useChat()` hook reads this format
- **Tool visualization**: Frontend renders tool annotations inline — expandable tool call details
- **Fallback format**: Negotiate protocol based on `Accept` header — Vercel protocol as default

## Architectural Decisions

- **Decision**: Vercel protocol vs. custom SSE format → Vercel protocol as default. Reason: Ecosystem compatibility, documented standard, tool annotation support.
- **Decision**: First-class support vs. optional → Built into Laravel AI SDK streaming. Reason: Ensures compatibility with Livewire and frontend frameworks.

## Tradeoffs

| Aspect | Vercel Protocol | Custom SSE | Raw Token Stream |
|--------|----------------|------------|------------------|
| Standardization | High (documented) | None (custom) | None |
| Tool support | Native (annotations) | Manual | None |
| Client libraries | Several (Vercel SDK, Livewire) | Custom JS | Custom JS |
| Overhead | Slight (JSON envelope) | Minimal | Minimal |
| Debugging | Clear event types | Custom parsing | Raw text |

## Performance Considerations

- JSON envelope adds ~50-100 bytes per event — negligible vs. token content
- Annotations add minimal overhead per tool call
- Finish event is single event — no cumulative cost
- Event parsing on frontend is sub-millisecond

## Production Considerations

- Implement protocol versioning in future — Vercel protocol may evolve
- Test with Vercel AI SDK frontend if using JavaScript frontend
- Verify Livewire wire:stream compatibility with protocol version
- Log protocol errors — malformed events indicate version mismatch
- Add `Content-Type: text/event-stream` header explicitly

## Common Mistakes

- Producing custom SSE format — frontend expects Vercel protocol, can't parse
- Not including `finish` event — frontend hangs waiting for stream end
- Sending tools as plain text instead of annotations — frontend can't render tool calls
- Missing usage metadata in finish event — frontend doesn't get token counts
- Using incorrect JSON format — single quotes instead of double quotes

## Failure Modes

- **Protocol mismatch**: Backend version incompatible with frontend expectations — negotiate version
- **Malformed JSON event**: Stream corruption — frontend error handling should skip malformed events
- **Missing finish event**: Stream cut by error — frontend should timeout and handle incomplete stream
- **Annotation overflow**: Too many annotations in single response — frontend rendering issues

## Ecosystem Usage

- Laravel AI SDK: default SSE format for `->stream()`
- Livewire: `wire:stream` expects Vercel AI Data Protocol
- Vercel AI SDK JavaScript: `useChat()` hook consumes this format
- Inertia.js: can consume via custom EventSource handler

## Related Knowledge Units

- KU-045: SSE Streaming
- KU-046: Livewire wire:stream Integration
- KU-047: WebSocket Broadcasting (Reverb)

## Research Notes

- Vercel AI Data Protocol documented at https://sdk.vercel.ai/docs/ai-specification
- Adopted by Laravel AI SDK for ecosystem compatibility
- Alternative formats: OpenAI SSE format, Anthropic SSE format — but Vercel is the cross-framework standard
- Protocol evolution: backported tool annotations from v2 spec
- No formal RFC — Vercel-driven standard but widely adopted
