# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module dependency management and versioning
Knowledge Unit ID: MMD-09
Difficulty Level: Advanced
Last Updated: 2026-06-02

---
## Rule Name
Declare all module dependencies explicitly in module.json
---
## Category
Architecture
---
## Rule
Every module must declare its dependencies in a `module.json` file listing which other modules it depends on. Undeclared dependencies are coupling that exists but is undocumented and unenforced.
---
## Reason
Explicit dependency declarations create a visible, analyzable dependency graph. Without them, dependencies are invisible — developers add cross-module imports without recognizing the coupling they create.
---
## Bad Example
```php
// No module.json — dependencies are invisible
// InventoryService imports from Catalog, Billing, Orders
// No one knows Inventory depends on 3 other modules
```
---
## Good Example
```php
// Modules/Inventory/module.json
{
    "name": "inventory",
    "version": "1.0.0",
    "dependencies": {
        "catalog": "^1.0",
        "billing": "^1.0",
        "orders": "^2.0"
    },
    "priority": 30
}
```
---
## Exceptions
Systems with fewer than 3 modules may not justify the module.json overhead.
---
## Consequences Of Violation
Undocumented coupling grows silently; dependency graph is inaccurate; extraction discovery requires reading all source code.

---
## Rule Name
Enforce acyclic dependency graph — block circular dependencies
---
## Category
Architecture
---
## Rule
The module dependency graph must always be a directed acyclic graph (DAG). Block any PR that introduces a circular dependency between modules.
---
## Reason
Circular dependencies are the primary symptom of architectural degradation. They prevent module extraction, testing in isolation, and independent evolution. A cycle means neither module can be understood without the other.
---
## Bad Example
```php
// Circular dependency
// Billing -> Orders -> Inventory -> Billing
Modules\Billing calls Modules\Orders
Modules\Orders calls Modules\Inventory
Modules\Inventory calls Modules\Billing
// Cannot extract any of the three independently
```
---
## Good Example
```php
// Acyclic graph
Shared -> Billing -> Orders -> Inventory
// Each module depends only on more stable modules
// Shared has no dependencies
// Each module can be extracted independently
```
---
## Exceptions
No common exceptions. Circular dependencies are always a design problem. Resolve by extracting shared contracts or using events to invert the dependency direction.
---
## Consequences Of Violation
Modules cannot be extracted; testing requires all modules; architectural degradation accelerates.

---
## Rule Name
Keep dependencies per module under 5
---
## Category
Maintainability
---
## Rule
Limit each module to a maximum of 5 direct dependencies on other modules. Treat a module with 5+ dependencies as a candidate for splitting or redesign.
---
## Reason
A module depending on 5+ other modules is a god module or a general-purpose module that is too coupled to the rest of the system. High dependency count correlates with low module cohesion and high change impact.
---
## Bad Example
```php
// Module with 8 dependencies — god module
// ReportingModule depends on:
// Billing, Catalog, Orders, Inventory, Users, Marketing, Analytics, Support
// Cannot change any of those without testing Reporting
```
---
## Good Example
```php
// Each module has focused dependencies
Billing: [Shared, Orders]    // 2 dependencies
Catalog: [Shared]            // 1 dependency
Orders: [Shared, Catalog]    // 2 dependencies
Inventory: [Shared, Catalog] // 2 dependencies
```
---
## Exceptions
Shared kernel or infrastructure modules (notification, audit) that genuinely serve many modules may exceed 5 dependents (incoming dependencies), but their own outgoing dependencies must remain under 5.
---
## Consequences Of Violation
Changes to any dependency require testing the high-dependency module; module is hard to extract; high change impact radius.

