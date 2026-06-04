# Service Naming Conventions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service Naming Conventions
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-01

---

## Executive Summary

Service naming conventions govern how service classes are named, how their methods are named, and how they are organized into namespaces. The framework imposes no naming rules — any PHP class can function as a service. However, community conventions have converged on patterns that maximize navigability and minimize ambiguity.

The engineering significance of naming conventions is discoverability. A developer searching for "where is the order creation logic?" should find the answer in one predictable location. Inconsistent naming scatters logic across the codebase — one developer creates `OrderService`, another creates `PlaceOrderAction`, a third creates `OrderCreator`. All three may contain related logic, but the inconsistency makes them invisible to search. Consistent naming converts a collection of files into a navigable system.

The dominant naming pattern is EntityName+Service (`UserService`, `OrderService`). The secondary pattern is Capability+Service (`AuthenticationService`, `ExportService`). Both patterns use consistent method naming conventions: business verbs (`register()`, `suspend()`, `process()`) rather than generic CRUD verbs for operations that have business meaning.

---

## Core Concepts

### The EntityName+Service Convention
The dominant convention across the Laravel ecosystem: service classes are named after the entity they operate on, with `Service` as a suffix.

| Entity | Service Class | File Location |
|--------|--------------|---------------|
| User | `UserService` | `app/Services/UserService.php` |
| Order | `OrderService` | `app/Services/OrderService.php` |
| Invoice | `InvoiceService` | `app/Services/InvoiceService.php` |
| Subscription | `SubscriptionService` | `app/Services/SubscriptionService.php` |

This convention dominates because it minimizes decision-making. Any developer can predict `UserService` contains user-related logic. The risk is that it invites unbounded growth — `UserService` accumulates methods for every user-related operation, losing cohesion over time.

### The Capability+Service Convention
Services named after the business capability they implement:

| Capability | Service Class | File Location |
|------------|--------------|---------------|
| Authentication | `AuthenticationService` | `app/Services/AuthenticationService.php` |
| Notifications | `NotificationService` | `app/Services/NotificationService.php` |
| Export | `ExportService` | `app/Services/ExportService.php` |
| Checkout | `CheckoutService` | `app/Services/CheckoutService.php` |

This convention is used when the service spans multiple entities or implements a cross-cutting business process. A developer may need to check multiple capability services to find all "user-related" logic.

### The [Domain][Purpose]Service Convention (Compound)
For services that need more precision than entity or capability naming provides:

| Domain | Purpose | Service Class |
|--------|---------|--------------|
| Order | Calculation | `OrderCalculationService` |
| Cart | Validation | `CartItemValidator` (Service suffix optional) |
| Delivery | Schedule | `DeliveryScheduleService` |
| Internal | Price Export | `InternalPriceExportService` |

This pattern combines the entity domain with a specific purpose qualifier. It is the most precise and least ambiguous, but requires more naming decisions.

### Method Naming Conventions
Service methods use business verbs, not generic CRUD terms:

| Operation | Method Name | Avoid |
|-----------|-------------|-------|
| Create a user | `register()` | `create()` or `save()` |
| Change a password | `changePassword()` | `update()` |
| Cancel an order | `cancel()` | `delete()` |
| Calculate total | `calculateTotal()` | `compute()` or `getTotal()` |
| Verify email | `verifyEmail()` | `update()` |

The method name should communicate business intent, not technical operation. `register()` tells the reader what the method does. `create()` tells the reader what SQL operation it performs — less useful.

---

## Mental Models

### File Name as Answer
When a developer asks "where does X happen?", the file name should be the answer. `CreateOrderAction` answers "where is order creation?" `OrderService` answers "where is order logic?" If the answer requires checking three files with different naming patterns, the convention is broken.

### Namespace as Address
The namespace tells the developer which part of the system a service belongs to. `App\Services\Users\UserService` communicates "this service is for user operations in the application layer." `App\Domain\Billing\Services\InvoiceService` communicates "this is a domain-level service for billing." The namespace is the address — it should be accurate and consistent.

