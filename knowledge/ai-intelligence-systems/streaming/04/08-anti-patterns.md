# ECC Anti-Patterns — Streaming Performance Optimization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Streaming Performance Optimization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. PHP-FPM for High-Concurrency Streaming — Worker Pool Exhaustion
2. No Keep-Alive on Streaming Connections
3. Streaming Without Compression — Higher Bandwidth Usage
4. Head-of-Line Blocking — One Slow Stream Delays Others
5. No Connection Pool for Provider HTTP Clients

---

## Repository-Wide Anti-Patterns

- Streaming worker pool not isolated from web worker pool
- No monitoring of concurrent stream count

---

## Anti-Pattern 1: PHP-FPM for High-Concurrency Streaming

### Category
Performance

### Description
Using PHP-FPM for 100+ concurrent streaming connections — each stream holds a worker, pool exhausted.

### Preferred Alternative
Use Octane (Swoole/ RoadRunner) for streaming. Workers handle concurrent streams efficiently.

### Detection Checklist
- [ ] PHP-FPM for streaming
- [ ] Worker pool exhausted at high concurrency
- [ ] Other requests blocked by streams

---

## Anti-Pattern 2: No Keep-Alive

### Category
Performance

### Description
New TCP connection for each stream chunk or stream restart — connection overhead adds latency.

### Preferred Alternative
Enable HTTP keep-alive. Reuse connections for multiple stream requests.

### Detection Checklist
- [ ] New connection per stream
- [ ] Connection overhead in latency
- [ ] Keep-alive not configured
