# Rule: Never place business logic in the shared kernel
---
## Category
Architecture
---
## Rule
Do not place business logic (calculations, rules, validations) in the shared kernel, even if multiple contexts use the same logic.
---
## Reason
Business logic evolves differently per context over time. Putting it in shared kernel locks all contexts to the same implementation, preventing independent evolution.
---
## Bad Example
```php
// Business logic in shared kernel
// Billing and Shipping use DiscountCalculator, but Billing needs a different algorithm
namespace App\Domains\Shared;
class DiscountCalculator
{
    public function calculate(float $amount, string $tier): float
    {
        return $tier === 'gold' ? $amount * 0.9 : $amount * 0.95;
    }
}
```
---
## Good Example
```php
// Each context has its own business logic
// Even if initially identical, they can diverge independently
namespace App\Domains\Billing\Services;
class BillingDiscountCalculator { /* Billing's rules */ }

namespace App\Domains\Shipping\Services;
class ShippingDiscountCalculator { /* Shipping's rules */ }
```
---
## Exceptions
When business rules are truly universal and will never diverge (e.g., tax calculation mandated by law with immutable formula).
---
## Consequences Of Violation
All contexts forced to adopt same business rules; changing rules for one context requires coordination across all.

# Rule: Never place Eloquent models in the shared kernel
---
## Category
Architecture
---
## Rule
Do not put Eloquent models in the shared kernel. Each Eloquent model belongs to exactly one bounded context.
---
## Reason
Eloquent models carry schema definitions, relationships, and lifecycle management. A shared model couples all contexts to the same schema, preventing independent database evolution.
---
## Bad Example
```php
// Shared Eloquent model
namespace App\Domains\Shared\Models;
class User extends Authenticatable // every context depends on this
{
    public function orders(): HasMany { /* ... */ }
}
```
---
## Good Example
```php
// Each context owns its models
namespace App\Domains\Identity\Models;
class User extends Authenticatable { /* Identity-specific */ }

namespace App\Domains\Billing\Models;
class Customer extends Authenticatable { /* Billing-specific */ }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Schema coupling across contexts; adding a field triggers migrations for all dependent contexts.

# Rule: Extract to shared kernel only when a third context needs it
---
## Category
Architecture
---
## Rule
Default to duplicating code between contexts; extract to shared kernel only when the third context independently needs the same stable concept.
---
## Reason
Premature extraction creates wrong abstractions. Two contexts duplicating the same value object is acceptable. When a third context needs it, extraction to shared kernel is justified by proven reuse.
---
## Bad Example
```php
// Premature extraction — only one consumer exists
namespace App\Domains\Shared;
class Email // extracted before any second consumer exists
{
    public function __construct(public string $address)
    {
        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidEmailException($address);
        }
    }
}
```
---
## Good Example
```php
// Duplicate until three contexts need it
namespace App\Domains\Identity;
// class Email { same code }

namespace App\Domains\Billing;
// class Email { same code }

// Third context appears → extract to Shared
namespace App\Domains\Shared\ValueObjects;
class Email
{
    public function __construct(public string $address)
    {
        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidEmailException($address);
        }
    }
}
```
---
## Exceptions
When the concept is universally stable (ISO standards, mathematical types) and duplication costs exceed extraction costs.
---
## Consequences Of Violation
Wrong abstractions in shared kernel that don't fit all consumers; shared kernel grows uncontrollably.

# Rule: Keep the shared kernel small — no more than 20 classes
---
## Category
Architecture
---
## Rule
Limit the shared kernel to fewer than 20 classes at any time.
---
## Reason
A large shared kernel signals wrong context boundaries or a dumping ground for "common" code. Every class in shared kernel is a coupling point between all contexts.
---
## Bad Example
```php
// Shared kernel with 50+ classes — dumping ground
namespace App\Domains\Shared;
// 50+ classes including helpers, DTOs, base classes, exceptions
```
---
## Good Example
```php
// Shared kernel has <20 classes
namespace App\Domains\Shared\ValueObjects;
// Money, Email, Address (stable)

namespace App\Domains\Shared\Contracts;
// EventBus, Logger (foundation interfaces)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Contexts coupled through shared kernel; changing any shared item requires coordinated deployment across all contexts.