### Verb as Contract
A service method named `register()` promises: "I handle the user registration workflow." A method named `create()` promises: "I create a record." The verb is a contract with the caller — it communicates what the method does. Using business verbs (which may internally use multiple transactions and side effects) with the same name as technical verbs (which typically do one database operation) creates confusion.

---

## Patterns

### Entity-Namespace with Subdirectory Organization

```
app/Services/
├── Users/
│   ├── UserService.php
│   ├── AuthenticationService.php
│   └── ProfileService.php
├── Orders/
│   ├── OrderService.php
│   ├── OrderCalculationService.php
│   └── OrderFulfillmentService.php
├── Billing/
│   ├── InvoiceService.php
│   ├── PaymentService.php
│   └── RefundService.php
└── Notifications/
    └── NotificationService.php
```

Domain subdirectories group related services. Each service within a domain has a clear purpose.

### Flat Entity Naming (Small Applications)

```
app/Services/
├── UserService.php
├── OrderService.php
├── InvoiceService.php
├── PaymentService.php
└── NotificationService.php
```

Simple and predictable. Works up to ~15–20 services. Beyond that, flat naming becomes a list that requires scanning.

### Interface + Implementation Naming (Swappable Services)

```
app/Services/Payment/
├── Contracts/
│   └── PaymentServiceInterface.php
├── StripePaymentService.php
└── PayPalPaymentService.php
```

Interface in a `Contracts` subdirectory. Implementation prefixed by provider name. The method signatures are defined in the interface, implementations differ in execution.

### Action-Style Method Naming (Alternative Convention)

Some teams prefer action-style naming even within service classes:

```php
class OrderService
{
    public function placeOrder(Cart $cart): Order {}
    public function cancelOrder(Order $order): void {}
    public function refundOrder(Order $order): Refund {}
}
```

The `[Verb]Order` pattern makes each method self-documenting. It is more verbose but eliminates ambiguity about what the method does.

### Method Return Type Naming Convention

Methods that may return null should communicate this:
- `find(int $id): ?User` — may return null
- `findOrFail(int $id): User` — throws if not found
- `findOrCreate(int $id, array $data): User` — creates if not found
- `getActive(): Collection` — returns collection (never null)

This follows Eloquent's conventions and makes the calling code's error handling visible.

---

## Architectural Decisions

### Why EntityName+Service Is the Default
The EntityName+Service pattern is the default because it aligns with how Laravel developers think about their application. Laravel is entity-centric — models, controllers, migrations, and factories are all named after entities. Following the same pattern for services reduces cognitive overhead.

### Why Service Suffix Over Alternatives
The `Service` suffix is preferred over `Manager`, `Handler`, `Processor`, or `Helper` because it is the most generic and least ambiguous. `Manager` implies lifecycle management. `Handler` implies event handling. `Processor` implies data transformation. `Helper` is a dumping ground. `Service` communicates no specific sub-pattern — it is a generic "this class provides business logic" marker.

### Why Business Verbs Over CRUD Verbs for Method Names
CRUD verbs (`create`, `read`, `update`, `delete`) describe database operations. Business verbs (`register`, `suspend`, `approve`, `cancel`) describe business operations. Using business verbs at the service layer communicates the business intent. The controller may use CRUD verbs because it maps to HTTP methods, but the service layer should speak the domain language.

---

## Tradeoffs

### EntityName+Service vs Capability+Service

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Entity: Predictable navigation — "find user logic in UserService" | Entity: Invites bloat — all user operations in one class | Use entity naming with discipline on method count |
| Capability: Cohesive — all checkout methods in CheckoutService | Capability: Scattered — user auth in AuthenticationService, user profile in ProfileService | Use capability naming for cross-cutting processes |

### Single-Name vs Compound-Name

| Pattern | When to Use | Risk |
|---------|-------------|------|
| `UserService` | Simple entity with cohesive operations | Ambiguous when entity has many sub-domains |
| `UserRegistrationService` | Entity has multiple distinct sub-domains | Too many files — navigation overhead |
| `OrderCalculationService` | Service has a focused purpose | Self-documenting | 

