## Use Reverb for High-Concurrency or Long-Running Streams

---
## Category
Scalability | Architecture

---
## Rule
Use Reverb (WebSocket) for high-concurrency streaming (>50 concurrent users) or responses lasting >30 seconds; use SSE for simple, low-concurrency streaming.

---
## Reason
SSE holds a PHP-FPM worker for the entire stream duration, limiting concurrency to `pm.max_children`. Reverb is event-driven — a single process handles thousands of connections. For long streams, SSE holds the worker for too long, blocking other requests.

---
## Bad Example
```php
// SSE for 100 concurrent users with 60-second responses
// 100 FPM workers occupied — likely exhausts pool
return (new Agent)->stream($input);
```

---
## Good Example
```php
// Reverb for high-concurrency streaming
$agent->broadcastOnQueue($input, 'conversation.' . $conversationId);
// Agent runs in queue worker — no FPM worker held
// Reverb fans out tokens to all subscribers
```

---
## Exceptions
Low-traffic applications (<20 concurrent users) with short responses (<10s) may use SSE.

---
## Consequences Of Violation
Worker pool exhaustion under concurrent streaming load, degraded application, blocked API requests.

---

## Use Private Channels for Authenticated Access

---
## Category
Security

---
## Rule
Broadcast streaming tokens on private or presence channels scoped to the authenticated user; never broadcast AI responses on public channels.

---
## Reason
AI responses may contain sensitive information. Public channels allow anyone with the channel name to listen in. Private channels require authentication, ensuring only the intended recipient receives the stream.

---
## Bad Example
```php
// Public channel — anyone can listen
broadcast(new StreamTokensEvent('chat.general', $tokens));
```

---
## Good Example
```php
// Private channel — only authenticated user can listen
broadcast(new StreamTokensEvent(
    'private-conversation.' . $conversationId,
    $tokens,
));

// Client subscribes via Echo:
Echo.private('conversation.' + conversationId)
    .listen('.stream.tokens', (e) => appendTokens(e.tokens));
```

---
## Exceptions
Public AI features (shared demo, public kiosk) may use presence channels with documented visibility.

---
## Consequences Of Violation
Data leakage of AI responses to unauthorized listeners, compliance violations.

---

## Broadcast Tool Execution Progress Events

---
## Category
Design | User Experience

---
## Rule
Broadcast separate events for agent state transitions (thinking, tool executing, tool completed, error) in addition to content tokens; never leave users in the dark during tool execution pauses.

---
## Reason
During tool execution, the stream pauses while the tool runs (500ms-5s). Without progress events, the user sees a stalled stream and may think the application is broken.

---
## Bad Example
```php
// Only broadcasts tokens — silent pause during tool execution
foreach ($stream as $chunk) {
    broadcast(new StreamTokensEvent($channel, $chunk->content));
}
```

---
## Good Example
```php
broadcast(new StreamStatusEvent($channel, 'thinking'));

foreach ($stream as $chunk) {
    if ($chunk->hasToolCalls()) {
        broadcast(new StreamStatusEvent($channel, 'tool_executing', [
            'tool' => $chunk->toolCalls[0]['name'],
        ]));
        // Execute tool...
        broadcast(new StreamStatusEvent($channel, 'tool_completed'));
    }

    if ($chunk->content) {
        broadcast(new StreamTokensEvent($channel, $chunk->content));
    }
}

broadcast(new StreamDoneEvent($channel));
```

---
## Exceptions
Simple text-only streams with no tool calls may skip status events.

---
## Consequences Of Violation
Users see stalled streams and think the application is broken, poor perceived responsiveness.

---

## Implement Client Reconnection Handling

---
## Category
Reliability

---
## Rule
Implement automatic WebSocket reconnection on the client side with session resumption; never assume the WebSocket will stay connected.

---
## Reason
WebSocket connections can drop due to network issues, proxy timeouts, or server restarts. Without reconnection, the user loses the stream and sees an incomplete response with no way to recover.

---
## Bad Example
```javascript
// No reconnection — connection loss = incomplete response
const ws = new WebSocket(url);
ws.onmessage = (e) => appendTokens(e.data);
```

---
## Good Example
```javascript
class ReconnectingWebSocket {
    connect() {
        this.ws = new WebSocket(url + '?session=' + this.sessionId);
        this.ws.onclose = () => {
            setTimeout(() => this.connect(), 1000); // Auto-reconnect
        };
        this.ws.onmessage = (e) => {
            if (e.data.type === 'reconnect') {
                // Server sends missed tokens on reconnect
            }
            appendTokens(e.data);
        };
    }
}
```

---
## Exceptions
Stateless streaming demos where incomplete responses are acceptable may skip reconnection.

---
## Consequences Of Violation
Users see incomplete responses on connection loss, frustration, repeated manual refreshes.

---

## Use Dedicated Queue for AI Streaming Jobs

---
## Category
Scalability

---
## Rule
Dispatch agent jobs to a dedicated queue (`--queue=ai-streaming`) with appropriate timeout configuration; never use the default queue for streaming agent jobs.

---
## Reason
Agent streaming jobs are long-running (30-300s) and have different resource profiles than short queue jobs. A dedicated queue prevents streaming jobs from blocking short jobs and allows independent scaling of streaming workers.

---
## Bad Example
```php
// Default queue — streaming jobs block short jobs
dispatch(new AgentJob($input))->onQueue('default');
```

---
## Good Example
```php
// Dedicated queue with appropriate workers
dispatch(new AgentJob($input))->onQueue('ai-streaming');

// Supervisor config:
// [program:ai-streaming-worker]
// command=php artisan queue:work --queue=ai-streaming --timeout=300
// numprocs=10
```

---
## Exceptions
Low-traffic applications with few agent jobs may use the default queue.

---
## Consequences Of Violation
Short queue jobs delayed by long-running streaming jobs, queue backpressure, degraded application performance.
