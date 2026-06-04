# Anti-Patterns: Service Boundaries

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Service Decomposition |
| **Topic** | Service boundaries in distributed systems |
| **Difficulty** | Advanced |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Shared Database Across Services | Architecture | High |
| 2 | Synchronous Call Chains | Architecture | High |
| 3 | Distributed Transactions | Reliability | High |
| 4 | Too Fine-Grained Services | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Shared Database Coupling**: Multiple services reading/writing to the same database, preventing independent deployment
- **Synchronous Chain**: Service A calls B calls C calls D, creating latency and cascading failures
- **2PC Across Services**: Distributed transactions crossing service boundaries via two-phase commit

---

## 1. Shared Database Across Services

**Category:** Architecture

**Description:** Multiple services reading and writing to the same database tables, creating tight coupling at the data level.

**Why It Happens:** Extracting services from a monolith without splitting the database. Legacy data ownership patterns persist.

**Warning Signs:**
- Services query each other's tables directly
- Schema changes require coordinated releases
- One service's slow query affects another service

**Why Harmful:** Shared databases prevent independent deployability — the core promise of microservices. If the database is shared, services are still coupled.

**Consequences:**
- Coordinated deployments despite service separation
- Schema changes break other services
- No service autonomy

**Alternative:** Each service owns its data exclusively. Other services access that data through the owning service's API.

**Refactoring Strategy:**
1. Identify which service should own each table
2. Create APIs for cross-service data access
3. Migrate data ownership gradually

**Detection Checklist:**
- [ ] Do services share database tables?
- [ ] Can schema changes be made without cross-service coordination?
- [ ] Is the database a deployment coupling point?

**Related Rules/Skills/Trees:**
- Rule: Each Service Owns Its Data Exclusively (`04-standardized-knowledge.md:14-15`)

---

## 2. Synchronous Call Chains

**Category:** Architecture

**Description:** Service A making a synchronous call to B, which calls C, which calls D — creating a chain where total latency equals the sum of all services.

**Why It Happens:** The simplest way to get data from another service is to call it synchronously. Teams don't notice the chain forming until it causes problems.

**Warning Signs:**
- Request tracing shows deep call chains
- P95 latency grows linearly with chain depth
- A downstream service outage cascades to upstream services

**Why Harmful:** Synchronous chains multiply latency, create cascading failures, and couple service availability. D's outage becomes A's outage.

**Consequences:**
- High and unpredictable latency
- Fragile system — one slow service slows all upstream services
- Hard to scale individual services independently

**Alternative:** Prefer async communication (events, queues) across service boundaries. Use synchronous calls only for the immediate consumer.

**Refactoring Strategy:**
1. Map synchronous call chains
2. Identify unnecessary synchronous dependencies
3. Replace with async events where eventual consistency is acceptable
4. Add caching to reduce synchronous call frequency

**Detection Checklist:**
- [ ] Are there synchronous call chains of depth >2?
- [ ] Does downstream latency affect upstream services?
- [ ] Can any synchronous calls be replaced with events?

**Related Rules/Skills/Trees:**
- Rule: Favor Async Across Service Boundaries (`04-standardized-knowledge.md:87-88`)

---

## 3. Distributed Transactions

**Category:** Reliability

**Description:** Using two-phase commit (2PC) or other distributed transaction protocols to maintain consistency across services.

**Why It Happens:** Teams want ACID guarantees across service boundaries. Distributed transactions seem like the natural extension of database transactions.

**Warning Signs:**
- 2PC coordinator configured
- Services participate in distributed transactions
- Transaction locks held across service calls

**Why Harmful:** Distributed transactions don't scale — they use locks, have a single point of failure (coordinator), and reduce availability per the CAP theorem.

**Consequences:**
- Poor performance from lock contention
- Coordinator becomes a single point of failure
- Services cannot be deployed independently

**Alternative:** Use the Saga pattern with compensating actions. Accept eventual consistency across service boundaries.

**Refactoring Strategy:**
1. Identify distributed transaction boundaries
2. Decompose into local transactions with compensating actions
3. Implement saga coordination (choreography or orchestration)

**Detection Checklist:**
- [ ] Are distributed transactions in use?
- [ ] Can consistency requirements tolerate eventual consistency?
- [ ] Are compensating actions implemented for failures?

**Related Rules/Skills/Trees:**
- Rule: Use Sagas Instead of Distributed Transactions (`04-standardized-knowledge.md:14-15`)

---

## 4. Too Fine-Grained Services

**Category:** Performance

**Description:** Services so small that the overhead of inter-service communication dominates the actual work being done.

**Why It Happens:** Over-decomposition following "one service per entity" or "one service per operation" logic without considering communication overhead.

**Warning Signs:**
- A single user request triggers 5+ inter-service calls
- Most service response times are <5ms but network overhead is 20ms
- Services with only 1-2 endpoints

**Why Harmful:** Fine-grained services increase latency (each call adds network overhead), complexity (more services to deploy and monitor), and operational burden.

**Consequences:**
- High latency from network overhead
- Increased operational complexity
- Deployment and monitoring overhead outweighs value

**Alternative:** Coarser service boundaries that group related operations. Aim for services that can fulfill common requests with 1-2 inter-service calls.

**Refactoring Strategy:**
1. Map user requests to service call counts
2. Merge frequently co-called services
3. Add caching for read operations to reduce calls

**Detection Checklist:**
- [ ] Does a single request trigger 5+ inter-service calls?
- [ ] Are there services with 1-2 endpoints?
- [ ] Is network overhead a significant portion of latency?

**Related Rules/Skills/Trees:**
- Rule: Aim for Coarse-Grained Service Boundaries (`04-standardized-knowledge.md:14-15`)
