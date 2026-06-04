# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service class naming conventions and method design
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Service class naming and method design conventions provide the most visible signal of code intent. A well-named service and its methods communicate what it does, what domain it belongs to, and what level of abstraction it operates at. Conventions include: services named after the domain entity (`UserService`), methods named as business operations (`register()`, `changePassword()`), and consistent method signatures that accept DTOs or validated data and return typed results.

---

# Core Concepts

**Class naming:** `{Domain}Service` — `UserService`, `OrderService`, `PaymentService`, `InventoryService`. The domain prefix identifies the business area. The `Service` suffix identifies the architectural role.

**Method naming:** Business operations, not CRUD operations. `register()` not `create()`. `changePassword()` not `update()`. Names should communicate what business goal is accomplished.

**Return types:** Methods return domain objects or DTOs—never HTTP responses. Service methods are framework-agnostic.

---

# Mental Models

**The "Business Language" model:** Service method names use the business's language. If the business says "register a user," the method is `register()`. If they say "cancel order," it's `cancelOrder()`.

**The "One Level of Abstraction" model:** Service methods call other services, actions, and repositories—not low-level queries. A service method shouldn't mix `DB::table()` calls with orchestration logic.

---

# Internal Mechanics

```php
// Good: Business language, clear intent
class OrderService {
    public function createOrder(Cart $cart, Customer $customer): Order;
    public function cancelOrder(Order $order, string $reason): void;
    public function processRefund(Order $order): Refund;
}

// Bad: Technical language, unclear intent
class OrderService {
    public function insert(array $data): Model;  // What is this doing?
    public function updateStatus(int $id, string $status): bool;  // Changing to what?
}
```

---

# Patterns

**Entity-based service naming:** `UserService`, `OrderService`, `ProductService`. Each service is paired with a primary entity.

**Domain-based service naming:** `BillingService`, `AuthService`, `NotificationService`. Used when the service spans multiple entities within a domain.

**Method prefix conventions:** `create`, `update`, `delete` prefixes for CRUD. `process`, `handle`, `execute` for workflows. `validate`, `calculate`, `check` for query operations.

---

# Architectural Decisions

**Use entity-based naming when:** The service closely maps to one entity. Most Laravel services follow this.

**Use domain-based naming when:** The service coordinates operations across multiple entities within a domain.

**Avoid generic naming:** `UserManager`, `UserHelper`, `UserUtils`—these don't communicate architectural role.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Immediate understanding of service role | Entity-based naming can be too narrow | `UserService` for operations that span User and Team |
| Method names document business operations | Long method names for complex operations | `processPaymentAndNotifyCustomer` — split the service |

---

# Performance Considerations

No performance impact from naming conventions.

---

# Production Considerations

Document naming conventions in a team coding standards document. Include examples of good and bad names.

---

# Common Mistakes

**CRUD-named methods:** `createUser()`, `updateUser()`, `deleteUser()`. These are model-level names, not service-level names. Use `registerUser()`, `suspendUser()`, `activateUser()`.

**Method returning response:** `register(Request $request): JsonResponse`. Services should return domain objects.

**Too many methods:** A service with 30+ methods. It's doing too much. Split by domain or extract actions.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | SLP-08 Action naming | COS-08 Feature-based naming |
| COS-08 Naming conventions | SLP-10 Decision criteria | AEG-07 Team convention docs |

---

## Failure Modes

**Inconsistent naming across the codebase:** Different services use different naming conventions (UserService, UserManager, UserHelper) creating confusion about architectural roles. Establish team-wide naming standards.

**Method name/behavior mismatch:** A method named createOrder() that also sends emails and updates inventory violates the principle of least surprise. Method names should accurately describe what the method does.

**Service explosion without domain grouping:** Too many services (50+ in a medium app) with overlapping responsibilities. Group by domain and consolidate.

---

## Ecosystem Usage

The laravel-actions package (lorisleiva) formalizes action classes. krayin/laravel-service provides service class scaffolding. Most production codebases follow the {Entity}Service naming convention. The Spatie team uses service classes extensively in their packages, consistently using domain-based naming.

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
