# Service Naming Conventions — Engineering Rules

---

## Rule 1: Use `{Entity}Service` Class Naming Pattern

Every service class must be named after its primary entity or capability using the `{Entity}Service` or `{Capability}Service` pattern.

---

## Category

Code Organization

---

## Rule

All service classes must follow the naming pattern `{Entity}Service` (e.g., `UserService`, `OrderService`, `InvoiceService`) for entity-oriented services or `{Capability}Service` (e.g., `AuthenticationService`, `NotificationService`, `PaymentService`) for capability-oriented services. Variants like `ServiceUser`, `UserSvc`, or `UserManagementService` are prohibited.

---

## Reason

Predictable naming eliminates the cognitive overhead of searching for the correct service class. When every service follows `{Entity}Service`, any developer can instantly locate the service for any entity without documentation or searching.

---

## Bad Example

```php
class UserManager {}
class ServiceUser {}
class UserSvc {}
class ManageUsers {}
```

---

## Good Example

```php
class UserService {}
class OrderService {}
class AuthenticationService {}
class NotificationService {}
```

---

## Exceptions

When a service operates on a concept that is not an entity (e.g., `PricingService`, `MailService`), use the capability-oriented naming pattern. The name must still end with `Service`.

---

## Consequences Of Violation

Maintenance risks: developers waste time searching for service classes. Onboarding risks: new team members cannot predict class names. Scalability risks: inconsistent naming compounds as the codebase grows.

---

## Rule 2: Use Business Verbs, Not HTTP Verbs, for Method Names

Service methods must be named with business-domain verbs (`place`, `cancel`, `suspend`, `register`) not HTTP verbs (`store`, `update`, `destroy`, `index`).

---

## Category

Design

---

## Rule

Service method names must describe the business operation being performed, not the HTTP verb used to trigger it. Never use `store()`, `update()`, `destroy()`, `index()`, `show()`, or `edit()` as service method names. Prefer `register()`, `suspend()`, `activate()`, `place()`, `cancel()`, `ship()`, `refund()`.

---

## Reason

HTTP verb names (store, update, destroy) couple the service to the transport layer. Services should be callable from HTTP, CLI, queues, and tests — none of which use HTTP verbs. Business-verb names express domain intent and remain stable across transport changes.

---

## Bad Example

```php
class UserService
{
    public function store(array $data): User { /* ... */ }
    public function update(int $id, array $data): User { /* ... */ }
    public function destroy(int $id): bool { /* ... */ }
}
```

---

## Good Example

```php
class UserService
{
    public function register(RegisterUserData $data): User { /* ... */ }
    public function suspend(User $user): void { /* ... */ }
    public function activate(User $user): void { /* ... */ }
}
```

---

## Exceptions

When implementing a service that directly wraps an external REST API (e.g., `PaymentGatewayService`), matching the external API's verb names may improve clarity. Document the exception.

---

## Consequences Of Violation

Maintenance risks: changing from HTTP to CLI/queue requires renaming methods or tolerating misleading names. Design risks: service is coupled to HTTP semantics, reducing reusability. Onboarding risks: new developers misunderstand the service's domain role.

---

## Rule 3: Do Not Repeat the Entity Name in Method Names

Method names must not repeat the entity name that is already in the class name. `orderService.place()` not `orderService.placeOrder()`.

---

## Category

Design

---

## Rule

Service method names must not include the entity or concept name that is already present in the class name. Use `$orderService->place()` instead of `$orderService->placeOrder()`. The class name establishes context; the method name should only add the specific operation.

---

## Reason

Repeating the entity name in method names adds noise without information. `orderService.place()` is more concise and equally clear as `orderService.placeOrder()`. Concise names improve readability at call sites.

---

## Bad Example

```php
$orderService->placeOrder($data);
$orderService->cancelOrder($order);
$orderService->shipOrder($order);
```

---

## Good Example

```php
$orderService->place($data);
$orderService->cancel($order);
$orderService->ship($order);
```

---

## Exceptions

When a method name alone would be ambiguous (e.g., `$userService->register()` could mean register a user or register a device), add the disambiguating noun: `$userService->registerDevice($device)`.

---

## Consequences Of Violation

Maintenance risks: unnecessarily verbose call sites. Readability risks: redundant information reduces scanning speed.

---

## Rule 4: Use Domain Subdirectories When Exceeding 20 Service Files

Organize services into domain subdirectories under `App\Services\` once the service layer exceeds 20 files.

---

## Category

Code Organization

---

## Rule

When the `App\Services\` directory contains more than 20 files, organize services into domain subdirectories (e.g., `App\Services\Sales\OrderService`, `App\Services\Billing\InvoiceService`, `App\Services\Identity\AuthenticationService`).

---

## Reason

A flat directory of 20+ services becomes difficult to navigate. Developers must scroll or search to find the relevant file. Domain subdirectories group related services, clarify ownership, and scale to hundreds of files without navigational friction.

---

## Bad Example

```
App\Services\
  UserService.php
  OrderService.php
  InvoiceService.php
  ProductService.php
  PaymentService.php
  NotificationService.php
  AuthenticationService.php
  ShippingService.php
  DiscountService.php
  TaxService.php
  ... (25+ files, no grouping)
