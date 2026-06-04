# Rules: COS-04 — Namespace Conventions

## R01: Always Declare a Namespace Matching the Directory Path
---
## Category
Framework Usage
---
## Rule
Every PHP class file must have a `namespace` declaration that exactly matches its directory path relative to the PSR-4 root.
---
## Reason
PSR-4 autoloading depends on the directory-to-namespace mapping. A mismatch means the file cannot be autoloaded. Missing namespace declarations place classes in the global namespace, causing collisions.
---
## Bad Example
```php
// File: app/Services/Payment/StripeService.php
// Missing namespace — class is in global namespace
class StripeService { }
```
---
## Good Example
```php
// File: app/Services/Payment/StripeService.php
namespace App\Services\Payment;

class StripeService { }
```
---
## Exceptions
Legacy files without namespaces during a migration (temporary, with documented timeline).
---
## Consequences Of Violation
Class not found errors. Global namespace pollution. Import failures in all consuming code.
---

## R02: Use PascalCase for All Namespace Segments
---
## Category
Code Organization
---
## Rule
Use PascalCase (uppercase first letter) for every namespace segment, mirroring class naming convention.
---
## Reason
Mixed-case or lowercase namespace segments (`app/Http/controllers/`, `app/models/`) break PSR-4 on case-sensitive filesystems and look inconsistent with PascalCase class names. Tooling and IDE navigation expect consistent casing.
---
## Bad Example
```php
// File: app/http/controllers/api/UserController.php
namespace App\http\controllers\api;
// Mixed case — works on Windows, fails on Linux
```
---
## Good Example
```php
// File: app/Http/Controllers/Api/UserController.php
namespace App\Http\Controllers\Api;
// Consistent PascalCase everywhere
```
---
## Exceptions
Third-party packages with their own naming conventions — do not modify vendor code.
---
## Consequences Of Violation
Production-only class not found errors. Inconsistent codebase appearance.
---

## R03: Never Use Namespace Aliasing for Application Classes
---
## Category
Maintainability
---
## Rule
Avoid `use ... as` aliasing for classes within the same application codebase.
---
## Reason
Aliasing (`use App\Models\User as AppUser`) indicates poor class naming or namespace structure — two classes with the same unqualified name suggests a naming collision that should be resolved by restructuring, not aliasing.
---
## Bad Example
```php
use App\Models\User as AppUser;
use App\Domains\Identity\Models\User as IdentityUser;
// Should never need to alias two application classes
```
---
## Good Example
```php
// Differentiate by namespace directly or rename classes
use App\Domains\Identity\Models\IdentityUser;
use App\Domains\Billing\Models\BillingUser;
```
---
## Exceptions
Disambiguating vendor packages that happen to share class names (rare).
---
## Consequences Of Violation
Inconsistent imports. Masked naming problems that should be fixed at the source.
---

## R04: Keep Sub-Namespace Depth at 5-6 Levels Maximum
---
## Category
Maintainability
---
## Rule
Limit namespace depth to a maximum of 5-6 segments from the root namespace.
---
## Reason
Deep namespaces produce long FQCNs that reduce readability, cause line-wrapping in imports, and approach Windows MAX_PATH limits. `App\Domains\Billing\Subscriptions\Plans\Http\Controllers\Admin` is unmanageable.
---
## Bad Example
```php
namespace App\Domains\Billing\Subscriptions\Plans\Http\Controllers\Admin;
// 8 segments — FQCN wraps in most editors
```
---
## Good Example
```php
namespace App\Domains\Billing\Http\Controllers\Admin;
// 5 segments — readable and navigable
```
---
## Exceptions
Generated files (migrations, compiled views) that follow framework conventions regardless of depth.
---
## Consequences Of Violation
Illegible import blocks. IDE line-wrapping. Potential Windows path length issues.
---

