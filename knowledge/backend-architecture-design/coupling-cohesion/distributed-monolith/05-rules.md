## Rule 1: Services must not share a single database — each service owns its data
---
## Category
Architecture
---
## Rule
Every service must own its data schema and database. No service may directly access another service's database; use APIs or events for cross-service data.
---
## Reason
Shared databases create the strongest coupling between services — a schema change in one service can break all others, negating independence.
---
## Bad Example
```
Service A: microservice
Service B: microservice
Both read/write the same "orders" table.
Schema change in A breaks B at runtime.
```
---
## Good Example
```
Service A: owns "orders" database
Service B: owns "notifications" database
Service B reads order data via Service A's API or via events.
```
---
## Exceptions
Reporting/analytics databases that are read-only replicas with no schema coupling risk.
---
## Consequences Of Violation
Database coupling, deployment coupling, lost service independence.
---
## Rule 2: No synchronous calls across service boundaries for data that could be eventually consistent
---
## Category
Architecture
---
## Rule
Prefer asynchronous events over synchronous HTTP/gRPC calls for cross-service data propagation unless strong consistency is absolutely required.
---
## Reason
Synchronous chaining creates availability coupling — if Service B is down, Service A fails. Eventual consistency via events decouples service availability.
---
## Bad Example
```
Service A calls Service B for every data lookup.
Service B is slow/down → Service A degrades or fails.
```
---
## Good Example
```
Service A publishes "OrderPlaced" event.
Service B consumes event and stores local read model.
Service A is always available regardless of B's health.
```
---
## Exceptions
When strong consistency is required (payment authorization, inventory reservation) and compensating transactions are acceptable.
---
## Consequences Of Violation
Availability coupling, cascading failures, reduced independence.
---
## Rule 3: Orchestrate sagas, not distributed transactions — no 2PC
---
## Category
Architecture
---
## Rule
Use saga patterns (choreography or orchestration) with compensating actions for multi-service transactions; never use two-phase commit (2PC) or XA transactions.
---
## Reason
2PC locks resources across services, kills availability, and defeats the purpose of microservice independence.
---
## Bad Example
```
Create Order + Charge Payment + Reserve Inventory in one distributed transaction.
Failure: locks held for minutes, cascading rollbacks.
```
---
## Good Example
```
Saga: OrderCreated → PaymentCharged → InventoryReserved
If inventory fails → compensating PaymentRefunded, OrderCancelled
Each step is an event, not a lock.
```
---
## Exceptions
Within a single service's boundary, local ACID transactions are fine. The rule applies across service boundaries.
---
## Consequences Of Violation
Tight coupling, availability degradation, lock contention.
---
## Rule 4: Each service must be independently deployable without coordinated deployments
---
## Category
Reliability
---
## Rule
Deploy each service independently; if deploying A requires simultaneously deploying B, you have a distributed monolith, not microservices.
---
## Reason
Coordinated deployments violate the primary benefit of microservices: independent deployability. They create deployment coupling and release bottlenecks.
---
## Bad Example
```
Deploy Service A: requires Service B to deploy at the exact same moment.
Orgs: "We have microservices."
Reality: Distributed monolith.
```
---
## Good Example
```
Service A deploys with backward-compatible API.
Service B deploys later, independently.
Old and new versions coexist during migration.
```
---
## Exceptions
Security patches where all services must deploy together to fix a vulnerability.
---
## Consequences Of Violation
Deployment coupling, release gate (slow), coordinated rollbacks.
---
## Rule 5: Service boundaries must follow bounded contexts — never cut services by technical layer
---
## Category
Architecture
---
## Rule
Define each service around a DDD bounded context; never create separate services for "controllers," "services," and "models" within the same domain.
---
## Reason
Technical splits within a domain still require tight communication — the services end up calling each other synchronously for every operation, creating a distributed monolith.
---
## Bad Example
```
order-controllers-service (deployed separately from order-data-service)
Every single request: controller-service → data-service (synchronous)
Extracting either one independently is impossible.
```
---
## Good Example
```
order-service: owns order domain completely (controllers, logic, persistence)
payment-service: owns payment domain completely
Clear bounded context boundaries.
```
---
## Exceptions
When the technical split is explicitly justified for scaling independent dimensions (e.g., read operations scaled separately from writes as in CQRS).
---
## Consequences Of Violation
Chatty synchronous calls, deployments coordination, no actual service independence.
