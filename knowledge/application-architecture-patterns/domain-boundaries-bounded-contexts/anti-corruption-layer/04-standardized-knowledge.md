# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Anti-corruption layer pattern
Knowledge Unit ID: DBC-04
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

An Anti-Corruption Layer (ACL) is a translation layer that prevents one context's domain model from corrupting another's. When Context A must integrate with Context B (or a legacy system), the ACL translates between B's model and A's model. The ACL ensures changes in B don't propagate into A's model. The primary pattern for protecting bounded context integrity when integrating with external or legacy systems.

---

# Core Concepts

- **Structure**: Context A → ACL → Legacy System B.
- **Translates**: B's model into A's model, A's commands into B's operations.
- **Isolates**: A from B's schema, API, and behavior changes.
- **Ownership**: Lives in A's boundary — A owns the translation.

---

# When To Use

- Integrating with a legacy system that has a different domain model.
- Integrating with an external system whose model would contaminate your bounded context.

---

# When NOT To Use

- External system's model aligns closely with your context's model.
- Integration is simple enough that direct translation in a service method suffices.

---

# Best Practices

- **Build ACL when model divergence exists, not for every integration.** WHY: If the external model closely matches your context's model, direct integration is simpler. ACL is for protecting model integrity, not for every API call.
- **Use Translator, Facade, and Adapter sub-patterns.** WHY: Translator handles two-way conversion, Facade simplifies complex interfaces, Adapter implements context-defined port interface.
- **Keep ACL within the consuming context's boundary.** WHY: The consuming context owns the translation. The upstream system doesn't need to know about the ACL.
- **Ensure ACL provides full protection, not just field mapping.** WHY: A thin pass-through that translates field names but not concepts doesn't fully protect the domain model.

---

# Architecture Guidelines

- ACL implements a port interface defined by the consuming context.
- ACL classes: Translator (conversion), Facade (simplification), Adapter (port implementation).
- The ACL lives in the consuming context's Infrastructure layer.

---

# Performance Considerations

- Translation adds processing overhead per call. Typically microseconds.
- If performance-critical, consider caching translated results.

---

# Security Considerations

- ACL provides security isolation by translating only necessary data. No direct database access.

---

# Common Mistakes

1. **No ACL when one is needed:** Directly using legacy models in the current context. Cause: convenience. Consequence: legacy changes break the context. Better: build ACL.

2. **ACL too thin:** Pass-through that translates field names but not concepts. Cause: rush. Consequence: domain model reflects legacy thinking. Better: translate conceptually, not just syntactically.

3. **ACL exposing legacy detail:** Translation doesn't fully protect the context. Cause: incomplete translation. Consequence: domain model shows traces of legacy schema.

---

# Anti-Patterns

- **Leaky ACL**: Some legacy methods exposed directly without translation.
- **ACL that's never updated**: Legacy system changes but ACL isn't updated. Build breaks.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-02 Context mapping | DBC-10 Legacy integration | LAP-04 Dependency Rule |
| CPC-07 Bridge/adapter pattern | CPC-01 Interface contracts | DBC-08 Evolutionary boundaries |

---

# AI Agent Notes

- Generate ACL when integrating with legacy or external systems with different models.
- ACL lives in consuming context's boundary.
- Include Translator, Facade, Adapter sub-patterns.

---

# Verification

- [ ] ACL protects context model integrity
- [ ] Translation is conceptual (not just field mapping)
- [ ] ACL lives in consuming context's boundary
- [ ] Legacy models never imported directly into context
- [ ] ACL is updated when legacy system changes
