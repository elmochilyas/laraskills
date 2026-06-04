# Knowledge Unit: WebSocket Broadcasting (Reverb)

## Metadata

- **ID:** KU-047
- **Subdomain:** Streaming & Real-Time AI Responses
- **Slug:** websocket-reverb-broadcasting
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Laravel Reverb enables WebSocket-based AI streaming, where agent tokens are broadcast to connected clients via WebSocket. Unlike SSE (which holds a PHP-FPM worker), Reverb is event-driven — the agent runs as a queued job and pushes tokens to Reverb, which fans out to WebSocket clients. This is the scalable approach for high-concurrency real-time AI features.

## Core Concepts

- **Reverb**: First-party Laravel WebSocket server (replacement for Pusher) — event-driven, scalable
- **`->broadcastOnQueue()`**: Agent method that queues agent execution and broadcasts tokens via Reverb
- **Channel-based broadcasting**: Tokens broadcast to private/presence channels per user
- **Event-driven**: Agent runs in queue worker, not HTTP worker — no blocking
- **Scalability**: Reverb handles thousands of concurrent connections per server

## Mental Models

- **Pub/sub for AI**: Agent publishes tokens → Reverb fans out to subscribers. HTTP worker isn't involved in streaming — it's async.
- **Queue worker + broadcast**: Like a queue job that progressively broadcasts its results. The queue worker is the producer; Reverb is the message broker.

## Internal Mechanics

1. Client sends request to HTTP endpoint
2. Controller validates, dispatches agent via `->broadcastOnQueue()`
3. Request returns immediately with channel identifier
4. Client opens WebSocket connection to Reverb on that channel
5. Queue worker picks up agent job
6. Agent begins executing, generates tokens
7. Each token is broadcast as event on Reverb channel
8. Reverb pushes to all connected clients
9. On completion, final event includes usage metadata

Agent runs in queue worker — no HTTP worker occupied during generation. Reverb handles WebSocket connection lifecycle.

## Patterns

- **Channel per conversation**: `conversation.{id}` — client subscribes, receives tokens
- **Typing indicators**: Broadcast "agent is thinking" event before first token
- **Tool progress**: Broadcast tool execution events (tool_name, status, duration)
- **Error broadcast**: Send error events to client for UI display
- **Abort channel**: Client sends abort message on separate channel to stop agent execution

## Architectural Decisions

- **Decision**: Reverb vs. SSE vs. Livewire → Reverb for high-concurrency or long-running responses. SSE for simple, low-concurrency cases. Livewire for Octane-incompatible but simpler setups.
- **Decision**: Broadcast via queue vs. synchronous → Reverb requires queue. The agent runs in queue worker, broadcasts tokens as events. This decouples generation from delivery.

## Tradeoffs

| Factor | Reverb + Queue | SSE (FPM) | Livewire wire:stream |
|--------|---------------|-----------|---------------------|
| Concurrency | High (event-driven) | Low (FPM workers) | Low (FPM workers) |
| Infrastructure | Reverb server + queue | Nginx config only | Nginx config only |
| Complexity | High | Low | Low |
| Agent timeout | Queue timeout (configurable) | PHP max_execution_time | PHP max_execution_time |
| Client reconnect | Yes (WebSocket) | Manual (EventSource) | Manual |

## Performance Considerations

- Reverb: 100K+ concurrent connections per server (event-driven, Laravel's benchmark)
- Queue workers: scale independently — more workers = more concurrent agent executions
- No HTTP worker blocking — web server serves other requests during generation
- Broadcast overhead: negligible per event (sub-millisecond)
- Token batching: broadcast every 50-100ms worth of tokens to reduce event volume

## Production Considerations

- Run Reverb as dedicated process (separate from web server)
- Configure queue with dedicated `--queue=ai-streaming` for agent jobs
- Set queue job timeout high enough for longest agent execution
- Monitor Reverb connections per channel — ensure isSingleConnection per user
- Use private channels for authenticated access
- Configure Reverb scaling (horizontal with Redis) for high-traffic applications
- Handle WebSocket reconnection — client should rejoining channel on reconnect

## Common Mistakes

- Using Reverb for short responses (<5s) — SSE is simpler for short streams
- Not configuring queue timeout — job fails mid-stream when default 60s timeout hit
- Broadcasting raw tokens without event envelope — client can't distinguish text from tool progress
- No reconnection handling — client loses stream on WebSocket disconnect
- Broadcasting to public channels — anyone can listen to AI responses
- Running Reverb on same server as web workers — resource contention

## Failure Modes

- **Reverb outage**: WebSocket connection fails — fall back to SSE polling
- **Queue backpressure**: All queue workers busy — agent execution delayed, client waits
- **Job failure mid-stream**: Agent throws exception — broadcast error event, client shows failure message
- **WebSocket disconnect**: Client loses connection — tokens continue generating (wasted if no reconnect)
- **Channel authorization failure**: Private channel authentication fails — client can't subscribe

## Ecosystem Usage

- High-concurrency AI chat applications
- Long-running AI workflows with progress updates
- Real-time AI coding assistants
- Multi-user AI collaboration features
- Serverless deployments (Vapor) where SSE worker limitation is problematic

## Related Knowledge Units

- KU-045: SSE Streaming
- KU-046: Livewire wire:stream Integration
- KU-048: Vercel AI SDK Protocol
- KU-015: Queued Agent Execution

## Research Notes

- `->broadcastOnQueue()` added in Laravel AI SDK v0.3.0
- Reverb is the recommended approach for high-concurrency AI streaming
- Reverb architecture: event-driven WebSocket server using Laravel's broadcasting system
- Horizontal scaling: multiple Reverb instances behind Redis
- Alternative: Pusher (third-party) for teams that don't want to manage Reverb infrastructure
