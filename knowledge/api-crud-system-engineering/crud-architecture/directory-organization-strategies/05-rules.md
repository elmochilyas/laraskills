# Directory Organization Strategies — Rules

## Rule 1: Choose One Primary Strategy and Apply Consistently
---
## Category
Code Organization
---
## Rule
Never mix domain-first and layer-first organization within the same codebase; choose one primary strategy and apply it to all new files.
---
## Reason
Mixed strategies make it impossible to predict where a file lives — developers waste time searching both `app/Http/Controllers/` and `app/Domain/*/Controllers/`. Consistency trumps any individual strategy's advantages.
---
## Bad Example
```
app/
  Http/Controllers/
    UserController.php
  Domain/
    Orders/
      Controllers/
        OrderController.php
```
---
## Good Example
```
app/
  Http/Controllers/
    UserController.php
    OrderController.php
```
---
## Exceptions
A mixed strategy (domain-first for core domains, layer-first for shared infrastructure) is acceptable if explicitly chosen and documented, but the exception boundaries must be clear to all developers.
---
## Consequences Of Violation
Developer confusion, duplicated files, autoloading errors, onboarding nightmare.
</rule>

## Rule 2: Always Match Namespace to Directory Path
---
## Category
Code Organization
---
## Rule
Never place a class in a directory that doesn't match its namespace; the namespace must exactly mirror the directory path.
---
## Reason
PSR-4 autoloading maps namespaces to directories. Mismatches cause runtime "class not found" errors that are difficult to debug and break IDE navigation.
---
## Bad Example
```php
// File: app/Domain/Users/UserController.php
namespace App\Http\Controllers; // ❌ Namespace doesn't match directory
```
---
## Good Example
```php
// File: app/Domain/Users/Controllers/UserController.php
namespace App\Domain\Users\Controllers;
```
---
## Exceptions
No common exceptions. Namespace-directory matching is a hard requirement of PSR-4.
---
## Consequences Of Violation
Autoloading errors, IDE cannot navigate to class, composer dump-autoload required after every file move.
</rule>

## Rule 3: Start Layer-First by Default; Graduate to Domain-First When Justified
---
## Category
Code Organization
---
## Rule
Use Laravel's default layer-first structure for all new projects; only migrate to domain-first when the application has 20+ domains or the team has 5+ developers.
---
## Reason
Layer-first is simpler, matches Laravel conventions, and works well for small-medium codebases. Premature domain-first creates empty domain directories and adds complexity without value.
---
## Bad Example
```php
// 10-model application with domain-first — mostly empty directories
app/Domain/Countries/  // Just 1 model
app/Domain/Categories/ // Just 1 model
app/Domain/Tags/       // Just 1 model
```
---
## Good Example
```php
// Same 10-model application with layer-first
app/Models/Country.php
app/Models/Category.php
app/Models/Tag.php
```
---
## Exceptions
Startups that know the application will grow to 50+ domains within 6 months may start domain-first, but must acknowledge the initial complexity cost.
---
## Consequences Of Violation
Empty domain directories, developers question the directory strategy, wasted navigation time.
</rule>

## Rule 4: Configure PSR-4 Prefix Mapping for Domain-First Structures
---
## Category
Framework Usage
---
## Rule
When using domain-first organization, always register PSR-4 prefix mappings in `composer.json` for each domain namespace.
---
## Reason
Without PSR-4 prefix mapping, domain namespaces fall back to inefficient scanning or fail to autoload. Explicit mapping tells Composer exactly where to find each namespace.
---
## Bad Example
```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/" // ❌ Domain subdirectories not mapped
        }
    }
}
```
---
## Good Example
```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "App\\Domain\\Users\\": "app/Domain/Users/",
            "App\\Domain\\Orders\\": "app/Domain/Orders/"
        }
    }
}
```
---
## Exceptions
Laravel apps using only layer-first organization do not need additional PSR-4 mapping beyond the default `App\\` mapping.
---
## Consequences Of Violation
Class not found errors in production, developers must manually dump autoload, CI pipeline fails intermittently.
</rule>

## Rule 5: Extract Shared Types to a Common Directory
---
## Category
Code Organization
---
## Rule
Never create circular dependencies between domains; extract shared types (base DTOs, interfaces, value objects) to a `Shared/` directory.
---
## Reason
Domain A importing from Domain B creates tight coupling between the two domains. Shared types in an common directory break the cycle and enforce proper domain boundaries.
---
## Bad Example
```php
// app/Domain/Orders/DTOs/CustomerInfo.php depends on app/Domain/Users/Models/User.php
// ❌ Circular: Orders → Users → (maybe) Orders
```
---
## Good Example
```php
// app/Shared/DTOs/CustomerInfo.php — shared type used by both domains
// app/Domain/Orders/ — imports from Shared, not from Users domain
// app/Domain/Users/ — imports from Shared, not from Orders domain
```
---
## Exceptions
Domains that are intentionally coupled (e.g., Billing and Payments) may import from each other, but this must be an explicit architectural decision documented in ADRs.
---
## Consequences Of Violation
Circular domain dependencies, fragile import chains, refactoring one domain breaks others, domain boundaries are meaningless.
</rule>

## Rule 6: Never Couple Directory Structure to URL Structure
---
## Category
Code Organization
---
## Rule
Never organize directories to mirror URL paths or API versioning (`/api/v1/users/` → `app/Api/V1/Users/`).
---
## Reason
URL structure changes (versioning, renaming) require directory restructuring. Code organization should reflect domain architecture, not HTTP routing.
---
## Bad Example
```
app/
  Api/
    V1/
      UsersController.php
    V2/
      UsersController.php
```
---
## Good Example
```
app/
  Http/Controllers/
    Api/
      V1/UserController.php
      V2/UserController.php
```
---
## Exceptions
No common exceptions. Routing is an HTTP concern and should not dictate code organization.
---
## Consequences Of Violation
Restructuring directories when API versions change, coupling code navigation to URL semantics, harder to extract domains into separate packages.
</rule>
