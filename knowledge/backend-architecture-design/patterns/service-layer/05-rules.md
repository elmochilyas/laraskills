## Rule 1: Service Layer defines an application boundary with coarse-grained operations
---
## Category
Architecture
---
## Rule
The Service Layer exposes coarse-grained methods that represent application use cases (e.g., `placeOrder()`, `cancelInvoice()`). Each method typically orchestrates multiple domain operations.
---
## Reason
Fine-grained domain operations exposed directly to the client force the client to orchestrate multiple calls, breaking encapsulation.
---
## Bad Example
```php
// Client must call multiple methods
$customer = $customerService->find($id);
$order = $orderService->create($data);
$orderService->linkCustomer($order, $customer);
```
---
## Good Example
```php
// Service Layer provides one operation
class OrderService
{
    public function placeOrder(OrderData $data): OrderResult
    {
        // Orchestrates customer lookup, order creation, inventory, notification
    }
}
```
---
## Exceptions
When the client needs fine-grained control for composition (e.g., a workflow engine).
---
## Consequences Of Violation
Chatty client-to-service communication, domain logic leak to client.
---
## Rule 2: Service Layer methods manage transactions and cross-cutting concerns
---
## Category
Architecture
---
## Rule
The Service Layer is responsible for transactional boundaries, security checks, logging, and other cross-cutting concerns.
---
## Reason
Domain objects should not manage transactions or security; the Service Layer acts as the application boundary.
---
## Bad Example
```php
// Transaction management in domain service
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        DB::beginTransaction();
        try {
            // ...
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
        }
    }
}
```
---
## Good Example
```php
// Transaction middleware handles cross-cutting
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        // Pure orchestration
    }
}
```
---
## Exceptions
When there is no middleware/transaction layer and the Service Layer is the only boundary.
---
## Consequences Of Violation
Scattered cross-cutting concerns, domain logic mixed with infrastructure.
---
## Rule 3: Keep Service Layer thin—delegate domain logic to domain objects
---
## Category
Architecture
---
## Rule
The Service Layer orchestrates and delegates; it should not contain domain business rules.
---
## Reason
Domain logic in Service Layer creates an anemic domain model—business rules cannot be reused or tested independently.
---
## Bad Example
```php
class OrderService
{
    public function approveOrder(OrderId $id): void
    {
        $order = $this->repo->find($id);
        if ($order->status !== 'pending') { // domain rule in service
            throw new \DomainException('Invalid status');
        }
        $order->status = 'approved'; // domain mutation in service
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function approveOrder(OrderId $id): void
    {
        $order = $this->repo->find($id);
        $order->approve(); // domain logic in domain object
        $this->repo->save($order);
    }
}
```
---
## Exceptions
When the domain logic is a simple delegation that doesn't justify a domain object method.
---
## Consequences Of Violation
Anemic domain model, logic scattered, testing difficulty.
---
## Rule 4: Name Service Layer methods in Ubiquitous Language
---
## Category
Architecture
---
## Rule
Service Layer method names should reflect the business use case in domain terms (e.g., `placeOrder()`, `approveLoan()`, `disburseFunds()`).
---
## Reason
Domain-term method names make the use cases readable by domain experts and document the application's capabilities.
---
## Bad Example
```php
class OrderService
{
    public function process(string $action, array $data): mixed { /* ... */ }
}
```
---
## Good Example
```php
class LoanService
{
    public function submitApplication(LoanData $data): ApplicationId { /* ... */ }
    public function approveLoan(LoanId $id): void { /* ... */ }
    public function disburseFunds(LoanId $id): void { /* ... */ }
}
```
---
## Exceptions
When the service belongs to a purely technical domain (caching, logging, formatting).
---
## Consequences Of Violation
Unclear use cases, generic method names, poor documentation.
