# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service vs. Action vs. Use Case: decision criteria
Knowledge Unit ID: SLP-10
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Service, Action, and Use Case classes solve different organizational problems at different scales. Emerging community consensus: Services orchestrate, Actions execute single operations, Use Cases encapsulate business intent with framework independence. Most teams start with services, add actions when services grow too large, and consider use cases when adopting Clean Architecture.

---

# Core Concepts

| Criterion | Service | Action | Use Case |
|---|---|---|---|
| Scope | Multiple related operations | One operation | One business intent |
| Granularity | Coarse (10+ methods) | Fine (1 method) | Medium (1-3 methods) |
| Dependencies | Multiple (5-8) | Few (2-4) | Several (3-6) |
| Role | Orchestrates | Executes | Coordinates intent |
| Framework coupling | Coupled (Eloquent) | Coupled (Eloquent) | Independent (via ports) |

---

# When To Use

- **Service**: Coordinate multiple operations, transaction boundaries, shared helper logic. Small teams valuing simplicity.
- **Action**: Service class growing too large, need independently testable operations, operations are distinct.
- **Use Case**: Clean/Hexagonal Architecture, multiple delivery mechanisms, framework independence needed.

---

# When NOT To Use

- Actions when a service method suffices (class explosion without benefit).
- Services when framework coupling is a problem (use cases solve this).
- Mixing patterns without clear rules (inconsistency is worse than any single choice).

---

# Best Practices

- **Default to Service + Action for most Laravel applications.** WHY: Services coordinate, actions execute. This is the "sweet spot" that provides structure without Clean Architecture overhead. Most teams should stop here.
- **Adopt Use Cases when pain of framework-coupled logic exceeds abstraction cost.** WHY: Typically at team sizes >10 or business complexity justifying Clean Architecture.
- **Document the team's chosen pattern explicitly.** WHY: The worst state is a codebase where some features use services, some use actions, some use use cases — without clear rules.
- **Avoid architecture paralysis.** WHY: Pick one, ship, refactor later. Debating pattern selection for weeks is worse than any single pattern choice.

---

# Architecture Guidelines

- Service + Action combination: Services orchestrate, actions are leaf nodes. Most teams (sweet spot).
- Service → Use Case migration: As application grows, services refactored into use cases. Service remains as thin facade for backward compatibility.
- Decision tree: Complex with multiple sub-steps → Service or Use Case. Simple single operation → Action or repository method.

---

# Performance Considerations

- Difference between patterns is negligible (~50μs per resolution). Database query time dominates.

---

# Security Considerations

- No direct implications. All patterns use the same authorization boundaries.

---

# Common Mistakes

1. **Actions when service suffices:** Creating actions for every operation even when services aren't needed. Cause: over-engineering. Consequence: class explosion.

2. **Services when use cases needed:** Services with conditional logic for different delivery mechanisms. Cause: growing complexity. Consequence: service coupled to delivery mechanism. Better: extract use cases.

3. **Mixing patterns without rules:** Some code uses services, some actions, some use cases — inconsistent. Cause: no documented standard. Consequence: confusion. Better: document and enforce team patterns.

---

# Anti-Patterns

- **Architecture paralysis**: Team debates pattern choice instead of shipping.
- **Pattern soup**: Different features use different patterns based on who wrote them.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-02 Action classes | LAP-06 Application layer |
| SLP-06 Use Case classes | SLP-04 Pyramid architecture | LAP-14 Clean Architecture tradeoffs |

---

# AI Agent Notes

- Default recommendation: Service + Action for most teams.
- Use Cases only when Clean Architecture or multi-delivery mechanism is explicitly required.
- Document the decision in project README.

---

# Verification

- [ ] Team's architectural pattern choice is documented
- [ ] Service + Action is default (sweet spot)
- [ ] Use Cases only where framework independence is needed
- [ ] No pattern soup (inconsistent usage across features)
- [ ] Decision tree is documented for what goes where
