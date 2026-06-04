# ECC Anti-Patterns — Agent Middleware Pipeline

---

## Metadata | Field | Value |
|-------|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | Agent Middleware Pipeline |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Monolithic Middleware — Single Class Handles All Concerns
2. Order-Dependent Middleware — Pipeline Order Changes Behavior
3. Middleware Modifying Request After Processing Started
4. No Short-Circuit Logic — All Middleware Runs Even on Error
5. Side Effects in Middleware Without Logging

---

## Repository-Wide Anti-Patterns

- Middleware not independently testable
- Pipeline not configurable per agent

---

## Anti-Pattern 1: Monolithic Middleware

### Category
Architecture

### Description
Single middleware class handling logging, rate limiting, caching, and auth — violates single responsibility.

### Preferred Alternative
One middleware class per concern. Compose via pipeline.

### Detection Checklist
- [ ] Single class handles multiple concerns
- [ ] Middleware logic tangled
- [ ] No separation of concerns

---

## Anti-Pattern 2: Order-Dependent Middleware

### Category
Reliability

### Description
Pipeline behavior changes if middleware order changes — auth after logging logs unauthenticated requests.

### Preferred Alternative
Define explicit, documented order. Test critical order invariants.

### Detection Checklist
- [ ] Behavior changes with order
- [ ] No documented order
- [ ] Order invariants not tested
