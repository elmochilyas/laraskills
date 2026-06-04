# ECC Anti-Patterns — Streaming Client-Side Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Streaming Client-Side Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Client Waiting for Full Response Before Rendering
2. No Reconnection Logic on Network Interrupt
3. No Exponential Backoff on Reconnection Attempts
4. Client-Side Buffer Overflow from Fast Stream
5. No Visual Indicator for Stream State (Connecting/Streaming/Error/Complete)

---

## Repository-Wide Anti-Patterns

- Client not displaying partial results during streaming
- No abort controller — user can't cancel stream mid-response

---

## Anti-Pattern 1: Client Waiting for Full Response

### Category
UX

### Description
Client-side code buffers entire SSE stream and renders on complete — defeats streaming purpose.

### Preferred Alternative
Process and render each SSE event as it arrives. Update UI progressively.

### Detection Checklist
- [ ] Buffering full response client-side
- [ ] No progressive rendering
- [ ] User sees nothing until complete

---

## Anti-Pattern 2: No Reconnection Logic

### Category
Reliability

### Description
Network interruption closes SSE connection — client doesn't attempt reconnection.

### Preferred Alternative
Implement reconnection with exponential backoff. Resume from last received event.

### Detection Checklist
- [ ] No reconnection on network error
- [ ] Stream lost on transient error
- [ ] User must manually retry
