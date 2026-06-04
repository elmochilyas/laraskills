# ECC Behavioral Rules — Controller Organization

---

## Rule: Group by Domain for Applications with 20+ Controllers

---

## Category

Code Organization

---

## Rule

When the application exceeds 20 controllers, organize them into domain subdirectories under `app/Http/Controllers/`. Do not keep all controllers in a flat directory.

---

## Reason

Flat organization becomes unmanageable beyond 20-30 files. Domain grouping provides clear team ownership boundaries, reduces navigation time, and ensures that developers working on a domain only see relevant controller files.

---

## Bad Example

```
app/Http/Controllers/
├── UserController.php
├── PostController.php
├── OrderController.php
├── InvoiceController.php
├── PaymentController.php
├── ProductController.php
├── CategoryController.php
├── DiscountController.php
├── ShippingController.php
├── NotificationController.php
├── SubscriptionController.php
├── ReportController.php
├── ... 30+ files in one directory
```

---

## Good Example

```
app/Http/Controllers/
├── Sales/
│   ├── OrderController.php
│   ├── ProductController.php
│   └── DiscountController.php
├── Billing/
│   ├── InvoiceController.php
│   ├── PaymentController.php
│   └── SubscriptionController.php
└── Auth/
    ├── LoginController.php
    └── RegisterController.php
```

---

## Exceptions

Applications with fewer than 20 controllers should stay flat. Microservices that only serve a single domain should also stay flat.

---

## Consequences Of Violation

Maintenance risks: file navigation slows down; developer onboarding requires learning the entire controller list. Team friction: ownership boundaries are unclear; merge conflicts increase.

---

## Rule: Limit Nesting to 3 Levels Maximum

---

## Category

Code Organization

---

## Rule

Do not nest controller subdirectories deeper than 3 levels from `app/Http/Controllers/`. For example, `Controllers/Api/V1/` is acceptable; `Controllers/Api/V1/Admin/Reports/` is not.

---

## Reason

Deep nesting creates verbose namespace prefixes (`App\Http\Controllers\Api\V1\Admin\ReportsController`) that are tedious to import, read, and type. Deep paths also make CLI commands harder to construct.

---

## Bad Example

```
app/Http/Controllers/
└── Api/
    └── V1/
        └── Admin/
            └── Reports/
                ├── UserReportController.php
                └── SalesReportController.php
```

---

## Good Example

```
app/Http/Controllers/
├── Api/
│   ├── V1/
│   │   ├── UserController.php
│   │   └── PostController.php
│   └── V2/
│       ├── UserController.php
│       └── PostController.php
└── Admin/
    ├── UserReportController.php
    └── SalesReportController.php
```

---

## Exceptions

First-party package controllers that ship with deep namespaces and are consumed as vendor files are exempt. The rule applies only to application controllers under `app/`.

---

## Consequences Of Violation

Maintenance risks: import statements become unwieldy; IDE autocomplete accuracy decreases. Developer productivity: navigating deep directories slows down file access.

---

## Rule: Use Api/V{version}/ Prefix for API Controllers

---

## Category

Code Organization

---

## Rule

Place all API controllers under `app/Http/Controllers/Api/V{version}/` with an explicit version segment. Generate them using `php artisan make:controller Api/V1/UserController --api`.

---

## Reason

Version-separated directories prevent breaking API changes from affecting existing consumers. The version in the path mirrors the URI prefix, making route-to-file mapping obvious.

---

## Bad Example

```
app/Http/Controllers/
├── UserApiController.php
└── PostApiController.php
```

---

## Good Example

```
app/Http/Controllers/
├── Api/
│   ├── V1/
│   │   ├── UserController.php
│   │   └── PostController.php
│   └── V2/
│       └── UserController.php
```

---

## Exceptions

Internal or single-version APIs that have no external consumers and no plan to version may use `Controllers/Api/` without a version segment.

---

## Consequences Of Violation

Maintenance risks: breaking API changes affect all consumers simultaneously. Scalability risks: introducing a new API version requires moving and renaming files.

---

## Rule: Choose One Organization Strategy and Apply Consistently

---

## Category

Code Organization

---

## Rule

Select a single organization strategy (domain, feature, or flat) and apply it to all controllers across the application. Do not mix strategies.

