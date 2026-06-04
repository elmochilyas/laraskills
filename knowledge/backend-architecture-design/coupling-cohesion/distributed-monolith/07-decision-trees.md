# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Distributed monolith anti-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Microservices vs Modular Monolith vs Distributed Monolith path
* Decision 2: Synchronous vs async communication across service boundaries
* Decision 3: Shared database vs database-per-service data ownership

---

# Architecture-Level Decision Trees

---

## Decision: Microservices vs Modular Monolith vs Distributed Monolith Path

---

## Decision Context

Choose the deployment architecture to avoid the distributed monolith anti-pattern.

---

## Decision Criteria

* performance considerations: microservices add network latency; monolith has none
* architectural considerations: modular monolith provides many microservice benefits without distribution costs
* security considerations: service boundaries improve isolation but add authentication complexity
* maintainability considerations: distributed monolith is worst of both worlds

---

## Decision Tree

Is the team experienced with microservices operations (DevOps, monitoring, deployment automation)?
↓
YES → Is the system large enough (> 10 bounded contexts, > 3 teams) to justify distribution?
    YES → Microservices with strict boundary enforcement (data ownership, async, independent deployability)
    NO → Modular Monolith (same boundary rigor, single deployment, no distribution overhead)
        ↓
        Can you resist the temptation to add synchronous calls between modules?
        YES → Modular Monolith (safe path)
        NO → You will create a Distributed Monolith → Stay Modular Monolith
NO → Do you have the operational maturity to run multiple services?
    YES → Modular Monolith (build operational maturity first; extract later)
    NO → Modular Monolith (microservices without operations = distributed monolith)

---

## Rationale

A distributed monolith is the most common failure mode of microservices adoption. It combines the costs of distribution (network latency, operational complexity) with the coupling of a monolith (coordinated deployments, shared databases). A modular monolith provides the same boundary rigor without the distribution overhead.

---

## Recommended Default

**Default:** Start with a Modular Monolith; extract to microservices only when clear need emerges and operational maturity exists.

**Reason:** The modular monolith provides all the architectural benefits of microservices (bounded contexts, data ownership, independent module evolution) without any of the distribution costs.

---

## Risks Of Wrong Choice

Microservices without maturity: distributed monolith, all costs of distribution with none of the benefits. Monolith without modularity: Big Ball of Mud, no clean boundaries to extract later. Distributed monolith: worst outcome — tight coupling + network overhead.

---

## Related Rules

- Rule 1: Services must not share a single database
- Rule 4: Each service must be independently deployable without coordinated deployments
- Rule 5: Service boundaries must follow bounded contexts

---

## Related Skills

- Detect and Resolve a Distributed Monolith
- Decompose by Business Capability
- Implement a Modular Monolith

---

## Decision: Synchronous vs Async Communication Across Service Boundaries

---

## Decision Context

Choose between synchronous (HTTP/gRPC) and asynchronous (events/queues) communication for cross-service interactions.

---

## Decision Criteria

* performance considerations: sync is lower latency per call; async decouples availability
* architectural considerations: sync creates temporal coupling; async enables independent deployment
* security considerations: both need authentication; async requires event security
* maintainability considerations: sync is simpler to debug; async adds infrastructure complexity

---

## Decision Tree

Does the consumer need strong consistency (immediate, transactional)?
↓
YES → Is the data critical enough that eventual consistency would cause business damage?
    YES → Synchronous call (accept availability coupling)
    NO → Is there a compensating transaction path available?
        YES → Async with saga pattern (eventual consistency + compensation)
        NO → Synchronous call (default to consistency)
NO → Can the consumer operate with eventually consistent data?
    YES → Prefer async events (decoupled availability, independent scalability)
    NO → Synchronous call (data freshness requirement)

---

## Rationale

Synchronous calls across service boundaries create availability coupling: if the downstream service is down, the upstream fails. Async communication via events decouples service availability at the cost of eventual consistency. The default should be async; use sync only when strong consistency is a hard requirement.

---

## Recommended Default

**Default:** Async events for cross-service communication; sync only for strong consistency requirements.

**Reason:** Async decouples service availability and enables independent deployment. Most business data can tolerate eventual consistency with proper saga compensation.

---

## Risks Of Wrong Choice

Sync everywhere: cascading failures, availability coupling, distributed monolith. Async everywhere: unnecessary eventual consistency complexity for data that needs to be immediately consistent.

---

## Related Rules

- Rule 2: No synchronous calls across service boundaries for eventually consistent data
- Rule 3: Orchestrate sagas, not distributed transactions — no 2PC

---

## Related Skills

- Detect and Resolve a Distributed Monolith
- Implement Event Sourcing
- Implement Outbox Pattern

---

## Decision: Shared Database vs Database-Per-Service Data Ownership

---

## Decision Context

Determine whether services should share a database or each own their data exclusively.

---

## Decision Criteria

* performance considerations: shared DB has no replication lag; per-service DB adds network latency
* architectural considerations: shared DB creates the strongest coupling between services
* security considerations: shared DB bypasses service-level access controls
* maintainability considerations: shared DB makes schema changes require coordinated deployment

---

## Decision Tree

Are these services or modules within the same bounded context?
↓
YES → Shared database is acceptable (they're the same context; coupling is expected)
NO → Are you using a modular monolith with strict module boundaries?
    YES → Separate schema per module in the same database (logical separation with single physical DB)
    NO → Do the services need to deploy independently?
        YES → Database per service (physical separation, no schema coupling)
        NO → Is the shared data read-only for some services?
            YES → Read-only replica (acceptable; no schema coupling risk)
            NO → Database per service (required for independence)

---

## Rationale

A shared database is the strongest form of coupling between services. A schema change in one service can break all consumers. Database-per-service is non-negotiable for true microservice independence. For modular monoliths, separate schemas within a single database provide a practical middle ground.

---

## Recommended Default

**Default:** Database per service for microservices; separate schemas per module for modular monoliths.

**Reason:** Service independence requires exclusive data ownership. Without it, deployment coupling and schema coupling inevitably create a distributed monolith.

---

## Risks Of Wrong Choice

Shared database across services: schema coupling, deployment coordination, lost independence. Database per service when unnecessary: infrastructure complexity, data duplication, cross-service queries become difficult.

---

## Related Rules

- Rule 1: Services must not share a single database
- Rule 4: Each service must be independently deployable

---

## Related Skills

- Detect and Resolve a Distributed Monolith
- Decompose by Business Capability
- Define Data Ownership and Transactional Boundaries
