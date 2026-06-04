# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Broadcasting & Real-Time
**Knowledge Unit:** K033 — Laravel Echo Client
**Generated:** 2026-06-03

---

# Decision Inventory

* Echo + WebSocket vs Polling for Real-Time Updates

---

# Architecture-Level Decision Trees

---

## Echo + WebSocket vs Polling for Real-Time Updates

---

### Decision Context

Whether to use Laravel Echo with WebSockets for real-time updates or rely on HTTP polling.

---

### Decision Criteria

* Update frequency requirement
* Update latency requirement
* Connection count and scalability
* Client environment (browser vs mobile)

---

### Decision Tree

Need sub-second delivery of updates?
YES → Use Echo + WebSocket
NO → Updates every 5-30 seconds are acceptable?
    YES → Polling is simpler — no WebSocket infrastructure needed
NO → Browser-based client?
    YES → Echo works natively (JavaScript library)
NO → Mobile/CLI client?
    YES → Native WebSocket client — Echo is browser-focused
NO → Default?
    YES → Echo + WebSocket for real-time; polling for non-real-time

---

### Rationale

WebSockets provide sub-second push delivery with no polling overhead. Polling is simpler to implement but introduces latency and unnecessary HTTP requests. Choose based on update frequency and latency requirements.

---

### Recommended Default

**Default:** Use Echo + WebSocket for user-facing real-time features (notifications, chat, live updates); polling for background/analytics updates
**Reason:** WebSockets provide the best UX for real-time features. Polling is simpler for non-critical updates where seconds of delay are acceptable.

---

### Risks Of Wrong Choice

- Polling for real-time: unnecessary HTTP traffic, poor UX
- WebSocket for non-real-time: infrastructure complexity without benefit
- Echo for mobile: not designed for mobile WebSocket clients
- No fallback: WebSocket disconnect leaves UI stale

---

### Related Rules

- keep-broadcast-event-payloads-minimal

---

### Related Skills

- Configure Broadcasting and Real-Time Events
- Configure Laravel Echo Client
