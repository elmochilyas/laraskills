## Configure Nginx for SSE Before Deploying

---
## Category
Infrastructure | Reliability

---
## Rule
Set `proxy_buffering off;` and send `X-Accel-Buffering: no` header for SSE endpoints; never deploy SSE streaming without Nginx configuration.

---
## Reason
Default Nginx buffering accumulates the entire response before sending. For SSE, this means the user sees nothing until generation completes — defeating the purpose of streaming.

---
## Bad Example
```php
// No Nginx config — default buffering kills streaming
return response()->stream(function () { /* ... */ }, 200, [
    'Content-Type' => 'text/event-stream',
]);
```

---
## Good Example
```php
// Nginx config (location /ai/stream):
// proxy_buffering off;
// proxy_cache off;
// proxy_read_timeout 120s;

// Laravel sets header:
return response()->stream(function () { /* ... */ }, 200, [
    'Content-Type' => 'text/event-stream',
    'Cache-Control' => 'no-cache',
    'X-Accel-Buffering' => 'no',
]);
```

---
## Exceptions
Development environments not behind Nginx may skip proxy configuration.

---
## Consequences Of Violation
Tokens arrive in bursts or all at once, no perceived streaming benefit, poor user experience.

---

## Disable PHP Output Buffering for Streaming

---
## Category
Performance

---
## Rule
Disable PHP output buffering at the start of streaming responses; never let PHP buffer accumulate tokens.

---
## Reason
PHP enables output buffering by default, accumulating output until the buffer is full or the request completes. For streaming, this causes tokens to arrive in bursts instead of real-time, increasing perceived latency.

---
## Bad Example
```php
public function stream(): void {
    foreach ($this->llm->stream($request) as $chunk) {
        echo "data: {$chunk->content}\n\n";
        // No flush — tokens accumulate in buffer
    }
}
```

---
## Good Example
```php
public function stream(): void {
    ob_implicit_flush(true);
    ob_end_flush(); // Disable output buffering

    foreach ($this->llm->stream($request) as $chunk) {
        echo "data: " . json_encode(['content' => $chunk->content]) . "\n\n";
        flush();
    }
}
```

---
## Exceptions
When using Octane or RoadRunner, output buffering is handled differently — use the framework's streaming primitives.

---
## Consequences Of Violation
Tokens arrive in large bursts, poor perceived latency, user sees delayed incremental updates.

---

## Check connection_aborted() to Stop on Disconnect

---
## Category
Cost | Reliability

---
## Rule
Check `connection_aborted()` after every token and break the stream loop when the client disconnects; never continue streaming tokens to a disconnected client.

---
## Reason
Streaming generates tokens that cost money per token. If the client closes the connection (navigates away, closes tab) and the server continues streaming, those tokens are wasted and the cost is unrecoverable.

---
## Bad Example
```php
foreach ($this->provider->stream($request) as $chunk) {
    echo "data: {$chunk->content}\n\n";
    flush();
    // Continues streaming even after client disconnects — wasted cost
}
```

---
## Good Example
```php
foreach ($this->provider->stream($request) as $chunk) {
    if (connection_aborted()) {
        break; // Stop streaming — save cost
    }
    echo "data: {$chunk->content}\n\n";
    flush();
}
```

---
## Exceptions
When using async streaming (queue + WebSocket), use a cancellation flag in Redis instead of `connection_aborted()`.

---
## Consequences Of Violation
Wasted tokens and API cost for disconnected clients, unnecessary provider load, inflated bills.

---

## Use Dedicated PHP-FPM Pool for Streaming

---
## Category
Scalability

---
## Rule
Configure a separate PHP-FPM pool with dedicated `pm.max_children` for streaming endpoints; never let streaming exhaust the main application's worker pool.

---
## Reason
Each SSE stream holds a PHP-FPM worker for the entire duration (potentially 30-300 seconds). If streaming shares the main pool, streaming clients can exhaust all workers, starving regular HTTP requests.

---
## Bad Example
```php
// Single pool — streaming steals workers from API requests
pm.max_children = 50
// All 50 could be occupied by streaming, blocking API calls
```

---
## Good Example
```php
; www.conf (main pool)
[www]
pm.max_children = 30

; streaming.conf (dedicated streaming pool)
[streaming]
listen = /run/php/php8.3-fpm-streaming.sock
pm.max_children = 20
pm.max_requests = 50

; Nginx routes /ai/stream to streaming pool
; location /ai/stream {
;     fastcgi_pass unix:/run/php/php8.3-fpm-streaming.sock;
; }
```

---
## Exceptions
Low-traffic applications with ample worker capacity may use a shared pool.

---
## Consequences Of Violation
Worker pool exhaustion, blocked API requests, degraded application responsiveness under streaming load.

---

## Set Appropriate Timeouts for Streaming

---
## Category
Reliability

---
## Rule
Configure `max_execution_time`, `proxy_read_timeout`, and FastCGI timeouts to match the longest expected stream duration (60-300s); never use default 30s timeouts for streaming endpoints.

---
## Reason
Default timeouts (30s) kill streaming connections mid-response. Long responses (complex analysis, long-form generation) need 60-300s to complete. Premature timeout drops the connection and wastes partial generation.

---
## Bad Example
```php
// Default 30s timeout — kills streams over 30 seconds
// php.ini: max_execution_time = 30
```

---
## Good Example
```php
// In Nginx config for streaming location:
location /ai/stream {
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
    fastcgi_read_timeout 120s;
}

// In PHP (streaming endpoint only):
public function stream(): void {
    set_time_limit(120); // Allow 120 seconds for this stream
    // ...
}
```

---
## Exceptions
Short-response streams (under 10s expected) may use default timeouts.

---
## Consequences Of Violation
Streams dropped mid-response, users see incomplete responses, wasted partial generation costs.

---

## Send Error Events During Stream, Don't Drop Connection

---
## Category
Reliability

---
## Rule
When an error occurs during streaming, send an error SSE event to the client and close gracefully; never drop the connection without explanation.

---
## Reason
A dropped connection leaves the client hanging indefinitely or displaying a partial, potentially misleading response. An error event enables the client to display a clear error message and retry if appropriate.

---
## Bad Example
```php
foreach ($this->provider->stream($request) as $chunk) {
    if ($chunk->error) {
        die(); // Abruptly kills connection — client has no context
    }
    echo "data: {$chunk->content}\n\n";
    flush();
}
```

---
## Good Example
```php
try {
    foreach ($this->provider->stream($request) as $chunk) {
        if (connection_aborted()) break;
        echo "data: " . json_encode(['content' => $chunk->content]) . "\n\n";
        flush();
    }
} catch (\Exception $e) {
    echo "event: error\n";
    echo "data: " . json_encode(['message' => 'Generation failed, please retry']) . "\n\n";
    flush();
}

echo "event: done\n";
echo "data: {}\n\n";
flush();
```

---
## Exceptions
Security-critical errors (authentication failure) should not reveal details in the error event.

---
## Consequences Of Violation
Client displays incomplete response, confusion about what happened, poor user experience.
