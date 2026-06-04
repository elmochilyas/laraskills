# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module boundary identification: bounded context heuristics
Knowledge Unit ID: MMD-02
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Use language divergence as the primary boundary signal
---
## Category
Architecture
---
## Rule
Identify module boundaries by finding business terms that mean different things in different contexts. If "Customer" means one thing in Billing and another in Support, that is a clear boundary signal.
---
## Reason
Shared terminology with different meanings across contexts is the clearest indicator of distinct bounded contexts. Validate this with domain experts, not developers alone.
---
## Bad Example
```php
// "Customer" used everywhere with the same Eloquent model
use App\Models\Customer; // single Customer model for Billing, Support, Marketing
// But Billing cares about payment info, Support cares about tickets
```
---
## Good Example
```php
// Separate bounded contexts with distinct Customer concepts
Modules\Billing\Models\Customer; // billing-specific attributes
Modules\Support\Models\Customer; // support-specific attributes
// Each module owns its Customer definition
```
---
## Exceptions
Trivial CRUD applications with no language divergence across domains may not benefit from strict boundary separation.
---
## Consequences Of Violation
Single model becomes a god object handling unrelated concerns; changes require coordination across unrelated teams; schema changes affect all contexts.

---
## Rule Name
Start broad, split later when divergence emerges
---
## Category
Architecture
---
## Rule
Begin with broader module boundaries (3-5 modules for most teams) and split as language divergence and independent change patterns emerge. Merging modules is significantly harder than splitting them.
---
## Reason
Module boundaries are easier to split than merge. Premature fine-grained boundaries create inter-module communication overhead and require costly merges when boundaries are wrong.
---
## Bad Example
```php
// Creating 15 modules for a 3-developer team from day one
Modules/OrderManagement/
Modules/OrderFulfillment/
Modules/OrderReturns/
Modules/OrderTracking/
// — indistinguishable concerns, excessive overhead
```
---
## Good Example
```php
// Start with 3-5 broad modules, split later
Modules/Ordering/       // orders, fulfillment, returns, tracking
Modules/Billing/        // invoices, payments, subscriptions
Modules/Catalog/        // products, categories, inventory
// Split Ordering when order management diverges from fulfillment
```
---
## Exceptions
Well-understood domains with clear bounded contexts from DDD event storming workshops may justify more fine-grained initial boundaries.
---
## Consequences Of Violation
Excessive inter-module coordination overhead; frequent boundary changes; developers confused about where functionality belongs.

---
## Rule Name
Use business domain boundaries, never technical layer boundaries
---
## Category
Architecture
---
## Rule
Name and organize modules by business domain (Billing, Catalog, Inventory), not technical layers (API, Admin, Frontend, Database).
---
## Reason
Technical layer boundaries don't align with business ownership. When "Admin" is a module, it contains unrelated business logic across domains — defeating the purpose of domain-driven modularity.
---
## Bad Example
```php
modules/Admin/       // contains billing admin, catalog admin, user admin
modules/Api/         // contains all API endpoints regardless of domain
modules/Web/         // contains all web controllers
```
---
## Good Example
```php
modules/Billing/     // all billing concerns including admin, API, web
modules/Catalog/     // all catalog concerns including admin, API, web
modules/Inventory/   // all inventory concerns including admin, API, web
```
---
## Exceptions
Cross-cutting technical concerns (Auditing, Logging, Reporting) may be modules if they represent distinct business capabilities with their own domain logic.
---
## Consequences Of Violation
Modules don't align with business needs; team ownership boundaries unclear; changes in a business domain require touching multiple "technical" modules.

---
## Rule Name
Avoid database-driven boundaries
---
## Category
Architecture
---
## Rule
Determine module boundaries by analyzing business domains and language divergence, not by using existing database table relationships as the boundary definition.
---
## Reason
Existing database tables reflect historical design decisions, not necessarily current business domain boundaries. Using tables as boundaries preserves past architectural mistakes.
---
## Bad Example
```php
// "Our database has users, orders, and products tables — that's the modules"
// Table design from 5 years ago doesn't reflect current business structure
modules/Users/
modules/Orders/
modules/Products/
```
---
## Good Example
```php
// Business domain analysis first, then database redesign if needed
// Event storming revealed: Subscription management is its own context
// Schema is reorganized to match
modules/Billing/      // payments, invoices, subscriptions
modules/Subscription/ // plans, entitlements, feature flags
```
---
## Exceptions
When the database schema already perfectly reflects business domain boundaries (validated with domain experts, not assumed), it may serve as a starting point.
---
## Consequences Of Violation
Modules reflect legacy schema organization; database redesign becomes harder; module boundaries don't match business needs.