---
## Rule Name
Use events to break dependency cycles
---
## Category
Architecture
---
## Rule
When Module A needs to communicate with Module B but a direct dependency would create a cycle, use domain events. Events invert the dependency direction because the publisher has no import dependency on the subscriber.
---
## Reason
Events are the primary tool for breaking dependency cycles. Module A dispatches an event (no import needed). Module B listens (depends on Module A's event). The arrow goes one direction: B → A's event.
---
## Bad Example
```php
// Direct dependency creates cycle risk
// Module A calls Module B
// Module B calls Module A
// Impossible with contracts — circular
```
---
## Good Example
```php
// Use events to break the cycle
// Module A dispatches OrderPlaced event
// Module B listens to OrderPlaced event
// Dependency: B depends on A's event class (A has no dependency on B)
// Graph is acyclic
```
---
## Exceptions
When the communication requires a synchronous response (validation, real-time data), events cannot replace contracts. Extract shared contracts into a third module instead.
---
## Consequences Of Violation
Cycles remain in the dependency graph; modules cannot be extracted; architectural degradation continues.

---
## Rule Name
Run dependency checks in CI
---
## Category
Reliability
---
## Rule
Make dependency graph validation a required CI check. Block PRs that introduce undeclared dependencies, circular dependencies, or exceed the dependency limit per module.
---
## Reason
Without automated enforcement, dependencies silently degrade over time. What gets measured and enforced gets maintained. What doesn't, degrades.
---
## Bad Example
```php
// No CI dependency check
// Developer adds direct import from another module
// No one notices — dependency count grows silently
// 6 months later: impossible extraction
```
---
## Good Example
```php
// CI pipeline step: Validate dependencies
// 1. Parse all module.json files
// 2. Scan imports for cross-module references
// 3. Verify declared dependencies match actual imports
// 4. Check for cycles
// 5. Enforce dependency limit (max 5)
// 6. Fail if any violation found
```
---
## Exceptions
No common exceptions. CI enforcement is required for architectural integrity.
---
## Consequences Of Violation
Dependencies grow silently; codebase becomes a big ball of mud; extraction becomes rewrite.

---
## Rule Name
Visualize the dependency graph regularly
---
## Category
Maintainability
---
## Rule
Generate a visual representation of the module dependency graph (Mermaid, DOT) regularly — include in CI artifacts or documentation. Review the graph as part of architectural reviews.
---
## Reason
A visual dependency graph makes coupling obvious in a way that code review doesn't. Teams can spot problematic patterns (dense clusters, god modules) at a glance.
---
## Bad Example
```php
// No visualization — "the dependency graph is in our heads"
// New developer: "Which modules depend on Billing?"
// Answer: "I think these three? Maybe four?"
```
---
## Good Example
```php
// CI generates Mermaid diagram from module.json
// ```mermaid
// graph TD
//   Shared --> Catalog
//   Shared --> Billing
//   Catalog --> Orders
//   Billing --> Orders
//   Inventory --> Catalog
// ```
// Reviewed monthly in architecture sync
```
---
## Exceptions
No common exceptions. Visualization is low-cost and high-value for architectural awareness.
---
## Consequences Of Violation
Dependency trends are invisible; coupling problems are noticed only when they become critical; architectural discussions lack data.

---
## Rule Name
Depend on things more stable than yourself
---
## Category
Architecture
---
## Rule
Module dependencies should always point toward more stable modules. Less stable modules (changing frequently) depend on more stable modules (changing rarely). The shared kernel is the most stable; leaf modules are the least stable.
---
## Reason
Stable Dependencies Principle prevents fragile modules from being depended upon by many other modules. If a frequently-changing module has many dependents, every change breaks many modules.
---
## Bad Example
```php
// Less stable module is depended on by many
// ReportingModule changes weekly (less stable)
// Orders, Billing, Catalog all depend on ReportingModule
// Every ReportingModule change breaks 3 modules
```
---
## Good Example
```php
// Dependencies point toward stability
// Shared (most stable) <- Catalog <- Orders <- Billing <- Reporting (least stable)
// Reporting depends on everything — but nothing depends on Reporting
// Changes to Reporting never break other modules
```
---
## Exceptions
Modules designed as shared infrastructure (notification, audit, logging) may be stable despite having many dependents — they are the stable foundation.
---
## Consequences Of Violation
Frequent changes in leaf modules break many dependents; high change coordination cost; developers avoid changing frequently-changed modules due to breakage risk.
