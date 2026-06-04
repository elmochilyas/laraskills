# ECC Anti-Patterns — Distributed Monolith

## Domain: Backend Architecture & Design | Subdomain: Anti-Patterns & Architectural Smells

### Anti-Pattern Inventory

1. **Shared Database** — Multiple services reading/writing the same database tables
2. **Synchronous Call Chains** — A → B → C → D for a single user operation
3. **Coordinated Deployments** — Services that must be deployed together
4. **Cross-Service Transactions** — Distributed transactions across service boundaries
5. **Technical-Split Services** — Services split by layer (frontend, backend, DB) not domain
6. **Premature Decomposition** — Splitting into services before understanding boundaries

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Shared Database

**Category:** Architecture

**Description:** Multiple microservices reading and writing the same database tables.

**Why It Happens:** Monolith is split into services but database remains shared for "simplicity."

**Warning Signs:** Service A writes `orders` table; Service B reads `orders` table directly; schema changes require coordinated updates.

**Why Is It Harmful:** Creates tight coupling at database level. Cannot change schema independently. One service's query load affects others. Defeats service autonomy.

**Preferred Alternative:** Each service owns its data. Services communicate via API or events, not shared database.

**Refactoring Strategy:** Extract service-specific tables. Create APIs for data access. Migrate consumers to API calls.

**Related Rules:** Each service owns its data exclusively (05-rules.md)

---

### Anti-Pattern 2: Synchronous Call Chains

**Category:** Architecture

**Description:** User request triggers synchronous calls through multiple services (A → B → C → D).

**Why It Happens:** Services designed as CRUD APIs; operations require data from multiple services.

**Warning Signs:** Single user request takes 2+ seconds due to service chain; any service down = entire operation fails.

**Why Is It Harmful:** Combined latency = sum of all service latencies. Availability = product of all service availabilities (A × B × C × D). One slow service slows everything.

**Preferred Alternative:** Use async events or CQRS with materialized views for cross-service data needs.

**Refactoring Strategy:** Identify read paths that can use cached/materialized data. Replace sync calls with event-driven updates.

**Related Rules:** Minimize synchronous inter-service calls (05-rules.md)

---

### Anti-Pattern 3: Coordinated Deployments

**Category:** Operations

**Description:** Services that must be deployed together because of API changes or shared contracts.

**Why It Happens:** Tight coupling — API changes require simultaneous updates across services.

**Warning Signs:** Deployment checklist: "deploy A, B, C together"; rollback requires rolling back all services.

**Why Is It Harmful:** Loses independent deployability — the main benefit of microservices. Deployments become high-risk, low-frequency events.

**Preferred Alternative:** Design backward-compatible APIs. Use versioned endpoints. Allow independent deployment.

**Refactoring Strategy:** Add API versioning. Implement consumer-driven contracts. Expand-contract migration pattern.

**Related Rules:** Services must be independently deployable (05-rules.md)

---

### Anti-Pattern 4: Cross-Service Transactions

**Category:** Architecture

**Description:** Distributed transactions (2PC, XA) spanning multiple services.

**Why It Happens:** Business operations that require atomic updates across service boundaries.

**Warning Signs:** Saga pattern implemented with distributed transaction coordinator; 2PC in microservices.

**Why Is It Harmful:** Distributed transactions don't scale. Locking across services causes contention. Failure recovery complex.

**Preferred Alternative:** Use Saga pattern with compensating actions. Eventual consistency with idempotent handlers.

**Refactoring Strategy:** Replace distributed transactions with choreographed sagas. Add compensating actions for failure scenarios.

**Related Rules:** Use sagas, not distributed transactions (05-rules.md)

---

### Anti-Pattern 5: Technical-Split Services

**Category:** Architecture

**Description:** Services split by technology layer (frontend service, backend service, data service) instead of business domain.

**Why It Happens:** Familiarity with layered architecture applied to distributed systems.

**Warning Signs:** "API service" + "Business Logic Service" + "Data Service" as separate deployment units.

**Why Is It Harmful:** Any feature change requires changes across all services. High ceremony, no autonomy.

**Preferred Alternative:** Split services by business domain (bounded context). Each service owns its full vertical slice.

**Refactoring Strategy:** Merge technical-split services by domain. Each service contains its own API, logic, and data.

**Related Rules:** Split by business domain, not technical layer (05-rules.md)

---

### Anti-Pattern 6: Premature Decomposition

**Category:** Architecture

**Description:** Splitting into microservices before understanding domain boundaries.

**Why It Happens:** Microservices adopted as trend; team doesn't know bounded contexts yet.

**Warning Signs:** Service boundaries keep shifting; frequent cross-service refactoring; "this should be in a different service" regularly.

**Why Is It Harmful:** Wrong boundaries lead to distributed monolith. Cost of splitting without understanding is constant reorganization.

**Preferred Alternative:** Start with modular monolith. Extract services as boundaries become clear.

**Refactoring Strategy:** Collapse services into modular monolith. Identify stable boundaries. Extract services only when boundaries are proven.

**Related Rules:** Start modular monolith, extract services later (05-rules.md)
