# Skill: Implement WebSocket Streaming for Bidirectional AI Communication

## Purpose
Set up bidirectional real-time communication for AI applications using Laravel Reverb WebSockets, enabling interactive chat, collaborative editing, and multi-user agent sessions with proper authentication, heartbeats, and horizontal scaling.

## When To Use
- Interactive AI features where the user sends messages while receiving streamed responses
- Real-time collaborative features (co-writing, co-editing with AI)
- Live transcription or translation with user corrections
- Multi-user AI features (shared agent sessions, collaborative chat)
- Applications needing real-time status updates (indexing progress, batch job status)

## When NOT To Use
- Simple server-to-client streaming (use SSE — simpler, no bidirectional needed)
- REST APIs where the client sends a request and waits for a complete response
- Short-lived requests where WebSocket overhead isn't justified

## Prerequisites
- KU-01 (Streaming Fundamentals) — understanding of SSE vs. WebSocket
- KU-04 (Performance Optimization) — connection pooling and buffering
- Laravel Reverb installed and configured (or Pusher)
- Redis configured as the pub/sub backend for Reverb
- Supervisor (or similar) configured to manage the Reverb process

## Inputs
- WebSocket server configuration (app_id, key, secret, allowed_origins)
- Channel authorization callback (private channel auth)
- Client-side EventSource or WebSocket library
- Session management (tracking connected users per session)

## Workflow
1. **Install and configure Laravel Reverb**: `composer require laravel/reverb`, publish config, configure app credentials and allowed origins in `config/reverb.php`.
2. **Set up Redis pub/sub**: Configure Redis as the Reverb scaling backend for cross-server message routing.
3. **Configure authentication**: Set up broadcasting auth routes `Broadcast::routes(['middleware' => ['auth:sanctum']])` for private channel authorization.
4. **Define channels**: Create private channels for each AI session — `private-ai-session.{sessionId}` with authorization callback that validates the user owns the session.
5. **Create broadcast events**: Implement `ShouldBroadcast` events for stream tokens, tool call status, session state changes, and error messages.
6. **Start Reverb process**: Run Reverb as a separate process via Supervisor (`php artisan reverb:start`), not inside PHP-FPM.
7. **Implement streaming loop**: In the Laravel controller, iterate over the LLM stream and broadcast `StreamToken` events to the session's private channel.
8. **Handle client reconnection**: Implement client-side auto-reconnection with exponential backoff (1s → 2s → 4s → 10s max) and session state resumption.
9. **Configure heartbeats**: Set `ping_interval` to 30 seconds in Reverb config for stale connection detection.
10. **Implement backpressure**: Monitor WebSocket send buffer depth and batch/skip tokens when the client falls behind.
11. **Monitor connections**: Track connection count, disconnection reasons, and broadcast throughput with alerts for anomalies.

## Validation Checklist
- [ ] Laravel Reverb is configured as the WebSocket server
- [ ] Connections are authenticated at upgrade time with tokens (Sanctum/JWT)
- [ ] Private channels are used for user/session-specific data (not public channels)
- [ ] Heartbeat/ping interval is configured (30 seconds)
- [ ] Client reconnection logic is implemented (auto-reconnect, session resume)
- [ ] Stale connections are cleaned up (no zombie connections)
- [ ] Rate limiting is applied to WebSocket connections per user/IP

## Common Failures
- **WebSocket connections fail silently**: Auth routes not set up correctly or CORS misconfigured. Check broadcasting auth routes and allowed origins.
- **Messages reach only some clients**: Redis pub/sub not configured for multi-server or sticky sessions not set up. Configure Redis scaling, enable sticky sessions on the load balancer.
- **Zombie connections accumulate**: No heartbeat/ping-pong configured. Set `ping_interval` in Reverb config and handle `onclose` on the client.
- **Client overwhelmed by token speed**: No backpressure handling. Implement server-side buffering and rate-limited flushing.
- **Session state lost on reconnect**: No reconnection logic or session resumption. Implement client-side reconnection with session ID tracking.

## Decision Points
- **WebSocket vs. SSE**: WebSocket for bidirectional (chat, collaboration). SSE for unidirectional server-to-client streaming (simpler, cheaper).
- **Reverb vs. Pusher**: Reverb for self-hosted (full control, no per-connection cost). Pusher for managed (zero ops, scales automatically, higher cost).
- **Public vs. Private channels**: Always use private channels for AI session data. Public channels only for system-wide status (model availability, maintenance).

## Performance Considerations
- Reverb handles 10,000+ concurrent WebSocket connections per process (event-loop based)
- Memory per idle connection: ~20-50KB. 10,000 connections = ~200-500MB
- Broadcast throughput: 100K+ events/second with Redis backend
- PHP-FPM overhead: broadcasting events from Laravel requires a PHP-FPM request. For high throughput, consider async broadcasting.
- Sticky sessions: required for WebSocket horizontal scaling (or Redis pub/sub with server registry)

## Security Considerations
- Authenticate connections at WebSocket upgrade time (not just channel subscription)
- Use private channels for all user/session-specific AI data
- Validate all messages received from the client over WebSocket (same as HTTP input)
- Rate limit WebSocket connections per user and per IP
- Sanitize broadcast messages (no PII in channel names)
- Implement connection hijacking protection (private channel auth)
- Store Reverb credentials in secrets manager, never in code

## Related Rules
- Run Laravel Reverb as a separate process, never inside PHP-FPM
- Always authenticate WebSocket connections at upgrade time, not just subscription time
- Implement heartbeat/ping-pong every 30 seconds to detect stale connections
- Use private channels for all user-specific or session-specific AI data
- Always implement client-side reconnection logic with session resumption
- Implement server-side backpressure when tokens arrive faster than the client consumes them

## Related Skills
- Skill: Implement LLM Response Streaming with SSE (ku-01)
- Skill: Stream Tool Calls and Agent Loops (ku-03)
- Skill: Optimize Streaming Performance (ku-04)
- Skill: Scale Streaming Connections to Production (ku-05)

## Success Criteria
- WebSocket connections establish within 1 second and authenticate successfully
- Tokens reach all connected clients in the same session within 500ms of generation
- Reconnecting clients resume the session without data loss
- Heartbeat detects and cleans up stale connections within 60 seconds
- Server handles 10,000+ concurrent connections without degradation
- Rate limiting prevents a single user from exhausting connection limits