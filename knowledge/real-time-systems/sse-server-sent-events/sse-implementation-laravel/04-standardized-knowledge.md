# Standardized Knowledge: SSE Implementation in Laravel

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | SSE (Server-Sent Events) |
| Knowledge Unit ID | K16 |
| Title | SSE Implementation in Laravel |
| Difficulty | Intermediate |
| Dependencies | K17, K18, K20 |

## Overview
Server-Sent Events (SSE) enable unidirectional real-time data flow from server to client over standard HTTP using the `text/event-stream` content type. Laravel implements SSE via `response()->stream()` (Symfony `StreamedResponse`), allowing the server to push events without WebSocket infrastructure. SSE requires specific HTTP headers, proper output flushing, and a streaming client (`EventSource` API or `fetch` with `ReadableStream`). The SSE protocol supports named events, auto-reconnection via `Last-Event-ID`, and configurable retry intervals.

## Core Concepts
- SSE is pure HTTP streaming: server opens a response, sets content type, writes event data as available
- `EventSource` API is the browser-native consumer, handling reconnection automatically
- Unlike WebSocket, SSE is strictly one-way (server to client); client communication requires separate HTTP requests
- SSE uses standard HTTP ports and protocols, compatible with all existing infrastructure
- `retry` field controls reconnection timing; `id` field enables missed event replay

## When To Use
- AI response streaming (LLM token streaming)
- Live notification feeds (unread count, new notification alerts)
- Real-time dashboard metrics (system load, request rate, error count)
- Live build/deployment logs (CI/CD pipeline output)
- Any unidirectional server-to-client real-time use case

## When NOT To Use
- Bidirectional communication (chat, collaborative editing)—use WebSocket
- Binary data streaming (SSE is text-only; binary must be Base64-encoded)
- High-frequency updates requiring <10ms latency (WebSocket is more efficient)
- Applications needing built-in channel subscription model (WebSocket broadcasting)

## Best Practices (Why)
- **Use `response()->stream()` for full control**: Provides direct control over output format and timing; `eventStream()` helper for structured SSE in Laravel 11+
- **Implement heartbeat events**: Periodic comments (`: heartbeat\n\n`) keep connections alive and prevent proxy timeouts
- **Set connection duration ceiling**: Close SSE after a maximum duration (e.g., 60s) to prevent PHP-FPM worker exhaustion; client reconnects automatically via EventSource
- **Check `connection_aborted()` in the stream loop**: Prevents wasted CPU sending to disconnected clients
- **Set `X-Accel-Buffering: no` for Nginx**: Prevents Nginx from buffering the streamed response—events arrive in real-time

## Architecture Guidelines
- Each SSE connection holds one PHP-FPM worker; size `pm.max_children` accordingly
- No queue worker needed for basic SSE (streams directly from PHP process)
- SSE works through any HTTP proxy, CDN, or load balancer without special WebSocket configuration
- For `Last-Event-ID` replay, store events in Redis with TTL

## Performance Considerations
- Memory per connection: minimal (stream overhead + event buffer)
- CPU per connection: low during idle (heartbeat only); spikes during event bursts
- Nginx `proxy_buffering off` prevents buffer allocation for streamed responses
- `set_time_limit(0)` should be avoided; use MAX_DURATION ceiling to free workers
- Output buffering must be disabled (`output_buffering = Off` in php.ini or `ob_end_flush()`)

## Security Considerations
- Rate limit SSE endpoints to prevent abuse (open connections as DoS vector)
- Validate authentication before establishing the SSE stream
- Do not expose sensitive data in SSE event streams without proper authorization
- Monitor PHP-FPM worker utilization—SSE connections count against total worker pool

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Missing X-Accel-Buffering header | Nginx buffers stream; events arrive in bursts or not at all | Not configuring Nginx for SSE | Users see delayed or no updates | Set `X-Accel-Buffering: no` header |
| Not calling ob_flush() and flush() | Data stays in PHP buffer | Missing flush calls after each event | Events never reach client | Flush output after each event write |
| set_time_limit(0) without MAX_DURATION | Workers held indefinitely | Not setting a connection ceiling | Worker pool exhaustion, HTTP requests queue up | Use a MAX_DURATION ceiling |
| EventSource for POST endpoints | EventSource only supports GET | Not understanding EventSource limitations | Requests fail | Use GET for SSE streams; POST for client input |
| Not checking connection_aborted() | Wasted CPU sending to disconnected clients | Missing connection check | Resource waste, slow server | Check `connection_aborted()` in the stream loop |

## Anti-Patterns
- **Long-lived SSE connections without heartbeat**: Proxy and load balancer timeouts will kill idle connections
- **No rate limiting on SSE endpoints**: Attackers can exhaust PHP-FPM workers by opening many connections
- **Blocking operations in the stream loop**: Slow database queries or API calls block the event loop for all connected clients

## Examples

### Basic Laravel SSE endpoint
```php
Route::get('/events/stream', function () {
    response()->stream(function () {
        $maxDuration = 60; // seconds
        $start = time();

        header('X-Accel-Buffering: no');
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');

        while ((time() - $start) < $maxDuration) {
            if (connection_aborted()) {
                break;
            }

            $event = getLatestEvent();
            if ($event) {
                echo "event: update\n";
                echo "id: {$event['id']}\n";
                echo "data: " . json_encode($event) . "\n\n";
                ob_flush();
                flush();
            }

            // Heartbeat
            echo ": heartbeat\n\n";
            ob_flush();
            flush();

            sleep(1);
        }
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache',
        'X-Accel-Buffering' => 'no',
    ]);
});
```

### Frontend EventSource listener
```javascript
const eventSource = new EventSource('/events/stream');
let lastEventId = null;

eventSource.addEventListener('update', (event) => {
    lastEventId = event.lastEventId;
    const data = JSON.parse(event.data);
    updateUI(data);
});

eventSource.onerror = () => {
    // EventSource auto-reconnects; Last-Event-ID header sent automatically
    console.log('Connection lost, reconnecting...');
};
```

## Related Topics
- K17: Laravel Wave SSE Package
- K18: WebSocket vs SSE vs Polling Decision Framework
- K20: Real-Time Dashboard Architecture

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- SSE has seen resurgence driven by AI streaming (ChatGPT, Claude, Gemini all use SSE)
- HTTP/2 adoption (70%+ as of 2026) removes the 6-connection-per-domain limitation
- SSE is increasingly seen as the correct default for unidirectional real-time use cases

## Verification
- [ ] SSE endpoint uses `Content-Type: text/event-stream`
- [ ] `X-Accel-Buffering: no` header set for Nginx
- [ ] `ob_flush()` and `flush()` called after each event
- [ ] Connection duration ceiling implemented (MAX_DURATION)
- [ ] `connection_aborted()` checked in stream loop
- [ ] Heartbeat events implemented (every 5-10s)
- [ ] Rate limiting configured on SSE endpoint
- [ ] `proxy_read_timeout` set higher than MAX_DURATION
- [ ] Output buffering disabled in PHP config
