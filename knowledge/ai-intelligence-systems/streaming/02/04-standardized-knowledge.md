---
id: ku-02
title: "WebSockets & Real-Time Communication"
subdomain: "streaming-real-time-ai"
ku-type: "communication"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/streaming-real-time-ai/ku-02/04-standardized-knowledge.md"
---

# WebSockets & Real-Time Communication

## Overview

WebSockets provide full-duplex communication channels between client and server, enabling real-time bidirectional data flow for AI applications. Unlike Server-Sent Events (SSE), which are server-to-client only, WebSockets allow the client to send messages while receiving streamed responses — critical for interactive AI features like real-time chat, collaborative editing, and live transcription. In the Laravel ecosystem, WebSockets are implemented using Laravel Reverb (first-party WebSocket server) or third-party services like Pusher.

## Core Concepts

- **WebSocket Protocol (RFC 6455):** A full-duplex protocol over a single TCP connection. Upgraded from HTTP via the `Upgrade: websocket` header.
- **Laravel Reverb:** First-party Laravel WebSocket server, built on ReactPHP. Scales horizontally via Redis.
- **Channel:** A named communication channel that clients subscribe to. Messages broadcast to all subscribers.
- **Presence Channel:** A channel that tracks connected users and their metadata. Used for "who's online" features.
- **Private Channel:** An authenticated channel that restricts access to authorized users.
- **Event Broadcasting:** Laravel's event system with `ShouldBroadcast` interface. Events are automatically sent to WebSocket clients.
- **Connection Lifecycle:** Establish → Authenticate → Subscribe → Communicate → Unsubscribe → Disconnect.
- **Heartbeat/Ping-Pong:** Periodic keep-alive messages to detect and clean up stale connections.

## When To Use

- Interactive AI features where the user sends messages while receiving streamed responses.
- Real-time collaborative features (co-writing, co-editing with AI).
- Live transcription or translation with user corrections.
- Multi-user AI features (shared agent sessions, collaborative chat).
- Applications that need real-time status updates (indexing progress, batch job status).

## When NOT To Use

