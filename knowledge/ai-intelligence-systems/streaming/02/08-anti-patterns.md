# ECC Anti-Patterns — Stream Error Handling

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Stream Error Handling |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Try/Catch Around Stream Iteration — Fatal Error on Provider Failure
2. No Partial Response Returned on Error — All Progress Lost
3. No Error Event in Stream — Client Tries to Parse Error as Data
4. Retrying Entire Stream Instead of Resuming From Failure Point
5. No Timeout on Streaming Connection — Hanging Forever

---

## Repository-Wide Anti-Patterns

- Stream error not logged — debugging incomplete responses
- Client has no way to distinguish stream completion vs. stream error

---

## Anti-Pattern 1: No Try/Catch Around Stream Iteration

### Category
Reliability

### Description
Streaming loop without exception handling — provider error mid-stream causes fatal PHP error.

### Preferred Alternative
Wrap stream iteration in try/catch. Send error event to client. Log error context.

### Detection Checklist
- [ ] No try/catch around stream
- [ ] Provider error crashes stream
- [ ] Client connection dropped unexpectedly

---

## Anti-Pattern 2: No Partial Response Returned

### Category
UX

### Description
Stream error discards all tokens streamed so far — user loses partial output.

### Preferred Alternative
Send a final error event with partial content. Client can display partial response with error indicator.

### Detection Checklist
- [ ] All progress lost on error
- [ ] No partial response sent
- [ ] User retries from scratch
