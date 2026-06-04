# ECC Anti-Patterns — Streaming Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Streaming Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Synchronous Prompt() for Interactive User Experiences
2. Not Handling Mid-Stream Provider Errors
3. No Client-Side Streaming Display — User Sees Nothing Until Complete
4. Streaming Without Timeout — Hanging Connection
5. Not Respecting HTTP/2 Server Push Limitations

---

## Repository-Wide Anti-Patterns

- Worker pool not sized for concurrent streaming connections
- No monitoring of active stream count

---

## Anti-Pattern 1: Synchronous for Interactive UX

### Category
Performance

### Description
Using synchronous `prompt()` for chat UI — user waits for full response before seeing anything.

### Preferred Alternative
Use `->stream()` for chat interfaces. Display tokens progressively.

### Detection Checklist
- [ ] prompt() for chat UI
- [ ] User waits silently
- [ ] No progressive display

---

## Anti-Pattern 2: No Client-Side Streaming Display

### Category
UX

### Description
Server streams tokens but client waits for complete response before rendering.

### Preferred Alternative
Implement streaming display: read stream events progressively, update UI on each chunk.

### Detection Checklist
- [ ] Client buffers full response
- [ ] No progressive rendering
- [ ] User experience same as synchronous