## R05: Keep Root Namespace as `App\` Unless Absolutely Necessary
---
## Category
Code Organization
---
## Rule
Use `App\` as the root application namespace. Do not change it without strong justification.
---
## Reason
All Laravel tooling, generators, documentation, and community packages assume `App\` as the root namespace. Changing it (`Company\Project\`) requires updating every generated file, overriding stubs, and documenting the deviation.
---
## Bad Example
```json
// composer.json
{
  "autoload": {
    "psr-4": {
      "AcmeCorp\\SuperPlatform\\": "app/"
    }
  }
}
// All generated files: namespace AcmeCorp\SuperPlatform\Models\User;
// Every artisan make: command produces wrong namespace
```
---
## Good Example
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/"
    }
  }
}
// Generated files work without customization
```
---
## Exceptions
Multi-tenant platforms, white-label products, or packages distributed to third parties.
---
## Consequences Of Violation
Every `artisan make:` command produces files with wrong namespaces. Stub overrides needed. All documentation references must use custom root.
---

## R06: Update Both File Path and Namespace When Refactoring
---
## Category
Maintainability
---
## Rule
When moving a class, always update its `namespace` declaration to match the new directory path.
---
## Reason
A class moved from `app/Services/` to `app/Domains/Billing/Services/` without updating `namespace App\Services` to `namespace App\Domains\Billing\Services` causes autoload failures that are difficult to debug.
---
## Bad Example
```php
// File physically moved to: app/Domains/Billing/Services/InvoiceService.php
// Namespace NOT updated — still says:
namespace App\Services;
// Autoloader resolves App\Services\InvoiceService → app/Services/InvoiceService.php
// File not found at old location — ClassNotFoundException
```
---
## Good Example
```php
// File moved to: app/Domains/Billing/Services/InvoiceService.php
// Namespace updated:
namespace App\Domains\Billing\Services;
```
---
## Exceptions
Use IDE refactoring tools that update both path and namespace automatically.
---
## Consequences Of Violation
Immediate class not found errors. Emergency debugging to trace namespace misalignment.
---

## R07: Never Create Directories Inside `app/` Without PHP Files
---
## Category
Code Organization
---
## Rule
Every directory under `app/` that contains PHP files should correspond to a namespace segment. Do not create non-PHP directories mixed with PHP directories.
---
## Reason
Non-PHP directories (e.g., `app/Assets/`, `app/Templates/`) inside the autoloaded `app/` tree create confusion about what constitutes the namespace. Assets, templates, and config belong in `resources/` or `config/`.
---
## Bad Example
```php
app/
├── Http/Controllers/     # PHP
├── Models/                # PHP
├── Assets/                # Non-PHP — why is this here?
└── Templates/             # Non-PHP — confusing with resources/views/
```
---
## Good Example
```php
app/
├── Http/Controllers/     # PHP
├── Models/                # PHP
resources/
├── assets/                # Frontend assets
└── views/                 # Blade templates
```
---
## Exceptions
Directories containing PHP and non-PHP files related to the same concern (e.g., a domain with markdown documentation).
---
## Consequences Of Violation
Confusion about namespace boundaries. Files placed in wrong locations. Autoload performance impact from scanning non-PHP directories.
---

## R08: Ensure Custom Namespace Prefixes Do Not Conflict with Vendor Packages
---
## Category
Reliability
---
## Rule
Verify that custom PSR-4 namespace prefixes do not match any third-party vendor prefix before adding them.
---
## Reason
A namespace collision between your `Modules\` and a package using `Modules\` causes unpredictable class resolution — Composer may resolve to either source depending on loading order.
---
## Bad Example
```json
// Sample package uses "Modules\\": "vendor/sample/modules/"
// Your app also uses "Modules\\": "modules/"
// Class Modules\PaymentGateway resolves to either file unpredictably
```
---
## Good Example
```json
// Use a unique prefix that won't collide:
"App\\Modules\\": "modules/"
// Or: "Domains\\": "app/Domains/"
```
---
## Exceptions
No common exceptions — namespace collisions in PHP cause silent, hard-to-debug issues.
---
## Consequences Of Violation
Intermittent class resolution failures. Impossible-to-diagnose behavior differences between environments.
