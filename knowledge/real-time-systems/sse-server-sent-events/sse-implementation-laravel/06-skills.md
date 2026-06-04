# Skill: Implement Native SSE in Laravel with response()->stream()

## Purpose
Build server-sent event endpoints using Laravel's `response()->stream()` for unidirectional real-time data push over standard HTTP.

## When To Use
- AI response streaming (LLM token streaming)
- Live notification feeds and dashboard metrics
- Live build/deployment logs (CI/CD pipeline output)
- Any unidirectional server-to-client real-time use case

## When NOT To Use
- Bidirectional communication (use WebSocket)
- Binary data streaming (SSE is text-only)
- Applications needing a channel subscription model (use broadcasting)
- High-frequency updates requiring <10ms latency

## Prerequisites
- Laravel application with route for SSE endpoint
- PHP-FPM or Octane runtime
- Nginx or compatible web server

## Inputs
- SSE route definition
- Stream callback function
- Event data source (database, Redis, in-memory)

## Workflow
1. Create a GET route returning `response()->stream($callback, 200, $headers)`
2. Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`
3. Implement the stream loop with a maximum duration ceiling (e.g., 60 seconds)
4. Check `connection_aborted()` in the loop to stop when client disconnects
5. Write events in SSE format: `event: name\nid: 123\ndata: {...}\n\n`
6. Call `ob_flush()` and `flush()` after each event for immediate delivery
7. Send periodic heartbeat comments (`: heartbeat\n\n`) every 5-10 seconds
8. Implement `Last-Event-ID` replay: store events with IDs, replay missed on reconnect
9. Apply rate limiting to the SSE endpoint
10. On frontend: use `EventSource` API with event listeners

## Validation Checklist
- [ ] SSE endpoint uses `Content-Type: text/event-stream`
- [ ] `X-Accel-Buffering: no` header set for Nginx
- [ ] `ob_flush()` and `flush()` called after each event
- [ ] Connection duration ceiling implemented (MAX_DURATION, not `set_time_limit(0)`)
- [ ] `connection_aborted()` checked in stream loop
- [ ] Heartbeat events implemented (every 5-10s)
- [ ] Rate limiting configured on SSE endpoint
- [ ] `proxy_read_timeout` set higher than MAX_DURATION

## Common Failures
| Failure | Likely Cause | Diagnostic |
|--------|-------------|------------|
| Events arrive in bursts | Nginx buffering enabled | Set `X-Accel-Buffering: no` header |
| Events never reach client | PHP output buffering not flushed | Call `ob_flush()` and `flush()` after each write |
| Workers exhausted after hours | No MAX_DURATION ceiling | Implement connection duration limit |
| Client reconnects infinitely | No heartbeat causes proxy timeout | Send `: heartbeat\n\n` every 5-10s |
| Missed events on reconnect | No `Last-Event-ID` replay | Store events by ID, replay on reconnect |

## Decision Points
- **Duration ceiling**: 60s is a good default—`EventSource` auto-reconnects, so the client experience is seamless
- **Heartbeat interval**: Every 5-10s prevents proxy timeouts without excessive traffic
- **Event ID strategy**: Use monotonically increasing integers or timestamps for `Last-Event-ID` replay

## Performance/Security Considerations
- Each SSE connection holds one PHP-FPM worker—size `pm.max_children` accordingly
- Output buffering must be disabled (`output_buffering = Off` or `ob_end_flush()`)
- Rate limit SSE endpoints to prevent connection exhaustion attacks
- HTTP/2 removes the browser's 6-connection-per-domain SSE limit

## Related Rules (from 05-rules.md)
- Always Set `Content-Type: text/event-stream` and Required Headers
- Always Set a Maximum Connection Duration
- Always Check `connection_aborted()` in the Stream Loop
- Always Implement Heartbeat Events
- Always Call `ob_flush()` and `flush()` After Each Event
- Always Implement Rate Limiting on SSE Endpoints
- Always Use `Last-Event-ID` for Missed Event Replay

## Related Skills
- Integrate Laravel Wave SSE Package for Echo-Compatible Streaming
- Choose Between WebSocket, SSE, and Polling Transports

## Success Criteria
- SSE endpoint streams events in real-time to connected clients
- Client auto-reconnects via `EventSource` after disconnection
- No PHP-FPM worker exhaustion (duration ceiling enforced)
- Missed events are replayed on reconnect via `Last-Event-ID`
