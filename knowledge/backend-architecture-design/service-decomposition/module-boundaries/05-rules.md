## Rule 1: Each module must have an explicit public API
---
## Category
Architecture
---
## Rule
Define a `Ports` directory (or `Api`) in each module that contains interfaces other modules may depend on. All other classes are internal.
---
## Reason
Without explicit public APIs, other modules depend on internal classes, creating coupling that defeats modularity.
---
## Bad Example
```
// Module A depends on Module B's internal repository
use App\Modules\Billing\Repositories\InvoiceRepository;
```
---
## Good Example
```
Module B/Ports/InvoiceService.php (public)
Module B/Repositories/ (internal, not accessible from outside)
```
---
## Exceptions
Shared kernel classes that are intentionally open to all modules.
---
## Consequences Of Violation
Implicit coupling, boundary erosion, extraction difficulty.
---
## Rule 2: Enforce boundary rules with automated dependency analysis
---
## Category
Architecture
---
## Rule
Use Deptrac or PHPArkitect in CI to enforce that no module's internal classes are imported from outside the module.
---
## Reason
Manual boundary enforcement inevitably fails; automated analysis provides objective protection.
---
## Bad Example
```yaml
# deptrac.yaml enforces layer rules but not module boundaries
```
---
## Good Example
```yaml
modules:
    Billing:
        - Billing:Ports
    Sales:
        - Sales:Ports
        - Billing:Ports
```
---
## Exceptions
When the project is too small (< 3 modules) to justify automated enforcement.
---
## Consequences Of Violation
Undetected boundary violations, increasing coupling over time.
---
## Rule 3: Module boundaries should follow bounded context boundaries
---
## Category
Architecture
---
## Rule
Define modules to match DDD bounded contexts. Each module represents one bounded context's complete implementation.
---
## Reason
Bounded context boundaries are the natural decomposition units; technical boundaries (by layer) cut across contexts.
---
## Bad Example
```
Modules: Controllers, Services, Repositories, Models (by layer)
```
---
## Good Example
```
Modules: Sales, Billing, Shipping, Inventory (by bounded context)
```
---
## Exceptions
Cross-cutting infrastructure (Logging, Caching, Auth) that has no bounded context.
---
## Consequences Of Violation
Technical coupling, context logic scattered across modules.
---
## Rule 4: Keep module interfaces small and stable
---
## Category
Architecture
---
## Rule
A module's public API should be minimal—only what other modules genuinely need. Stable interfaces change less frequently.
---
## Reason
Large or volatile public APIs create high coupling—every change forces updates in all dependent modules.
---
## Bad Example
```
Billing module's Ports/:
- InvoiceService (10 methods, frequently changed)
- PaymentService (8 methods)
- RefundService (6 methods)
- CreditNoteService (5 methods)
```
---
## Good Example
```
Billing module's Ports/:
- BillingFacade (3 methods: createInvoice, processPayment, issueRefund)
```
---
## Exceptions
When each service represents a genuinely independent capability used by different clients.
---
## Consequences Of Violation
High coupling, frequent dependent module changes, volatile API.
---
## Rule 5: Module-internal code is private—treat it as an implementation detail
---
## Category
Architecture
---
## Rule
All classes not in the module's public API should be treated as private. Other modules must not import them, even if PHP allows it.
---
## Reason
Module internals are implementation details—they can change without notice. External coupling to internals prevents refactoring.
---
## Bad Example
```
// Sales module imports Billing's internal helpers
use App\Modules\Billing\Helpers\TaxCalculator;
```
---
## Good Example
```
// Sales uses only Billing's public API
use App\Modules\Billing\Ports\BillingFacade;
```
---
## Exceptions
When the same team owns both modules and has agreed that internals are temporarily shared (document as shared kernel).
---
## Consequences Of Violation
Internal changes break external modules, refactoring paralysis.
