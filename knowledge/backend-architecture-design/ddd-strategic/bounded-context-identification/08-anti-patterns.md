# ECC Anti-Patterns — Bounded Context Identification

## Domain: Backend Architecture & Design | Subdomain: Domain-Driven Design

### Anti-Pattern Inventory

1. **Technical Boundaries** — Splitting by technology layer instead of domain semantics
2. **Wrong Granularity** — Contexts too large (monolith) or too small (micro-contexts)
3. **Ignoring Ubiquitous Language Divergence** — Same term used differently in same context
4. **No Context Mapping** — Unknown relationships between contexts
5. **Data Ownership Confusion** — Multiple contexts claiming same data
6. **Premature Context Splitting** — Dividing before understanding domain

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Technical Boundaries

**Category:** Architecture

**Description:** Splitting by technical layer (Controllers, Services, Models) instead of domain concepts.

**Why It Happens:** Technical architecture is easier to see than domain boundaries.

**Warning Signs:** Bounded contexts named "API", "Services", "Models"; contexts don't match business domains.

**Why Is It Harmful:** Changes span multiple "contexts" when they should be in one. High coupling, low cohesion.

**Preferred Alternative:** Identify contexts by business domain meaning, not technical layer.

**Refactoring Strategy:** Reorganize around business domains. Merge technical-split contexts.

**Related Rules:** Identify contexts by domain semantics (05-rules.md)

---

### Anti-Pattern 2: Wrong Granularity

**Category:** Architecture

**Description:** Contexts too large (multiple domains in one) or too small (single concept per context).

**Why It Happens:** No explicit granularity guideline; extreme interpretation of bounded contexts.

**Warning Signs:** A single context covering billing, shipping, and inventory; or separate contexts for "Customer" and "CustomerAddress."

**Why Is It Harmful:** Too large: high coupling within context, hard to change. Too small: integration overhead exceeds value.

**Preferred Alternative:** Size contexts so each can be owned and evolved by a single team independently.

**Refactoring Strategy:** Merge overly small contexts; split overly large ones based on subdomain types.

**Related Rules:** Size contexts for independent team ownership (05-rules.md)

---

### Anti-Pattern 3: Ignoring Language Divergence

**Category:** Domain Modeling

**Description:** Same term used with different meanings within the same bounded context.

**Why It Happens:** No glossary; language drift not tracked.

**Warning Signs:** "Customer" means different things in different parts of same context. Confusion in team discussions.

**Why Is It Harmful:** Code doesn't match business understanding. Bugs from misinterpretation.

**Preferred Alternative:** Document ubiquitous language in glossary. Resolve ambiguities by splitting contexts or renaming.

**Refactoring Strategy:** Identify divergent terms. Either split context or rename to disambiguate.

**Related Rules:** Maintain consistent language within each context (05-rules.md)

---

### Anti-Pattern 4: No Context Mapping

**Category:** Architecture

**Description:** Context relationships not documented or understood.

**Why It Happens:** Contexts identified but their integration patterns not defined.

**Warning Signs:** Ad-hoc integration between contexts; no explicit partnership/customer-supplier decisions.

**Why Is It Harmful:** Integration happens without design. Wrong relationship patterns emerge.

**Preferred Alternative:** Map all context relationships using context mapping patterns.

**Refactoring Strategy:** Document context map. Define relationship pattern per edge.

**Related Rules:** Map all context relationships (05-rules.md)

---

### Anti-Pattern 5: Data Ownership Confusion

**Category:** Architecture

**Description:** Multiple bounded contexts claiming ownership of the same data.

**Why It Happens:** No explicit data ownership per context.

**Warning Signs:** Both Billing and Shipping contexts directly updating "order status."

**Why Is It Harmful:** Data integrity issues. Which context is authoritative? Concurrent updates conflict.

**Preferred Alternative:** Each data element owned by exactly one context. Others access via API/events.

**Refactoring Strategy:** Assign data ownership per context. Create APIs for cross-context data access.

**Related Rules:** Each context owns its data exclusively (05-rules.md)

---

### Anti-Pattern 6: Premature Context Splitting

**Category:** Process

**Description:** Splitting into bounded contexts before understanding the domain.

**Why It Happens:** "Microservices" enthusiasm applied before domain analysis.

**Warning Signs:** Context boundaries keep shifting; services frequently need to be merged.

**Why Is It Harmful:** Cost of repeated reorganization. Wrong boundaries persist because changing them is expensive.

**Preferred Alternative:** Use Event Storming and domain exploration before defining contexts. Start with larger contexts, split as understanding grows.

**Refactoring Strategy:** Merge prematurely split contexts. Re-split after proper domain analysis.

**Related Rules:** Understand domain before defining context boundaries (05-rules.md)
