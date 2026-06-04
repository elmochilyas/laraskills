## Rule 1: Start at Level 1 (same model, separate command/query methods) before progressing
---
## Category
Architecture
---
## Rule
Begin CQRS adoption at the lowest maturity level—same model with segregated command/query methods—and only progress when a concrete need arises.
---
## Reason
Jumping directly to Level 3 (separate read/write models and databases) before understanding the domain's CQRS needs is over-engineering.
---
## Bad Example
```
New project: "We're doing full CQRS with separate databases."
3 months later: "Our 'read database' is a direct replica of the write database."
```
---
## Good Example
```
Level 1 → Same model, different methods for commands and queries.
Level 2 eventually → Separate read models for complex queries.
Level 3 only if → Scalability/consistency requirements demand it.
```
---
## Exceptions
When performance requirements (high write throughput + complex reads) are known upfront from day one.
---
## Consequences Of Violation
Over-engineering, unnecessary complexity, premature infrastructure decisions.
---
## Rule 2: Enforce command and query segregation at the API/controller level even at Level 1
---
## Category
Architecture
---
## Rule
Never mix command and query calls in the same controller method. Separate HTTP verbs: POST/PUT/DELETE for commands, GET for queries.
---
## Reason
Mixed endpoints violate CQS, hide side effects, and make it impossible to reason about idempotency.
---
## Bad Example
```php
// GET endpoint that modifies state
Route::get('/orders/{id}/cancel', [OrderController::class, 'cancel']);
```
---
## Good Example
```php
Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
Route::get('/orders/{id}', [OrderController::class, 'show']);
```
---
## Exceptions
When the query inherently requires a side effect from a read-only perspective (e.g., "get and lock for processing" with explicit documentation).
---
## Consequences Of Violation
Unsafe GET requests, caching problems, side effects hidden from API consumers.
---
## Rule 3: Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
---
## Category
Architecture
---
## Rule
Create projectors that listen to domain events and build denormalized read models when queries span multiple aggregates or need computed views.
---
## Reason
Querying across aggregates from the write model leads to performance issues, complex joins, and coupling between unrelated domain concepts.
---
## Bad Example
```php
// Querying across aggregates for a dashboard
class DashboardController
{
    public function index(): JsonResponse
    {
        $orders = Order::with('items', 'payments', 'customer')->get();
        // heavy query across multiple aggregates
    }
}
```
---
## Good Example
```php
class OrderProjector implements Projector
{
    public function onOrderPlaced(OrderPlaced $event): void
    {
        OrderReadModel::create([
            'id' => $event->orderId,
            'customer_name' => $event->customerName,
            'total' => $event->total,
        ]);
    }
}

class DashboardController
{
    public function index(): JsonResponse
    {
        $orders = OrderReadModel::all(); // simple, fast query
    }
}
```
---
## Exceptions
When the query is simple enough that it adds no overhead to the write model (single aggregate, no joins).
---
## Consequences Of Violation
Performance issues, query complexity, aggregate boundary violation.
---
## Rule 4: Move to separate databases (Level 3) only when justified by scalability data
---
## Category
Architecture
---
## Rule
Only separate read and write databases when you have metrics showing that read/write contention is causing measurable performance degradation.
---
## Reason
Separate databases introduce eventual consistency, infrastructure complexity, and maintenance overhead without benefit if not needed.
---
## Bad Example
```
"Let's use separate DBs for reads and writes because it's the 'proper' CQRS way."
No performance measurement justifying it.
```
---
## Good Example
```
Metrics show: write transactions are queuing behind read queries; p95 latency > 2s.
→ ADR proposes separate read database.
Before: p95 2s. After: p95 200ms.
```
---
## Exceptions
When regulatory compliance requires separate read/write data stores (e.g., audit trails).
---
## Consequences Of Violation
Complexity without payoff, eventual consistency issues, operational overhead.
---
## Rule 5: Progress through maturity levels incrementally, not in one change
---
## Category
Architecture
---
## Rule
Move from one CQRS maturity level to the next one level at a time, with at least one full sprint at each level to validate the pattern.
---
## Reason
Jumping multiple levels at once causes confusion, over-engineering, and difficulty identifying which change caused problems.
---
## Bad Example
```
Week 1: Mixed model (Level 0).
Week 2: Separate databases (Level 3).
Week 3: "Why is our read data stale? Rollback!"
```
---
## Good Example
```
Sprint 1–2: Level 1 (CQS at controller level).
Sprint 3–4: Level 2 (read models for dashboard).
Sprint 5–6: If needed, Level 3 (separate read DB).
Each level validated before proceeding.
```
---
## Exceptions
When starting a new project with well-understood high-throughput requirements from previous experience.
---
## Consequences Of Violation
Overwhelmed team, architecture abandoned for being too complex.
