# ECC Anti-Patterns — Hexagonal Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Hexagonal/Ports and Adapters architecture concept |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Adapter Explosion
2. Anemic Core
3. Framework Leak
4. Fat Ports

---

## Anti-Pattern 1: Adapter Explosion

### Description
Every infrastructure choice creates a new adapter even when sharing is sufficient. Three database drivers, five cache backends, two mail drivers — each with their own adapter — when only one is ever used in production.

### Why It Happens
Over-preparing for infrastructure swaps that never happen. Building every conceivable port/adapter pair upfront.

### Preferred Alternative
Create adapters only when a second implementation exists or is definitively planned.

---

## Anti-Pattern 2: Framework Leak

### Description
Port interfaces use framework types in their method signatures. A use case port accepts `Illuminate\Http\Request` or a repository port returns `Illuminate\Support\Collection`.

### Why It Happens
Convenience. Framework types offer useful features.

### Preferred Alternative
Port interfaces must only use core-defined types — primitives, DTOs, and domain objects.

### Related Rules
- Keep ports pure (LAP-03/05-rules.md)

---

## Anti-Pattern 3: Fat Ports

### Description
A single port interface with 15+ methods covering all possible operations on an entity. Violates Interface Segregation Principle.

### Preferred Alternative
Separate ports by concern: read vs write, or per use case.
