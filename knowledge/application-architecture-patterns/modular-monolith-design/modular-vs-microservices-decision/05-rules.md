# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Modular monolith vs. microservices decision framework
Knowledge Unit ID: MMD-17
Difficulty Level: Advanced
Last Updated: 2026-06-02

---
## Rule Name
Always start with a modular monolith as the default architecture
---
## Category
Architecture
---
## Rule
Default to a modular monolith for every new Laravel project. Only consider microservices when specific, measurable organizational or technical constraints prove the modular monolith insufficient.
---
## Reason
Industry data suggests 40%+ of microservice implementations should have remained monoliths. Modules provide domain isolation without distribution costs (separate CI, deploys, monitoring, teams). The modular monolith is a valid end-state architecture, not a temporary stepping stone.
---
## Bad Example
`php
// "Let's build microservices from day one to be future-proof"
// 8-person team, 5 microservices
// CI x5, deploy x5, monitoring x5
// 50% of time on infrastructure instead of features
`
---
## Good Example
`php
// Start modular: modules in a single Laravel app
// Extract to microservice only when specific trigger is met
// Billing module: 70% CPU, needs separate scaling. Extract Billing.
// Other modules stay in monolith.
`
---
## Exceptions
Organizations with >50 engineers and independently operating sub-teams may justify starting with microservices if the business requires independent deployability from day one.
---
## Consequences Of Violation
Unnecessary operational complexity; development velocity drops 50%+; team spends more time on infrastructure than features.

---
## Rule Name
Use team size as the primary decision factor
---
## Category
Architecture
---
## Rule
Choose modular monolith for teams under 30 engineers. Consider microservices for teams over 50 with independently operating sub-teams. Between 30-50, evaluate based on organizational coupling needs.
---
## Reason
Microservices are primarily an organizational pattern enabling team independence. Conway's Law: software structure mirrors communication structure. One team -> one deployment. Multiple independent teams -> consider microservices.
---
## Bad Example
`php
// 15-person team, 8 microservices
// "Each developer owns a service"
// But all 15 people still coordinate on every cross-service change
// No team independence benefit - just extra cost
`
---
## Good Example
`php
// 15-person team, modular monolith
// 3 sub-teams: Billing (5), Catalog (5), Orders (5)
// Each team owns modules within single deployment
// When teams grow to 15+ each and need independence - extract
`
---
## Exceptions
Specific technology needs (mixed stacks) or regulatory requirements (PCI scope isolation) may justify earlier microservice adoption regardless of team size.
---
## Consequences Of Violation
Distribution costs without organizational benefit; developer frustration with coordination overhead.

---
## Rule Name
Track module-level resource usage before considering extraction
---
## Category
Scalability
---
## Rule
Implement per-module resource monitoring (CPU, memory, database query volume, response time). Only consider extraction when a module's resource profile diverges significantly from the rest of the monolith.
---
## Reason
Without data, extraction decisions are based on gut feeling. Measure first: if all modules have similar resource profiles, scaling the monolith instance is simpler and cheaper than extracting.
---
## Bad Example
`php
// "The Orders module might need to scale separately"
// No data to support the claim
// Extraction adds 3x infrastructure cost for no benefit
`
---
## Good Example
`php
// Per-module metrics show:
// Billing: 70% CPU, 2000 RPM (requests per minute)
// Orders: 15% CPU, 300 RPM
// Catalog: 10% CPU, 100 RPM
// Inventory: 5% CPU, 50 RPM
// Billing has diverged - extraction candidate identified
`
---
## Exceptions
Organizational requirements (team independence) may justify extraction even without resource divergence.
---
## Consequences Of Violation
Unnecessary extraction; or failure to identify modules that genuinely need independent scaling.

---
## Rule Name
Assess the cost of distribution before adopting microservices
---
## Category
Architecture
---
## Rule
Before adopting microservices, calculate the expected cost increase: 3-5x operational complexity, 2-3x latency overhead, 2x CI infrastructure, 3x monitoring surface area. Use these numbers to validate the decision.
---
## Reason
Microservices trade operational simplicity for organizational flexibility. The cost is real and predictable. A team that underestimates this cost will be surprised by infrastructure overhead consuming development capacity.
---
## Bad Example
`php
// "Microservices will make us faster"
// No cost assessment performed
// 6 months later: "We spend all our time on CI and deployments"
`
---
## Good Example
`php
// Cost assessment before decision:
// Current: 1 CI pipeline, 1 deploy, 1 monitoring dashboard
// After extraction (5 services): 5 CI pipelines, 5 deploy pipelines, 5 monitoring dashboards
// Estimated: 2 DevOps engineer months to set up, 20% ongoing overhead
// Decision justified only if business benefit exceeds this cost
`
---
## Exceptions
No common exceptions. Distribution cost assessment is mandatory before deciding on microservices.
---
## Consequences Of Violation
Underestimated operational overhead; team capacity consumed by infrastructure; slower feature delivery than monolith baseline.

