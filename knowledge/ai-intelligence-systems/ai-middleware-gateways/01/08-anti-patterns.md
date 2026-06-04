# ECC Anti-Patterns — AI Middleware Gateway Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | AI Middleware Gateway Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Gateway — Direct Provider Calls from Application
2. Gateway Without Observability — Opaque Traffic
3. Single Provider Behind Gateway — No Failover
4. Gateway Without Caching — Repeated Identical Requests
5. No Request/Response Transformation at Gateway

---

## Repository-Wide Anti-Patterns

- Gateway deployed without load testing
- Gateway credentials shared across environments

---

## Anti-Pattern 1: No Gateway

### Category
Architecture

### Description
Application calls provider APIs directly without any intermediate gateway — no centralized control.

### Preferred Alternative
Deploy AI gateway between application and providers. Centralize auth, rate limiting, logging, cost tracking.

### Detection Checklist
- [ ] Direct provider calls
- [ ] No middleware/gateway layer
- [ ] No centralized control

---

## Anti-Pattern 2: Gateway Without Observability

### Category
Observability

### Description
Gateway deployed but no metrics on traffic, errors, latency, or costs — debugging requires provider-side logs.

### Preferred Alternative
Instrument gateway: log all requests/responses (redacted), track latency per provider, alert on error rate spikes.

### Detection Checklist
- [ ] No gateway metrics
- [ ] Traffic opaque
- [ ] Debug requires provider console
