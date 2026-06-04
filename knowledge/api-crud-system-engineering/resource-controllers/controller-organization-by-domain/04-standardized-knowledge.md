| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Organization by Domain |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Resource Controller Pattern |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

As applications grow beyond a handful of resources, flat controller directories become unwieldy. Domain-organized controllers group controllers by bounded context — `Controllers/Billing/`, `Controllers/Inventory/`, `Controllers/Users/` — mirroring the domain model structure. Each directory contains controllers that serve a specific domain, along with domain-specific form requests, resources, and sometimes dedicated middleware.

## Core Concepts

- **Bounded Context Grouping**: Controllers organized by domain boundary, not technical role.
- **PSR-4 Autoloading**: `App\Http\Controllers\Billing\*` maps to `app/Http/Controllers/Billing/` automatically.
- **Domain-Specific Route Files**: Each domain gets its own route file or route group.
- **Team Ownership Boundaries**: Each domain directory can be owned by a different team.
- **Scalable Namespacing**: Deep namespacing is acceptable (`Controllers\Billing\Subscriptions\PlanController`).

## When To Use

- Applications with 20+ controllers across multiple business domains.
- Teams organized by domain (Billing team, Inventory team, etc.).
- Projects where future extraction to microservices is anticipated.
- Any project where the flat controllers/ directory has become hard to navigate.

## When NOT To Use

- Small applications with fewer than 10 controllers — flat is simpler.
- Projects with a single domain — unnecessary abstraction.
- Prototypes or early-stage projects — add domain organization when the structure warrants it.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Group by bounded context, not technical layer | Aligns with DDD principles and team ownership |
| Use `php artisan make:controller Billing/InvoiceController` | Generates controllers in the correct subdirectory |
| Create domain-specific route files | Prevents a single api.php from becoming a bottleneck |
| Enforce cross-domain dependency rules with PHPStan/Deptrac | Prevents tight coupling between domains |
| Domain directories are singular (`Billing`, `User`) | Consistent naming prevents `Billing` vs `Billings` confusion |

## Architecture Guidelines

- Each domain directory should contain its own `Requests/` subdirectory for form requests.
- Route groups use both `prefix` and `namespace` to point to the domain directory.
- Define a `Shared/` or `Common/` directory for cross-domain code.
- Add a PHPStan or Deptrac rule: `Billing/` controllers cannot import from `Inventory/`.
- Only introduce domain directories when there are 20+ controllers.

## Performance Considerations

- No performance impact from directory organization — PSR-4 autoloads by class name.
- Opcode cache stores all classes regardless of directory depth.
- Route caching compiles all route files into a single cache regardless of organization.

## Security Considerations

- Cross-domain import restrictions prevent accidental coupling but not security issues directly.
- Ensure domain-specific middleware (e.g., `billing.verified`) is consistently applied within each domain.
- Authorization policies should be organized alongside their domain controllers.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Flat directory with domain prefixes | Avoiding subdirectories | Long class names (BillingInvoiceController), flat bloat | Use subdirectories and PSR-4 |
| Too granular domain directories | Confusing single controllers with domains | Many directories with 1-2 controllers | Group by bounded context, not single actions |
| Cross-domain dependency | Shared logic pulled across boundaries | Tight coupling between domains | Extract to Shared/ or use domain events |

## Anti-Patterns

- **Domain prefixes in filenames instead of subdirectories**: `BillingInvoiceController` instead of `Billing/InvoiceController`.
- **1-controller-per-directory**: Each directory should have multiple related controllers.
- **No cross-domain enforcement**: Without tooling, domain boundaries are easily violated.
- **Mixing domain and version at the same directory level**: Use `Controllers/Api/V1/Billing/` if both patterns are needed.

## Examples

- **Directory structure**: `Controllers/Billing/{InvoiceController, PaymentController, Requests/StoreInvoiceRequest.php}`
- **Route registration**: `Route::prefix('billing')->namespace('Billing')->group(base_path('routes/billing.php'))`
- **Controller generation**: `php artisan make:controller Billing/InvoiceController --api --resource`
- **Domain-specific middleware**: `class BillingController extends Controller { public function __construct() { $this->middleware('billing.verified'); } }`

## Related Topics

- Controller Organization by Version — Alternative organization strategy
- Controller Code Limits — Pairing limits with domain organization
- Thin Controller Enforcement — Automated rules per domain

## AI Agent Notes

- Start flat and introduce domain organization when the directory reaches ~20 controllers.
- Generate controllers with the full namespace path to ensure correct placement.
- Use route file splitting per domain for independent testing.
- Add Deptrac configuration to enforce domain boundaries from the start.

## Verification

- [ ] Controllers are organized by domain (Billing, Inventory, etc.), not flat
- [ ] Each domain has its own route file or route group
- [ ] Cross-domain imports are restricted via PHPStan or Deptrac
- [ ] Form requests are co-located in domain-specific `Requests/` directories
- [ ] `php artisan make:controller DomainName/ControllerName` generates in the correct location
- [ ] Domain organization has a documented naming convention
