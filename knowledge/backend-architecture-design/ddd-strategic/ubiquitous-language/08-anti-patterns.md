# ECC Anti-Patterns — Ubiquitous Language

## Domain: Backend Architecture & Design | Subdomain: Domain-Driven Design

### Anti-Pattern Inventory

1. **Technical Language in Code** — Class/method names using CRUD terms, not domain concepts
2. **No Glossary** — Domain terms undocumented, leading to drift
3. **Homonym Confusion** — Same term, different meanings across contexts without clarification
4. **Synonym Confusion** — Multiple terms for same concept causing ambiguity
5. **Expert-Developer Language Gap** — Domain experts and developers using different terms
6. **Frozen Language** — Language never updated as domain understanding evolves

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Technical Language in Code

**Category:** Communication

**Description:** Code named after technical concepts (CRUD, Manager, Service) instead of domain concepts.

**Why It Happens:** Developers default to technical naming; domain language not prioritized.

**Warning Signs:** `UserController@store`, `OrderManager`, `updateStatus()` — technical, not domain.

**Why Is It Harmful:** Code doesn't communicate business meaning. Domain experts can't read the code. Business rules hidden behind technical names.

**Preferred Alternative:** Use domain terms: `RegisterUser`, `ShipOrder`, `CancelSubscription`.

**Refactoring Strategy:** Rename classes and methods to domain terms. Involve domain experts in naming.

**Related Rules:** Name code after domain concepts (05-rules.md)

---

### Anti-Pattern 2: No Glossary

**Category:** Communication

**Description:** Domain terms not documented. New team members rely on tribal knowledge.

**Why It Happens:** Glossary seen as overhead; team "knows" the terms.

**Warning Signs:** Same term used differently by different team members; onboarding confusion.

**Why Is It Harmful:** Language drift accelerates as team rotates. Lost institutional knowledge.

**Preferred Alternative:** Maintain living glossary of domain terms with definitions.

**Refactoring Strategy:** Create glossary from current code/team knowledge. Review and update regularly.

**Related Rules:** Maintain a domain glossary (05-rules.md)

---

### Anti-Pattern 3: Homonym Confusion

**Category:** Communication

**Description:** Same business term used with different meanings in different contexts without clarification.

**Why It Happens:** Different departments use same term differently; codebase doesn't disambiguate.

**Warning Signs:** "Customer" means subscriber in one class, lead in another; confusion in PR reviews.

**Why Is It Harmful:** Bugs from incorrect assumptions. Models polluted with conflicting meanings.

**Preferred Alternative:** Qualify terms per context: `BillingCustomer`, `SupportCustomer`. Or split contexts.

**Refactoring Strategy:** Rename ambiguous terms with context qualifier. Document both meanings in glossary.

**Related Rules:** Disambiguate homonyms across contexts (05-rules.md)

---

### Anti-Pattern 4: Synonym Confusion

**Category:** Communication

**Description:** Multiple terms used for the same domain concept.

**Why It Happens:** Different team members prefer different terminology; no standardization.

**Warning Signs:** Codebase uses both "Client" and "Customer"; database table named "clients", code uses "Customer."

**Why Is It Harmful:** Confusion about whether they're the same thing. Code becomes inconsistent.

**Preferred Alternative:** Standardize on one term per concept across the codebase.

**Refactoring Strategy:** Choose one term. Rename all occurrences. Update database schema if needed.

**Related Rules:** One term per concept (05-rules.md)

---

### Anti-Pattern 5: Expert-Developer Language Gap

**Category:** Communication

**Description:** Domain experts use business terms; developers use technical terms for the same concepts.

**Why It Happens:** Developers don't learn domain language; domain experts don't participate in modeling.

**Warning Signs:** Requirements translated from business to technical before implementation; code doesn't reflect business conversations.

**Why Is It Harmful:** Requirements lost in translation. Implementation drifts from business intent.

**Preferred Alternative:** Developers learn and use domain language. Domain experts review code names.

**Refactoring Strategy:** Involve domain experts in naming. Refactor to match business terms.

**Related Rules:** Align developer and domain expert language (05-rules.md)

---

### Anti-Pattern 6: Frozen Language

**Category:** Communication

**Description:** Ubiquitous language never updated as domain understanding grows.

**Why It Happens:** Language defined at project start and never revisited.

**Warning Signs:** Terms that no longer match business reality; code uses outdated concepts.

**Why Is It Harmful:** Language becomes disconnected from business. Code refactored without language update.

**Preferred Alternative:** Treat language as living artifact. Update as domain understanding evolves.

**Refactoring Strategy:** Review glossary quarterly. Update terms to reflect current understanding.

**Related Rules:** Evolve language as domain understanding grows (05-rules.md)
