# ECC Anti-Patterns — Specialized Agent Frameworks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Specialized Agent Frameworks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Vendor Lock-in — Using Framework-Specific Abstractions Instead of Laravel AI SDK
2. Mixing Multiple Agent Frameworks in Same Codebase
3. Framework Without Fake/Test Support — Tests Call Real APIs
4. Custom Framework When Laravel AI SDK Meets Needs
5. No Fallback Between Frameworks — Single Point of Failure

---

## Repository-Wide Anti-Patterns

- Framework version pinned without compatibility testing
- Framework documentation referenced instead of team-owned patterns

---

## Anti-Pattern 1: Vendor Lock-in to Framework-Specific Abstractions

### Category
Architecture

### Description
Using non-Laravel agent framework abstractions that prevent switching to Laravel AI SDK.

### Preferred Alternative
Prefer Laravel AI SDK patterns. Wrap third-party frameworks behind application interfaces for swappability.

### Detection Checklist
- [ ] Non-Laravel agent framework in use
- [ ] Hard to migrate to Laravel AI SDK
- [ ] Framework-specific types leak into application

---

## Anti-Pattern 2: Mixing Multiple Agent Frameworks

### Category
Maintainability

### Description
Some agents use Laravel AI SDK, others use Prism directly, others use LLPhant — inconsistent patterns.

### Preferred Alternative
Standardize on one framework (Laravel AI SDK). Use alternatives only when SDK doesn't support a required feature.

### Detection Checklist
- [ ] Multiple agent frameworks in use
- [ ] Inconsistent agent patterns
- [ ] Developer confusion about which to use