---
## Rule Name
Document boundary rationale in Architecture Decision Records
---
## Category
Maintainability
---
## Rule
Document every module boundary decision in an ADR including: context name, owned concepts, exposed interfaces, dependencies, and the rationale for the boundary.
---
## Reason
Future developers (including future you) need to understand why boundaries exist where they do. Without documentation, boundaries are treated as arbitrary and are eroded over time.
---
## Bad Example
```php
// No ADR — "Everyone knows why we split Billing from Orders"
// 6 months later: new developer merges them "because they share tables"
```
---
## Good Example
```php
// ADR-007: Billing and Orders Module Boundary
// Context: Billing handles money, Orders handles fulfillment
// Owned concepts: Billing owns Invoice, Payment; Orders owns Order, Shipment
// Dependencies: Orders -> Billing (via InvoiceContract)
// Rationale: Different regulatory requirements, different change frequency
```
---
## Exceptions
No common exceptions. Boundary documentation is essential for architectural longevity.
---
## Consequences Of Violation
Boundary rationale is lost; future developers introduce violations (cross-boundary JOINs, shared models); extraction becomes impossible without rediscovering the reasoning.

---
## Rule Name
Limit module count based on team size
---
## Category
Code Organization
---
## Rule
Keep module count proportional to team size: 3-5 modules for teams of 3-5 engineers, 5-8 modules for teams of 6-15 engineers, 8-12 modules for teams of 15-30 engineers.
---
## Reason
Each module adds inter-module communication overhead, test suite overhead, and cognitive overhead. Too many modules for a small team consumes development capacity on boundary maintenance.
---
## Bad Example
```php
// 3-person team, 12 modules
// Each developer "owns" 4 modules
// More time managing boundaries than building features
```
---
## Good Example
```php
// 3-person team, 4 modules
// Each developer understands all module boundaries
// When database-query-heavy module emerges, split is evaluated
```
---
## Exceptions
Well-established domains with clear bounded contexts from long-running event storming may support slightly higher module counts.
---
## Consequences Of Violation
Developers spend more time managing inter-module contracts than building features; boundary violations increase as developers seek shortcuts.

---
## Rule Name
Use event storming to discover bounded contexts collaboratively
---
## Category
Architecture
---
## Rule
Facilitate event storming workshops with domain experts and developers to discover natural bounded contexts before defining module boundaries on your own.
---
## Reason
Event storming maps business events, which reveal where concepts diverge across contexts. Developer-only boundary identification often results in technically-driven boundaries that don't match business needs.
---
## Bad Example
```php
// Developer-only decision: "Let's make modules mirror our database tables"
// No domain expert involvement
// Boundaries don't match how the business operates
```
---
## Good Example
```php
// Event storming revealed:
// "OrderPlaced" event is handled differently by Fulfillment vs Billing
// Natural boundary: Orders, Fulfillment, Billing are separate modules
// Each validated with domain experts
```
---
## Exceptions
When domain experts are unavailable or the domain is well-understood and documented, skip event storming and base boundaries on existing domain documentation.
---
## Consequences Of Violation
Modules align with technical concerns, not business domains; boundary changes are frequent and disruptive.

---
## Rule Name
Validate boundaries with change-frequency analysis
---
## Category
Maintainability
---
## Rule
Analyze change patterns across the codebase: if concepts consistently change together for the same reasons, they belong in the same module. If they change for different reasons, they should be separate.
---
## Reason
Concepts that change for different reasons should be in different modules to allow independent evolution. This is the Single Responsibility Principle applied at module granularity.
---
## Bad Example
```php
// Invoice and Payment always change together (same module — correct)
// But Subscription tier rules also in the same module, changing more frequently
// Subscription changes require Billing module redeployment
```
---
## Good Example
```php
// Change analysis shows:
// Invoice/Payment change monthly (billing operations)
// Subscription rules change weekly (product experiments)
// Result: separate Subscription module from Billing core
```
---
## Exceptions
New codebases without change history may use domain analysis as a proxy for change-frequency analysis.
---
## Consequences Of Violation
Frequently changing concepts in stable modules cause unnecessary deployment churn; independent evolution prevented.