---
## Rule Name
Avoid the distributed monolith anti-pattern
---
## Category
Architecture
---
## Rule
Never create microservices that share a database or have synchronous call chains that create deployment coupling. A distributed monolith combines the operational complexity of microservices with the coupling of a monolith.
---
## Reason
Shared database + independent services = worst of both worlds. You get the cost of distribution (CI x N, deploy x N, monitoring x N) without the benefit of independence (schema changes still require coordination, queries still cross boundaries).
---
## Bad Example
`php
// Distributed monolith
// 5 microservices, all using the SAME database
// "microservices_user" can access all tables
// Schema changes require coordinating ALL services
// Services cannot deploy independently
`
---
## Good Example
`php
// True microservices - separate databases
// Billing service: own database (billing_db)
// Orders service: own database (orders_db)
// Catalog service: own database (catalog_db)
// Communication only via HTTP/queue
// Each service can deploy independently
`
---
## Exceptions
During extraction (Strangler Fig transition), temporary shared database access may exist with a documented cutover plan.
---
## Consequences Of Violation
All the cost of microservices (complex CI, deploy, monitoring) with none of the benefit (no independent evolution); worst possible architectural outcome.

---
## Rule Name
Use Conway's Law as architectural guidance
---
## Category
Architecture
---
## Rule
Structure your software architecture to match your organizational structure. One team that communicates frequently → one deployment (modular monolith). Multiple independent teams → consider multiple deployments (microservices).
---
## Reason
Conway's Law is not optional - it describes an inevitable relationship between communication structure and system design. Fighting it creates friction. Using it creates alignment.
---
## Bad Example
`php
// One team of 10 people, but 4 microservices
// Team communicates constantly (Slack, daily standup)
// But software is split into 4 deployments
// Every change touches multiple services - constant coordination
`
---
## Good Example
`php
// One team of 10 people -> modular monolith (one deployment)
// Team can coordinate internally through architecture
// When team splits into independent sub-teams: extract corresponding modules
// Software structure evolves with organizational structure
`
---
## Exceptions
No common exceptions. Conway's Law should always be considered in architectural decisions.
---
## Consequences Of Violation
Organizational friction; services require constant cross-team coordination despite being "independent"; deployment independence is theoretical, not actual.

---
## Rule Name
Do not treat the modular monolith as a temporary "not yet microservices" state
---
## Category
Architecture
---
## Rule
Design the modular monolith as a permanent end-state architecture. Extraction to microservices is possible when needed, but the modular monolith itself is a complete and valid architecture.
---
## Reason
Treating the modular monolith as temporary leads to underinvesting in module quality. Developers take shortcuts ("we'll fix it when we extract") that never get fixed. The modular structure must be maintained regardless of extraction plans.
---
## Bad Example
`php
// "This module is just a folder - we'll extract it to a service in Q3"
// Q3 comes: module is coupled, contracts are fragile, cannot extract
// "We'll fix coupling first" - never happens
`
---
## Good Example
`php
// "This modular monolith is our architecture"
// Modules have explicit contracts, schema ownership, enforcement
// Extraction is possible because modules are well-designed
// But extraction may never happen - and that's fine
`
---
## Exceptions
No common exceptions. The modular monolith is always a valid end-state architecture.
---
## Consequences Of Violation
Artifical urgency around extraction; underinvested module boundaries; shortcuts justified by "temporary" status that never end.

---
## Rule Name
Document the architecture decision with specific rationale
---
## Category
Maintainability
---
## Rule
When choosing between modular monolith and microservices, document the decision in an ADR with: team size, organizational structure, expected scaling needs, deployment requirements, and the specific rationale for the chosen architecture.
---
## Reason
Architecture decisions without documentation are forgotten. Future team members need to understand why a particular choice was made to avoid repeating analysis or making contradictory changes.
---
## Bad Example
`php
// No ADR - "We chose microservices because everyone does it"
// 2 years later: "Why are we using microservices? No one knows."
// Cost of reverting to monolith is now too high
`
---
## Good Example
`php
// ADR-001: Architecture Decision Record
// Title: Choose Modular Monolith
// Team size: 12 engineers, one team
// Scaling needs: Uniform across domains
// Deployment: Single deployment sufficient
// Rationale: Modular monolith provides domain isolation
//   without distribution costs. Extraction path preserved
//   for when team grows or resource profiles diverge.
// Date: 2026-06-02
`
---
## Exceptions
No common exceptions. Architecture decisions should always be documented.
---
## Consequences Of Violation
Architecture rationale is lost; future teams make contradictory decisions; cost of changing architecture direction is not understood.
