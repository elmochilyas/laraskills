# Anti-Patterns: Microservices Decomposition Threshold

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Architectural Styles |
| **Topic** | Microservices decomposition threshold assessment |
| **Difficulty** | Intermediate |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Starting with Microservices | Architecture | High |
| 2 | Premature Extraction | Architecture | High |
| 3 | Ignoring Team Topology | Organizational | Medium |
| 4 | Splitting Data Before Extracting Service | Architecture | High |

## Repository-Wide Anti-Patterns

- **Microservices-First Fallacy**: Starting a new project with microservices before proving the monolith is insufficient
- **Distributed Monolith**: Services deployed separately but tightly coupled through shared database or synchronous call chains
- **Organizational Mismatch**: Service boundaries that don't align with team structures (Conway's Law violation)

---

## 1. Starting with Microservices

**Category:** Architecture

**Description:** Beginning a new project with microservices architecture instead of starting with a monolith and extracting services when needed.

**Why It Happens:** Microservices are perceived as "modern" and "scalable." Teams overestimate their future needs and underestimate the complexity of distributed systems.

**Warning Signs:**
- Greenfield project starts with 5+ services
- No monolith has ever existed
- Team has no experience operating distributed systems

**Why Harmful:** Microservices add network latency, data consistency challenges, deployment complexity, monitoring overhead, and debugging difficulty. Most applications never need microservices — the added complexity is wasted.

**Consequences:**
- Months of infrastructure before any business value
- High operational overhead for a small team
- Features take longer due to cross-service coordination
- Difficult to refactor wrong boundaries

**Alternative:** Start with a modular monolith. Keep clean module boundaries. Extract services only when scaling or team constraints make the monolith a bottleneck.

**Refactoring Strategy:**
1. Keep the monolith unless there's a proven need
2. Measure: deployment frequency conflicts, team coordination overhead, scaling bottlenecks
3. Extract incrementally using the strangler fig pattern

**Detection Checklist:**
- [ ] Have you proven the monolith is insufficient?
- [ ] Is there a clear bottleneck that microservices solve?
- [ ] Is the team experienced with distributed systems?

**Related Rules/Skills/Trees:**
- Rule: Start with a Modular Monolith (`04-standardized-knowledge.md:14-15`)

---

## 2. Premature Extraction

**Category:** Architecture

**Description:** Extracting a module into a service too eagerly, before the boundary is stable and the coupling is understood, creating a distributed monolith.

**Why It Happens:** The urge to "get to microservices" drives early extraction. Teams extract modules that still have tight coupling with the monolith.

**Warning Signs:**
- Extracted service still calls the monolith's database
- Synchronous calls between extracted service and monolith for every operation
- Deployment requires coordinated releases

**Why Harmful:** A distributed monolith has the worst of both worlds — the complexity of distributed systems with the coupling of a monolith. You pay the coordination tax without getting independent deployability.

**Consequences:**
- Coordinated deployments despite service separation
- Network latency added to tightly coupled operations
- Transactional complexity without autonomy benefits

**Alternative:** Extract only when modules are truly decoupled — independent data ownership, well-defined APIs, async communication where possible.

**Refactoring Strategy:**
1. Ensure the module has its own database schema
2. Verify it can operate without synchronous calls to the monolith
3. Test independent deployment before extraction

**Detection Checklist:**
- [ ] Does the extracted service own its data exclusively?
- [ ] Can it be deployed independently?
- [ ] Does it make synchronous calls back to the monolith?

**Related Rules/Skills/Trees:**
- Rule: Extract Only When Modules Are Truly Decoupled (`04-standardized-knowledge.md:14-15`)

---

## 3. Ignoring Team Topology

**Category:** Organizational

**Description:** Designing service boundaries without considering team structure, violating Conway's Law — software architecture mirrors communication structures.

**Why It Happens:** Architects design services purely from a technical domain perspective without assessing the team's organizational structure.

**Warning Signs:**
- One team owns multiple services that require constant coordination
- Service boundaries don't align with team ownership
- Teams frequently need to coordinate changes across services

**Why Harmful:** If services require coordination between two teams, communication overhead multiplies. Teams cannot work independently, defeating the purpose of microservices.

**Consequences:**
- Cross-team coordination for every feature
- Slow decision-making from inter-team dependencies
- Frustrated teams blocked by other teams' changes

**Alternative:** Design service boundaries to match team boundaries. One service = one team. Two-team services require clear contracts and async communication.

**Refactoring Strategy:**
1. Map current team structure
2. Identify services that require cross-team coordination
3. Either merge services into single-team ownership or split them further

**Detection Checklist:**
- [ ] Does each service have a clear owning team?
- [ ] Can teams deploy independently?
- [ ] Is cross-team coordination rate acceptable?

**Related Rules/Skills/Trees:**
- Rule: Align Service Boundaries with Team Boundaries (`04-standardized-knowledge.md:14-15`)

---

## 4. Splitting Data Before Extracting Service

**Category:** Architecture

**Description:** Splitting the database schema and migrating data before the service code is extracted, adding complexity and risk without immediate benefit.

**Why It Happens:** Database splitting is perceived as a prerequisite for service extraction. Teams tackle data migration first.

**Warning Signs:**
- Data migration in progress while service code is still in the monolith
- Temporary dual-write logic to keep schemas in sync
- Months of data work before any service extraction

**Why Harmful:** Premature data splitting adds massive complexity (dual writes, sync mechanisms, migration scripts) before the service boundary is proven correct. If the boundary is wrong, the data work must be redone.

**Consequences:**
- Wasted effort if boundaries change
- Months of data migration, delaying extraction value
- Risk of data loss or inconsistency during migration

**Alternative:** Extract the service code first with its own new schema. Use the strangler fig pattern: new features use the new service, old data stays in the monolith until migration is trivial.

**Refactoring Strategy:**
1. Create new service with its own database schema
2. Route new operations to the service
3. Backfill or migrate data incrementally
4. Decommission old data when no longer needed

**Detection Checklist:**
- [ ] Is data migration happening before service extraction?
- [ ] Is there a dual-write phase?
- [ ] Can the extraction proceed without data migration?

**Related Rules/Skills/Trees:**
- Rule: Extract Service First, Migrate Data Later (`04-standardized-knowledge.md:14-15`)
