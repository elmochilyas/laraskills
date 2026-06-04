## Rule 1: Document every context relationship using one of the 7 standard patterns
---
## Category
Architecture
---
## Rule
For every pair of bounded contexts that interact, explicitly document the relationship type: Partnership, Shared Kernel, Customer-Supplier, Conformist, ACL, OHS/Published Language, or Separate Ways.
---
## Reason
Undocumented relationship types lead to implicit expectations and integration style mismatches (e.g., one team expects Partnership, the other treats it as Customer-Supplier).
---
## Bad Example
```
"Sales and Billing contexts... they just call each other."
No agreed relationship type. Confusion about who breaks what.
```
---
## Good Example
```
Sales → Billing: Customer-Supplier
  Sales: upstream, provides OrderPlaced events
  Billing: downstream, consumes and adapts
  Breaking changes require 2-week notice
```
---
## Exceptions
Trivial applications with a single context; no relationships to document.
---
## Consequences Of Violation
Team friction, integration surprises, unclear change management.
---
## Rule 2: Use ACL downstream when the upstream context's language cannot be adopted
---
## Category
Architecture
---
## Rule
When consuming a context whose Ubiquitous Language is incompatible or whose model quality is poor, place an Anti-Corruption Layer in the consuming context.
---
## Reason
Directly using a poorly-modeled upstream context's concepts pollutes the downstream model with foreign concepts and poor semantics.
---
## Bad Example
```php
// Billing directly uses Sales' Order model with foreign terminology
$order = $salesContext->getOrder($id);
$billingTotal = $order->order_total; // foreign concept
```
---
## Good Example
```php
// Billing uses ACL
$orderData = $this->salesAcl->getOrderAsBillingView($id);
$invoice = Invoice::fromSalesOrder($orderData);
```
---
## Exceptions
When the upstream and downstream teams can negotiate to align languages (Partnership or Shared Kernel).
---
## Consequences Of Violation
Foreign concepts in domain model, model pollution, poor Ubiquitous Language.
---
## Rule 3: Establish a Customer-Supplier relationship when the upstream controls the schedule
---
## Category
Architecture
---
## Rule
When the upstream context dictates the delivery timeline and the downstream must adapt, explicitly document the Customer-Supplier relationship with negotiation terms.
---
## Reason
In Customer-Supplier, the upstream (Supplier) is constrained to not break the downstream (Customer). Without explicit terms, the upstream may break the downstream without notice.
---
## Bad Example
```
Upstream team: "We changed our API. Fix your code."
Downstream team: "We weren't notified!"
```
---
## Good Example
```
Customer-Supplier agreement:
- Supplier notifies Customer 2 weeks before breaking change
- Customer provides test suite for Supplier to run
- Supplier provides migration guide
```
---
## Exceptions
When the upstream context is a third-party service with no negotiation possible.
---
## Consequences Of Violation
Unexpected breakage, emergency fixes, team friction.
---
## Rule 4: Avoid Shared Kernel unless the shared part is small, stable, and agreed
---
## Category
Architecture
---
## Rule
If contexts share a kernel, keep it minimal (value objects, base classes) and document that changes require approval from all sharing contexts.
---
## Reason
Large shared kernels create implicit coupling—changing core concepts becomes a multi-context coordination problem.
---
## Bad Example
```
All contexts share: User model, Order model, Payment model, Address model — almost the entire domain.
Any change requires all teams to coordinate.
```
---
## Good Example
```
Shared Kernel:
- Money value object
- OrderId value object
- Timestampable trait
Everything else is context-private.
```
---
## Exceptions
When contexts are inherently tightly coupled and will never be separated (e.g., early-stage startup).
---
## Consequences Of Violation
Coordination overhead, shared changes block deployments.
---
## Rule 5: Use Separate Ways when integration cost outweighs benefit
---
## Category
Architecture
---
## Rule
If two contexts only need occasional data from each other, use duplication (copy relevant data) rather than integration.
---
## Reason
Integration adds complexity, latency, and failure modes; if the data is rarely needed or changes slowly, duplication is simpler and more robust.
---
## Bad Example
```
Billing needs a user's name (changes monthly). Integrates via real-time API.
Complexity of integration >> cost of occasional staleness.
```
---
## Good Example
```
Billing copies user name on account creation (event).
Name rarely changes. Separate Ways avoids API dependency.
```
---
## Exceptions
When the data is critical and must be consistent (financial amounts, inventory counts).
---
## Consequences Of Violation
Unnecessary integration complexity, dependency on other context's availability.
