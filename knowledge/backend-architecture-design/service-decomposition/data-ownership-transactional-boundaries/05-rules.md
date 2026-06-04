## Rule 1: Each bounded context owns its data schema and persistence entirely
---
## Category
Architecture
---
## Rule
No bounded context directly accesses another context's database. Each context manages its own schema, migrations, and queries.
---
## Reason
Shared databases create the strongest coupling between contexts—a schema change in one breaks the other.
---
## Bad Example
```
Billing context queries Sales context's "orders" table directly.
Sales changes the orders schema. Billing breaks.
```
---
## Good Example
```
Billing context has its own "billable_orders" table populated via events.
Sales context owns "orders".
Schema changes in Sales don't affect Billing.
```
---
## Exceptions
Read-only analytics replicas with no schema coupling risk.
---
## Consequences Of Violation
Database coupling, schema change coordination, lost context autonomy.
---
## Rule 2: One transactional boundary per aggregate
---
## Category
Architecture
---
## Rule
Each aggregate defines a transactional boundary: all changes within the aggregate happen in one ACID transaction; changes across aggregates are eventually consistent.
---
## Reason
Cross-aggregate transactions create lock contention and violate aggregate boundary principles.
---
## Bad Example
```php
DB::transaction(function () {
    $order->complete(); // aggregate 1
    $payment->capture(); // aggregate 2 — different boundary
});
```
---
## Good Example
```php
$order->complete(); // aggregate 1 — one transaction
$this->events->dispatch(new OrderCompleted($order->id()));
// payment is handled eventually via saga
```
---
## Exceptions
When the business requires strong consistency across aggregates and the team accepts the performance tradeoff.
---
## Consequences Of Violation
Transaction contention, deadlocks, aggregate boundary erosion.
---
## Rule 3: Use sagas for multi-aggregate workflows
---
## Category
Architecture
---
## Rule
When a workflow spans multiple aggregates, use a saga (choreography or orchestration) with compensating actions for failure.
---
## Reason
Distributed transactions (2PC) are complex, slow, and reduce availability; sagas provide consistency without locks.
---
## Bad Example
```php
// Distributed transaction across services
DB::beginTransaction();
$order->save();
$payment->charge(); // external service in same transaction
DB::commit(); // holds locks for too long
```
---
## Good Example
```php
// Saga: Order → Payment → Inventory
$order->place(); // local transaction
$this->events->dispatch(new OrderPlaced($order->id()));

// On payment failure: compensating action (cancel order)
```
---
## Exceptions
When the workflow is small (< 3 steps) and 2PC is acceptable for the specific use case.
---
## Consequences Of Violation
Lock contention, availability coupling, complex failure handling.
---
## Rule 4: Prefer data duplication over cross-context queries
---
## Category
Architecture
---
## Rule
When a context needs data from another context, duplicate it locally (via events) rather than querying the source context's API or database.
---
## Reason
Cross-context queries create runtime coupling—if the source context is unavailable, the consuming context fails.
---
## Bad Example
```
Billing calls Sales API for every order lookup.
Sales is down → Billing cannot generate invoices.
```
---
## Good Example
```
Billing subscribes to OrderPlaced events and stores local read model.
Billing can always generate invoices, regardless of Sales availability.
```
---
## Exceptions
When the data is so volatile and consistency-critical that duplication cannot work (e.g., real-time inventory).
---
## Consequences Of Violation
Availability coupling, dependency on other contexts' uptime.
---
## Rule 5: Document all cross-context data flows and ownership
---
## Category
Architecture
---
## Rule
Maintain a data ownership matrix showing: which context owns each data entity, which contexts consume it, and the mechanism (event/API).
---
## Reason
Undocumented data ownership leads to confusion about which team is responsible for data quality and schema changes.
---
## Bad Example
```
"Who owns the customer data? Marketing? Sales? Billing?"
"Not sure, let me check."
```
---
## Good Example
```
Data Ownership Matrix:
| Entity       | Owner         | Consumers             | Mechanism       |
|--------------|---------------|-----------------------|-----------------|
| Order        | Sales         | Billing, Shipping     | OrderPlaced     |
| Customer     | CRM           | Sales, Billing, Mktg  | CustomerUpdated |
| Product      | Catalog       | Sales, Inventory      | ProductSync API |
```
---
## Exceptions
Single-context applications where there is no cross-context data flow.
---
## Consequences Of Violation
Data ownership disputes, unclear responsibilities, stale data.
