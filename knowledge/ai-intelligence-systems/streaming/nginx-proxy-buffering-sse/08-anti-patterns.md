# ECC Anti-Patterns — Nginx Proxy Buffering for SSE

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Nginx Proxy Buffering for SSE |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Nginx Buffering SSE Responses — Chunks Delayed Until Buffer Full
2. No proxy_buffering off for Streaming Endpoints
3. Proxy Timeout Shorter Than Stream Duration
4. No Connection Upgrade Headers for WebSocket
5. Load Balancer Terminating Idle Streaming Connections

---

## Repository-Wide Anti-Patterns

- No distinction between streaming and non-streaming routes in nginx config
- Global proxy settings applied to streaming endpoints

---

## Anti-Pattern 1: Nginx Buffering SSE

### Category
Performance

### Description
Nginx buffers SSE response by default — tokens don't reach client until buffer fills (typically 4-8KB).

### Preferred Alternative
Disable proxy buffering for streaming endpoints: `proxy_buffering off;` and set appropriate `X-Accel-Buffering: no` header.

### Detection Checklist
- [ ] SSE buffered by nginx
- [ ] Tokens arrive in bursts, not progressively
- [ ] No proxy_buffering off

---

## Anti-Pattern 2: Proxy Timeout Shorter Than Stream

### Category
Reliability

### Description
`proxy_read_timeout` (default 60s) shorter than expected stream duration — connection dropped mid-stream.

### Preferred Alternative
Set `proxy_read_timeout` to 3600s (1 hour) for streaming endpoints, or match expected max stream duration.

### Detection Checklist
- [ ] proxy_read_timeout too short
- [ ] Connections dropped mid-stream
- [ ] Timeout errors during streaming
