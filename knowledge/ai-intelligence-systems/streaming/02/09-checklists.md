# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** streaming
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Authenticate connections on upgrade.
- [ ] Handle reconnection gracefully.
- [ ] Implement backpressure.
- [ ] Log connection events.
- [ ] Send heartbeats every 30 seconds.
- [ ] Client reconnection logic is implemented (auto-reconnect, session resume).
- [ ] Connections are authenticated at upgrade time with tokens.
- [ ] Heartbeat/ping interval is configured (30 seconds).
- [ ] Rules for WebSockets & Real-Time Communication
- [ ] Client reconnection logic is implemented (auto-reconnect, session resume)
- [ ] Connections are authenticated at upgrade time with tokens (Sanctum/JWT)
- [ ] Heartbeat/ping interval is configured (30 seconds)
- [ ] **Configure authentication**: Set up broadcasting auth routes `Broadcast::routes(['middleware' => ['auth:sanctum']])` for private channel authorization.
- [ ] **Configure heartbeats**: Set `ping_interval` to 30 seconds in Reverb config for stale connection detection.
- [ ] **Create broadcast events**: Implement `ShouldBroadcast` events for stream tokens, tool call status, session state changes, and error messages.
- [ ] Heartbeat detects and cleans up stale connections within 60 seconds
- [ ] Rate limiting prevents a single user from exhausting connection limits
- [ ] Reconnecting clients resume the session without data loss

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Authenticate connections on upgrade.
- [ ] Handle reconnection gracefully.
- [ ] Implement backpressure.
- [ ] Log connection events.
- [ ] Send heartbeats every 30 seconds.
- [ ] Use Laravel Reverb
- [ ] Use private channels for user-specific data.
- [ ] **Configure authentication**: Set up broadcasting auth routes `Broadcast::routes(['middleware' => ['auth:sanctum']])` for private channel authorization.
- [ ] **Configure heartbeats**: Set `ping_interval` to 30 seconds in Reverb config for stale connection detection.
- [ ] **Create broadcast events**: Implement `ShouldBroadcast` events for stream tokens, tool call status, session state changes, and error messages.
- [ ] **Define channels**: Create private channels for each AI session â€” `private-ai-session.{sessionId}` with authorization callback that validates the user owns the session.
- [ ] **Handle client reconnection**: Implement client-side auto-reconnection with exponential backoff (1s â†’ 2s â†’ 4s â†’ 10s max) and session state resumption.

---

# Performance Checklist

- [ ] Broadcast throughput: Reverb can handle 100K+ events/second with Redis backend.
- [ ] Horizontal scaling: add more Reverb processes behind a load balancer. All instances share Redis for cross-instance broadcasting.
- [ ] Memory per connection: ~20-50KB for idle WebSocket connections. 10,000 connections = ~200-500MB.
- [ ] PHP-FPM overhead: the Laravel app process that generates LLM tokens broadcasts events. Ensure the broadcasting step is non-blocking (queue-based if possible).
- [ ] Reverb is event-loop based (ReactPHP), handling thousands of concurrent connections per process.
- [ ] Authenticate connections at WebSocket upgrade time (not just channel subscription)
- [ ] Broadcast throughput: 100K+ events/second with Redis backend
- [ ] Implement connection hijacking protection (private channel auth)

---

# Security Checklist

- [ ] Connection authentication:
- [ ] Connection hijacking:
- [ ] CSRF protection:
- [ ] Data validation:
- [ ] Message validation:
- [ ] Rate limiting:
- [ ] Authenticate connections at WebSocket upgrade time (not just channel subscription)
- [ ] Implement connection hijacking protection (private channel auth)

---

# Reliability Checklist

- [ ] Broadcasting sensitive data on public channels â€” anyone on the channel sees it.
- [ ] Not cleaning up stale connections â€” zombie connections accumulate, consuming server resources.
- [ ] Not handling reconnection â€” the user loses the AI session when the connection drops.
- [ ] Not implementing backpressure â€” the server overwhelms slow clients.
- [ ] Running Reverb in PHP-FPM â€” Reverb is an event-loop server, not a request-response server.
- [ ] Using WebSockets when SSE would suffice â€” WebSockets add unnecessary complexity.

---

# Testing Checklist

- [ ] Client reconnection logic is implemented (auto-reconnect, session resume)
- [ ] Client reconnection logic is implemented (auto-reconnect, session resume).
- [ ] Connections are authenticated at upgrade time with tokens (Sanctum/JWT)
- [ ] Connections are authenticated at upgrade time with tokens.
- [ ] Heartbeat detects and cleans up stale connections within 60 seconds
- [ ] Heartbeat/ping interval is configured (30 seconds)
- [ ] Heartbeat/ping interval is configured (30 seconds).
- [ ] Laravel Reverb (or Pusher) is configured as the WebSocket server.
- [ ] Laravel Reverb is configured as the WebSocket server
- [ ] Private channels are used for user/session-specific data (not public channels)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Try/Catch Around Stream Iteration â€” Fatal Error on Provider Failure]
- [ ] [No Partial Response Returned on Error â€” All Progress Lost]
- [ ] [No Error Event in Stream â€” Client Tries to Parse Error as Data]
- [ ] [Retrying Entire Stream Instead of Resuming From Failure Point]
- [ ] [No Timeout on Streaming Connection â€” Hanging Forever]
- [ ] Broadcast to All:
- [ ] No Connection State:
- [ ] No Fallback:
- [ ] Unlimited Channel Creation:
- [ ] WebSocket for Everything:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


