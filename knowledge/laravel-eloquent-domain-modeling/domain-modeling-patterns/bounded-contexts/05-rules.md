# Bounded Contexts — Rules

---

## Rule: Organize Code by Business Capability, Not Technical Layer
---
## Category
Code Organization
---
## Rule
Always structure Laravel application code into directories named after business capabilities (e.g., `Sales`, `Inventory`, `Billing`) rather than technical layers (`Models`, `Controllers`, `Services`).
---
## Reason
Technical layer organization scatters business logic across dozens of directories, making it hard to find all code related to a domain concept. Business-capability grouping keeps related models, controllers, policies, and events together, improving discoverability and enforcing context boundaries.
---
## Bad Example
```
app/
  Models/
    Order.php
    Product.php
  Controllers/
    OrderController.php
    ProductController.php
  Events/
    OrderPlaced.php
```
---
## Good Example
```
app/
  Contexts/
    Sales/
      Models/
        Order.php
      Controllers/
        OrderController.php
      Events/
        OrderPlaced.php
    Inventory/
      Models/
        Product.php
      Controllers/
        ProductController.php
```
---
## Exceptions
Small projects with a single bounded context and minimal domain logic. Re-evaluate as the codebase grows.
---
## Consequences Of Violation
Difficulty locating domain logic, unintentional cross-context coupling, and a codebase that resists decomposition as the application scales.

---

## Rule: Never Share Database Tables Across Bounded Contexts
---
## Category
Architecture
---
## Rule
Each bounded context must own its own database tables or schema. Never allow two contexts to read or write the same table directly.
---
## Reason
Shared database tables create hidden coupling between contexts, making it impossible to evolve one context without potentially breaking another. Explicit API or event boundaries force clear contracts and prevent accidental coupling.
---
## Bad Example
```php
// Sales context reads orders
// Shipping context reads the same orders table directly
// Both contexts share `orders` — coupling is invisible and tight
```
---
## Good Example
```php
// Sales context owns `orders` table
// Shipping context reads from `shipments` table built via event projection
// Communication: OrderPlaced event → Shipping listener creates shipment
```
---
## Exceptions
Shared Kernel — a small, explicitly agreed-upon set of schemas that both contexts commit to evolving together. Keep Shared Kernel minimal and documented.
---
## Consequences Of Violation
Hidden coupling prevents independent deployment, schema changes require coordinated releases, and a context's internal changes can break other contexts at runtime.

---

## Rule: Communicate Between Contexts Only Through Events or APIs
---
## Category
Architecture
---
## Rule
Never call Eloquent models, repositories, or service classes from another bounded context directly. Use domain events or explicit API contracts instead.
---
## Reason
Direct model access bypasses the context boundary entirely, creating tight coupling. Events and APIs provide an explicit contract that allows each context to evolve independently and be tested in isolation.
---
## Bad Example
```php
// In Shipping context — directly using Sales models
use App\Models\Order;

class ShipmentController extends Controller
{
    public function create(int $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);
        // Direct cross-context model access — coupling!
    }
}
```
---
## Good Example
```php
// Sales context dispatches:
Event::dispatch(new OrderPlaced($order->id, $order->customer_id));

// Shipping context listens:
class CreateShipmentOnOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        // Shipping uses its own models, not Sales models
        Shipment::createFromOrderId($event->orderId);
    }
}
```
---
## Exceptions
Within the same bounded context — direct calls are fine. Across contexts, never.
---
## Consequences Of Violation
Tight coupling between contexts, inability to deploy or test contexts independently, and implicit contracts that break silently.

---

## Rule: Implement an Anti-Corruption Layer When Integrating with External Contexts
---
## Category
Architecture
---
## Rule
Always create an Anti-Corruption Layer (ACL) when one bounded context needs data from another context that uses a different domain model or ubiquitous language.
---
## Reason
Without an ACL, external domain concepts leak into the local context, polluting its model and language. The ACL translates between models, preserving the local context's integrity.
---
## Bad Example
```php
// Sales context directly uses a external CRM's Customer object
$crmCustomer = $externalCrmApi->getCustomer($email);
$order->customer_name = $crmCustomer->getFullName();
$order->customer_email = $crmCustomer->getEmailAddress();
// Sales model now coupled to external CRM terminology
```
---
## Good Example
```php
class CustomerAcL
{
    public function __construct(private ExternalCrmApi $api) {}

    public function getCustomer(string $email): Customer
    {
        $crmCustomer = $this->api->getCustomer($email);

        return new Customer(
            name: $crmCustomer->getFullName(),
            email: $crmCustomer->getEmailAddress(),
        );
    }
}

// Sales uses its own Customer value object, not the CRM's object
$customer = $this->acl->getCustomer($email);
```
---
## Exceptions
When both contexts already share the same domain model and ubiquitous language (Shared Kernel). Rare and explicitly documented.
---
## Consequences Of Violation
Domain model pollution, inconsistent ubiquitous language, and brittle code that breaks when the external system changes its API or model.

