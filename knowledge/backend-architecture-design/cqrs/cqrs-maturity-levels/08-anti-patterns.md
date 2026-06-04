# ECC Anti-Patterns — CQRS Maturity Levels

## Domain: Backend Architecture & Design | Subdomain: Command Query Separation

### Anti-Pattern Inventory

1. **Jumping to Level 4** — Full independent deployment for a simple CRUD app
2. **Level 0 Denial** — Refusing Level 1-2 when read/write asymmetry is obvious
3. **Label Obsession** — Debating maturity level instead of solving the actual problem
4. **Storage Separation Without Need** — Separate databases when in-memory transformation suffices
5. **Event Sourcing for CRUD** — Full event sourcing applied to write-only data
6. **Level Lock-In** — Architecture that prevents moving between levels as needed

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Jumping to Level 4

**Category:** Architecture

**Description:** Implementing fully independent read/write deployment without need.

**Why It Happens:** "Going all in" on CQRS; overestimating scale requirements.

**Warning Signs:** Separate read/write services, databases, and deployment pipelines for < 1k req/s.

**Why Is It Harmful:** Massive infrastructure complexity for no benefit. Team maintains double the deployment units. Eventual consistency issues without scale justification.

**Preferred Alternative:** Start at Level 0-1. Increase level as actual bottlenecks appear.

**Refactoring Strategy:** Collapse to simpler level. Use in-memory or single-database patterns. Add complexity only when measured need exists.

**Related Rules:** Start at lowest level, ascend as needed (05-rules.md)

---

### Anti-Pattern 2: Level 0 Denial

**Category:** Architecture

**Description:** Refusing to adopt any CQRS pattern even when read/write asymmetry causes pain.

**Why It Happens:** "CQRS is overengineering" dogma applied to cases where it would help.

**Warning Signs:** Complex queries on transactional models causing performance issues; no separate read models.

**Why Is It Harmful:** Performance problems persist. Code forced through single model that tries to serve both transactional and reporting needs poorly.

**Preferred Alternative:** Apply Level 1 (separate read model) where read/write patterns differ significantly.

**Refactoring Strategy:** Add simple read model for reporting/query paths. Keep write model transactional.

**Related Rules:** Apply CQRS where read/write asymmetry exists (05-rules.md)

---

### Anti-Pattern 3: Label Obsession

**Category:** Process

**Description:** Teams debating "what CQRS level are we?" instead of solving structural problems.

**Why It Happens:** Architectural label matters more than actual outcomes.

**Warning Signs:** Meetings about CQRS level classification; "we're Level X" used as status symbol.

**Why Is It Harmful:** Energy spent on taxonomy rather than improvement. Rigid level adherence prevents pragmatic compromises.

**Preferred Alternative:** Focus on read/write separation needs. Let appropriate level emerge from needs.

**Refactoring Strategy:** Skip level labeling. Describe actual architecture: "queries use separate models," not "we're Level 2."

**Related Rules:** Solve problems, don't collect levels (05-rules.md)

---

### Anti-Pattern 4: Storage Separation Without Need

**Category:** Architecture

**Description:** Separate read/write databases when in-memory transformation would suffice.

**Why It Happens:** Level 2 seen as "real CQRS"; desire for sophisticated infrastructure.

**Warning Signs:** Read replica configured; eventual consistency introduced; data synchronization pipeline built — all for < 100 req/s.

**Why Is It Harmful:** Operational complexity of syncing two data stores. Eventual consistency bugs. Infrastructure cost.

**Preferred Alternative:** In-memory read model transformation. Only separate storage when read volume exceeds write capacity.

**Refactoring Strategy:** Consolidate to single database. Use in-memory transformations or caching. Monitor read performance before separating.

**Related Rules:** Separate storage only when performance demands it (05-rules.md)

---

### Anti-Pattern 5: Event Sourcing for CRUD

**Category:** Architecture

**Description:** Full event sourcing (Level 3) for domains that only create, read, update, delete.

**Why It Happens:** "Event sourcing is best practice" applied without domain fit assessment.

**Warning Signs:** Event sourcing infrastructure for data that never needs temporal queries.

**Why Is It Harmful:** Massive complexity for no benefit. Event stores are harder to query. Projections need maintenance. Catch-up is slow.

**Preferred Alternative:** Use Level 0-2 for CRUD domains. Reserve event sourcing for domains requiring audit trails or temporal queries.

**Refactoring Strategy:** Remove event sourcing from CRUD contexts. Use soft deletes and timestamps for basic audit needs.

**Related Rules:** Event source only when temporal queries are required (05-rules.md)

---

### Anti-Pattern 6: Level Lock-In

**Category:** Architecture

**Description:** Architecture choices that prevent moving between CQRS levels.

**Why It Happens:** Over-committing to infrastructure that's hard to undo.

**Warning Signs:** Cannot easily remove event sourcing; read database coupled to write database infrastructure.

**Why Is It Harmful:** If chosen level is wrong, system cannot adapt. Team stuck with complexity they don't need.

**Preferred Alternative:** Design for level mobility. Keep boundaries clean so levels can be reduced or increased.

**Refactoring Strategy:** Ensure write model doesn't depend on read model infrastructure. Use interfaces that allow swapping strategies.

**Related Rules:** Design for level mobility (05-rules.md)
