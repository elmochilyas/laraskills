# ECC Anti-Patterns — Streaming with Livewire

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Streaming with Livewire |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Polling Instead of Real-Time Streaming — Latency, Overfetch
2. Full Component Re-Render on Each Stream Update
3. No Debouncing — UI Updates on Every Token (Too Frequent)
4. Stream State Lost on Component Refresh
5. No Loading State During Stream

---

## Repository-Wide Anti-Patterns

- Livewire component not optimized for stream updates
- Wire:poll intervals too frequent — unnecessary server load

---

## Anti-Pattern 1: Polling Instead of Real-Time Streaming

### Category
Performance

### Description
Using `wire:poll` to check for new tokens instead of WebSocket/SSE push.

### Preferred Alternative
Use Reverb broadcasting for stream events. Livewire component listens for stream events and updates.

### Detection Checklist
- [ ] Polling for stream updates
- [ ] Delayed token display
- [ ] Server load from polling

---

## Anti-Pattern 2: Full Component Re-Render on Each Token

### Category
Performance

### Description
Each stream chunk triggers full Livewire component re-render — unnecessary DOM diffing.

### Preferred Alternative
Use targeted DOM updates. Only update the streaming content element, not the full component.

### Detection Checklist
- [ ] Full re-render per token
- [ ] UI stuttering during stream
- [ ] Unnecessary DOM updates
