# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Data ownership and transactional boundaries
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Data ownership — exclusive write vs shared database
* Decision 2: Cross-service consistency — saga vs distributed transaction
* Decision 3: Data duplication — eventual consistency cache vs live query

---

# Architecture-Level Decision Trees

---

## Decision: Data Ownership — Exclusive Write vs Shared Database

---

## Decision Context

Choose whether each service exclusively owns its data or multiple services share a database.

---

## Decision Criteria

* performance considerations: exclusive ownership avoids query coupling but may duplicate data
* architectural considerations: exclusive ownership enables independent deployment and autonomy
* security considerations: exclusive ownership limits data exposure to the owning service
* maintainability considerations: shared database creates implicit coupling that cascades schema changes

---

## Decision Tree

Does more than one service need write access to the same table?
↓
YES → Can one service be designated as the write owner?
    YES → The other service must read via the owner's API (not direct DB access)
    NO → Are both services in the same bounded context?
        YES → Merge into a single service (they shouldn't be separate)
        NO → Assign ownership to one service; the other requests writes via API
            ↓
            Does the non-owning service need immediate consistency?
            YES → Use sync API call (but consider if this creates a distributed monolith)
            NO → Use async event (owner publishes change, others consume)
NO → Is this service the sole writer of its data?
    YES → Exclusive write ownership (ideal state)
    ↓
    Do other services need read access to this data?
    YES → Expose via API (not direct DB access)
    ↓
    Is the API read path too slow for the consumer's use case?
    YES → Replicate data via events (eventual consistency cache in consumer)
    NO → API is sufficient (no data duplication needed)
NO → Single-owner-per-service pattern applies

---

## Rationale

Each service should exclusively own its data. Other services access it through the owner's API, never directly. Shared databases create deployment coupling, implicit schema contracts, and prevent independent evolution. When read latency is critical, replicate data via events rather than sharing the database.

---

## Recommended Default

**Default:** Exclusive write ownership per service. All cross-service data access goes through the owning service's API or events.

**Reason:** Exclusive ownership enables independent deployment, schema evolution, and team autonomy. It prevents the tight coupling that turns microservices into a distributed monolith.

---

## Risks Of Wrong Choice

Shared database: deployment coupling, cascading schema changes, no service autonomy, distributed monolith. Exclusive ownership without API contracts: brittle consumers that break when the owner changes internal representation.

---

## Related Rules

- Rule 2: Data ownership assertions — a service must fail if it doesn't own the data it writes
- Rule 1: Each service exclusively owns its data; other services read/write via the owner's API

---

## Related Skills

- Design Data Ownership Boundaries
- Implement Service APIs for Cross-Service Data Access

---

## Decision: Cross-Service Consistency — Saga vs Distributed Transaction

---

## Decision Context

Choose how to maintain consistency across services when an operation spans multiple data owners.

---

## Decision Criteria

* performance considerations: distributed transactions (2PC) block resources; sagas are non-blocking
* architectural considerations: sagas align with service autonomy; 2PC couples transaction managers
* security considerations: sagas must handle partial failure with compensating actions
* maintainability considerations: sagas require compensating logic; 2PC hides complexity but is fragile

---

## Decision Tree

Does the operation span multiple data-owning services?
↓
YES → Can the operation tolerate eventual consistency?
    YES → Use saga pattern (choreography or orchestration)
    ↓
    Does the saga have 3+ steps?
    YES → Use orchestration saga (central coordinator manages flow)
    NO → Use choreography saga (each step emits events for next step)
    NO → Is strong immediate consistency truly required (regulatory, financial)?
        YES → Consider: 2PC is the only option for strong consistency across services
        ↓
        Can the services be merged into one to avoid distributed consistency?
        YES → Merge services (one transaction, no distribution needed)
        NO → Evaluate 2PC vs redesign for eventual consistency
            ↓
            Is the business willing to accept downtime when the coordinator fails?
            YES → 2PC possible (but coordinator is SPOF and latency bottleneck)
            NO → Redesign for eventual consistency (the business can tolerate delayed consistency)
    ↓
    Are compensating actions defined for every step in the saga?
    YES → Saga is safe to implement
    NO → Add compensating actions: every step's compensation must be idempotent and reliable

---

## Rationale

Distributed transactions (2PC) across services are an anti-pattern. They introduce a coordinator bottleneck, reduce availability, and couple services at the transaction level. Sagas with compensating actions are the correct approach — they tolerate partial failure and preserve service autonomy.

---

## Recommended Default

**Default:** Saga pattern (choreography for simple, orchestration for complex). Avoid 2PC across services entirely.

**Reason:** Sagas preserve service autonomy, tolerate partial failure, and scale better than 2PC. The business cost of eventual consistency is almost always lower than the operational cost of distributed transactions.

---

## Risks Of Wrong Choice

2PC across services: coordinator SPOF, locking, reduced availability, coupling. Saga without compensations: partial failure leaves system with no recovery path, data corruption.

---

## Related Rules

- Rule 3: Transactional boundaries fall within a single service — never span services
- Rule 4: Use sagas with compensating actions for multi-service operations

---

## Related Skills

- Design Saga Orchestrator
- Implement Compensating Actions
- Apply Outbox Pattern for Reliable Event Dispatch

---

## Decision: Data Duplication — Eventual Consistency Cache vs Live Query

---

## Decision Context

Choose whether to duplicate data across services (eventual consistency cache) or query the owning service live.

---

## Decision Criteria

* performance considerations: local cache is faster; live queries add network latency
* architectural considerations: duplicated data requires sync logic; live queries keep data fresh
* security considerations: cached data may become stale or leak sensitive information
* maintainability considerations: cache sync adds complexity; live queries are simpler but slower

---

## Decision Tree

Does the consumer need this data on every request to its own endpoint?
↓
YES → Is sub-100ms response time critical for this endpoint?
    YES → Consider caching the data locally (eventual consistency)
    ↓
    Can the data be stale by up to 60 seconds without business impact?
    YES → Event-sourced cache: subscribe to events from the owning service
    NO → Live query: API call to owning service (fresher but slower)
    NO → Live query: API call to owning service (no duplication needed)
↓
How many consumers need the same data?
FEW (1-2) → Live query is simpler and viable
MANY (5+) → Event-sourced cache: each consumer stores a local copy
    ↓
    What's the data change frequency?
    RARELY → Cache aggressively (long TTL, refresh on event or periodic poll)
    OFTEN → Consider: is this data genuinely owned by the right service?
        YES → Accept the event volume and sync frequency
        NO → Reconsider service boundaries (maybe data should move)
↓
Does the duplicated data need to be searchable or queryable?
YES → Local read model with indexed fields (build from events)
NO → Key-value cache (simple, TTL-based)

---

## Rationale

Data duplication across services should be the exception, not the norm. Prefer live queries via the owning service's API. Duplicate only when (1) response time is critical, (2) the owning service cannot meet the SLA, or (3) multiple consumers need the same data. Duplication always means eventual consistency and sync logic.

---

## Recommended Default

**Default:** Live query via API. Duplicate only when latency requirements cannot be met or when 5+ consumers need the same data.

**Reason:** Live queries are simpler, always consistent, and avoid the operational overhead of sync mechanisms. Data duplication is a performance optimization that trades consistency for speed.

---

## Risks Of Wrong Choice

Duplicating without sync mechanism: stale data leads to incorrect business decisions. Live query for every request: latency cascades, network overhead, owning service becomes bottleneck. Over-duplication: synchronization complexity, data drift, confusion about source of truth.

---

## Related Rules

- Rule 5: Data duplication across services must have a sync mechanism
- Rule 1: Each service exclusively owns its data

---

## Related Skills

- Implement Event-Sourced Cache
- Design Cross-Service Data Synchronization
