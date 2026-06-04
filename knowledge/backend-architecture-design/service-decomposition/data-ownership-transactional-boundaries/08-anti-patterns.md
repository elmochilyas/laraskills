# Anti-Patterns: Data Ownership and Transactional Boundaries

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Service Decomposition |
| **Topic** | Data ownership and transactional boundaries |
| **Difficulty** | Advanced |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Distributed Transactions | Architecture | High |
| 2 | Shared Database Across Services | Architecture | High |
| 3 | Cross-Service Joins | Performance | Medium |
| 4 | No Compensating Actions | Reliability | High |

## Repository-Wide Anti-Patterns

- **2PC Across Services**: Distributed two-phase commit transactions crossing service boundaries
- **Shared Data Ownership**: Multiple services writing to the same table, causing data corruption
- **Query-Level Coupling**: Joining across service databases for performance convenience

---

## 1. Distributed Transactions

**Category:** Architecture

**Description:** Using two-phase commit (2PC) or similar distributed transaction protocols to maintain ACID consistency across service boundaries.

**Why It Happens:** Teams need strong consistency guarantees that span multiple services. Distributed transaction protocols seem like the natural answer.

**Warning Signs:**
- Transaction coordinator configured
- Locks held across service boundaries
- Rollback logic spans multiple services

**Why Harmful:** Distributed transactions reduce availability per the CAP theorem, introduce a single point of failure (coordinator), and cause lock contention that limits scalability.

**Consequences:**
- Poor performance from distributed lock contention
- Coordinator becomes a single point of failure
- Services cannot be deployed or scaled independently

**Alternative:** Use the Saga pattern. Each service performs its local transaction and emits events. Compensating actions handle failures.

**Refactoring Strategy:**
1. Identify distributed transaction boundaries
2. Decompose into local transactions per service
3. Implement compensating actions for each step
4. Choose choreography or orchestration for saga coordination

**Detection Checklist:**
- [ ] Are distributed transactions in use?
- [ ] Is there a transaction coordinator?
- [ ] Can consistency requirements tolerate eventual consistency?

**Related Rules/Skills/Trees:**
- Rule: Use Sagas, Not 2PC (`04-standardized-knowledge.md:14-15`)

---

## 2. Shared Database Across Services

**Category:** Architecture

**Description:** Multiple services reading and writing to the same database tables, violating exclusive data ownership.

**Why It Happens:** Legacy monolith extraction without splitting the database. Or architectural oversight during initial design.

**Warning Signs:**
- Two services modify the same table
- Schema changes require coordinated releases
- One service's slow queries affect another

**Why Harmful:** Shared databases prevent independent deployability. If the database is shared, services are still tightly coupled regardless of code separation.

**Consequences:**
- Cannot deploy services independently
- Schema changes break other services
- Data ownership is ambiguous — multiple services can corrupt data

**Alternative:** Each service owns its data exclusively. Other services access data through the owning service's API.

**Refactoring Strategy:**
1. Assign each table to exactly one service
2. Create APIs for cross-service data access
3. Migrate ownership gradually, one table at a time
4. Add data sync mechanisms for read replicas if needed

**Detection Checklist:**
- [ ] Do multiple services write to the same table?
- [ ] Can schema changes be made without cross-service coordination?
- [ ] Is data ownership clearly assigned?

**Related Rules/Skills/Trees:**
- Rule: Each Service Owns Its Data Exclusively (`04-standardized-knowledge.md:14-15`)

---

## 3. Cross-Service Joins

**Category:** Performance

**Description:** Joining across multiple services' databases at the query level to avoid API calls, creating query-level coupling.

**Why It Happens:** API calls are slower than database joins. Teams take the performance shortcut of direct database access.

**Warning Signs:**
- Queries join tables owned by different services
- Service A's queries reference Service B's schema
- Schema changes in B break A's reporting queries

**Why Harmful:** Cross-service joins couple services at the query level, prevent schema evolution, and create hidden dependencies that surface as breaking changes.

**Consequences:**
- Service B cannot change its schema without breaking Service A's queries
- Hidden coupling — no API contract, just implicit schema knowledge
- Performance issues cascade across services

**Alternative:** Use API composition — the consuming service calls the owning service's API and combines results. Or use CQRS with read models for reporting.

**Refactoring Strategy:**
1. Identify cross-service joins
2. Create an API endpoint in the data-owning service for the needed data
3. Replace joins with API calls
4. Add read model for high-frequency queries

**Detection Checklist:**
- [ ] Are there cross-service database joins?
- [ ] Do services reference other services' schemas directly?
- [ ] Are there API endpoints for cross-service data access?

**Related Rules/Skills/Trees:**
- Rule: Access Cross-Service Data Through APIs, Not Joins (`04-standardized-knowledge.md:14-15`)

---

## 4. No Compensating Actions

**Category:** Reliability

**Description:** Implementing sagas or multi-step operations without compensating actions for rollback, leaving the system in an inconsistent state on failure.

**Why It Happens:** Compensating actions are complex to implement. Teams assume failures won't happen or that manual fixes will suffice.

**Warning Signs:**
- Saga steps have no compensating (undo) actions
- Failed operations leave partial state
- Manual database fixes required when things go wrong

**Why Harmful:** Without compensating actions, partial failures leave the system permanently inconsistent. Manual fixes are error-prone and don't scale.

**Consequences:**
- Data inconsistency after failures
- Manual intervention for every saga failure
- Hard-to-diagnose data corruption

**Alternative:** Every saga step must have a compensating action. Test compensating actions regularly.

**Refactoring Strategy:**
1. Identify all saga operations
2. For each step, implement a compensating action (undo the step)
3. Test compensating actions in failure scenarios
4. Monitor saga failures and compensating action success

**Detection Checklist:**
- [ ] Do all saga steps have compensating actions?
- [ ] Are compensating actions tested?
- [ ] Is there a monitoring system for saga failures?

**Related Rules/Skills/Trees:**
- Rule: Every Saga Step Must Have a Compensating Action (`04-standardized-knowledge.md:14-15`)
