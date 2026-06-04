# ECC Anti-Patterns — Vercel AI SDK Protocol

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Vercel AI SDK Protocol |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Custom Streaming Protocol Instead of Standard Vercel AI SDK Format
2. Not Including Finish Reason in Stream End Event
3. No Tool Call Events in Stream — Client Can't Display Tool Usage
4. Stream Event Ordering Not Maintained
5. No Metadata Event at Stream Start

---

## Repository-Wide Anti-Patterns

- Client-side SDK version mismatched with server protocol version
- No error event types defined for stream errors

---

## Anti-Pattern 1: Custom Protocol Instead of Standard

### Category
Architecture

### Description
Implementing a custom SSE event format instead of using the Vercel AI SDK protocol — client-side SDKs can't consume it.

### Preferred Alternative
Use the standard Vercel AI SDK SSE format: `0:` for text, `9:` for tool calls, `e:` for finish, `f:` for error.

### Detection Checklist
- [ ] Custom SSE format
- [ ] Standard SDK can't parse
- [ ] No protocol compatibility

---

## Anti-Pattern 2: No Finish Reason in End Event

### Category
Reliability

### Description
Stream end event doesn't include `finishReason` — client cannot distinguish completion from truncation.

### Preferred Alternative
Include `finishReason` (stop, length, tool-calls, error, content-filter) in the stream end event.

### Detection Checklist
- [ ] No finishReason in end event
- [ ] Client can't detect truncation
- [ ] Missing stream metadata
