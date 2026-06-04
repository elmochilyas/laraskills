## Rule 1: Modules must have clear, documented boundaries with controlled communication
---
## Category
Architecture
---
## Rule
Each module must declare its public API (classes/interfaces other modules may use) and keep everything else private. Cross-module communication goes only through public APIs.
---
## Reason
Undocumented module boundaries lead to implicit coupling—any class can access any other class, negating modularity benefits.
---
## Bad Example
```
// Module A directly accesses Module B's internal repository
use App\Modules\Billing\Repositories\InternalInvoiceRepository;
```
---
## Good Example
```
// Module B publishes a public port
namespace App\Modules\Billing\Ports;

interface BillingService
{
    public function createInvoice(OrderData $data): InvoiceId;
}

// Module A depends only on the port
```
---
## Exceptions
Shared infrastructure (ServiceProviders, base classes) that are genuinely cross-cutting.
---
## Consequences Of Violation
Implicit cross-module coupling, hard to extract modules.
---
## Rule 2: Enforce module boundaries with automated dependency analysis
---
## Category
Architecture
---
## Rule
Use Deptrac, PHPArkitect, or PHPStan to enforce that modules only use each other's public APIs. Fail the build on violations.
---
## Reason
Manual enforcement of module boundaries fails as the team grows and deadlines approach; automated gates are essential.
---
## Bad Example
```
"Let's just review module boundaries in code review."
6 months later: "How did this dependency creep in?"
```
---
## Good Example
```yaml
# deptrac.yaml
modules:
    Ordering:
        - Billing:ports
    Billing:
        - Shipping:ports
```
---
## Exceptions
When the module boundary is intentionally open (rare—prototype phase).
---
## Consequences Of Violation
Boundary erosion, implicit coupling, modular monolith becomes a big ball of mud.
---
## Rule 3: Modules should be extractable to microservices with minimal changes
---
## Category
Architecture
---
## Rule
Design each module as if it could become a microservice: own data, own logic, public API, events for cross-module communication.
---
## Reason
Well-designed modules in a monolith can be extracted with minimal effort; tightly-coupled modules cannot be extracted without rewriting.
---
## Bad Example
```
Module A shares database tables with Module B.
Extracting A: need to split schema, rewrite queries, coordinate migration.
```
---
## Good Example
```
Module A owns its tables.
Extracting A: copy module, add API layer, route traffic. Done.
```
---
## Exceptions
When the monolithic phase is temporary and extraction is not planned.
---
## Consequences Of Violation
Costly extraction, rewritten code, abandoned modularization attempts.
---
## Rule 4: Use events for cross-module communication when eventual consistency is acceptable
---
## Category
Architecture
---
## Rule
Modules should communicate via events for any data that can be eventually consistent. Reserve direct calls for operations that require synchronous results.
---
## Reason
Direct calls create compile-time coupling and runtime dependencies; events decouple modules and allow independent evolution.
---
## Bad Example
```php
class OrderingService
{
    public function placeOrder(OrderData $data): void
    {
        $order = $this->repo->save($data);
        $this->billingService->createInvoice($order); // direct coupling
    }
}
```
---
## Good Example
```php
class OrderingService
{
    public function placeOrder(OrderData $data): void
    {
        $order = $this->repo->save($data);
        $this->events->dispatch(new OrderPlaced($order));
    }
}
// BillingModule subscribes to OrderPlaced independently
```
---
## Exceptions
When the cross-module operation requires a synchronous result to continue (e.g., "check inventory before ordering").
---
## Consequences Of Violation
Compile-time coupling between modules, reduced module independence.
---
## Rule 5: Start with a monolith and add modular boundaries as the system grows
---
## Category
Architecture
---
## Rule
Do not over-architect the modular structure upfront. Define broad modules first, add finer boundaries as the system and team grow.
---
## Reason
Premature modular boundaries add overhead (interfaces, events) that slows development before the complexity justifies it.
---
## Bad Example
```
Day 1: 15 modules with interfaces, events, and dependency rules.
Week 2: "This interface has one implementation and no plans for another."
```
---
## Good Example
```
Month 1: 3 broad modules (Core, Billing, Admin).
Month 3: Split Billing into PaymentProcessing and Invoicing.
Month 6: Add dependency analysis CI gates.
```
---
## Exceptions
When the team has prior experience with the exact domain and knows the boundaries upfront.
---
## Consequences Of Violation
Over-engineering, YAGNI violation, slow initial development.
