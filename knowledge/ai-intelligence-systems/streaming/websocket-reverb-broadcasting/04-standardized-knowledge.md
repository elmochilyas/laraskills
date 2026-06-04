---
id: KU-047
title: "WebSocket Broadcasting (Reverb)"
subdomain: "streaming"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/07-streaming/websocket-reverb-broadcasting/04-standardized-knowledge.md"
---

# WebSocket Broadcasting (Reverb)

## Overview

Laravel Reverb enables WebSocket-based AI streaming, where agent tokens are broadcast to connected clients via WebSocket. Unlike SSE (which holds a PHP-FPM worker), Reverb is event-driven â€” the agent runs as a queued job and pushes tokens to Reverb, which fans out to WebSocket clients. This is the scalable approach for high-concurrency real-time AI features.

## Core Concepts

- **Reverb**: First-party Laravel WebSocket server (replacement for Pusher) â€” event-driven, scalable
- **`->broadcastOnQueue()`**: Agent method that queues agent execution and broadcasts tokens via Reverb
- **Channel-based broadcasting**: Tokens broadcast to private/presence channels per user
- **Event-driven**: Agent runs in queue worker, not HTTP worker â€” no blocking
- **Scalability**: Reverb handles thousands of concurrent connections per server

## When To Use

- Production applications requiring WebSocket Broadcasting (Reverb) functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Channel per conversation**: `conversation.{id}` â€” client subscribes, receives tokens
- **Typing indicators**: Broadcast "agent is thinking" event before first token
- **Tool progress**: Broadcast tool execution events (tool_name, status, duration)
- **Error broadcast**: Send error events to client for UI display
- **Abort channel**: Client sends abort message on separate channel to stop agent execution

- **Pub/sub for AI**: Agent publishes tokens â†’ Reverb fans out to subscribers. HTTP worker isn't involved in streaming â€” it's async.
- **Queue worker + broadcast**: Like a queue job that progressively broadcasts its results. The queue worker is the producer; Reverb is the message broker.

## Architecture Guidelines

- **Decision**: Reverb vs. SSE vs. Livewire â†’ Reverb for high-concurrency or long-running responses. SSE for simple, low-concurrency cases. Livewire for Octane-incompatible but simpler setups.
- **Decision**: Broadcast via queue vs. synchronous â†’ Reverb requires queue. The agent runs in queue worker, broadcasts tokens as events. This decouples generation from delivery.

## Performance Considerations

- Reverb: 100K+ concurrent connections per server (event-driven, Laravel's benchmark)
- Queue workers: scale independently â€” more workers = more concurrent agent executions
- No HTTP worker blocking â€” web server serves other requests during generation
- Broadcast overhead: negligible per event (sub-millisecond)
- Token batching: broadcast every 50-100ms worth of tokens to reduce event volume

| Factor | Reverb + Queue | SSE (FPM) | Livewire wire:stream |
|--------|---------------|-----------|---------------------|
| Concurrency | High (event-driven) | Low (FPM workers) | Low (FPM workers) |
| Infrastructure | Reverb server + queue | Nginx config only | Nginx config only |
| Complexity | High | Low | Low |
| Agent timeout | Queue timeout (configurable) | PHP max_execution_time | PHP max_execution_time |
| Client reconnect | Yes (WebSocket) | Manual (EventSource) | Manual |

## Security Considerations

- Run Reverb as dedicated process (separate from web server)
- Configure queue with dedicated `--queue=ai-streaming` for agent jobs
- Set queue job timeout high enough for longest agent execution
- Monitor Reverb connections per channel â€” ensure isSingleConnection per user
- Use private channels for authenticated access
- Configure Reverb scaling (horizontal with Redis) for high-traffic applications
- Handle WebSocket reconnection â€” client should rejoining channel on reconnect

## Common Mistakes

- Using Reverb for short responses (<5s) â€” SSE is simpler for short streams
- Not configuring queue timeout â€” job fails mid-stream when default 60s timeout hit
- Broadcasting raw tokens without event envelope â€” client can't distinguish text from tool progress
- No reconnection handling â€” client loses stream on WebSocket disconnect
- Broadcasting to public channels â€” anyone can listen to AI responses
- Running Reverb on same server as web workers â€” resource contention

## Anti-Patterns

- **Reverb outage**: WebSocket connection fails â€” fall back to SSE polling
- **Queue backpressure**: All queue workers busy â€” agent execution delayed, client waits
- **Job failure mid-stream**: Agent throws exception â€” broadcast error event, client shows failure message
- **WebSocket disconnect**: Client loses connection â€” tokens continue generating (wasted if no reconnect)
- **Channel authorization failure**: Private channel authentication fails â€” client can't subscribe

## Examples

The following ecosystem packages provide reference implementations:

- High-concurrency AI chat applications
- Long-running AI workflows with progress updates
- Real-time AI coding assistants
- Multi-user AI collaboration features
- Serverless deployments (Vapor) where SSE worker limitation is problematic

## Related Topics

- KU-045: SSE Streaming
- KU-046: Livewire wire:stream Integration
- KU-048: Vercel AI SDK Protocol
- KU-015: Queued Agent Execution

## AI Agent Notes

- When asked about WebSocket Broadcasting (Reverb), first determine the specific use case and requirements.
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