---

## Rule: Each Bounded Context Must Have Its Own Policies and Authorization Rules
---
## Category
Security
---
## Rule
Define policies, gates, and authorization rules within each bounded context rather than in a centralized authorization file.
---
## Reason
Authorization rules are context-specific. Centralized policies cross context boundaries, creating hidden dependencies and making it unclear which context owns which authorization logic.
---
## Bad Example
```php
// app/Providers/AuthServiceProvider.php — centralized
Gate::define('view-order', function ($user, $order) {
    return $user->id === $order->user_id;
});
Gate::define('fulfill-order', function ($user, $order) {
    return $user->hasRole('warehouse');
});
```
---
## Good Example
```php
// app/Contexts/Sales/Policies/OrderPolicy.php
class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $user->id === $order->user_id;
    }
}

// app/Contexts/Shipping/Policies/ShipmentPolicy.php
class ShipmentPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole('warehouse');
    }
}
```
---
## Exceptions
Cross-cutting authorization (e.g., admin roles) that applies uniformly to all contexts — but still implement it per context for consistency.
---
## Consequences Of Violation
Authorization logic sprawl, unclear ownership, and security gaps when a context's specific rules are missed in the centralized file.

---

## Rule: Use Context Maps to Document Inter-Context Relationships
---
## Category
Maintainability
---
## Rule
Maintain a context map — a living document or diagram — that describes each bounded context, its responsibilities, and its relationships (shared kernel, customer/supplier, conformist, etc.) with other contexts.
---
## Reason
Without a context map, the architecture's boundaries and communication patterns exist only in team members' heads. New developers, or the same team months later, will make incorrect assumptions about inter-context integration points.
---
## Bad Example
```bash
# No documentation — developers guess at context boundaries
# "Does Shipping use Sales models directly?"
# "Can I add a column to the orders table for Shipping?"
```
---
## Good Example
```php
// docs/context-map.md
// ## Context Map
// - Context: Sales (Customer) → Shipping (Supplier)
//   Communication: Domain events → Queue → Async listener
// - Context: Sales (Shared Kernel) → Billing (Shared Kernel)
//   Communication: Shared Payment value object
// - Context: Inventory (Conformist) → External ERP ( upstream)
//   Communication: ACL translating ERP terminology
```
---
## Exceptions
Trivial projects with a single context — no map needed.
---
## Consequences Of Violation
Architectural drift, accidental coupling, and integration bugs caused by incorrect assumptions about how contexts should interact.

---

## Rule: Never Import Models from Another Bounded Context
---
## Category
Code Organization
---
## Rule
Never use a `use` statement importing an Eloquent model from a different bounded context's namespace. Communicate through events, commands, or API calls instead.
---
## Reason
A `use` import of a model from another context creates direct source-level coupling. It makes the dependency invisible in diagrams and enables casual cross-context method calls that bypass the architectural boundary.
---
## Bad Example
```php
// In app/Contexts/Shipping/...
use App\Contexts\Sales\Models\Order; // Cross-context import!

class ShipmentService
{
    public function createFromOrder(int $orderId): void
    {
        $order = Order::findOrFail($orderId); // Tight coupling
    }
}
```
---
## Good Example
```php
// In app/Contexts/Shipping/...
// No cross-context imports
class CreateShipmentOnOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        $shipment = Shipment::create(['order_id' => $event->orderId]);
    }
}
```
---
## Exceptions
Within migration or seed code for cross-context integration setup — but prefer separate databases per context.
---
## Consequences Of Violation
Source-level coupling that is invisible in architecture diagrams, making refactoring dangerous and context decomposition impossible.