---

## Reason

Mixed strategies create ambiguity: developers cannot predict where a new controller should live. One team organizes by domain, another by feature — the result is a namespace that requires browsing directories to find anything.

---

## Bad Example

```
app/Http/Controllers/
├── UserController.php          // flat — no subdirectory
├── Billing/
│   └── InvoiceController.php   // domain
├── Auth/
│   └── LoginController.php     // feature
└── Api/V1/
    └── UserController.php      // version
```

---

## Good Example

```
app/Http/Controllers/
├── Auth/
│   ├── LoginController.php
│   └── RegisterController.php
├── Sales/
│   ├── OrderController.php
│   └── ProductController.php
└── Billing/
    ├── InvoiceController.php
    └── PaymentController.php
```

---

## Exceptions

A default installation's `Controller.php` base class may remain in the root. Only application-specific controllers must follow the chosen strategy.

---

## Consequences Of Violation

Maintenance risks: every new controller requires a decision about placement, slowing development. Developer productivity: team members waste time searching for files.

---

## Rule: Do Not Create Empty Subdirectories

---

## Category

Code Organization

---

## Rule

Create a subdirectory only when its first controller file is added. Do not create directories preemptively for anticipated future controllers.

---

## Reason

Empty directories clutter the file tree, create namespace ambiguity, and represent architectural decisions made without real context. They accumulate stale, unused paths that must be cleaned up later.

---

## Bad Example

```
app/Http/Controllers/
├── Admin/          // empty — no controllers yet
├── Reports/        // empty — planned but never built
└── UserController.php
```

---

## Good Example

```
app/Http/Controllers/
├── Admin/
│   └── DashboardController.php  // created when DashboardController was written
└── UserController.php
```

---

## Exceptions

A CI/CD pipeline that creates directories for deployment artifacts is exempt. Build-generated directories outside the source tree are also exempt.

---

## Consequences Of Violation

Maintenance risks: stale empty directories accumulate over time, obscuring the actual controller count. Developer confusion: empty directories suggest missing or incomplete features.

---

## Rule: Do Not Organize Controllers by User Role

---

## Category

Code Organization

---

## Rule

Never name controller directories after user roles (e.g., `Admin/`, `Customer/`, `Manager/`). Organize by domain or feature instead.

---

## Reason

Role-based organization couples the code structure to an authentication concept that changes independently of the code. A controller that serves both admins and managers must be duplicated or placed in one role's directory, creating confusion.

---

## Bad Example

```
app/Http/Controllers/
├── Admin/
│   └── UserController.php
└── Customer/
    └── UserController.php   // duplicate UserController for different roles
```

---

## Good Example

```
app/Http/Controllers/
├── Users/
│   └── UserController.php   // single controller, handles all user operations
└── Auth/
    ├── LoginController.php
    └── RegisterController.php
```

---

## Exceptions

When the concept of "Admin" is a bounded domain (e.g., AdminPanelController for admin-specific dashboard actions that have no customer equivalent), an `Admin/` directory is acceptable.

---

## Consequences Of Violation

Maintenance risks: same logic duplicated across role directories. Scalability risks: adding a new role requires restructuring the entire controller directory.

---

## Rule: Use Artisan with Subdirectory Paths

---

## Category

Code Organization

---

## Rule

Generate controllers in subdirectories using forward-slash path notation with Artisan: `php artisan make:controller Admin/UserController`. Do not manually create files and namespaces.

---

## Reason

Artisan correctly generates the namespace and file location in one command. Manual creation risks namespace mismatch between the file path and the declared namespace, causing autoloading errors.

---

## Bad Example

Manually creating `app/Http/Controllers/Admin/UserController.php` with `namespace App\Http\Controllers;` instead of `namespace App\Http\Controllers\Admin;`.

---

## Good Example

```bash
php artisan make:controller Admin/UserController
php artisan make:controller Api/V1/UserController --api
```

---

## Exceptions

When renaming or moving an existing controller, use the IDE or manual refactoring instead of generating a new file.

---

## Consequences Of Violation

Reliability risks: PSR-4 autoloading fails on namespace mismatch. Developer productivity: debugging autoloading errors wastes time.