# Rule: Only share value objects and foundation interfaces
---
## Category
Code Organization
---
## Rule
Restrict shared kernel contents to immutable value objects, foundation interfaces (contracts), and stable enums.
---
## Reason
Value objects are low-risk to share because they are immutable and carry no mutable state or business logic. Foundation interfaces define contracts without locking implementation.
---
## Bad Example
```php
namespace App\Domains\Shared;
// Infrastructure code, DTOs, helper classes
class ApiClient { /* infrastructure */ }
class OrderDto { /* mutable DTO */ }
class StringHelper { /* utility */ }
```
---
## Good Example
```php
namespace App\Domains\Shared\ValueObjects;
class Money { /* immutable */ }
class Email { /* immutable */ }

namespace App\Domains\Shared\Contracts;
interface EventBus { /* contract */ }
interface Logger { /* contract */ }

namespace App\Domains\Shared\Enums;
enum Currency: string { case USD = 'USD'; case EUR = 'EUR'; }
```
---
## Exceptions
Base classes like AggregateRoot or Entity that are genuinely foundational across contexts.
---
## Consequences Of Violation
Shared kernel becomes coupling hub; changes to "shared" code ripple through all contexts.

# Rule: Prefer stable interfaces over shared implementations
---
## Category
Architecture
---
## Rule
When sharing is necessary, share interfaces (contracts) rather than concrete implementations.
---
## Reason
An interface defines a contract without locking all contexts to the same implementation. Each context can implement the interface differently or evolve its implementation independently.
---
## Bad Example
```php
// Shared implementation — all contexts forced to use RedisEventBus
namespace App\Domains\Shared\Infrastructure;
class RedisEventBus implements EventBus { /* Redis-specific */ }
```
---
## Good Example
```php
// Shared interface — each context can choose implementation
namespace App\Domains\Shared\Contracts;
interface EventBus
{
    public function dispatch(Event $event): void;
}

// Billing uses Redis; Identity uses SQS
namespace App\Domains\Billing\Infrastructure;
class RedisEventBus implements EventBus { /* Redis */ }

namespace App\Domains\Identity\Infrastructure;
class SQSEventBus implements EventBus { /* SQS */ }
```
---
## Exceptions
When the implementation is universal and unlikely to change per context (e.g., Logger writing to a common log stream).
---
## Consequences Of Violation
All contexts locked to same implementation; changing implementation requires coordinated change across all contexts.

# Rule: Do not mutate shared kernel state
---
## Category
Architecture
---
## Rule
Never place mutable global state in the shared kernel that can be modified by different contexts.
---
## Reason
Mutable shared state creates hidden temporal coupling between contexts. One context's modification affects all others unpredictably.
---
## Bad Example
```php
// Mutable shared state
namespace App\Domains\Shared;
class AppState
{
    public static string $currentTenant = 'default'; // any context can change
}
```
---
## Good Example
```php
// State is per-context or passed explicitly
namespace App\Domains\Identity\Services;
class TenantContext
{
    public function __construct(
        private string $tenantId
    ) {}
}

// Each context resolves its own tenant context
// No shared mutable state
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unpredictable behavior when contexts modify shared state at different times.

# Rule: Do not put cross-context DTOs in the shared kernel
---
## Category
Code Organization
---
## Rule
Keep Data Transfer Objects for cross-context communication in the consuming context or a dedicated contracts layer, not in the shared kernel.
---
## Reason
DTOs for cross-context communication change when either producer or consumer changes. They are not stable enough for the shared kernel and would cause unnecessary churn.
---
## Bad Example
```php
// Cross-context DTO in shared kernel — changes every time billing or ordering changes
namespace App\Domains\Shared\DTO;
class OrderData { /* changes trigger all context rebuilds */ }
```
---
## Good Example
```php
// DTO lives in the contract interface
interface BillingServiceInterface
{
    /** @return array<InvoiceData> */
    public function getInvoices(int $userId): array;
}

class InvoiceData
{
    public function __construct(
        public int $id,
        public float $total,
        public string $status
    ) {}
}
```
---
## Exceptions
When the DTO is universally stable and used by three or more contexts with identical semantics.
---
## Consequences Of Violation
Frequent changes to shared kernel cause cascading rebuilds and retesting across all contexts.

# Rule: Version shared kernel contracts explicitly
---
## Category
Maintainability
---
## Rule
Version shared kernel contracts explicitly so that context boundaries are aware of contract changes.
---
## Reason
Without versioning, a change to a shared interface silently breaks contexts that depend on the old contract. Versioning forces explicit upgrade decisions.
---
## Bad Example
```php
// Shared contract without versioning
interface EventBus
{
    public function dispatch(Event $event): void;
}
// Changing this interface breaks all implementers silently
```
---
## Good Example
```php
// Versioned contract
interface EventBusV1
{
    public function dispatch(Event $event): void;
}

interface EventBusV2
{
    public function dispatch(Event $event): void;
    public function dispatchBatch(array $events): void;
}

class BillingEventBus implements EventBusV1 { /* ... */ }
class IdentityEventBus implements EventBusV2 { /* ... */ }
```
---
## Exceptions
During initial development when contexts are still stabilizing.
---
## Consequences Of Violation
Silent breaking changes across all contexts consuming the shared contract.
