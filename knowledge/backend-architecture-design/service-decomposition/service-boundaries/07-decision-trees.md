# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Service boundaries in distributed systems
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Boundary definition strategy — business capability vs DDD subdomain for services
* Decision 2: Communication pattern — sync (API) vs async (event) for service interactions
* Decision 3: Data ownership isolation — database per service vs shared database

---

# Architecture-Level Decision Trees

---

## Decision: Boundary Definition Strategy — Business Capability vs DDD Subdomain for Services

---

## Decision Context

Choose the primary method for defining service boundaries in a distributed system.

---

## Decision Criteria

* performance considerations: subdomain boundaries minimize cross-service calls; capability boundaries may create chatter
* architectural considerations: subdomain boundaries are more stable; capability boundaries may shift with org changes
* security considerations: subdomain boundaries naturally isolate core/security-critical subdomains
* maintainability considerations: subdomain boundaries produce more autonomous services; capability boundaries align with teams

---

## Decision Tree

Does the organization have clearly defined team structures aligned to business capabilities?
↓
YES → Start with business capability boundaries (Conway's Law alignment)
    ↓
    Validate: can each capability operate independently without frequent cross-capability calls?
    YES → Capability boundaries are valid
    NO → Overlay subdomain analysis: are multiple capabilities operating in the same subdomain?
        YES → Merge capabilities that belong to the same subdomain
        NO → Capability boundaries may create distributed monolith — reconsider
NO → Use DDD subdomain analysis as the primary driver
    ↓
    For each candidate service boundary, evaluate:
    Does it own its data exclusively?
    YES → Valid service boundary
    NO → Redefine boundary until data ownership is exclusive
    Can it operate without 3+ synchronous calls to other services?
    YES → Valid service boundary (autonomous operation)
    NO → Redefine boundary to reduce synchronous call chains
    Would a change in this service affect <3 other services?
    YES → Valid boundary (change containment)
    NO → Boundary is too narrow or coupled — re-evaluate

---

## Rationale

Service boundaries are the most critical architectural decision in a distributed system. Business capability decomposition aligns with team structure (Conway's Law). DDD subdomain decomposition identifies where competitive advantage lies and produces more stable boundaries. In practice, boundaries should satisfy three criteria: exclusive data ownership, autonomous operation (few sync dependencies), and change containment (changes affect few services).

---

## Recommended Default

**Default:** Map business capabilities first, validate each candidate against the three criteria (data ownership, autonomy, change containment). Refine with subdomain analysis where criteria aren't met.

**Reason:** Capability alignment with teams is practical, but boundaries must satisfy the three technical criteria to avoid creating a distributed monolith.

---

## Risks Of Wrong Choice

Poor service boundaries: distributed monolith with network overhead, no real autonomy, coordinated deployments. Too fine-grained: service mesh complexity, data consistency nightmares, orchestration spaghetti. Too coarse: team coordination bottlenecks, deployment conflicts.

---

## Related Rules

- Rule 1: Service boundaries must satisfy: exclusive data ownership, autonomous operation, and change containment
- Rule 2: Bad boundaries create distributed monoliths

---

## Related Skills

- Identify Service Boundaries
- Map Business Capabilities to Services
- Design Anti-Corruption Layer

---

## Decision: Communication Pattern — Sync (API) vs Async (Event) for Service Interactions

---

## Decision Context

Choose whether services communicate via synchronous APIs or asynchronous events.

---

## Decision Criteria

* performance considerations: sync adds direct latency per call; async has queue delay but better throughput
* architectural considerations: sync couples service availability; async decouples lifecycles
* security considerations: sync allows real-time auth; async requires secure event bus and consumer auth
* maintainability considerations: async requires event schema management, dead letter queues, and monitoring

---

## Decision Tree

Does the calling service need an immediate response to proceed?
↓
YES → Sync API call (request/response required)
    ↓
    Is this a read operation (query data)?
    YES → Sync API is appropriate (but consider: could a read model serve this?)
    NO → Is this a write operation that requires confirmation?
        YES → Sync API to write + return confirmation
        ↓
        Can this be changed to "fire and forget" with callback later?
        YES → Async with callback would decouple services (prefer async)
        NO → Sync is appropriate
    NO → Does the response carry critical business data for the next operation?
        YES → Sync (async would add latency for the decision path)
        NO → Async possible (the response is informational, not blocking)
NO → Async event (fire and forget)
    ↓
    Does the event need guaranteed delivery?
    YES → Use outbox pattern (DB transaction + event published after commit)
    NO → Simple event dispatch (acceptable for non-critical notifications)
    ↓
    How many consumers need this event?
    FEW (1-2) → Topic per consumer or simple event
    MANY (3+) → Publish to a shared event bus, each consumer filters
    ↓
    Does the consumer need to reply or acknowledge?
    YES → Consider request/reply pattern over async (correlation ID)
    NO → Pure fire-and-forget

---

## Rationale

Sync communication is simpler but couples service availability and creates cascading failure risk. Async communication decouples services, improves resilience, and is generally preferred for inter-service communication. However, some operations inherently require sync (read queries, operations needing immediate confirmation). The goal is to minimize sync dependencies and prefer async for most interactions.

---

## Recommended Default

**Default:** Async events for write operations; sync APIs only for read queries and operations requiring immediate responses.

**Reason:** Async decouples service lifecycles, improves resilience, and aligns with eventual consistency patterns. Sync creates temporal coupling and cascading failure risk. Minimize sync calls; each sync call is a potential failure point.

---

## Risks Of Wrong Choice

All sync: cascading failures, temporal coupling, distributed monolith. All async: latency on read paths, complexity for operations needing immediate confirmation, debugging difficulty. Sync without timeouts: resource exhaustion, thread pool starvation.

---

## Related Rules

- Rule 3: Favor async communication across service boundaries
- Rule 4: Document cross-boundary communication contracts

---

## Related Skills

- Design Event Schema
- Implement Outbox Pattern
- Design Resilient API Contracts

---

## Decision: Data Ownership Isolation — Database Per Service vs Shared Database

---

## Decision Context

Choose whether each service has its own database or services share a database.

---

## Decision Criteria

* performance considerations: shared database allows efficient joins; per-service database requires API composition
* architectural considerations: per-service database enables independent deployment and schema evolution
* security considerations: per-service database isolates data access; shared database increases exposure risk
* maintainability considerations: per-service database requires data sync mechanisms; shared database requires coordinated migrations

---

## Decision Tree

Do multiple services write to the same database?
↓
YES → Shared database — evaluate if this is appropriate
    ↓
    Is there an architectural constraint (legacy, compliance) preventing split?
    YES → Accept shared database but mitigate:
        → Each service reads/writes only its own tables
        → Table prefixes or schemas per service
        → Schema changes approved by all service owners
    NO → Split into per-service databases (this is the recommended default)
NO → Does each service have exclusive write access to its own tables/database?
    YES → Database per service (ideal state)
    ↓
    Do services need to join data across databases?
    YES → Use API composition or CQRS with read models (not cross-DB joins)
    NO → Database per service is correct
NO → Redefine service boundaries to ensure exclusive data ownership

---

## Rationale

Each service should own its database exclusively. Shared databases create deployment coupling, schema coordination overhead, and prevent independent evolution. This is the defining characteristic of a distributed monolith. When data needs to be aggregated across services, use API composition or build read models — never share databases.

---

## Recommended Default

**Default:** Database per service. Shared database only when legacy or compliance constraints make it unavoidable.

**Reason:** Exclusive database ownership is what makes services independently deployable. Without it, schema changes require coordination, deployment order matters, and services aren't truly autonomous.

---

## Risks Of Wrong Choice

Shared database: deployment order coupling, cascading schema changes, no autonomous deployment, distributed monolith. Database per service without read models: slow API composition queries, N+1 across services, no efficient cross-service reporting.

---

## Related Rules

- Rule 5: Each service exclusively owns its database and schema
- Rule 1: Service boundaries must satisfy exclusive data ownership

---

## Related Skills

- Implement Database Per Service Pattern
- Design Read Models for Cross-Service Queries
- Implement API Composition Pattern
