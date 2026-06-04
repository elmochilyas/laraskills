# Metadata

**Domain:** real-time-systems
**Subdomain:** sse-server-sent-events
**Knowledge Unit:** sse-implementation-laravel
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `connection_aborted()` checked in stream loop
- [ ] `ob_flush()` and `flush()` called after each event
- [ ] `proxy_read_timeout` set higher than MAX_DURATION
- [ ] Always Call ob_flush() and flush() After Each Event
- [ ] Always Check connection_aborted() in the Stream Loop
- [ ] Always Implement Heartbeat Events
- [ ] Always Implement Rate Limiting on SSE Endpoints
- [ ] Always Set a Maximum Connection Duration
- [ ] `connection_aborted()` checked in stream loop
- [ ] `ob_flush()` and `flush()` called after each event
- [ ] `proxy_read_timeout` set higher than MAX_DURATION
- [ ] Apply rate limiting to the SSE endpoint
- [ ] Call `ob_flush()` and `flush()` after each event for immediate delivery
- [ ] Check `connection_aborted()` in the loop to stop when client disconnects
- [ ] Client auto-reconnects via `EventSource` after disconnection
- [ ] Missed events are replayed on reconnect via `Last-Event-ID`
- [ ] No PHP-FPM worker exhaustion (duration ceiling enforced)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Apply rate limiting to the SSE endpoint
- [ ] Call `ob_flush()` and `flush()` after each event for immediate delivery
- [ ] Check `connection_aborted()` in the loop to stop when client disconnects
- [ ] Create a GET route returning `response()->stream($callback, 200, $headers)`
- [ ] Implement `Last-Event-ID` replay: store events with IDs, replay missed on reconnect
- [ ] Implement the stream loop with a maximum duration ceiling (e.g., 60 seconds)
- [ ] On frontend: use `EventSource` API with event listeners
- [ ] Send periodic heartbeat comments (`: heartbeat\n\n`) every 5-10 seconds
- [ ] Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`
- [ ] Write events in SSE format: `event: name\nid: 123\ndata: {...}\n\n`
- [ ] Always Call ob_flush() and flush() After Each Event
- [ ] Always Check connection_aborted() in the Stream Loop

---

# Performance Checklist

- [ ] `set_time_limit(0)` should be avoided; use MAX_DURATION ceiling to free workers
- [ ] CPU per connection: low during idle (heartbeat only); spikes during event bursts
- [ ] Memory per connection: minimal (stream overhead + event buffer)
- [ ] Nginx `proxy_buffering off` prevents buffer allocation for streamed responses
- [ ] Output buffering must be disabled (`output_buffering = Off` in php.ini or `ob_end_flush()`)
- [ ] Each SSE connection holds one PHP-FPM workerâ€”size `pm.max_children` accordingly
- [ ] HTTP/2 removes the browser's 6-connection-per-domain SSE limit
- [ ] Rate limit SSE endpoints to prevent connection exhaustion attacks

---

# Security Checklist

- [ ] Do not expose sensitive data in SSE event streams without proper authorization
- [ ] Monitor PHP-FPM worker utilizationâ€”SSE connections count against total worker pool
- [ ] Rate limit SSE endpoints to prevent abuse (open connections as DoS vector)
- [ ] Validate authentication before establishing the SSE stream
- [ ] Rate limit SSE endpoints to prevent connection exhaustion attacks

---

# Reliability Checklist

- [ ] Client reconnects infinitely
- [ ] Events arrive in bursts
- [ ] Events never reach client
- [ ] Missed events on reconnect
- [ ] Workers exhausted after hours
- [ ] Always Call ob_flush() and flush() After Each Event
- [ ] Always Check connection_aborted() in the Stream Loop
- [ ] Always Implement Heartbeat Events
- [ ] Always Implement Rate Limiting on SSE Endpoints
- [ ] Always Set a Maximum Connection Duration

---

# Testing Checklist

- [ ] `connection_aborted()` checked in stream loop
- [ ] `ob_flush()` and `flush()` called after each event
- [ ] `proxy_read_timeout` set higher than MAX_DURATION
- [ ] `X-Accel-Buffering: no` header set for Nginx
- [ ] Client auto-reconnects via `EventSource` after disconnection
- [ ] Connection duration ceiling implemented (MAX_DURATION)
- [ ] Connection duration ceiling implemented (MAX_DURATION, not `set_time_limit(0)`)
- [ ] Heartbeat events implemented (every 5-10s)
- [ ] Missed events are replayed on reconnect via `Last-Event-ID`
- [ ] No PHP-FPM worker exhaustion (duration ceiling enforced)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Maximum Connection Duration (PHP-FPM Worker Exhaustion)]
- [ ] [Missing Headers for SSE Streaming]
- [ ] [No Heartbeat Events (Proxy Timeout Disconnections)]
- [ ] [No connection_aborted() Check]
- [ ] [No Last-Event-ID Replay for Reconnected Clients]
- [ ] Blocking operations in the stream loop
- [ ] Long-lived SSE connections without heartbeat
- [ ] No rate limiting on SSE endpoints

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


