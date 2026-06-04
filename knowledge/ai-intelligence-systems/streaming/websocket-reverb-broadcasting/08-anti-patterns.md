# ECC Anti-Patterns — WebSocket Reverb Broadcasting

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | WebSocket Reverb Broadcasting |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Broadcasting Full Prompt Responses Without Chunking
2. No Auth on WebSocket Channel — Unauthorized Users See Stream
3. No Rate Limiting on Stream Events — Client Overwhelmed
4. Queue Worker Not Running for Async Broadcasting
5. Broadcasting PII or Sensitive Data Over WebSocket

---

## Repository-Wide Anti-Patterns

- WebSocket connections not monitored — zombie connections accumulate
- No reconnection backoff — clients reconnect instantly on disconnect

---

## Anti-Pattern 1: Full Response Without Chunking

### Category
Performance

### Description
Waiting for complete LLM response then broadcasting it in one WebSocket message — user sees nothing until complete.

### Preferred Alternative
Broadcast chunks as they arrive from the LLM stream. User sees tokens progressively.

### Detection Checklist
- [ ] Full response broadcast
- [ ] User waits without feedback
- [ ] No chunked broadcasting

---

## Anti-Pattern 2: No Auth on WebSocket Channel

### Category
Security

### Description
Stream events broadcast on public WebSocket channel — anyone can subscribe and see responses.

### Preferred Alternative
Use private/presence channels with authentication. Validate user has access to the stream.

### Detection Checklist
- [ ] Public channel for streaming
- [ ] No auth check
- [ ] Unauthorized subscription possible
