## Rule 1: A service should own one complete business capability
---
## Category
Architecture
---
## Rule
Each service encapsulates one complete business capability (e.g., "Order Management") from API to persistence. A service is the runtime deployment unit of a bounded context.
---
## Reason
Services that cover partial capabilities create chatty communication and coordination overhead.
---
## Bad Example
```
order-api-service (only handles API routing)
order-logic-service (only handles business logic)
order-data-service (only handles persistence)
// Every order operation requires 3 services
```
---
## Good Example
```
order-service (handles all Order Management: API, logic, persistence)
```
---
## Exceptions
CQRS where read and write sides are deployed separately for scaling reasons.
---
## Consequences Of Violation
Distributed monolith, chatty communication, deployment coupling.
---
## Rule 2: Each service is independently deployable
---
## Category
Reliability
---
## Rule
Services must be deployable without requiring simultaneous deployment of other services. Backward-compatible APIs or events enable this.
---
## Reason
Coordinated deployments violate the primary benefit of services: independent release cycles.
---
## Bad Example
```
Deploying service A requires deploying service B at the exact same time.
```
---
## Good Example
```
Service A deploys with backward-compatible API.
Service B deploys independently, with its own schedule.
```
---
## Exceptions
Security patches where all services must coordinate to fix a vulnerability.
---
## Consequences Of Violation
Deployment coupling, release gate, rollback coordination.
---
## Rule 3: Services communicate via well-defined APIs (sync) or events (async)
---
## Category
Architecture
---
## Rule
All inter-service communication goes through versioned APIs (REST/gRPC) or events (message broker). No shared databases or direct internal access.
---
## Reason
Shared databases or internal access creates implicit coupling that bypasses the service contract.
---
## Bad Example
```
Service A reads Service B's database directly.
```
---
## Good Example
```
Service A calls Service B's API or consumes Service B's events.
```
---
## Exceptions
Read-only analytics replicas explicitly designed for reporting.
---
## Consequences Of Violation
Implicit coupling, untracked dependencies, schema change breakage.
---
## Rule 4: Choose synchronous or async communication based on consistency needs
---
## Category
Architecture
---
## Rule
Use synchronous calls when the caller needs a response to proceed (strong consistency). Use async events when eventual consistency is acceptable.
---
## Reason
Wrong communication model causes either unnecessary latency (sync when async would work) or inconsistency (async when sync is needed).
---
## Bad Example
```
Synchronous call to notification service (could be async).
Order is held up because email sending is slow.
```
---
## Good Example
```
Synchronous: "Check inventory before confirming order" (needs result).
Async: "Send confirmation email" (doesn't block the order).
```
---
## Exceptions
When asynchronous communication adds unacceptable complexity for a simple synchronous workflow.
---
## Consequences Of Violation
Performance degradation from unnecessary sync or data inconsistency from missing sync.
---
## Rule 5: A service boundary failing should not cascade to other services
---
## Category
Reliability
---
## Rule
Design services with bulkheads: timeouts, circuit breakers, fallbacks, and graceful degradation so that one service's failure doesn't bring down others.
---
## Reason
Without bulkheads, a failure in any service cascades, causing system-wide outages.
---
## Bad Example
```
Service A calls Service B. Service B hangs.
Service A has no timeout → requests queue up → Service A runs out of memory → whole system down.
```
---
## Good Example
```
Service A calls Service B with:
- Timeout: 2s
- Circuit breaker: open after 5 failures
- Fallback: cached data
Service B failure is isolated.
```
---
## Exceptions
When the service is critical-path and failure is non-survivable (degraded mode instead of full fallback).
---
## Consequences Of Violation
Cascading failures, system-wide outages, hard-to-debug incidents.
