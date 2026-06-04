# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module internal structure conventions
Knowledge Unit ID: MMD-03
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Follow a consistent internal structure across all modules
---
## Category
Code Organization
---
## Rule
Every module must follow the same internal directory structure: `Contracts/`, `Models/`, `Services/`, `Actions/`, `Events/`, `Providers/`, `database/migrations/`, `tests/`. Consistency is mandatory — developers must navigate any module without documentation.
---
## Reason
Inconsistent structure creates cognitive overhead, makes tooling harder, and prevents developers from finding code quickly across modules. Predictability is the primary benefit of a structural convention.
---
## Bad Example
```php
// Module A
Modules/Billing/Services/, Models/, Config/, Routes/
// Module B
Modules/Catalog/Repositories/, Entities/, database/
// Module C
Modules/Inventory/src/, helpers/, routes/
```
---
## Good Example
```php
// Every module follows the same structure
Modules/Billing/src/Contracts/, Models/, Services/, Actions/, Events/, Providers/
Modules/Billing/database/migrations/
Modules/Billing/tests/
Modules/Catalog/src/Contracts/, Models/, Services/, Actions/, Events/, Providers/
Modules/Catalog/database/migrations/
Modules/Catalog/tests/
```
---
## Exceptions
Very simple modules (single service, no models) may omit empty directories but must follow the namespace convention so that adding files later doesn't require restructuring.
---
## Consequences Of Violation
Developer confusion when switching between modules; tooling (PHPStan, test runners) requires per-module configuration; module extraction requires restructuring.

---
## Rule Name
Define Contracts/ as the public face of the module
---
## Category
Architecture
---
## Rule
Place all inter-module communication interfaces in the module's `Contracts/` directory. Other modules may only import from Contracts/ — never from Services/, Models/, or any other internal directory.
---
## Reason
Contracts/ is the only directory visible to other modules. This is the primary isolation mechanism — it defines the module's API boundary and hides internal implementation.
---
## Bad Example
```php
// Other modules import internal classes directly
use Modules\Billing\Services\InvoiceService;
use Modules\Billing\Models\Invoice;
// Contracts/ exists but is bypassed
```
---
## Good Example
```php
// Contracts/ is the only cross-module import
use Modules\Billing\Contracts\InvoiceServiceContract;
// Implementation is hidden — only the interface is visible
```
---
## Exceptions
Shared kernel code (base value objects, foundation types) resides outside modules in a Shared/ namespace and is importable by all modules.
---
## Consequences Of Violation
Module isolation is defeated; internal refactoring breaks consumers; extraction requires rewriting because internal code is referenced externally.

---
## Rule Name
Colocate module tests within the module directory
---
## Category
Testing
---
## Rule
Place all module tests inside the module's own `tests/` directory, never in the application-level `tests/` directory. This ensures the test directory moves with the module during extraction.
---
## Reason
Colocated tests make module extraction trivial — the entire module directory, including its test suite, can be moved to a new repository without test file reorganization.
---
## Bad Example
```php
tests/Feature/Billing/
tests/Unit/Billing/
// Tests are organized by module name but at application level
// Extraction requires separating test files from other test files
```
---
## Good Example
```php
Modules/Billing/tests/Feature/
Modules/Billing/tests/Unit/
// Tests move with the module during extraction
// No test file separation needed
```
---
## Exceptions
Integration tests that span multiple modules (cross-module contract tests) may live at the application level but should reference module test helpers by namespace.
---
## Consequences Of Violation
Extraction requires manual test file separation; risk of losing test coverage during extraction; test suite organization doesn't mirror module boundaries.

