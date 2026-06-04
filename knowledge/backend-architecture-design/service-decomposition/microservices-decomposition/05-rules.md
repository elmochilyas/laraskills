## Rule 1: Decompose into microservices by bounded context, not by technical layer
---
## Category
Architecture
---
## Rule
Each microservice should align with a DDD bounded context, owning its entire domain. Never split a single bounded context across multiple microservices.
---
## Reason
Splitting a bounded context across services creates a distributed monolith—services must communicate constantly, defeating microservice benefits.
---
## Bad Example
```
order-controllers-service (deployed independently from order-data-service)
Every request: controller-service → data-service (synchronous)
```
---
## Good Example
```
order-service (owns Order domain end-to-end: controllers, logic, persistence)
payment-service (owns Payment domain end-to-end)
```
---
## Exceptions
When a bounded context has genuinely different scaling needs for read vs. write operations (CQRS).
---
## Consequences Of Violation
Distributed monolith, chatty communication, deployment coupling.
---
## Rule 2: Start with a monolith; extract microservices only when justified
---
## Category
Architecture
---
## Rule
Begin with a modular monolith; extract a microservice only when: (a) the module needs independent scaling, (b) a different team needs ownership, or (c) the deployment cadence diverges.
---
## Reason
Premature microservices add massive complexity (networking, data consistency, observability) without proven need.
---
## Bad Example
```
Day 1: 6 microservices. Day 30: "Why is deployment so complex? Why is debugging so hard?"
Day 60: Back to monolith.
```
---
## Good Example
```
Month 1–6: Modular monolith with clear module boundaries.
Month 7: Extract "Notification" as first microservice (needs different scaling).
Month 10: Extract "Billing" (needs separate deployment cadence).
```
---
## Exceptions
Greenfield projects in organizations with existing microservice expertise and well-understood domain boundaries.
---
## Consequences Of Violation
Premature complexity, operational overhead, team burnout.
---
## Rule 3: Each microservice must have its own database
---
## Category
Architecture
---
## Rule
No microservice may directly access another service's database. Each service owns its data and schema.
---
## Reason
Shared databases create the strongest coupling between services—independent deployment and schema evolution become impossible.
---
## Bad Example
```
order-service and payment-service both access the same "orders" table.
Order service changes schema → payment service breaks.
```
---
## Good Example
```
order-service: owns order-db
payment-service: owns payment-db
Cross-service data: via events or API calls
```
---
## Exceptions
Reporting/analytics databases that are read-only replicas.
---
## Consequences Of Violation
Database coupling, deployment coordination, lost service autonomy.
---
## Rule 4: Prefer asynchronous communication between microservices
---
## Category
Architecture
---
## Rule
Use events for cross-service communication unless synchronous response is absolutely required; document why synchronous is chosen.
---
## Reason
Synchronous calls create runtime coupling (service A is down when service B fails), reduce availability, and add latency.
---
## Bad Example
```
order-service calls payment-service synchronously for every order creation.
payment-service is slow/down → order-service degrades.
```
---
## Good Example
```
order-service publishes OrderPlaced event.
payment-service consumes and processes asynchronously.
order-service is always available.
```
---
## Exceptions
When strong consistency is required (payment authorization) and the team accepts the availability tradeoff.
---
## Consequences Of Violation
Availability coupling, cascading failures, reduced independence.
---
## Rule 5: Implement observability (logging, metrics, tracing) from day one
---
## Category
Reliability
---
## Rule
Every microservice must emit structured logs, metrics, and distributed trace spans from the start. No "We'll add observability later."
---
## Reason
Debugging distributed systems without observability is nearly impossible; retrofitting observability is much harder than building it in from the start.
---
## Bad Example
```
"We'll add logging later." Later never comes.
Production incident: "Which service failed? No idea, check each service's logs individually."
```
---
## Good Example
```
Every service:
- Structured JSON logs with trace_id, service_name, correlation_id
- Metrics: request latency, error rate, queue depth
- Distributed tracing: OpenTelemetry spans across all services
```
---
## Exceptions
Experimental/prototype services with < 100 requests/day.
---
## Consequences Of Violation
Blind production debugging, extended incident response time, team frustration.
