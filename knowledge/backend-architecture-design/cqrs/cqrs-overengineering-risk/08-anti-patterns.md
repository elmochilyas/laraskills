# ECC Anti-Patterns — CQRS Overengineering Risk

## Domain: Backend Architecture & Design | Subdomain: Command Query Separation

### Anti-Pattern Inventory

1. **Full CQRS for CRUD-Only Domain** — Command/query pairs for every operation
2. **Read/Write Separation Without Asymmetry** — Separating when models are identical
3. **Early Event Sourcing** — Event sourcing adopted before CQRS Level 2 is stable
4. **Single-Developer CQRS** — Full CQRS in small team/project
5. **CQRS as Default Architecture** — Adopting universally, not per-context
6. **No Migration Path** — Locked into CQRS without ability to scale down

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Full CQRS for CRUD-Only Domain

**Category:** Architecture

**Description:** Implementing full command/query separation for simple CRUD operations with no read/write asymmetry.

**Why It Happens:** CQRS adopted as "standard architecture" without domain analysis.

**Warning Signs:** Every table has same-shaped read/write models; no performance benefit from separation.

**Why Is It Harmful:** Doubles code for no benefit. Read and write models are identical in shape — separation adds ceremony only.

**Preferred Alternative:** Use simple service layer. Only add CQRS where read/write shapes differ.

**Refactoring Strategy:** Collapse identical read/write models into single model. Remove handler classes that only delegate.

**Related Rules:** Apply CQRS only where read/write asymmetry exists (05-rules.md)

---

### Anti-Pattern 2: Read/Write Separation Without Asymmetry

**Category:** Architecture

**Description:** Separate read and write models that have identical structure.

**Why It Happens:** CQRS template followed mechanically.

**Warning Signs:** `UserReadModel` and `UserWriteModel` have identical fields; same validation, same relationships.

**Why Is It Harmful:** Duplication without purpose. Maintenance burden doubles. Changes must be made in two places.

**Preferred Alternative:** Use single model when read/write shapes match. Separate only when they diverge.

**Refactoring Strategy:** Merge identical read/write models. Re-introduce separation when shapes diverge.

**Related Rules:** Separate only when shapes differ (05-rules.md)

---

### Anti-Pattern 3: Early Event Sourcing

**Category:** Architecture

**Description:** Event sourcing implemented before basic CQRS is stable.

**Why It Happens:** "Skip ahead" mentality; event sourcing seen as ultimate CQRS.

**Warning Signs:** Event store before command bus; projections before read models.

**Why Is It Harmful:** Compound complexity — debugging event sourcing issues while CQRS fundamentals are not solid. Hard to know if problem is CQRS or event sourcing.

**Preferred Alternative:** Stabilize CQRS Level 0-2 first. Add event sourcing only when Level 2 patterns prove insufficient.

**Refactoring Strategy:** Simplify to Level 0-2 first. Reintroduce event sourcing only when specific need is proven.

**Related Rules:** Stabilize CQRS before adding event sourcing (05-rules.md)

---

### Anti-Pattern 4: Single-Developer CQRS

**Category:** Process

**Description:** Full CQRS adopted by a single-developer or small team project.

**Why It Happens:** Enthusiasm for architectural patterns regardless of team size.

**Warning Signs:** Solo developer maintaining command bus, query handlers, read models, and event store.

**Why Is It Harmful:** Architectural overhead exceeds team capacity. Developer spends more time on CQRS infrastructure than delivering features.

**Preferred Alternative:** Simple patterns for small teams. Add architecture complexity as team grows.

**Refactoring Strategy:** Simplify architecture to match team size. Use Laravel defaults. Add patterns as team scales.

**Related Rules:** Match architecture complexity to team capacity (05-rules.md)

---

### Anti-Pattern 5: CQRS as Default Architecture

**Category:** Process

**Description:** CQRS adopted as default for all new features without assessment.

**Why It Happens:** Architecture decision made at project start without domain-driven evaluation.

**Warning Signs:** Every bounded context uses same CQRS level; no per-context assessment.

**Why Is It Harmful:** Overengineering in simple contexts; under-engineering in complex ones. Uniform solution for non-uniform problems.

**Preferred Alternative:** Evaluate each bounded context independently. Apply CQRS only where beneficial.

**Refactoring Strategy:** Assess each context's read/write asymmetry. Adjust CQRS depth per context.

**Related Rules:** Evaluate CQRS need per bounded context (05-rules.md)

---

### Anti-Pattern 6: No Migration Path

**Category:** Architecture

**Description:** CQRS implementation that cannot be simplified if overengineering is discovered.

**Why It Happens:** Tight coupling between CQRS infrastructure and business code.

**Warning Signs:** Business code directly depends on command bus; read model infrastructure embedded in queries.

**Why Is It Harmful:** If CQRS proves unnecessary, cannot be removed without major refactoring. Team stuck with overhead.

**Preferred Alternative:** Keep CQRS infrastructure swappable. Business code depends on interfaces, not bus directly.

**Refactoring Strategy:** Add interface layers between business code and CQRS infrastructure. Allow swapping to simpler patterns.

**Related Rules:** Design for architectural mobility (05-rules.md)
