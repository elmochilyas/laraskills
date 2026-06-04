# Phase 5: Rules — Directory Structure

## Rule: Start Flat, Split by Domain When Navigation Suffers
---
## Category
Code Organization
---
## Rule
Keep all models in the flat `app/Models/` directory for projects with fewer than 20 models and split into domain subdirectories only when navigation in the flat structure becomes difficult.
---
## Reason
Premature domain structuring adds organizational overhead without benefit. A flat directory is simplest to search, refactor, and navigate for small-to-medium applications. Domain splitting is a response to pain, not a proactive default.
---
## Bad Example
```php
// 12 models in a small project, each in its own domain directory:
app/Models/Billing/Invoice.php
app/Models/Billing/Payment.php
app/Models/Support/Ticket.php
app/Models/Support/TicketReply.php
app/Models/Catalog/Product.php
app/Models/Catalog/Category.php
```
---
## Good Example
```php
// Same 12 models, flat structure — simple and navigable:
app/Models/Invoice.php
app/Models/Payment.php
app/Models/Ticket.php
app/Models/TicketReply.php
app/Models/Product.php
app/Models/Category.php
```
---
## Exceptions
A project with clear bounded contexts from day one (e.g., a modular monolith with separate domain teams) may start with domain directories.
---
## Consequences Of Violation
Unnecessary ceremony increases cognitive load; developers spend time deciding which directory to place a model in rather than modeling the domain.
---

## Rule: Match Namespace Exactly to Directory Structure
---
## Category
Reliability
---
## Rule
Always ensure that the namespace of a model file exactly matches its directory path relative to the `app/` root.
---
## Reason
PSR-4 autoloading maps namespace segments to directory segments. A mismatch causes a runtime `ClassNotFoundException` or, worse, loads a stale class from a cached autoloader.
---
## Bad Example
```php
// File: app/Models/Billing/Invoice.php
namespace App\Models; // Wrong — should be App\Models\Billing
```
---
## Good Example
```php
// File: app/Models/Billing/Invoice.php
namespace App\Models\Billing;
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Autoloading errors in production; silent autoloader fallback behavior may load an incorrect class definition.
---

## Rule: Apply One Organizational Pattern Consistently
---
## Category
Maintainability
---
## Rule
Choose exactly one organizational pattern (flat, domain-subdirectory, or module-based) and apply it to every model in the application without mixing approaches.
---
## Reason
Consistency creates a predictable mental model. Mixed patterns force developers to check both the directory convention and individual model namespaces, increasing cognitive load and introducing lookup errors.
---
## Bad Example
```php
// Flat + domain subdirectories mixed:
app/Models/User.php
app/Models/Billing/Invoice.php
app/Models/Payment.php        // Should be in Billing/ or flat root
app/Models/Support/Ticket.php
app/Models/TicketCategory.php // Should be in Support/ or flat root
```
---
## Good Example
```php
// All domain-subdirectory (consistent):
app/Models/User.php
app/Models/Billing/Invoice.php
app/Models/Billing/Payment.php
app/Models/Support/Ticket.php
app/Models/Support/TicketCategory.php
```
---
## Exceptions
A single domain may start subdirectory organization while the rest of the app remains flat, but this should be a transitional state with a clear migration plan.
---
## Consequences Of Violation
Inconsistent navigation; some models are assumed in the wrong namespace; imports break; confidence in the project's organization erodes over time.
---

## Rule: Use Module-Based Structure Only for Bounded Contexts
---
## Category
Scalability
---
## Rule
Use module-based directory structure (`app/Modules/{Module}/Models/`) only when the application has clearly defined bounded contexts with independent data ownership and team boundaries.
---
## Reason
Module-based structure isolates models by bounded context, enabling independent deployment, testing, and team ownership. Applying it before bounded contexts are established adds unnecessary indirection without benefit.
---
## Bad Example
```php
// Small app with no team boundaries:
app/Modules/Sales/Models/Order.php
app/Modules/Support/Models/Ticket.php
app/Modules/Billing/Models/Invoice.php
// No actual bounded context isolation — just extra nesting
```
---
## Good Example
```php
// Bounded context established — each module has its own models, policies, controllers:
app/Modules/Billing/Models/Invoice.php
app/Modules/Billing/Models/Payment.php
app/Modules/Billing/Policies/InvoicePolicy.php
app/Modules/Billing/Http/Controllers/InvoiceController.php
```
---
## Exceptions
Organizational mandate to use modules regardless of app size (common in enterprise standardization).
---
## Consequences Of Violation
Premature modularization adds directory depth without isolation value; cross-module coupling still occurs, negating the benefit while incurring the navigation cost.
---

## Rule: Place Enum and DTO Classes Outside the Models Directory
---
## Category
Code Organization
---
## Rule
Store enumerations, Data Transfer Objects, and value objects in `app/Enums/`, `app/DTOs/`, or `app/ValueObjects/` directories rather than inside the `app/Models/` directory.
---
## Reason
The `Models` directory should contain only classes that extend `Illuminate\Database\Eloquent\Model`. Mixing enums, DTOs, and value objects alongside models dilutes the directory's purpose and makes navigation ambiguous.
---
## Bad Example
```php
app/Models/Order.php
app/Models/OrderStatus.php       // Enum
app/Models/OrderData.php         // DTO
app/Models/Address.php
app/Models/Money.php             // Value Object
```
---
## Good Example
```php
app/Enums/OrderStatus.php
app/DTOs/OrderData.php
app/ValueObjects/Money.php
app/Models/Order.php
app/Models/Address.php
```
---
## Exceptions
Laravel's built-in `App\Models\User` is justified because `User` extends `Model` and uses the default namespace.
---
## Consequences Of Violation
Diluted directory purpose; developers cannot distinguish between persistable entities and non-entity value types at a glance.
---

## Rule: Keep Base Model and Traits Outside Domain Subdirectories
---
## Category
Code Organization
---
## Rule
Place the project base model class and shared model traits directly in `app/Models/` (or `app/Models/Concerns/` for traits) rather than inside any domain subdirectory.
---
## Reason
Shared base classes and traits are cross-domain artifacts. Placing them inside a domain subdirectory implies ownership by that domain and creates awkward imports for models in other domains.
---
## Bad Example
```php
app/Models/Billing/BaseModel.php       // Base model only in Billing
app/Models/Billing/Concerns/HasAudit.php
app/Models/Support/Ticket.php          // Must import from Billing
```
---
## Good Example
```php
app/Models/BaseModel.php               // Cross-domain base class
app/Models/User.php
app/Models/Billing/Invoice.php
app/Models/Support/Ticket.php
```
---
## Exceptions
A trait or base class used exclusively within a single domain may reside in that domain's subdirectory.
---
## Consequences Of Violation
Cross-domain imports create awkward dependencies; domain directories lose their bounded-context purity when they contain shared infrastructure.
