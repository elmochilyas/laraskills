# ECC Anti-Patterns — Dependency Analysis & Modularity

## Domain: Backend Architecture & Design | Subdomain: Architectural Governance

### Anti-Pattern Inventory

1. **Metrics Without Context** — Chasing metric values without understanding what they mean
2. **Hub Module** — Single module with high afferent AND efferent coupling
3. **Dependency Cycle** — Circular dependencies between modules
4. **Stable Dependency** — Instable module depends on unstable module
5. **Ignoring Distance Metric** — High distance from main sequence ignored
6. **Tool Metrics Only** — Relying solely on automated metrics without human review

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Metrics Without Context

**Category:** Analysis

**Description:** Optimizing dependency metrics as numbers without understanding their architectural meaning.

**Why It Happens:** "Improve metrics" becomes a goal without context of what good looks like.

**Warning Signs:** Teams chasing lower coupling without considering domain cohesion; metrics gamed by restructuring classes arbitrarily.

**Why Is It Harmful:** Low coupling is meaningless if cohesion is destroyed. Classes moved to reduce coupling that belong together domain-wise.

**Preferred Alternative:** Interpret metrics in context of module responsibilities and domain boundaries.

**Refactoring Strategy:** Pair metric review with domain analysis. Never change structure based on metrics alone.

**Related Rules:** Interpret metrics in domain context (05-rules.md)

---

### Anti-Pattern 2: Hub Module

**Category:** Architecture

**Description:** A single module that many depend on AND depends on many others.

**Why It Happens:** Utility/helper module grows unchecked; central "core" module accumulates dependencies.

**Warning Signs:** Single module has highest Ca AND Ce in system; changes to module cause cascading breaks.

**Why Is It Harmful:** The hub becomes a bottleneck — any change risks breaking many dependents while also being affected by many changes.

**Preferred Alternative:** Split hub into smaller, focused modules with clear responsibilities.

**Refactoring Strategy:** Identify responsibilities within hub. Extract each into separate module. Reduce both Ca (dependents use specific sub-modules) and Ce (hub depends only on what it needs).

**Related Rules:** Split hub modules by responsibility (05-rules.md)

---

### Anti-Pattern 3: Dependency Cycle

**Category:** Architecture

**Description:** Module A depends on B, which depends on C, which depends on A.

**Why It Happens:** Cross-cutting concerns not identified; bidirectional communication needs not abstracted.

**Warning Signs:** Cannot understand any module without understanding the whole system; tests require loading all modules.

**Why Is It Harmful:** Creates tight coupling across modules. Prevents independent testing, deployment, and development. Indicates poor separation of concerns.

**Preferred Alternative:** Break cycles by extracting shared dependency or using dependency inversion.

**Refactoring Strategy:** Use Deptrac to detect cycles. Extract interfaces to invert dependencies. Move shared types to separate module.

**Related Rules:** Eliminate all dependency cycles (05-rules.md)

---

### Anti-Pattern 4: Stable Dependency

**Category:** Architecture

**Description:** An unstable (frequently changing) module is depended upon by many stable modules.

**Why It Happens:** Core domain concepts change frequently but are depended on widely.

**Warning Signs:** Low instability module with high efferent coupling to high instability modules.

**Why Is It Harmful:** Changes to a volatile module cascade to all its dependents. Stable modules become fragile.

**Preferred Alternative:** Apply Stable Dependencies Principle — depend in direction of stability.

**Refactoring Strategy:** Extract stable interfaces from unstable modules. Make dependents depend on interfaces, not implementations.

**Related Rules:** Depend in direction of stability (05-rules.md)

---

### Anti-Pattern 5: Ignoring Distance Metric

**Category:** Analysis

**Description:** High Distance from Main Sequence (|A + I - 1|) ignored as "too theoretical."

**Why It Happens:** Distance metric is less intuitive than coupling/cohesion.

**Warning Signs:** Modules with high D value (close to 1) are not refactored; main sequence violations accumulate.

**Why Is It Harmful:** Indicates modules that are either "useless" (high abstraction, low stability — interfaces nobody uses) or "painful" (high concreteness, high stability — can't change, breaks everything).

**Preferred Alternative:** Review modules with D > 0.5 and refactor toward main sequence.

**Refactoring Strategy:** For "useless" modules — remove or implement. For "painful" modules — abstract to reduce concrete dependency impact.

**Related Rules:** Keep modules close to main sequence (05-rules.md)

---

### Anti-Pattern 6: Tool Metrics Only

**Category:** Analysis

**Description:** Relying solely on automated metrics without human architectural review.

**Why It Happens:** Metrics tools produce numbers that feel objective and complete.

**Warning Signs:** Team believes low coupling/high cohesion metrics = good architecture; surprises when system is still hard to maintain.

**Why Is It Harmful:** Metrics measure structure, not semantics. Two modules may be loosely coupled but semantically incoherent. Cohesion metrics don't capture domain-driven design quality.

**Preferred Alternative:** Combine automated metrics with regular architecture reviews (ADRs, C4 model reviews).

**Refactoring Strategy:** Schedule quarterly architecture reviews. Use metrics as indicators, not judgments. Pair metrics with domain analysis.

**Related Rules:** Combine metrics with human review (05-rules.md)
