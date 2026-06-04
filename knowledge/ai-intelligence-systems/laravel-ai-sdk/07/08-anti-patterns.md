# ECC Anti-Patterns — Agent Execution (prompt/stream/queue)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Agent Execution (prompt/stream/queue) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using prompt() Where stream() Is More Appropriate
2. Not Handling Streaming Errors Mid-Response
3. Queue Without Notification — User Never Knows Agent Completed
4. Mixing Synchronous and Async Patterns in Same Workflow
5. No Timeout on prompt() — Indefinite Blocking

---

## Repository-Wide Anti-Patterns

- Worker pool not configured for streaming endpoints
- No retry on queued agent failures

---

## Anti-Pattern 1: prompt() Where stream() Is Appropriate

### Category
Performance

### Description
Using synchronous `prompt()` for responses that take >2s — blocks PHP worker for the duration.

### Preferred Alternative
Use `stream()` for interactive responses. User sees tokens as they arrive.

### Detection Checklist
- [ ] prompt() for >2s responses
- [ ] Worker blocked during LLM response
- [ ] User waits without feedback

---

## Anti-Pattern 2: Not Handling Streaming Errors Mid-Response

### Category
Reliability

### Description
Provider error mid-stream — user sees partial response, no recovery.

### Preferred Alternative
Wrap stream iteration in try/catch. Return partial response with error indicator.

### Detection Checklist
- [ ] No stream error handling
- [ ] Partial responses on error
- [ ] User gets incomplete output

---

## Anti-Pattern 3: Queue Without Notification

### Category
UX

### Description
Agent queued with `->queue()` but no mechanism to notify user when complete.

### Preferred Alternative
Implement notification (broadcast, email, webhook) when queued agent completes.

### Detection Checklist
- [ ] queue() without notification
- [ ] User doesn't know when done
- [ ] Polling workaround implemented
