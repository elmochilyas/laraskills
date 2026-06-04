# ECC Anti-Patterns — Selective CQRS Application

## Domain: Backend Architecture & Design | Subdomain: Command Query Separation

### Anti-Pattern Inventory

1. **Uniform CQRS Depth** — Same CQRS level applied to all bounded contexts
2. **CQRS Theater** — Superficial separation without actual read/write asymmetry benefit
3. **Context Boundary Pollution** — CQRS infrastructure leaking between bounded contexts
4. **Analysis Paralysis** — Endless assessment without applying CQRS where it helps
5. **Context Islands Too Small** — Splitting into too many small contexts with individual CQRS
6. **Ignoring Operational Cost** — Adding CQRS without accounting for team maintenance capacity

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Uniform CQRS Depth

**Category:** Architecture

**Description:** All bounded contexts using the same CQRS level regardless of their individual needs.

**Why It Happens:** Architecture decision made centrally and applied uniformly.

**Warning Signs:** Reporting context (high read asymmetry) and user registration (simple CRUD) use same CQRS level.

**Why Is It Harmful:** Overengineering in simple contexts, under-engineering in complex ones. Wasted effort.

**Preferred Alternative:** Assess each bounded context independently. Apply appropriate CQRS depth per context.

**Refactoring Strategy:** Evaluate each context's read/write asymmetry. Simplify over-engineered contexts; enhance under-engineered ones.

**Related Rules:** Apply CQRS depth per bounded context (05-rules.md)

---

### Anti-Pattern 2: CQRS Theater

**Category:** Architecture

**Description:** Superficial read/write separation (different files) without actual benefit in query performance or model clarity.

**Why It Happens:** Following CQRS naming conventions without understanding the purpose.

**Warning Signs:** Query model has identical fields to command model; no performance difference between approaches.

**Why Is It Harmful:** Separated files with no actual separation of concerns. Waste of file count and navigation overhead.

**Preferred Alternative:** Only separate when there's actual asymmetry in structure, performance, or evolution needs.

**Refactoring Strategy:** Merge identical read/write models. Keep CQRS only where asymmetry provides measurable benefit.

**Related Rules:** Separate only where asymmetry exists (05-rules.md)

---

### Anti-Pattern 3: Context Boundary Pollution

**Category:** Architecture

**Description:** CQRS infrastructure (bus, events, projections) shared across bounded contexts.

**Why It Happens:** Single command bus configuration for entire application.

**Warning Signs:** Billing context events trigger actions in User context; shared middleware pipeline for multiple contexts.

**Why Is It Harmful:** Contexts become coupled through shared infrastructure. Cannot evolve independently. Changes in one context affect others.

**Preferred Alternative:** Separate CQRS infrastructure per bounded context or use context-specific middleware.

**Refactoring Strategy:** Isolate CQRS infrastructure per context. Use context identifier in middleware to segment processing.

**Related Rules:** Keep CQRS infrastructure bounded per context (05-rules.md)

---

### Anti-Pattern 4: Analysis Paralysis

**Category:** Process

**Description:** Endless analysis of whether to apply CQRS without actually implementing it.

**Why It Happens:** Fear of overengineering leads to never engineering.

**Warning Signs:** Weeks of discussion about CQRS levels; no code changes despite clear asymmetry.

**Why Is It Harmful:** Benefits never realized. Team stuck discussing rather than delivering.

**Preferred Alternative:** Start with Level 1 (separate models) for obvious cases. Assess after implementation.

**Refactoring Strategy:** Pick one context with clear asymmetry. Implement Level 1. Evaluate results, then expand.

**Related Rules:** Start implementing, stop analyzing (05-rules.md)

---

### Anti-Pattern 5: Context Islands Too Small

**Category:** Architecture

**Description:** Splitting into too many bounded contexts, each with its own CQRS infrastructure.

**Why It Happens:** Every domain concept treated as its own context.

**Warning Signs:** 20+ bounded contexts each with command bus, query handlers, read models.

**Why Is It Harmful:** Massive infrastructure overhead. Cross-context transactions become complex. Navigation nightmare.

**Preferred Alternative:** Group related concepts into larger bounded contexts. Apply CQRS at context group level.

**Refactoring Strategy:** Merge related small contexts. Share CQRS infrastructure within merged context.

**Related Rules:** Keep bounded context granularity pragmatic (05-rules.md)

---

### Anti-Pattern 6: Ignoring Operational Cost

**Category:** Operations

**Description:** Adding CQRS without accounting for ongoing maintenance and team capacity.

**Why It Happens:** Architecture decisions made without operational cost consideration.

**Warning Signs:** Team overwhelmed by CQRS-related bugs; backlog growing; features delayed by architecture maintenance.

**Why Is It Harmful:** Team spends more time on architecture than features. Technical debt from CQRS infrastructure exceeds its value.

**Preferred Alternative:** Assess team capacity before adding CQRS complexity. Start small, expand as team can handle.

**Refactoring Strategy:** Simplify CQRS stack to match team capacity. Reduce levels where maintenance cost exceeds benefit.

**Related Rules:** Match CQRS complexity to team capacity (05-rules.md)
