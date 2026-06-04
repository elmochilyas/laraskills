## Rule 1: Each vertical slice is autonomous—no cross-slice sharing of models or services
---
## Category
Architecture
---
## Rule
Every feature slice owns its complete request-to-response pipeline: its own controller, use case, DTO, and persistence logic. Do not import models or services from another slice.
---
## Reason
Cross-slice sharing creates coupling that defeats the purpose of vertical slicing—changes in one slice can break another.
---
## Bad Example
```php
// billing-slice uses the order-slice's Order model directly
use App\Slices\Orders\Models\Order;
```
---
## Good Example
```php
// billing-slice defines its own OrderReadModel
class OrderReadModel
{
    public function __construct(
        public readonly string $id,
        public readonly Money $total
    ) {}
}
```
---
## Exceptions
Shared kernel patterns (value objects, base classes) that are intentionally shared and change rarely.
---
## Consequences Of Violation
Hidden coupling between slices, broken encapsulation, shared model changes break multiple slices.

> **ECC Context Note:** Vertical slices naturally avoid generic repositories since each slice owns its persistence. The ECC default (direct Eloquent in Actions) aligns well with vertical slices. Repository abstractions within a slice are only justified when the Repository Justification Criteria are met (see `docs/architecture-decisions/repository-vs-direct-eloquent.md`).
---
## Rule 2: Slice by business capability, not by technical layer
---
## Category
Architecture
---
## Rule
Organize directories by feature name (e.g., `Checkout/`, `Returns/`, `Inventory/`), not by technical concern (e.g., `Controllers/`, `Services/`, `Models/`).
---
## Reason
Technical layering across features scatters a single feature's code across many directories, making it hard to find, change, or extract.
---
## Bad Example
```
app/
  Controllers/CheckoutController.php
  Services/CheckoutService.php
  Models/Order.php
  Dtos/CheckoutDto.php
```
---
## Good Example
```
app/
  Slices/
    Checkout/
      Controllers/CheckoutController.php
      Services/CheckoutService.php
      Models/Order.php
      Dtos/CheckoutDto.php
```
---
## Exceptions
Truly shared infrastructure (ServiceProviders, middleware, base controller) can remain in a `Shared/` directory.
---
## Consequences Of Violation
Scattered feature logic, hard to find related code, difficult to extract a feature as a microservice.
---
## Rule 3: Use lightweight in-process messages (commands/queries) as slice boundaries
---
## Category
Architecture
---
## Rule
Define explicit Command and Query classes per slice action; use a message bus (or simple dispatch) to invoke them.
---
## Reason
Command/Query objects make each use case explicit, documentable, and testable in isolation.
---
## Bad Example
```php
class CheckoutController
{
    public function store(Request $request): Response
    {
        // inline logic
    }
}
```
---
## Good Example
```php
class CheckoutController
{
    public function __construct(private CheckoutCommand $command) {}

    public function store(CheckoutRequest $request): Response
    {
        $result = $this->command->execute($request->toDto());
        return response()->json($result);
    }
}
```
---
## Exceptions
Trivial CRUD actions that are simple enough that a command class adds accidental complexity.
---
## Consequences Of Violation
Logic in controllers, implicit use cases, harder to test in isolation.
---
## Rule 4: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure
---
## Category
Architecture
---
## Rule
If two slices need the same logic, extract it into a shared kernel or a reusable library, not into a shared domain model.
---
## Reason
DRY across slices creates coupling; selective duplication preserves autonomy.
---
## Bad Example
```php
// Both slices import a shared "OrderCalculator" — now changes affect both
```
---
## Good Example
```php
// A "Money" value object extracted to Shared Kernel — no business logic, just types
// Business rules are duplicated per slice
```
---
## Exceptions
When the duplicated logic is a core domain invariant that must be consistent across the entire system.
---
## Consequences Of Violation
Cross-slice coupling, changes ripple across features, autonomy lost.
---
## Rule 5: Each slice must have its own database tables or schema namespace
---
## Category
Architecture
---
## Rule
Slices must not share tables; each slice owns its persistence schema. Cross-slice queries go through read models or APIs.
---
## Reason
Shared tables create implicit coupling—schema changes in one slice can break another.
---
## Bad Example
```sql
-- Two slices write to orders table directly
INSERT INTO orders ... -- from Checkout slice
INSERT INTO orders ... -- from Returns slice
```
---
## Good Example
```sql
-- Each slice has its own tables
checkout.orders
returns.returns
-- Cross-slice data via event-sourced read models
```
---
## Exceptions
Reporting/analytics databases that are intentionally denormalized from multiple slices.
---
## Consequences Of Violation
Schema coupling, migration conflicts, inability to extract slices into independent services.