### Flat vs Namespace Organization

| Aspect | Flat | Namespace |
|--------|------|-----------|
| Simplicity | No directory decisions | Subdirectory structure needed |
| Navigability | Good for <20 services | Essential for 50+ services |
| Refactoring | Simple file moves | Namespace changes update all imports |

---

## Internal Mechanics

### PSR-4 Autoloading and Name Resolution
Service class naming maps directly to file paths through PSR-4 autoloading. `App\Services\UserService` resolves to `app/Services/UserService.php`. The namespace segments after `App\` correspond to directory segments. A service at `App\Services\Users\UserService` resolves to `app/Services/Users/UserService.php`. The autoloader uses Composer's generated class map to resolve class names to file paths. Name resolution depth does not affect resolution speed — all files are found through the same class map lookup.

### Container Resolution by Name
When a service is type-hinted in a controller constructor or method, the container resolves it by class name:

```php
public function __construct(
    private UserService $users,  // Container resolves 'App\Services\UserService'
) {}
```

The container uses reflection to read the type hint, then calls `Container::make()`. For concrete classes (no interface binding), the container auto-resolves through the constructor. The class name must match the injected type hint exactly — namespace mismatches cause resolution failures.

### Name Collisions in Same Namespace
Two classes with the same name in different namespaces (e.g., `App\Services\Billing\PaymentService` and `App\Services\Integrations\PaymentService`) cannot both be imported in the same file without aliasing:

```php
use App\Services\Billing\PaymentService as BillingPaymentService;
use App\Services\Integrations\PaymentService as IntegrationPaymentService;
```

Without aliasing, PHP throws a fatal error at import time. This is a compile-time error, not a runtime error — it is caught immediately when the file is loaded.

---

## Performance Considerations

Naming conventions have zero runtime performance cost. PHP class names and namespaces are resolved at autoload time, not at execution time. The depth of a directory structure does not affect autoloading performance — PSR-4 maps namespaces to directories with equal cost regardless of depth.

---

## Production Considerations

### Convention Documentation
Document the chosen naming convention in a project architecture guide. The documentation should cover:
- Service suffix: always `Service` (avoid `Manager`, `Handler`, `Helper`)
- Entity vs capability naming: when to use each
- Method naming: business verbs preferred over CRUD verbs
- Namespace: `App\Services\{Domain}\{ServiceName}`
- Special cases: interface naming, multi-implementation naming

### Enforcement in Code Review
Code review should flag:
- Services named `helper`, `utils`, `manager`, `handler` without justification
- Methods named `save()`, `delete()`, `update()` on services that do business operations
- Services with compound responsibilities (name implies one thing but class does another)
- Inconsistent naming across the same domain (both `UserService` and `AccountService` for the same entity)

### Migration Path
When renaming services: update the class declaration, update all injection points, update test references. Use IDE rename refactoring to handle the file and all references in one operation. Run the full test suite after any service rename.

---

## Common Mistakes

### Generic Suffix Abuse
Why it happens: Not knowing what to name a class, so it becomes `Helper`, `Manager`, or `Processor`. Why it's harmful: `Helper` is a dumping ground — no cohesion, no clear responsibility. `Manager` implies lifecycle management. `Processor` implies data transformation. None of these communicate business intent. Better approach: If you cannot name it specifically, you do not yet understand its responsibility.

### Naming After Framework Constructs
Why it happens: A service named `UserController` or `UserModel` because it handles HTTP concerns or data access. Why it's harmful: Controller and Model are framework constructs with specific meanings. Naming a service after them confuses the architectural layer. A service named `UserModel` suggests it belongs in the model layer. Better approach: Use `UserService`, or if it handles persistence, `UserRepository`.

### Inconsistent Entity Naming
Why it happens: One developer creates `UserService`, another creates `AccountService`, a third creates `MemberService` — all for the same entity. Why it's harmful: Developers searching for user logic must check three potential file names. Logic gets duplicated because developers don't find the existing service. Better approach: Map each entity to exactly one service name, documented and enforced.

### Mixing Suffixes Within a Project
Why it happens: No documented convention. Why it's harmful: Some services end in `Service`, some in `Manager`, some in `Handler`. A developer needs to know both the entity and the suffix pattern to find a service. Better approach: Pick one suffix (`Service`) and use it consistently across all service classes.

### Verb-Noun Confusion in Method Names
Why it happens: Translating between business domain and technical implementation. Why it's harmful: `getActiveUsers()` and `fetchActiveUsers()` both do the same thing but different developers named them differently. The inconsistency creates ambiguity about whether there's a behavioral difference. Better approach: Agree on a verb taxonomy (get/fetch/create/register) and apply consistently.

---

## Failure Modes

### Two Services with Same Name in Different Namespaces
A `PaymentService` in `App\Services\Billing` and a `PaymentService` in `App\Services\Integrations`. Both cannot be imported in the same file without aliasing. The collision is invisible until a developer imports both, at which point PHP produces a fatal error. Resolution: Use distinct names (`BillingPaymentService`, `IntegrationPaymentService`) or always alias at import.

### Service Named After Deprecated Entity
An `OldUserService` that persists in the codebase after a user entity rename. New developers create `AccountService` for the renamed entity. Logic for the same domain concept is split across two services. Resolution: Delete old services when entities are renamed, or create a facade class that delegates.

### Service Name That Covers Too Much
`ProjectService` that handles billing, team management, task tracking, file uploads, and notifications for projects. The name is technically correct (all relate to projects), but provides zero information about what the service actually does. Resolution: Split by sub-domain: `ProjectBillingService`, `ProjectTeamService`, `ProjectTaskService`.

---

## Ecosystem Usage

### Laravel Framework
The framework itself does not define service naming conventions. `Illuminate\Auth\AuthManager`, `Illuminate\Cache\CacheManager`, and `Illuminate\Session\SessionManager` use the `Manager` suffix for lifecycle-managed components — a different pattern from application services.

### Spatie Packages
Spatie uses descriptive naming: `Spatie\Permission\PermissionRegistrar`, `Spatie\Activitylog\ActivityLogger`. The naming describes what the class does, not what entity it relates to. This is capability-oriented naming at the package level.

### Monica CRM
Monica uses entity-oriented service naming: `ContactService`, `ActivityService`, `RelationshipService`, `CallService`. Each service is named after the entity it operates on. Methods use business verbs: `createContact()`, `updateContact()`, `addTag()`.

### Community Standard
The community has converged on these conventions (2024–2026):
- **Service suffix** for all service classes (replacing Manager/Handler/Helper)
- **Entity naming** for domain services (UserService, OrderService)
- **Capability naming** for cross-cutting services (NotificationService, ExportService)
- **Business verb methods** for service methods (register, suspend, approve)
- **Subdirectory namespaces** for applications with 20+ services

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — What services are and how they are structured

### Related Topics
- Controller Organization — How controller naming relates to service naming
- Action Naming — How action naming conventions differ from service naming

### Advanced Follow-up Topics
- Service vs Action Decision — How naming conventions inform the service/action choice
- Domain vs Application Services — Naming distinctions between layers
- Directory Conventions — Where services live in the project structure

---

## Research Notes

### Key Insight
Naming is the single most cost-effective architectural investment. Deciding on names is free (no code to write), but the decision affects every future developer who searches for code. Inconsistent naming creates invisible duplication — two files with different names doing the same thing. The cost of finding that duplication later is 100x the cost of agreeing on names upfront.

### Key Controversy
The `VerbNoun` vs `NounVerb` naming debate for service methods continues. `getUsers()` vs `users()` vs `fetchAll()` — each has advocates. The community has not converged on a single pattern, but has converged on the importance of consistency within a single project. The specific choice matters less than the decision to choose and document.

### Version-Specific Notes
- PHP 8.0+ constructor property promotion: influences method naming (readonly properties make naming more explicit)
- No framework changes to naming conventions across Laravel 8–13
- Community conventions evolve slowly — the EntityName+Service pattern has been stable since Laravel 5.x
