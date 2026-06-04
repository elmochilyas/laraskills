## Rule 1: Identify bounded contexts through language boundaries, not technical boundaries
---
## Category
Architecture
---
## Rule
Run Event Storming or domain workshops to identify where the Ubiquitous Language changes; each language boundary is a potential bounded context. Never split by technical layers.
---
## Reason
Language boundaries reflect genuine domain distinctions; splitting by technical layers (controllers, services, models) ignores domain semantics and creates coupling.
---
## Bad Example
```
Splitting by tech: "Controllers folder", "Services folder", "Models folder"
All code is about the same domain but scattered.
```
---
## Good Example
```
Bounded contexts: "Sales", "Billing", "Shipping", "Inventory"
Each has its own language, models, and logic.
Sales speaks about "Orders"; Shipping speaks about "Packages".
```
---
## Exceptions
When the domain is so simple that a single bounded context suffices for the entire application.
---
## Consequences Of Violation
Tight coupling between unrelated domain concepts, team misalignment, model confusion.
---
## Rule 2: Each bounded context gets its own module with its own models and logic
---
## Category
Architecture
---
## Rule
Define clear namespace/module boundaries per bounded context: `App\Sales`, `App\Billing`. Each context owns its models, services, repositories, and events.
---
## Reason
Shared models between contexts create coupling; each context's model represents that context's view of the concept, which may differ.
---
## Bad Example
```
// All contexts share the same "User" model
App\Models\User // used by Sales, Billing, Shipping
```
---
## Good Example
```
App\Sales\Models\Customer    // Sales' view of a customer
App\Billing\Models\Payer     // Billing's view of a customer
App\Shipping\Models\Recipient // Shipping's view
```
---
## Exceptions
A Shared Kernel (small set of shared models) agreed upon by multiple contexts, documented and stable.
---
## Consequences Of Violation
Model coupling, conflicting requirements, bloated shared models.
---
## Rule 3: Map context relationships explicitly with Context Mapping
---
## Category
Architecture
---
## Rule
Document how each bounded context relates to others: Partnership, Shared Kernel, Customer-Supplier, Conformist, Anti-Corruption Layer, Open-Host Service, Published Language, Separate Ways, Big Ball of Mud.
---
## Reason
Undocumented context relationships lead to implicit coupling, confusion about responsibilities, and integration surprises.
---
## Bad Example
```
"We have Sales and Billing contexts."
"How do they interact?"
"Uh, they just call each other's methods."
```
---
## Good Example
```
Sales → Billing: Customer-Supplier (Sales is upstream, provides order data).
Billing → Legacy CRM: ACL (translates legacy schemas).
Billing → Shipping: Partnership (coordinate on shipment scheduling).
```
---
## Exceptions
Single-context applications where there are no context relationships to document.
---
## Consequences Of Violation
Implicit coupling, integration surprises, unclear team responsibilities.
---
## Rule 4: Respect bounded context autonomy—no shared databases across contexts
---
## Category
Architecture
---
## Rule
Each bounded context owns its persistence; no other context accesses its database directly. Use APIs, events, or anti-corruption layers for cross-context data.
---
## Reason
Shared databases are the fastest way to destroy bounded context independence—schema changes in one context break another.
---
## Bad Example
```
Sales context and Billing context both access "orders" table.
Sales changes schema. Billing breaks.
```
---
## Good Example
```
Sales context: owns "orders" database.
Billing context: gets order data via Sales API or OrderPlaced events.
```
---
## Exceptions
Reporting/analytics databases that are read-only snapshots with no schema coupling.
---
## Consequences Of Violation
Database coupling, lost context independence, migration conflicts.
---
## Rule 5: Align team structure with bounded contexts (Conway's Law)
---
## Category
Architecture
---
## Rule
Organize engineering teams around bounded contexts: one team per context. Avoid splitting a context across multiple teams or assigning multiple contexts to the same team without clear boundaries.
---
## Reason
Teams organized around contexts produce clean, decoupled systems; teams organized around technical layers produce technically-coupled systems.
---
## Bad Example
```
Team A: builds "controllers" across all contexts.
Team B: builds "models" across all contexts.
Outcome: every feature requires both teams → coordination overhead.
```
---
## Good Example
```
Sales Team: owns Sales context end-to-end.
Billing Team: owns Billing context end-to-end.
Outcome: teams are autonomous, deploy independently.
```
---
## Exceptions
Startups with small teams (2–5 engineers) where one team handles multiple contexts; formal context boundaries still apply even though team boundaries don't.
---
## Consequences Of Violation
Coordination overhead, slow feature delivery, architectural coupling.
