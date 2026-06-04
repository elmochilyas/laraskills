# ECC Anti-Patterns — Context Mapping Relationships

## Domain: Backend Architecture & Design | Subdomain: Domain-Driven Design

### Anti-Pattern Inventory

1. **No Context Map** — Relationships between contexts unknown and unmanaged
2. **Wrong Relationship Pattern** — Using tight coupling (Shared Kernel) when loose suffices
3. **Conformist for Innovation** — Downstream team blindly following unstable upstream
4. **Anti-Corruption Layer Overuse** — ACL between well-aligned contexts
5. **Partnership Without Structure** — Frequent sync meetings but no integration agreements
6. **Separate Ways When Integration Needed** — Avoiding integration that adds business value

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: No Context Map

**Category:** Architecture

**Description:** Bounded contexts exist but their relationships are not documented or understood.

**Why It Happens:** Focus on internal context design; cross-context relationships ignored.

**Warning Signs:** Integration code scattered; teams surprised by cross-context dependencies.

**Why Is It Harmful:** Integration patterns emerge accidentally. Wrong relationships create coupling. Hard to evolve.

**Preferred Alternative:** Create and maintain a context map showing all relationships and patterns.

**Refactoring Strategy:** Document current relationships. Identify and fix mismatched patterns.

**Related Rules:** Document all context relationships (05-rules.md)

---

### Anti-Pattern 2: Wrong Relationship Pattern

**Category:** Architecture

**Description:** Using high-coupling pattern (Shared Kernel, Partnership) where loose pattern suffices.

**Why It Happens:** Convenience — sharing code is easier than designing APIs.

**Warning Signs:** Shared Kernel growing unbounded; contexts tightly coupled through shared code.

**Why Is It Harmful:** High coupling reduces autonomy. Changes in one context break others.

**Preferred Alternative:** Choose loosest pattern that meets integration needs.

**Refactoring Strategy:** Replace Shared Kernel with Open-Host Service or Published Language. Extract shared code into stable published language.

**Related Rules:** Choose loosest appropriate relationship (05-rules.md)

---

### Anti-Pattern 3: Conformist for Innovation

**Category:** Strategy

**Description:** Downstream team blindly conforming to an unstable upstream context.

**Why It Happens:** Power imbalance; downstream team doesn't negotiate.

**Warning Signs:** Downstream team constantly breaking because upstream changes its model.

**Why Is It Harmful:** Downstream team has no protection. Upstream changes cascade without consideration.

**Preferred Alternative:** Use Customer-Supplier (negotiated contract) or Anti-Corruption Layer (translation).

**Refactoring Strategy:** Add ACL between contexts. Negotiate contract with upstream.

**Related Rules:** Don't blindly conform to unstable upstream (05-rules.md)

---

### Anti-Pattern 4: Anti-Corruption Layer Overuse

**Category:** Architecture

**Description:** ACL between well-aligned contexts that share the same language.

**Why It Happens:** "Always use ACL" applied without context.

**Warning Signs:** ACL translating between contexts with identical terms and models.

**Why Is It Harmful:** Unnecessary complexity. Translation logic must be maintained for no benefit.

**Preferred Alternative:** Use Conformist or Shared Kernel when contexts share language.

**Refactoring Strategy:** Remove ACL, use direct integration or shared kernel.

**Related Rules:** No ACL between aligned contexts (05-rules.md)

---

### Anti-Pattern 5: Partnership Without Structure

**Category:** Process

**Description:** Two teams agree to "partner" but have no integration agreements, API contracts, or sync schedule.

**Why It Happens:** Good intentions without process.

**Warning Signs:** Frequent breaking changes between teams; no defined integration points.

**Why Is It Harmful:** Both teams waste time chasing integration breaks. No stability.

**Preferred Alternative:** Formal Partnership with integration contracts, joint planning, and shared CI.

**Refactoring Strategy:** Define API contracts. Set up cross-context CI. Schedule regular sync.

**Related Rules:** Formalize partnership with contracts (05-rules.md)

---

### Anti-Pattern 6: Separate Ways When Integration Needed

**Category:** Strategy

**Description:** Choosing Separate Ways (no integration) when integration provides business value.

**Why It Happens:** Avoiding integration difficulty at expense of business value.

**Warning Signs:** Two systems with duplicate data that should be shared; manual data sync.

**Why Is It Harmful:** Duplicate work. Inconsistent data. Missed business opportunities.

**Preferred Alternative:** Integrate with appropriate relationship pattern based on value/cost analysis.

**Refactoring Strategy:** Identify valuable integration points. Choose appropriate relationship pattern.

**Related Rules:** Integrate where business value exceeds cost (05-rules.md)
