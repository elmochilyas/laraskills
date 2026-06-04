# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Context mapping: relationships between contexts
Knowledge Unit ID: DBC-02
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Context mapping documents relationships between bounded contexts. Relationship types: Partnership (coordinated changes), Shared Kernel (shared synchronized code), Customer-Supplier (upstream provides data), Conformist (downstream conforms to upstream), Anti-Corruption Layer (translation between models), Open Host Service (published API), Separate Ways (no integration). Each implies different integration patterns and coupling levels.

---

# Core Concepts

- **Partnership**: Teams coordinate changes. Tight alignment, frequent communication.
- **Shared Kernel**: Shared subset of domain model. Changes synchronized.
- **Customer-Supplier**: Upstream provides data; downstream consumes. Upstream may need to accommodate downstream.
- **Conformist**: Downstream conforms to upstream's model without translation. Simplest, most coupling.
- **Anti-Corruption Layer**: Downstream translates upstream's model to its own. Protects model integrity.
- **Open Host Service**: Upstream publishes clear API. Any downstream consumes.
- **Separate Ways**: No integration. Different solutions for different contexts.

---

# When To Use

- After bounded contexts are identified. Documents how contexts relate.
- During architectural planning to determine integration patterns.

---

# When NOT To Use

- Single-context applications (no relationships to map).

---

# Best Practices

- **Document the context map visibly.** WHY: Context relationships must be explicit. Undocumented relationships lead to inconsistent integration patterns.
- **Prefer Open Host Service for stable upstream APIs.** WHY: Clear, published contracts decouple upstream from downstream and provide the most flexible relationship.
- **Use Anti-Corruption Layer for legacy integration.** WHY: Protects downstream context from upstream's model quality and prevents legacy model corruption.
- **Avoid defaulting to Shared Kernel.** WHY: Sharing too much code across contexts creates hidden coupling. Default to separate with translation.

---

# Architecture Guidelines

- Document context map as a diagram or matrix showing relationship types between each pair.
- More explicit integration (ACL, OHS) costs more upfront but provides better isolation.
- Less explicit integration (Conformist, Shared Kernel) costs less upfront but creates more coupling.

---

# Performance Considerations

- No runtime cost. Design-time documentation only.

---

# Security Considerations

- Context relationships may expose data across boundaries. ACL provides security isolation through translation.

---

# Common Mistakes

1. **No context map:** Contexts exist but relationships are undocumented. Cause: oversight. Consequence: inconsistent integration patterns. Better: document relationships.

2. **Defaulting to Shared Kernel:** Sharing too much code across contexts. Cause: DRY obsession. Consequence: hidden coupling. Better: prefer ACL or OHS.

3. **Defaulting to Separate Ways:** Two contexts implementing same concept differently. Cause: no coordination. Consequence: business logic duplication. Better: consider Customer-Supplier or OHS.

---

# Anti-Patterns

- **No translation layer**: Direct model access between contexts. Creates tight coupling.
- **Context map not maintained**: Relationships change over time but map isn't updated.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Context identification | DBC-03 Shared kernel | DBC-04 Anti-corruption layer |
| MMD-08 Shared kernel | CPC-01 Interface contracts | DBC-10 Legacy integration |

---

# AI Agent Notes

- Document context map for any multi-context architecture.
- Default to Open Host Service for stable APIs.
- Default to Anti-Corruption Layer for legacy integration.

---

# Verification

- [ ] Context map documents all cross-context relationships
- [ ] Relationship type is intentional (not default)
- [ ] Integration patterns match the relationship type
- [ ] Shared Kernel is minimal where used
- [ ] Context map is kept up-to-date