```

---

## Good Example

```
App\Services\
  Sales\
    OrderService.php
    CartService.php
  Billing\
    InvoiceService.php
    PaymentService.php
  Identity\
    UserService.php
    AuthenticationService.php
    RoleService.php
  Inventory\
    ProductService.php
    ShippingService.php
```

---

## Exceptions

Small projects with fewer than 20 services may remain flat. Introduce subdirectories proactively when the team anticipates growth beyond 20 services.

---

## Consequences Of Violation

Scalability risks: navigational friction beyond 20 files slows development. Code organization risks: related services are scattered, making it hard to understand domain boundaries.

---

## Rule 5: Avoid Generic or Ambiguous Service Names

Never name a service `HelperService`, `UtilityService`, `ManagerService`, `CommonService`, or similar generic terms.

---

## Category

Code Organization

---

## Rule

Generic service class names that do not clearly identify the entity or capability are prohibited. Every service name must precisely describe what domain concept it operates on. Names like `HelperService`, `UtilityService`, `ManagerService`, `CommonService`, and `GeneralService` must not exist.

---

## Reason

Generic names indicate undefined responsibility. They become dumping grounds for unrelated operations, growing into god services with unclear boundaries. Specific names enforce a single, clear responsibility and make the codebase self-documenting.

---

## Bad Example

```php
class HelperService
{
    public function sendEmail(...) { /* ... */ }
    public function calculateTotal(...) { /* ... */ }
    public function validateAddress(...) { /* ... */ }
    public function formatDate(...) { /* ... */ }
}
```

---

## Good Example

```php
class MailService { public function send(...) { /* ... */ } }
class PricingService { public function calculateTotal(...) { /* ... */ } }
class AddressService { public function validate(...) { /* ... */ } }
class DateFormattingService { public function format(...) { /* ... */ } }
```

---

## Exceptions

No common exceptions. Every service must have a specific, descriptive name.

---

## Consequences Of Violation

Maintenance risks: generic services accumulate unrelated code, violate single responsibility. Testing risks: generic services become too large to test thoroughly. Onboarding risks: new developers cannot understand the service's role from its name.

---

## Rule 6: Namespace Services Under `App\Services`

Every service class must live under the `App\Services` namespace, with domain subdirectories as needed for larger applications.

---

## Category

Code Organization

---

## Rule

All service classes must be placed within the `App\Services` namespace directory. The full namespace pattern is `App\Services\{Domain}\{Entity}Service`. Services must not be placed in `App\Http`, `App\Models`, or other non-service namespaces.

---

## Reason

A dedicated namespace makes services discoverable, enforces architectural boundaries, and prevents services from being scattered across inappropriate directories. It communicates that services are a first-class architectural concept.

---

## Bad Example

```php
// In App\Http\Services — wrong location
namespace App\Http\Services;

class UserService {}
```

---

## Good Example

```php
namespace App\Services\Identity;

class UserService {}
```

---

## Exceptions

In package development, service classes follow the package's own namespace convention.

---

## Consequences Of Violation

Code organization risks: services scattered across the codebase are hard to find and audit. Architecture risks: placing services in HTTP directory implies they are HTTP-layer constructs, violating layering principles.

---

## Rule 7: Maintain Consistent Naming Across the Team

All service names and method names must follow a single, team-agreed convention. Inconsistent naming across developers or modules is prohibited.

---

## Category

Maintainability

---

## Rule

All developers on the team must use the same naming conventions for service classes and methods. The conventions must be documented (ideally in an ADR or contributing guide) and enforced in code review. One developer must not use `placeOrder()` while another uses `orderPlace()` for the same concept.

---

## Reason

Inconsistent naming forces developers to check each service individually, increases cognitive load, and creates arbitrary differences between modules. Consistent naming makes the codebase predictable — any developer can work in any module without learning local conventions.

---

## Bad Example

```php
// Developer A:
class UserService
{
    public function userRegister(array $data): User { /* ... */ }
}

// Developer B:
class ProductService
{
    public function storeProduct(array $data): Product { /* ... */ }
}
```

---

## Good Example

```php
// Consistent across all developers:
class UserService
{
    public function register(RegisterUserData $data): User { /* ... */ }
}

class ProductService
{
    public function create(CreateProductData $data): Product { /* ... */ }
}
```

---

## Exceptions

Services that wrap third-party APIs may use the external API's terminology to reduce translation friction. Document the deviation.

---

## Consequences Of Violation

Maintenance risks: every file must be individually inspected rather than predicted. Onboarding risks: new developers cannot build reliable mental models. Code review risks: naming discussions consume review time on every PR.
