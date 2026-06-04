# Decomposition: Sse Implementation Laravel

## Topic Overview
Server-Sent Events (SSE) enable unidirectional real-time data flow from server to client over standard HTTP using the `text/event-stream` content type. Laravel implements SSE via `response()->stream()` (Symfony `StreamedResponse`), allowing the server to push events to the client without WebSocket infrastructure. SSE requires specific HTTP headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no` for Nginx), proper output flushing (`ob_flush()`, `flush()`)...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
sse-server-sent-events/K16-sse-implementation-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sse Implementation Laravel
- **Purpose:** Server-Sent Events (SSE) enable unidirectional real-time data flow from server to client over standard HTTP using the `text/event-stream` content type. Laravel implements SSE via `response()->stream()` (Symfony `StreamedResponse`), allowing the server to push events to the client without WebSocket infrastructure. SSE requires specific HTTP headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no` for Nginx), proper output flushing (`ob_flush()`, `flush()`)...
- **Difficulty:** Intermediate
- **Dependencies:
  - K17: Laravel Wave SSE Package
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K20: Real-Time Dashboard Architecture

## Dependency Graph
**Depends on:**
  - K17: Laravel Wave SSE Package
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K20: Real-Time Dashboard Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **`response()->stream()` for raw SSE**: Full control over output format and timing**`eventStream()` for structured SSE**: Laravel 11+ helper with custom event name support**Heartbeat events**: Periodic comments (`: heartbeat\n\n`) to keep connections alive and prevent proxy timeouts**Connection duration ceiling**: Close SSE connection after a maximum duration (e.g., 60s) to prevent worker exhaustion; client reconnects automatically**`Last-Event-ID` replay**: Server stores events in a buffer (Redis list/database) and replays missed events on reconnect**Standard HTTP infrastructure**: SSE works through any HTTP proxy, CDN, or load balancer without special config (unlike WebSocket upgrades)**No queue worker needed**: SSE streams directly from the PHP process; no queue-based event pipeline (unless replay is needed)**PHP-FPM connection impact**: Each SSE connection holds one PHP-FPM worker for its duration; worker pool must be sized accordingly**Unidirectional only**: Cannot receive real-time data from client; requires separate HTTP POST requests for client input**HTTP/1.1 connection limit**: Browsers limit 6 concurrent SSE connections per domain (HTTP/2 removes this via multiplexing)**Worker hold**: Each SSE connection occupies one PHP-FPM worker thread; scaling requires significant worker pool**No binary data**: SSE is text-only (UTF-8); binary data must be Base64-encoded**No built-in event fan-out**: Unlike WebSocket broadcasting, SSE has no built-in channel subscription model; must implement custom pub/sub for multi-client streamsEach SSE connection holds a PHP-FPM worker; `pm.max_children` must accommodate expected concurrent connectionsMemory per connection: minimal (stream overhead + event buffer)CPU per connection: low during idle (heartbeat only); spikes during event burstsNginx `proxy_buffering off` prevents buffer allocation for streamed responses`set_time_limit(0)` should be avoided; use MAX_DURATION ceiling to free workersOutput buffering must be disabled (`output_buffering = Off` in php.ini or `ob_end_flush()` at stream start)Set `proxy_read_timeout` higher than your MAX_DURATION (Nginx default 60s kills SSE streams)Add `X-Accel-Buffering: no` header for Nginx compatibilityImplement heartbeat intervals (every 5-10s) to keep proxy/ALB connection timeout from triggeringRate limit SSE endpoints to prevent abuse (open connections as a DoS vector)Use `connection_aborted()` check in the stream loop to detect client disconnectionStore events in Redis with TTL for `Last-Event-ID` replay on reconnectMonitor PHP-FPM worker utilization—SSE connections count against total worker poolForgetting `X-Accel-Buffering: no` header (Nginx buffers the stream; events arrive in bursts or not at all)Not calling `ob_flush()` and `flush()` after each event (data stays in PHP buffer)Using `set_time_limit(0)` without a MAX_DURATION (workers held indefinitely)Relying on `EventSource` for POST endpoints (EventSource only supports GET)Not checking `connection_aborted()` in the loop (wasted CPU sending to disconnected clients)**PHP-FPM worker exhaustion**: SSE connections consume all available workers; HTTP requests queue up**Nginx timeout**: `proxy_read_timeout` expires before heartbeat; connection dropped**Output buffer overflow**: Rapid events fill the output buffer; PHP blocks on write**Client disconnect not detected**: `connection_aborted()` not checked; server continues writing to dead connection**Replay buffer overflow**: Event history buffer in Redis exceeds memory limitsAI response streaming (Claude, GPT, other LLM token streaming)Live notification feeds (unread count, new notification alerts)Real-time dashboard metrics (system load, request rate, error count)Live build/deployment logs (CI/CD pipeline output streaming)Progress indicators for long-running server processesK17: Laravel Wave SSE PackageK18: WebSocket vs SSE vs Polling Decision FrameworkK20: Real-Time Dashboard Architecture

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization