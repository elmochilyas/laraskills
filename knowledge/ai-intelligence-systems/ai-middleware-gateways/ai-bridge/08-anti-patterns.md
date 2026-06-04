# ECC Anti-Patterns — AI Bridge

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | AI Bridge |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Bypassing Bridge for Direct Provider Calls
2. Single Bridge for All Traffic Without Provider Routing
3. No Bridge Health Check — Using Degraded Provider
4. Bridge Without Rate Limiting — Provider Overload
5. Not Logging Bridge Decisions — Opaque Routing

---

## Repository-Wide Anti-Patterns

- Bridge configuration not environment-aware
- Bridge single point of failure without fallback

---

## Anti-Pattern 1: Bypassing Bridge for Direct Provider Calls

### Category
Architecture

### Description
Some code paths call providers directly instead of routing through the AI bridge — inconsistent routing.

### Preferred Alternative
Route all provider traffic through the bridge. The bridge handles failover, rate limiting, logging.

### Detection Checklist
- [ ] Direct provider calls
- [ ] Bridge not used consistently
- [ ] Inconsistent routing logic

---

## Anti-Pattern 2: No Provider Routing in Bridge

### Category
Architecture

### Description
Bridge forwards all traffic to one provider — no model-based or capability-based routing.

### Preferred Alternative
Implement routing by model, capability, or cost. Bridge selects optimal provider per request.

### Detection Checklist
- [ ] Single provider route
- [ ] No capability-based routing
- [ ] Bridge adds no routing value
