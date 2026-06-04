## Rule 1: Apply CQRS only where justified by query complexity or throughput requirements
---
## Category
Architecture
---
## Rule
Assess whether the read side is complex enough (cross-aggregate queries, multiple projections) or the write side is high-throughput enough to warrant CQRS. If not, use a single model with CQS.
---
## Reason
CQRS adds complexity (eventual consistency, separate models, projection infrastructure) that outweighs benefits in simple CRUD applications.
---
## Bad Example
```
Simple blog with 100 visits/day: CQRS with separate databases, event bus, projectors.
"Because it's the right architecture."
```
---
## Good Example
```
Blog: Single model, CQS methods. When read traffic hits 10K RPM with complex dashboards → evaluate CQRS.
```
---
## Exceptions
When CQRS is required for non-performance reasons (e.g., full audit trail via event sourcing).
---
## Consequences Of Violation
Complexity overhead, slow development, unnecessary infrastructure.
---
## Rule 2: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
---
## Category
Architecture
---
## Rule
Start with Command-Query Separation (CQS)—same model, different methods for commands vs. queries. Add separate infrastructure only when CQS proves insufficient.
---
## Reason
CQS alone eliminates the most common CQRS anti-pattern (mixed read/write methods) without any of the infrastructure overhead.
---
## Bad Example
```
Jump straight to: separate databases + event bus + projectors.
Team spends 3 weeks on infrastructure before writing a single use case.
```
---
## Good Example
```
Sprint 1: CQS — controllers call createOrder() (command) vs. getOrder() (query). Done.
Months later, when dashboards need aggregated data → add read models.
```
---
## Exceptions
When the project is greenfield with known high-throughput requirements validated by domain experts.
---
## Consequences Of Violation
Infrastructure-first thinking, delayed delivery, over-engineered solution.
---
## Rule 3: Keep write and read models in the same repository until separation is proven necessary
---
## Category
Architecture
---
## Rule
Start with write and read logic in the same module, separated only by method/class. Split into different repositories or databases only when performance data demands it.
---
## Reason
Separate repositories create deployment and synchronization overhead; premature separation is costly and rarely needed.
---
## Bad Example
```
"Read service" and "Write service" as separate repositories.
Reality: 80% of the code is duplicated infrastructure boilerplate.
```
---
## Good Example
```
app/Orders/
  Commands/PlaceOrderHandler.php
  Queries/OrderQuery.php
  Models/Order.php
Same repository, same database. Separation at code level.
```
---
## Exceptions
When the read and write sides have genuinely different scaling characteristics (read: 100K RPM, write: 100 RPM).
---
## Consequences Of Violation
Duplicated boilerplate, deployment coupling, harder onboarding.
---
## Rule 4: Abstract projections behind simple interfaces—don't couple to a specific event store
---
## Category
Architecture
---
## Rule
When adding projections, keep the interface projection-agnostic (Projector::project(Event $event)) so the underlying store can be swapped.
---
## Reason
Coupling to a specific event store (e.g., Laravel's event system vs. Kafka vs. DynamoDB Streams) makes changing infrastructure painful.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        // Directly publishing to Kafka
        $this->kafka->publish('orders', $event->toArray());
    }
}
```
---
## Good Example
```php
class OrderProjector implements Projector
{
    public function __construct(private OrderReadModel $readModel) {}

    public function __invoke(OrderPlaced $event): void
    {
        $this->readModel->add($event->orderId, $event->data);
    }
}
```
---
## Exceptions
When using event store's specific features (e.g., Kafka exactly-once semantics) that cannot be abstracted.
---
## Consequences Of Violation
Infrastructure lock-in, painful migration, coupling event store to domain.
---
## Rule 5: Validate CQRS adoption with a 6-month retrospective
---
## Category
Architecture
---
## Rule
6 months after adopting CQRS, review: (a) Has it solved the problems it was intended to? (b) Has it introduced unacceptable complexity? (c) Would you choose it again?
---
## Reason
CQRS is often adopted for wrong reasons; a retrospective reveals whether the complexity is justified or whether the project should revert to a simpler model.
---
## Bad Example
```
CQRS adopted 2 years ago. Nobody remembers why. "It's just how we do things."
No one can articulate whether it's worth the complexity.
```
---
## Good Example
```
6-month retrospective:
Solved: Dashboard queries went from 2s to 50ms ✓
Complexity: Projection lag occasional issue, 2 bugs from stale reads ✗
Verdict: Worth it for this domain. Keep.
```
---
## Exceptions
Short-lived projects (< 6 months) that won't benefit from retrospective insights.
---
## Consequences Of Violation
Unjustified complexity continues indefinitely, no organizational learning.
