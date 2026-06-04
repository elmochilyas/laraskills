# Metadata
Domain: Real-Time Systems
Subdomain: SSE (Server-Sent Events)
Knowledge Unit: SSE Implementation in Laravel
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Server-Sent Events (SSE) enable unidirectional real-time data flow from server to client over standard HTTP using the `text/event-stream` content type. Laravel implements SSE via `response()->stream()` (Symfony `StreamedResponse`), allowing the server to push events to the client without WebSocket infrastructure. SSE requires specific HTTP headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no` for Nginx), proper output flushing (`ob_flush()`, `flush()`), and a streaming client (`EventSource` API or `fetch` with `ReadableStream`). The SSE protocol supports named events, auto-reconnection via `Last-Event-ID`, configurable retry intervals, and event IDs for resume semantics. Laravel 11+ enhanced SSE support with the `eventStream()` method (custom event names, start/end stream messages). Primary use cases include AI token streaming, live notification feeds, and real-time dashboard updates.

## Core Concepts
SSE is pure HTTP streaming. The server opens a response, sets the content type, and writes event data as it becomes available. The client reads the stream incrementally. The `EventSource` API is the browser-native consumer, handling reconnection automatically. Unlike WebSocket, SSE is strictly one-way (server to client); client-to-server communication requires separate HTTP requests. SSE uses standard HTTP ports and protocols, making it compatible with all existing infrastructure (proxies, CDNs, load balancers) without special configuration. The `retry` field controls reconnection timing, and the `id` field enables missed event replay.

## Mental Models
SSE is a "data faucet." The server turns on the tap (opens the response) and data drips out as events occur. The client (EventSource) catches each drip. If the tap is temporarily turned off (connection drops), the client automatically reopens it and asks for any drips it missed (via Last-Event-ID).

## Internal Mechanics
The Laravel `response()->stream()` creates a `StreamedResponse` with a callback. Inside the callback, a loop (or event listener) writes data to stdout using echo(). The data must follow SSE format: `data: payload\n\n` for a simple event, `event: name\ndata: payload\n\n` for a named event, `id: 123\n` for event ID, `retry: 5000\n` for reconnection timing. The `ob_flush()` and `flush()` calls force PHP to send buffered output to the client immediately. For Nginx, `X-Accel-Buffering: no` prevents Nginx from buffering the streamed response. The browser's `EventSource` API reads the stream, parses the SSE format, and emits JavaScript events for each received message.

## Patterns
- **`response()->stream()` for raw SSE**: Full control over output format and timing
- **`eventStream()` for structured SSE**: Laravel 11+ helper with custom event name support
- **Heartbeat events**: Periodic comments (`: heartbeat\n\n`) to keep connections alive and prevent proxy timeouts
- **Connection duration ceiling**: Close SSE connection after a maximum duration (e.g., 60s) to prevent worker exhaustion; client reconnects automatically
- **`Last-Event-ID` replay**: Server stores events in a buffer (Redis list/database) and replays missed events on reconnect

## Architectural Decisions
- **Standard HTTP infrastructure**: SSE works through any HTTP proxy, CDN, or load balancer without special config (unlike WebSocket upgrades)
- **No queue worker needed**: SSE streams directly from the PHP process; no queue-based event pipeline (unless replay is needed)
- **PHP-FPM connection impact**: Each SSE connection holds one PHP-FPM worker for its duration; worker pool must be sized accordingly

## Tradeoffs
- **Unidirectional only**: Cannot receive real-time data from client; requires separate HTTP POST requests for client input
- **HTTP/1.1 connection limit**: Browsers limit 6 concurrent SSE connections per domain (HTTP/2 removes this via multiplexing)
- **Worker hold**: Each SSE connection occupies one PHP-FPM worker thread; scaling requires significant worker pool
- **No binary data**: SSE is text-only (UTF-8); binary data must be Base64-encoded
- **No built-in event fan-out**: Unlike WebSocket broadcasting, SSE has no built-in channel subscription model; must implement custom pub/sub for multi-client streams

## Performance Considerations
- Each SSE connection holds a PHP-FPM worker; `pm.max_children` must accommodate expected concurrent connections
- Memory per connection: minimal (stream overhead + event buffer)
- CPU per connection: low during idle (heartbeat only); spikes during event bursts
- Nginx `proxy_buffering off` prevents buffer allocation for streamed responses
- `set_time_limit(0)` should be avoided; use MAX_DURATION ceiling to free workers
- Output buffering must be disabled (`output_buffering = Off` in php.ini or `ob_end_flush()` at stream start)

## Production Considerations
- Set `proxy_read_timeout` higher than your MAX_DURATION (Nginx default 60s kills SSE streams)
- Add `X-Accel-Buffering: no` header for Nginx compatibility
- Implement heartbeat intervals (every 5-10s) to keep proxy/ALB connection timeout from triggering
- Rate limit SSE endpoints to prevent abuse (open connections as a DoS vector)
- Use `connection_aborted()` check in the stream loop to detect client disconnection
- Store events in Redis with TTL for `Last-Event-ID` replay on reconnect
- Monitor PHP-FPM worker utilization—SSE connections count against total worker pool

## Common Mistakes
- Forgetting `X-Accel-Buffering: no` header (Nginx buffers the stream; events arrive in bursts or not at all)
- Not calling `ob_flush()` and `flush()` after each event (data stays in PHP buffer)
- Using `set_time_limit(0)` without a MAX_DURATION (workers held indefinitely)
- Relying on `EventSource` for POST endpoints (EventSource only supports GET)
- Not checking `connection_aborted()` in the loop (wasted CPU sending to disconnected clients)

## Failure Modes
- **PHP-FPM worker exhaustion**: SSE connections consume all available workers; HTTP requests queue up
- **Nginx timeout**: `proxy_read_timeout` expires before heartbeat; connection dropped
- **Output buffer overflow**: Rapid events fill the output buffer; PHP blocks on write
- **Client disconnect not detected**: `connection_aborted()` not checked; server continues writing to dead connection
- **Replay buffer overflow**: Event history buffer in Redis exceeds memory limits

## Ecosystem Usage
- AI response streaming (Claude, GPT, other LLM token streaming)
- Live notification feeds (unread count, new notification alerts)
- Real-time dashboard metrics (system load, request rate, error count)
- Live build/deployment logs (CI/CD pipeline output streaming)
- Progress indicators for long-running server processes

## Related Knowledge Units
- K17: Laravel Wave SSE Package
- K18: WebSocket vs SSE vs Polling Decision Framework
- K20: Real-Time Dashboard Architecture

## Research Notes
SSE has seen a resurgence driven by AI streaming (ChatGPT, Claude, and Gemini all use SSE). Laravel 11's `eventStream()` method was enhanced via PR #54726 to support custom event names and start/end stream messages. The HTTP/2 adoption rate (70%+ as of 2026) removes the 6-connection-per-domain limitation. SSE is increasingly seen as the correct default for unidirectional real-time use cases, with WebSocket reserved for bidirectional scenarios. The OWASP SSE security considerations include rate limiting and connection monitoring.
