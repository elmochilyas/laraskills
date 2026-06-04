---
id: ku-02
title: "WebSockets & Real-Time Communication - Rules"
subdomain: "streaming-real-time-ai"
ku-type: "communication"
date-created: "2026-06-02"
---

## Rules for WebSockets & Real-Time Communication

### R1: Run Laravel Reverb as a separate process, never inside PHP-FPM
- **Category:** Architecture
- **Rule:** Deploy Laravel Reverb as a standalone ReactPHP event-loop process managed by Supervisor; never run it within PHP-FPM workers.
- **Reason:** Reverb is an event-loop server handling thousands of concurrent connections in a single process. PHP-FPM is a process-per-request model that cannot efficiently manage long-lived WebSocket connections.
- **Bad Example:** Including Reverb logic in a PHP-FPM controller that holds a process for each WebSocket connection.
- **Good Example:** `supervisord.conf` configuration with `command=php artisan reverb:start` running independently from the web server.
- **Exceptions:** Development environments where a single `sail up` handles everything with low concurrency.
- **Consequences of Violation:** PHP-FPM worker pool exhaustion, inability to scale beyond `pm.max_children`, and frequent timeout errors.

### R2: Always authenticate WebSocket connections at upgrade time, not just subscription time
- **Category:** Security
- **Rule:** Validate user identity and authorization during the WebSocket upgrade handshake using tokens (Sanctum, JWT, or signed URLs); never defer authentication to channel subscription.
- **Reason:** Unauthenticated upgrade allows attackers to establish connections before any auth check runs. Subscription-level auth can be bypassed if the broadcast auth endpoint has vulnerabilities.
- **Bad Example:** Allowing any WebSocket connection through the upgrade, then checking auth only when subscribing to a private channel.
- **Good Example:** Passing a Sanctum token as a query parameter during upgrade, validating it in broadcasting auth routes before the connection is established.
- **Exceptions:** Public channels (announcements, status feeds) where no authentication is needed.
- **Consequences of Violation:** Unauthorized users can connect, probe channels, and potentially access private data before auth is checked.

### R3: Implement heartbeat/ping-pong every 30 seconds to detect stale connections
- **Category:** Reliability
- **Rule:** Configure Reverb's `ping_interval` to 30 seconds and implement client-side handling for missed heartbeats to trigger reconnection.
- **Reason:** Stale connections (network drops, client crashes) without detection accumulate server resources. Heartbeat detection ensures timely cleanup of zombie connections.
- **Bad Example:** No heartbeat configuration — stale connections remain in memory until the TCP timeout (potentially hours).
- **Good Example:** `config/reverb.php` sets `ping_interval => 30` and client-side JavaScript detects `onclose` with automatic reconnection.
- **Exceptions:** Short-lived connections that complete within seconds (not applicable).
- **Consequences of Violation:** Connection tables fill with zombie entries, Redis pub/sub channels accumulate stale subscribers, and memory usage grows unbounded.

### R4: Use private channels for all user-specific or session-specific AI data
- **Category:** Security
- **Rule:** Broadcast AI streaming responses and tool call events on private channels scoped to the specific user or session; never use public channels for any AI-related data.
- **Reason:** AI responses may contain personal data, proprietary business logic, or system status information. Public channels expose this data to all connected subscribers.
- **Bad Example:** Broadcasting AI stream tokens to a public channel named `ai-responses` where any subscriber receives all users' responses.
- **Good Example:** `new PrivateChannel("ai-session.{$sessionId}")` with authorization callback validating the authenticated user owns the session.
- **Exceptions:** System-wide status events (model availability, maintenance notices) on public channels.
- **Consequences of Violation:** Cross-user data leakage, GDPR/CCPA violations, and exposure of business-sensitive AI outputs to unauthorized users.

### R5: Always implement client-side reconnection logic with session resumption
- **Category:** UX
- **Rule:** Implement automatic WebSocket reconnection on the client with exponential backoff (1s → 2s → 4s → 10s max) and a session resumption mechanism that restores the AI conversation state.
- **Reason:** WebSocket connections drop frequently due to network instability, proxies, and server restarts. Without reconnection, users lose AI sessions mid-conversation.
- **Bad Example:** A chat UI that shows a permanent "Connection Lost" error and requires the user to refresh the page.
- **Good Example:** JavaScript reconnection with backoff that sends the last received event ID on reconnect, and the server replays missed events.
- **Exceptions:** Short-lived AI queries under 10 seconds where the cost of reconnection logic exceeds the benefit.
- **Consequences of Violation:** Poor user retention, lost conversation state, and repeated "it disconnected" support tickets.

### R6: Implement server-side backpressure when tokens arrive faster than the client consumes them
- **Category:** Performance
- **Rule:** Monitor WebSocket buffer size on the server and skip, batch, or rate-limit tokens when the client's receive buffer exceeds a threshold.
- **Reason:** Fast LLM providers (100+ t/s) can overwhelm slow clients or congested networks, causing out-of-memory conditions on the server as the send buffer grows unbounded.
- **Bad Example:** Pushing every generated token immediately into the WebSocket send buffer without checking the buffer depth.
- **Good Example:** Buffering tokens server-side and flushing at 50ms intervals or when the buffer reaches 5 tokens, with a maximum buffer size that triggers token dropping.
- **Exceptions:** Internal server-to-server WebSocket connections on the same high-speed network.
- **Consequences of Violation:** Server memory exhaustion from unbounded send buffers, degraded performance for other connected clients, and potential application crash.
