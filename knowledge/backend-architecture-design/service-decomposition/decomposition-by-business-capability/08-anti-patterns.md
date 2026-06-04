# Anti-Patterns: Decomposition by Business Capability vs Subdomain

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Service Decomposition |
| **Topic** | Decomposition by business capability vs subdomain |
| **Difficulty** | Advanced |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Treating All Subdomains as Core | Architecture | High |
| 2 | Decomposing by Technical Layer | Architecture | High |
| 3 | Over-Decomposition | Architecture | Medium |
| 4 | Ignoring Organizational Alignment | Organizational | Medium |

## Repository-Wide Anti-Patterns

- **Everything Is Core**: Treating all subdomains with equal investment, overspending on commodity features
- **Technical Decomposition**: Splitting services by technical layers (frontend, backend, DB) instead of business capabilities
- **Over-Decomposition Syndrome**: Creating too many services that become a distributed monolith

---

## 1. Treating All Subdomains as Core

**Category:** Architecture

**Description:** Investing equal architectural effort and complexity in all subdomains, regardless of whether they are core (competitive advantage), supporting, or generic (commodity).

**Why It Happens:** Technical teams lack business domain insight. They apply the same architecture standards to authentication as they do to their core product logic.

**Warning Signs:**
- Custom-built authentication service instead of using off-the-shelf
- Generic features (logging, email, notifications) have microservice architectures
- Development velocity on core features matches commodity features

**Why Harmful:** Core subdomains deserve more investment because they provide competitive advantage. Generic subdomains should use off-the-shelf solutions. Treating all equally wastes resources.

**Consequences:**
- Overspending on commodity features
- Core features move slower due to misallocated resources
- Competitive advantage features don't get the investment they need

**Alternative:** Classify subdomains as core, supporting, or generic. Invest proportionally — maximum architecture effort in core, minimal in generic.

**Refactoring Strategy:**
1. Classify each subdomain (core, supporting, generic)
2. Replace generic subdomain custom code with off-the-shelf solutions
3. Focus architecture improvement on core subdomains

**Detection Checklist:**
- [ ] Are all subdomans treated with equal architectural investment?
- [ ] Are generic features (auth, email, logging) custom-built?
- [ ] Is there a clear classification of core vs supporting vs generic?

**Related Rules/Skills/Trees:**
- Rule: Classify Subdomains Before Decomposing (`04-standardized-knowledge.md:14-15`)

---

## 2. Decomposing by Technical Layer

**Category:** Architecture

**Description:** Splitting services by technical layers — frontend service, backend service, database service — instead of by business capability.

**Why It Happens:** Technical alignment is easier to identify than business capabilities. Teams know their technical stack better than their business domain.

**Warning Signs:**
- Services named "API Service," "Frontend Service," "Data Service"
- A single business change requires changes in all layers
- Team boundaries match technical layers, not business domains

**Why Harmful:** Technical decomposition doesn't match business change patterns. A single business feature requires changes across multiple technically-separated services.

**Consequences:**
- Business features require coordinated changes across services
- No service aligns with a complete business capability
- High coordination overhead for every feature

**Alternative:** Decompose by business capability or DDD subdomain. Each service represents a complete business function.

**Refactoring Strategy:**
1. Map business capabilities (not technical layers)
2. Group related capabilities into potential service boundaries
3. Redefine services around these business capabilities

**Detection Checklist:**
- [ ] Are services named by technical layer instead of business capability?
- [ ] Does a business change affect multiple services?
- [ ] Are services aligned with business outcomes?

**Related Rules/Skills/Trees:**
- Rule: Decompose by Business Capability, Not Technical Layer (`04-standardized-knowledge.md:14-15`)

---

## 3. Over-Decomposition

**Category:** Architecture

**Description:** Creating too many fine-grained services (e.g., 20 services for 5 capabilities), resulting in a distributed monolith.

**Why It Happens:** Enthusiasm for microservices leads to excessive decomposition. Teams split by every noun in the domain model.

**Warning Signs:**
- 20+ services for a moderate-sized application
- Most services have 1-2 endpoints
- A single feature requires coordinating 5+ services

**Why Harmful:** Over-decomposition increases latency, operational cost, and coordination overhead without delivering proportional autonomy benefits.

**Consequences:**
- High operational burden for low-value services
- Features require complex orchestration across services
- Distributed monolith — services are tightly coupled through interactions

**Alternative:** Start with fewer, coarser services. Extract smaller services only when there's a clear need (team size, deployment frequency, scaling requirements).

**Refactoring Strategy:**
1. Measure services per team member (aim for 2-3 max)
2. Merge services that are frequently deployed together
3. Keep coarse boundaries until proven insufficient

**Detection Checklist:**
- [ ] How many services exist per team member?
- [ ] Do features frequently span multiple services?
- [ ] Are there services with 1-2 endpoints?

**Related Rules/Skills/Trees:**
- Rule: Start Coarse, Extract Finer Only When Needed (`04-standardized-knowledge.md:14-15`)

---

## 4. Ignoring Organizational Alignment

**Category:** Organizational

**Description:** Designing service decomposition without considering team structure and communication patterns (ignoring Conway's Law).

**Why It Happens:** Architects design boundaries from a purely technical domain perspective, not accounting for organizational reality.

**Warning Signs:**
- A single team owns services that require coordination
- Service boundaries don't match team ownership
- Cross-team coordination is a bottleneck for changes

**Why Harmful:** Conway's Law says software architecture mirrors communication structures. Misaligned boundaries create organizational friction — teams must coordinate on every change.

**Consequences:**
- Slow feature delivery due to cross-team dependencies
- Teams cannot work independently
- Architectural complexity increased without autonomy benefit

**Alternative:** Design service boundaries to match team boundaries. Each service should be owned by exactly one team.

**Refactoring Strategy:**
1. Map current team structures
2. Identify services requiring cross-team coordination
3. Realign service boundaries to team ownership
4. Or adjust team structures to match service boundaries

**Detection Checklist:**
- [ ] Does each service have a clear owning team?
- [ ] Can teams deploy their services independently?
- [ ] Is cross-team coordination rate acceptable?

**Related Rules/Skills/Trees:**
- Rule: Align Service Boundaries with Team Boundaries (`04-standardized-knowledge.md:14-15`)
