# Anti-Patterns: Aggregate Boundaries as Decomposition Units

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Service Decomposition |
| **Topic** | Aggregate boundaries as decomposition units |
| **Difficulty** | Advanced |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Giant Aggregates | Architecture | High |
| 2 | Cross-Aggregate Transactions | Architecture | High |
| 3 | Aggregate Object References | Design | Medium |
| 4 | Ignoring Aggregates in Decomposition | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Monolithic Aggregate**: Single aggregate containing many entities, creating performance bottlenecks and transaction conflicts
- **Distributed Aggregate Transaction**: Operations spanning multiple aggregates wrapped in distributed transactions
- **Entity References Across Aggregates**: Aggregates referencing other aggregates by object reference instead of by ID

---

## 1. Giant Aggregates

**Category:** Architecture

**Description:** Aggregates that contain too many entities and value objects, becoming large consistency boundaries that cause performance issues and transaction conflicts.

**Why It Happens:** Modeling the entire business object graph as a single aggregate. "An Order has OrderItems, Payments, Shipments, Invoices — make it all one aggregate."

**Warning Signs:**
- Aggregate root with 10+ child entities
- Frequent transaction conflicts from concurrent users modifying different parts
- Large aggregate load times

**Why Harmful:** Large aggregates mean more contention — every change loads and locks more data than needed. Performance degrades as the aggregate grows.

**Consequences:**
- Transaction conflicts from unrelated concurrent modifications
- Slow aggregate load times (loading unnecessary data)
- Reduced scalability from contention

**Alternative:** Keep aggregates small — one entity plus closely related value objects. Different parts of the object graph are separate aggregates.

**Refactoring Strategy:**
1. Identify entity groups that change independently
2. Split the aggregate into smaller aggregates
3. Use domain events for cross-aggregate communication

**Detection Checklist:**
- [ ] Does the aggregate have 10+ child entities?
- [ ] Are there transaction conflicts from concurrent modifications?
- [ ] Do different parts of the aggregate change independently?

**Related Rules/Skills/Trees:**
- Rule: Keep Aggregates Small (`04-standardized-knowledge.md:14-15`)

---

## 2. Cross-Aggregate Transactions

**Category:** Architecture

**Description:** Wrapping operations that modify multiple aggregates in a single database transaction, violating aggregate boundary independence.

**Why It Happens:** The simplest way to ensure consistency across aggregates is to wrap everything in a transaction. It appears to "just work."

**Warning Signs:**
- Database transaction spans multiple aggregate saves
- Multiple aggregates loaded and saved in one request
- Transaction rollback for one aggregate affects others

**Why Harmful:** Cross-aggregate transactions negate the purpose of aggregate boundaries. Aggregates are supposed to be independent consistency boundaries. Joining them in transactions creates coupling.

**Consequences:**
- Transaction conflicts from unrelated aggregate modifications
- Cannot extract aggregates into separate services
- Reduced scalability (locks held across aggregates)

**Alternative:** Use domain events for eventual consistency across aggregates. Each aggregate persists independently.

**Refactoring Strategy:**
1. Identify cross-aggregate transaction boundaries
2. Replace with event-driven eventual consistency
3. Implement compensating actions for failure scenarios

**Detection Checklist:**
- [ ] Do database transactions span multiple aggregates?
- [ ] Are multiple aggregates saved atomically?
- [ ] Is eventual consistency acceptable for cross-aggregate operations?

**Related Rules/Skills/Trees:**
- Rule: One Transaction Per Aggregate (`04-standardized-knowledge.md:14-15`)

---

## 3. Aggregate Object References

**Category:** Design

**Description:** Aggregates referencing other aggregates by object reference (loading the entire aggregate) instead of by ID.

**Why It Happens:** Object-oriented modeling instincts. Loading a related aggregate by object reference feels natural.

**Warning Signs:**
- Aggregate A has a direct object reference to Aggregate B
- Loading Aggregate A also loads Aggregate B
- Cascade loading across aggregate boundaries

**Why Harmful:** Object references cause unintended cascade loading, coupling aggregate persistence, and making it impossible to extract aggregates into separate services.

**Consequences:**
- Excessive database loading (loading aggregates not needed for the operation)
- Coupled persistence — cannot store aggregates in different databases
- Unclear boundary between aggregates

**Alternative:** Reference other aggregates by their ID only. Load them explicitly through a repository when needed.

**Refactoring Strategy:**
1. Replace object references with ID references
2. Replace lazy loading with explicit repository queries
3. Verify aggregates can be loaded independently

**Detection Checklist:**
- [ ] Do aggregates reference other aggregates by object?
- [ ] Are there cascade loads across aggregate boundaries?
- [ ] Can each aggregate be loaded independently?

**Related Rules/Skills/Trees:**
- Rule: Reference Aggregates by ID, Not Object (`04-standardized-knowledge.md:14-15`)

---

## 4. Ignoring Aggregates in Decomposition

**Category:** Architecture

**Description:** Decomposing services by technical concerns (controllers, services, repositories) instead of using aggregate boundaries as natural decomposition units.

**Why It Happens:** Teams unfamiliar with DTD design decompose the architecture the same way they organize code — by technical layer.

**Warning Signs:**
- Service boundaries don't align with aggregate boundaries
- A single service manages multiple unrelated aggregates
- Aggregates split across services without clear ownership

**Why Harmful:** Aggregate boundaries represent natural transaction and consistency boundaries. Ignoring them creates services that either own too much (multiple aggregates) or too little (part of an aggregate).

**Consequences:**
- Services that manage conflicting consistency boundaries
- Services that cannot maintain aggregate invariants
- Painful refactoring to realign boundaries later

**Alternative:** Use aggregate boundaries as a starting point for service decomposition. Each aggregate root can be a service.

**Refactoring Strategy:**
1. Identify aggregate roots in the domain
2. Map each aggregate root to a potential service
3. Align service boundaries with aggregate boundaries
4. Merge aggregates only if they change together

**Detection Checklist:**
- [ ] Do service boundaries align with aggregate boundaries?
- [ ] Does each aggregate have a clear owning service?
- [ ] Are aggregates split across services?

**Related Rules/Skills/Trees:**
- Rule: Align Service Boundaries with Aggregate Boundaries (`04-standardized-knowledge.md:14-15`)