---
## Rule Name
Each module must have exactly one service provider
---
## Category
Code Organization
---
## Rule
Each module must have a single service provider registered in `config/app.php`. The provider handles all bootstrapping: route loading, migration loading, config merging, event registration, and container bindings.
---
## Reason
Multiple providers per module signal the module should be split. A single provider is the bootstrap entry point — clearly defined and easily locatable.
---
## Bad Example
```php
Modules/Billing/Providers/RoutesServiceProvider.php
Modules/Billing/Providers/EventServiceProvider.php
Modules/Billing/Providers/BindingServiceProvider.php
// Three providers for one module — confusing registration
```
---
## Good Example
```php
Modules/Billing/Providers/BillingServiceProvider.php
// Single provider handles all bootstrapping
// register(): bindings, event listeners
// boot(): routes, migrations, config
```
---
## Exceptions
If Laravel requires separate event service providers (automatic event discovery), use a single BillingEventServiceProvider within the module alongside the main provider. Never exceed 2 providers per module.
---
## Consequences Of Violation
Boot order complexity; registration scattered across files; unclear module boundaries; extraction requires provider consolidation.

---
## Rule Name
Use @internal docblocks or PHP 8 internal attributes for non-public module classes
---
## Category
Code Organization
---
## Rule
Mark any class that is not part of the module's public API with `@internal` docblock or PHP 8 `#[Internal]` attribute. Communicate intent that these classes should never be imported from other modules.
---
## Reason
Without explicit internal markers, developers assume any public class is fair game for cross-module imports. Internal markers provide both documentation and a hook for static analysis enforcement.
---
## Bad Example
```php
namespace Modules\Billing\Services;

class InvoiceCalculator
{
    // No internal marker — other modules may import this
    public function calculateTotal(array $items): float
    {
        // ...
    }
}
```
---
## Good Example
```php
namespace Modules\Billing\Services;

/**
 * @internal - Do not use outside Billing module.
 * Use InvoiceServiceContract instead.
 */
class InvoiceCalculator
{
    public function calculateTotal(array $items): float
    {
        // ...
    }
}
```
---
## Exceptions
No common exceptions. Marking internal classes is a low-cost, high-value practice.
---
## Consequences Of Violation
Developers import internal classes from other modules; refactoring internal implementation breaks consumers; module contracts are bypassed.

---
## Rule Name
Expose only what other modules need in Contracts
---
## Category
Architecture
---
## Rule
Design Contracts/ interfaces as minimal consumer-facing APIs, not mirrors of every internal class. If a method has no cross-module consumer, it should not be in a contract.
---
## Reason
Empty or bloated contracts create maintenance overhead without value. Every contract method is a commitment — changing it requires coordinating with all consumers.
---
## Bad Example
```php
interface InvoiceServiceContract
{
    public function generatePdf(InvoiceDTO $dto): string;
    public function calculateSubtotal(array $items): float;
    public function calculateTax(array $items, string $region): float;
    public function calculateTotal(array $items, string $region): float;
    public function applyDiscount(array $items, string $code): array;
    // All internal methods exposed — bloat without value
}
```
---
## Good Example
```php
interface InvoiceServiceContract
{
    public function generateInvoice(OrderDTO $order): InvoiceDTO;
    // Only methods other modules actually call
    // Internal logic (calculations, formatting) stays in Services/
}
```
---
## Exceptions
When a module is explicitly designed as a shared service layer (e.g., a Notification module), broader contracts may be justified.
---
## Consequences Of Violation
Contract maintenance overhead without benefit; interface pollution; breaking changes affect more consumers than necessary.

---
## Rule Name
Namespace every module with its own top-level namespace
---
## Category
Code Organization
---
## Rule
Each module must use its own top-level namespace (e.g., `Modules\Billing`, `Modules\Catalog`). All module classes reside under this namespace. Never place module classes in `App\` or global namespace.
---
## Reason
Distinct namespaces prevent class collisions, enable namespace-based static analysis enforcement, and make module ownership explicit in import statements.
---
## Bad Example
```php
namespace App\Services\Billing; // Under App namespace
namespace App\Models\Billing;    // Mixed with application code
// Not clear where module boundary starts and ends
```
---
## Good Example
```php
namespace Modules\Billing\Services;
namespace Modules\Billing\Models;
// Clear namespace boundary — module ownership is explicit
```
---
## Exceptions
No common exceptions. Module namespacing is a core convention.
---
## Consequences Of Violation
Namespacing collisions between modules and application code; static analysis rules cannot distinguish module boundaries; unclear ownership of classes.
