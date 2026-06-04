# Directory Conventions — Rules

## Start with Default Laravel Directory Structure

Begin every new project with Laravel's default directory structure. Create additional directories only when files warrant their existence.

---

## Category

Architecture

---

## Rule

Use Laravel's default scaffold for new projects (`app/`, `config/`, `database/`, `resources/`, `routes/`, `storage/`, `tests/`). Add `app/Services/`, `app/Actions/`, `app/DTOs/` only when you have concrete files to place there, not preemptively.

---

## Reason

Premature directory creation adds empty namespaces, architectural decisions made without context, and navigation overhead without benefit. Conventions should be earned by codebase complexity, not created by anticipation.

---

## Bad Example

```
app/
  Services/       # empty
  Actions/        # empty
  DTOs/           # empty
  Repositories/   # empty
  Enums/          # empty
  Traits/         # empty
```

---

## Good Example

```
app/
  Http/Controllers/
  Models/
  Providers/
  Services/       # created when first service class is needed
```

---

## Exceptions

Applications following domain-driven or modular organization from the start may create their structure at initialization, provided bounded contexts are already defined.

---

## Consequences Of Violation

Empty directories, premature architectural decisions, navigation overhead, team confusion about where to place files.

---

## Maintain Case Consistency Between Namespace and Directory

The namespace segment and directory path must match exactly, including letter casing.

---

## Category

Reliability

---

## Rule

Every namespace component must correspond exactly to a directory segment with identical casing. `App\Models\User` must resolve to `app/Models/User.php`. Case-insensitive filesystems (macOS, Windows) cannot be relied upon for correctness testing.

---

## Reason

Case-insensitive local development filesystems hide case mismatches. Deployment to Linux (case-sensitive) produces "class not found" errors. CI must catch these mismatches before deployment.

---

## Bad Example

```php
// Namespace
namespace App\Models;

// File on disk (macOS/Windows)
app/models/User.php
// Deploys to Linux → class not found
```

---

## Good Example

```php
// Namespace
namespace App\Models;

// File on disk
app/Models/User.php
// Works on all filesystems
```

---

## Exceptions

No common exceptions. Case consistency is a hard requirement enforced by PSR-4 autoloading.

---

## Consequences Of Violation

"Class not found" errors in production, deployment failures, debugging time wasted on autoloading issues.

---

## Never Mix Organizational Strategies

Apply exactly one organizational pattern consistently across the entire application.

---

## Category

Maintainability

---

## Rule

Choose one organizational convention (technical-layer, domain-driven, modular, or hybrid) and apply it to every file. Do not have files in both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php`.

---

## Reason

Mixed strategies create ambiguity about where new files belong. Team members make different choices over time, producing a scattered structure that is difficult to navigate and maintain.

---

## Bad Example

```
app/
  Services/
    LogService.php
  Domain/
    Payment/
      Services/
        PaymentService.php
  Http/Controllers/
    PaymentController.php
    LogController.php
```

---

## Good Example

```
app/
  Domain/
    Payment/
      Services/
        PaymentService.php
      Controllers/
        PaymentController.php
    Logging/
      Services/
        LogService.php
      Controllers/
        LogController.php
```

---

## Exceptions

Shared infrastructure (middleware, exceptions, base providers) may live outside domain directories. All application logic must follow the single chosen convention.

---

## Consequences Of Violation

Structural inconsistency, files scattered by developer preference, onboarding confusion, difficulty finding code.

---

## Keep Directory Depth at Maximum 3 Levels

Limit directory nesting under `app/` to three levels. Depth beyond 3 signals over-engineering.

---

## Category

Maintainability

---

## Rule

Organize files so the maximum directory depth under `app/` does not exceed three levels (e.g., `app/Http/Controllers/Api/` is level 3). Deeper nesting creates verbose namespace prefixes and indicates excessive categorization.

---

## Reason

Deep nesting creates long namespace prefixes (`App\Http\Controllers\Api\V2\Users\`, which maps to 5 levels), makes imports harder to read, and slows IDE file tree rendering.

---

## Bad Example

```
app/Http/Controllers/Api/V2/Users/Admin/UserController.php
// Depth: 5 levels
// Namespace: App\Http\Controllers\Api\V2\Users\Admin
```

---

## Good Example

```
app/Http/Controllers/Api/V2/UserController.php
// Depth: 3 levels
// Namespace: App\Http\Controllers\Api\V2
```

---

## Exceptions

Modular organization inherently creates deeper nesting (`app/Modules/{Module}/Http/Controllers/`). In this case, 4 levels are acceptable.

---

## Consequences Of Violation

Verbose namespace prefixes, difficult-to-read imports, slower IDE navigation, perception of complexity without real benefit.

---

## Prevent Premature Top-Level Directory Creation

Add top-level directories under `app/` only when you have at least one class file to place there.

---

## Category

Code Organization

---

## Rule

Do not create empty directory structures for anticipated future needs. Create `app/Services/` when the first service class is written, `app/Actions/` when the first action class is written, and so on.

---

## Reason

Empty directories signal architectural intent without architectural substance. They invite debate about naming and placement before the codebase provides concrete context for those decisions.

---

## Bad Example

```bash
mkdir -p app/Services
mkdir -p app/Actions
mkdir -p app/Repositories
mkdir -p app/Enums
# All empty — no code yet
```

---

## Good Example

```bash
# First service class created
mkdir -p app/Services
# File: app/Services/PaymentService.php
```

---

## Exceptions

Projects following domain-driven or modular patterns may create the entire directory tree at initialization time, as the pattern requires it.

---

## Consequences Of Violation

Empty directories, speculation-driven architecture, team disagreement about directory purpose, eventual dead directories with unused namespace declarations.

---

## Do Not Organize by Developer Role

Never organize directories by who writes the code (admin, frontend, backend) rather than by what the code does.

---

## Category

Design

---

## Rule

Organize code by technical role or business domain, not by developer specialization. Directories named `Admin/`, `Frontend/`, or `Backend/` as top-level organizational units are not acceptable.

---

## Reason

Role-based organization creates arbitrary boundaries that don't map to business domains. It assumes a fixed team structure, makes code reuse harder, and becomes meaningless when team roles change.

---

## Bad Example

```
app/
  Admin/
    UserController.php
    OrderController.php
  Frontend/
    UserController.php
    OrderController.php
```

---

## Good Example

```
app/
  Http/Controllers/
    UserController.php
    Admin/
      UserController.php
  Domain/
    Users/
      Controllers/
        UserController.php
```

---

## Exceptions

Route prefixes for admin panels (`admin/users`) are acceptable. File organization should follow technical-layer or domain-driven patterns, not URL prefixes.

---

## Consequences Of Violation

Arbitrary team-structure-driven organization, code duplication across role directories, difficulty finding related files.
