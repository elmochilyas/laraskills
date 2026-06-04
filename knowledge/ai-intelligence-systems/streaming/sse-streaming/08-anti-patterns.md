# ECC Anti-Patterns — SSE Streaming

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | SSE Streaming |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Backpressure — Server Pushes Data Faster Than Client Can Consume
2. Closing Connection on First Error — No Error Recovery Mid-Stream
3. No Reconnection Logic — Client Disconnect Ends Stream Permanently
4. Buffering Entire Response Before Sending — Defeats Streaming Purpose
5. Not Setting Proper SSE Headers (Content-Type, Cache-Control)

---

## Repository-Wide Anti-Patterns

- PHP-FPM worker held open for streaming duration — pool exhaustion
- No heartbeat/ping to keep connection alive

---

## Anti-Pattern 1: No Backpressure

### Category
Performance

### Description
Server sends data at LLM response speed regardless of client consumption rate — buffer overflow or dropped events.

### Preferred Alternative
Implement flow control. Use writable buffer monitoring. Pause LLM stream when client buffer is full.

### Detection Checklist
- [ ] No backpressure
- [ ] Client-side buffer overflow
- [ ] Dropped events

---

## Anti-Pattern 2: Closing Connection on First Error

### Category
Reliability

### Description
Provider error mid-stream immediately closes SSE connection — user sees partial response.

### Preferred Alternative
Send error event in stream. Allow client to decide whether to reconnect. Log error for debugging.

### Detection Checklist
- [ ] Connection closed on stream error
- [ ] User gets incomplete response
- [ ] No error event in stream