- Simple server-to-client streaming (use SSE — simpler, no bidirectional needed).
- REST APIs where the client sends a request and waits for a complete response.
- Short-lived requests (use standard HTTP — WebSocket overhead isn't justified).

## Best Practices

- **Use Laravel Reverb** for first-party WebSocket support. It's built for Laravel and scales well.
- **Authenticate connections on upgrade.** Use Laravel's broadcasting auth routes with Sanctum or JWT tokens.
- **Send heartbeats every 30 seconds.** Detect and close stale connections (free up resources).
- **Handle reconnection gracefully.** The client should automatically reconnect on disconnect and resume the session.
- **Use private channels for user-specific data.** Never broadcast sensitive data on public channels.
- **Implement backpressure.** If the server generates tokens faster than the client can consume, buffer or skip tokens.
- **Log connection events.** Track connects, disconnects, and errors for debugging and capacity planning.

## Architecture Guidelines

- Laravel Reverb runs as a **separate process** (not in PHP-FPM). Use Supervisor to keep it running.
- The **Laravel application** handles business logic (LLM calls). Reverb handles WebSocket connections.
- Use **Redis** as the pub/sub backend for Reverb — all Reverb instances share the same Redis to broadcast across servers.
- For streaming LLM responses over WebSocket, the Laravel app **broadcasts events** to Reverb, which pushes to connected clients.
- Implement a **presence channel** for each AI session — track active users, their typing status, and connection state.

## Performance Considerations

- Reverb is event-loop based (ReactPHP), handling thousands of concurrent connections per process.
- Memory per connection: ~20-50KB for idle WebSocket connections. 10,000 connections = ~200-500MB.
- Broadcast throughput: Reverb can handle 100K+ events/second with Redis backend.
- Horizontal scaling: add more Reverb processes behind a load balancer. All instances share Redis for cross-instance broadcasting.
- PHP-FPM overhead: the Laravel app process that generates LLM tokens broadcasts events. Ensure the broadcasting step is non-blocking (queue-based if possible).

## Security Considerations

- **Connection authentication:** Verify user identity at connection upgrade time (not just at subscription time).
- **CSRF protection:** WebSocket connections are not subject to CSRF. Use tokens (JWT, Signed URL) in the connection request.
- **Message validation:** Validate all messages received from the client over WebSocket (same as HTTP input validation).
- **Rate limiting:** Rate limit WebSocket connections per user and per IP. Abusers can open hundreds of connections.
- **Data validation:** Messages broadcast over WebSocket should be sanitized (no PII in channel names, no sensitive data in events).
- **Connection hijacking:** Use private channels with user-specific access. Don't rely on channel name secrecy.

## Common Mistakes

- Using WebSockets when SSE would suffice — WebSockets add unnecessary complexity.
- Not handling reconnection — the user loses the AI session when the connection drops.
- Broadcasting sensitive data on public channels — anyone on the channel sees it.
- Not implementing backpressure — the server overwhelms slow clients.
- Running Reverb in PHP-FPM — Reverb is an event-loop server, not a request-response server.
- Not cleaning up stale connections — zombie connections accumulate, consuming server resources.

## Anti-Patterns

- **WebSocket for Everything:** Using WebSockets for REST API calls because "it's real-time." Use the right protocol for each use case.
- **No Fallback:** Requiring WebSocket support without a fallback for environments that block WebSocket connections (corporate proxies).
- **Unlimited Channel Creation:** Allowing users to create unlimited channels. Implement channel limits per user.
- **Broadcast to All:** Broadcasting every event to all connected clients. Use targeted channels (user-specific, session-specific).
- **No Connection State:** Not tracking which users are connected to which sessions. You can't deliver targeted messages without state.

## Examples

### Broadcasting Stream Tokens via WebSocket
```php
class StreamTokensEvent implements ShouldBroadcast {
    public function __construct(
        private string $channel,   // session-specific private channel
        public string $content,
        public ?string $finishReason = null,
    ) {}

    public function broadcastOn(): array {
        return [new PrivateChannel("ai-session.{$this->channel}")];
    }
}

// In the streaming service:
foreach ($stream as $chunk) {
    broadcast(new StreamTokensEvent(
        channel: $sessionId,
        content: $chunk->content,
        finishReason: $chunk->finishReason,
    ));
}
```

### Reverb Configuration
```php
// config/reverb.php
return [
    'apps' => [
        [
            'app_id' => env('REVERB_APP_ID'),
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'allowed_origins' => [env('APP_URL')],
            'ping_interval' => 30,       // Heartbeat every 30s
            'max_message_size' => 65536,  // 64KB max message
        ],
    ],
];
```

## Related Topics

- ku-01 (Streaming Fundamentals): Foundation for WebSocket streaming.
- ku-03 (Streaming with Tool Calls): Streaming tool calls over WebSocket.
- ku-05 (Scaling Streaming Connections): Scaling Reverb horizontally.
- agent-architecture-orchestration/ku-03: Multi-agent communication over WebSockets.
- ai-middleware-gateway/ku-05: Observability for WebSocket connections.

## AI Agent Notes

- When asked to implement WebSocket streaming, first check: is bidirectional communication needed (use WebSocket) or is server-to-client enough (use SSE)?
- For WebSocket issues, check: Reverb configuration, Redis pub/sub, authentication, and reconnection handling.
- Prefer reading the broadcasting configuration (Reverb, Pusher) before the event classes.
- When generating WebSocket code, include: connection auth, private channels, event broadcasting, and reconnection handling.

## Verification

- [ ] Laravel Reverb (or Pusher) is configured as the WebSocket server.
- [ ] Connections are authenticated at upgrade time with tokens.
- [ ] Private channels are used for user-specific data (not public channels).
- [ ] Heartbeat/ping interval is configured (30 seconds).
- [ ] Client reconnection logic is implemented (auto-reconnect, session resume).
- [ ] Stale connections are cleaned up (no zombie connections).
- [ ] Rate limiting is applied to WebSocket connections per user.
