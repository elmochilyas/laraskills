# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Shared kernel: what belongs in shared vs. modules
Knowledge Unit ID: MMD-08
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Extract to shared kernel only when three or more modules need the same concept
---
## Category
Architecture
---
## Rule
Do not extract code into the shared kernel until at least three independent modules need the same concept. Wait for duplication to emerge before extracting.
---
## Reason
Premature extraction creates wrong abstractions. When only two modules share a concept, duplication is cheaper and more flexible than a premature shared abstraction that may not fit future needs.
---
## Bad Example
```php
// Extracted after 2 modules — premature
// Shared/ValueObjects/Money.php
// Only Billing and Orders need it — duplication would be fine
```
---
## Good Example
```php
// Extracted after 3+ modules need it
// Billing, Orders, AND Catalog need Money value object
// Shared/ValueObjects/Money.php
// Third module justifies the shared extraction
```
---
## Exceptions
Infrastructure-level types (logger interface, event bus interface) that are inherently cross-cutting may be shared from the start.
---
## Consequences Of Violation
Wrong abstractions that don't fit all consumers; cost of changing shared code across all modules; unnecessary shared kernel bloat.

---
## Rule Name
Never put business logic in the shared kernel
---
## Category
Architecture
---
## Rule
Keep all business logic and domain rules in module-specific code. The shared kernel may only contain base value objects, foundation types, and utility interfaces.
---
## Reason
Business logic in the shared kernel cannot evolve independently per module. Every module is coupled to the same business logic, preventing independent module evolution.
---
## Bad Example
```php
// Shared kernel contains business logic
class Shared\Services\TaxCalculator
{
    public function calculate(OrderDTO $order): float
    {
        // Tax calculation logic — business logic in shared
        // If Billing needs different tax rules, impossible without affecting Catalog
    }
}
```
---
## Good Example
```php
// Shared kernel contains only value objects and types
class Shared\ValueObjects\Money
{
    public function __construct(
        public readonly float $amount,
        public readonly string $currency,
    ) {}
}

// Business logic stays in modules
Modules\Billing\Services\TaxCalculator
Modules\Catalog\Services\TaxCalculator
```
---
## Exceptions
Cross-cutting business rules that apply identically to all modules (compliance requirements, legal constraints) may live in shared with comprehensive documentation.
---
## Consequences Of Violation
Business logic cannot evolve per module; changes affect all modules; module independence is compromised.

---
## Rule Name
Do not import Laravel facades or helpers in the shared kernel
---
## Category
Architecture
---
## Rule
Keep the shared kernel free of Laravel-specific imports: no facades (`\DB`, `\Cache`, `\Event`), no helpers (`collect()`, `optional()`, `blank()`), no framework-dependent types.
---
## Reason
Framework imports in the shared kernel couple all modules to Laravel. The shared kernel should be framework-agnostic to enable testing, extraction, and future framework upgrades.
---
## Bad Example
```php
// Shared kernel depends on Laravel
namespace Shared\ValueObjects;

use Illuminate\Support\Facades\Cache; // Framework coupling

class Money
{
    public function convert(string $currency): Money
    {
        $rate = Cache::get("exchange_rate_{$currency}"); // Facade in value object
        // ...
    }
}
```
---
## Good Example
```php
// Shared kernel — pure PHP, no framework dependency
namespace Shared\ValueObjects;

class Money
{
    public function __construct(
        public readonly float $amount,
        public readonly string $currency,
    ) {}

    public function convert(float $exchangeRate): Money
    {
        return new self($this->amount * $exchangeRate, $this->currency);
    }
}

// Framework usage stays in module services
```
---
## Exceptions
The shared kernel may import Laravel contracts (interfaces only, e.g., `Illuminate\Contracts\Cache\Repository`) as type hints, but never concrete implementations or facades.
---
## Consequences Of Violation
All modules are coupled to Laravel through the shared kernel; testing in isolation requires Laravel boot; framework upgrades require shared kernel changes.

---
## Rule Name
Never place Eloquent models in the shared kernel
---
## Category
Architecture
---
## Rule
All Eloquent models must belong to a specific module. Never define a model in the shared kernel that multiple modules access directly.
---
## Reason
A shared Eloquent model (e.g., shared `User` model) creates implicit coupling between all modules that access it. Every module directly queries the same table, defeating module isolation.
---
## Bad Example
```php
// Shared kernel has Eloquent model
// Shared/Models/User.php — ALL modules access it directly
// Any module can add a scope, accessor, or relation
// User model becomes a god object with contributions from every module
```
---
## Good Example
```php
// Each module owns its own model (or uses contract-based access)
Modules\Billing\Models\User;  // Billing's view of User
Modules\Support\Models\User;  // Support's view of User
// Or better: modules access User data through a contract
Modules\Identity\Contracts\UserContract
```
---
## Exceptions
Legacy monoliths with a shared User model may extract it as a transition step, with a clear plan for module-specific User representations.
---
## Consequences Of Violation
All modules coupled to a single model; model becomes a god object; schema changes affect all modules; module extraction is impossible.

---
## Rule Name
Assign clear ownership for the shared kernel
---
## Category
Maintainability
---
## Rule
Designate an owner or owners for the shared kernel. Shared kernel changes require broader review than module changes because they affect all modules.
---
## Reason
Without ownership, the shared kernel becomes a dumping ground where anyone adds anything. Every module is affected by shared kernel changes, so changes need coordination and review from all consumers.
---
## Bad Example
```php
// No shared kernel owner — anyone adds anything
// Shared/ now contains: Money, Logger, TaxRate, EmailConfig, UserHelper
// No one knows who reviews shared kernel PRs
```
---
## Good Example
```php
// Shared kernel has designated owners (e.g., Architecture team or senior devs)
// All shared kernel PRs require review from shared kernel owners
// module.json in Shared/ lists owners
{
    "name": "shared",
    "owners": ["@arch-team"],
    "review_required": true
}
```
---
## Exceptions
In very small teams (<5 engineers), shared kernel ownership is implicitly the whole team. Document this explicitly.
---
## Consequences Of Violation
Shared kernel becomes dumping ground; changes break modules without coordination; no accountability for shared code quality.

---
## Rule Name
Keep the shared kernel as small as possible
---
## Category
Maintainability
---
## Rule
Minimize the shared kernel to the absolute smallest set of types that avoids unacceptable duplication. When in doubt, prefer duplication over adding to shared.
---
## Reason
Every addition to the shared kernel creates coupling between all modules. A large shared kernel creates a hidden coupling layer that degrades module independence as much as direct inter-module imports.
---
## Bad Example
```php
// Bloated shared kernel
Shared/
├── ValueObjects/    // Money, Email, Address, Phone, SSN, Currency, ...
├── Enums/           // Status, Role, Permission, PaymentMethod, ...
├── Exceptions/      // ValidationException, NotFoundException, ...
├── Helpers/         // StringHelper, ArrayHelper, MathHelper, ...
├── DTOs/            // PaginatedResponse, ApiResponse, SortRequest, ...
// 30+ files — modules coupled via shared code
```
---
## Good Example
```php
// Minimal shared kernel
Shared/
├── ValueObjects/
│   ├── Money.php       // Used by 4 modules
│   └── Email.php       // Used by 3 modules
├── Enums/
│   └── Currency.php    // Used by 3 modules
// 3 files — only extracted when justified by 3+ consumers
```
---
## Exceptions
No common exceptions. Shared kernel minimalism is a core architectural principle.
---
## Consequences Of Violation
High coupling between all modules via shared code; shared kernel changes require broad coordination; module extraction pulls unnecessary shared dependencies.
