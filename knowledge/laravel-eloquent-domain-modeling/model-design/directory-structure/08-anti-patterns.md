# Directory Structure — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Directory Structure |
| Focus | Anti-patterns in model file organization, namespacing, and structure |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Premature Domain Subdirectories | Code Organization | Medium |
| 2 | Namespace-Directory Mismatch | Reliability | Critical |
| 3 | Mixed Flat and Domain Structure | Maintainability | High |
| 4 | Module Structure Without Bounded Contexts | Code Organization | Medium |
| 5 | Enums, DTOs, and VOs Inside Models Directory | Code Organization | Medium |
| 6 | Base Model/Traits Inside Domain Subdirectories | Code Organization | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is a namespace-directory mismatch that breaks PSR-4 autoloading, causing `ClassNotFoundException` or stale class loading
- Premature domain splitting adds organizational overhead without benefit for small applications — start flat, split when navigation suffers
- Mixed organizational patterns (some flat, some subdirectory) create confusion and lookup errors

---

## 1. Premature Domain Subdirectories

### Category
Code Organization

### Description
Creating domain-based subdirectories under `app/Models/` when the application has fewer than 20 models, adding unnecessary organizational overhead without demonstrated navigation benefits.

### Why It Happens
Domain-driven design concepts encourage organizing by business domain. Developers apply domain subdirectories proactively, even when a flat directory is more navigable for the current application size.

### Warning Signs
- 10-15 models each in their own single-file domain directory
- More time spent deciding which directory to place a model in than modeling the domain
- Navigation is no easier than a flat alphabetically sorted list
- Comments like "this model could go in two domains" indicating unclear boundaries

### Why Harmful
- Cognitive load increases — developers must remember which domain each model belongs to
- Cross-domain models (e.g., a `Subscription` that spans Billing and Users) create directory ambiguity
- Refactoring directory structure later requires updating namespaces and all import references

### Preferred Alternative
```php
// Flat structure for <20 models:
app/Models/Invoice.php
app/Models/Payment.php
app/Models/Product.php
app/Models/Subscription.php
app/Models/Ticket.php
app/Models/User.php
```

### Detection Checklist
- [ ] Count total models — is it under 20?
- [ ] Check if domain subdirectories actually improve navigation
- [ ] Flatten if subdirectories add more overhead than benefit

### Related
| Rule | `05-rules.md` — Start Flat, Split by Domain When Navigation Suffers |
| Decision Tree | `07-decision-trees.md` — Flat vs Domain-Based Directory Structure |

---

## 2. Namespace-Directory Mismatch

### Category
Reliability

### Description
Declaring a namespace on a model file that does not match its directory path relative to the `app/` root, breaking PSR-4 autoloading.

### Why It Happens
Developers copy-paste model files from one location to another without updating the namespace, or they create subdirectories without updating the namespace declaration.

### Warning Signs
- File at `app/Models/Billing/Invoice.php` has `namespace App\Models` instead of `namespace App\Models\Billing`
- `ClassNotFoundException` for models that exist on disk
- Autoloader cache clearing resolves the error temporarily
- Inconsistent namespace patterns across the codebase

### Preferred Alternative
```php
// File: app/Models/Billing/Invoice.php
namespace App\Models\Billing;

class Invoice extends Model
{
    //
}
```

### Detection Checklist
- [ ] Verify every model's namespace matches its directory path
- [ ] Check moved or copied models for outdated namespace declarations
- [ ] Run `composer dump-autoload` after namespace changes

### Related
| Rule | `05-rules.md` — Match Namespace Exactly to Directory Structure |
| Skill | `06-skills.md` — Organize Models by Domain with Matching Namespaces |

---

## 3. Mixed Flat and Domain Structure

### Category
Maintainability

### Description
Using both flat storage (models directly in `app/Models/`) and domain subdirectories simultaneously, creating an inconsistent organizational pattern.

### Why It Happens
The application starts flat and adds domain subdirectories incrementally without migrating existing models. New models are added to subdirectories while older models remain in the flat root.

### Warning Signs
- Some models in `app/Models/` root, others in `app/Models/{Domain}/`
- Developers unsure whether to add new models to the flat root or create a new subdirectory
- Import paths vary between `use App\Models\Order` and `use App\Models\Billing\Invoice`
- IDE navigation shows models in multiple locations

### Preferred Alternative
```php
// Consistent: all domain-subdirectory or all flat
app/Models/User.php
app/Models/Billing/Invoice.php
app/Models/Billing/Payment.php
app/Models/Support/Ticket.php
```

### Detection Checklist
- [ ] Identify models in flat root vs subdirectories
- [ ] Choose one pattern and migrate all models to it
- [ ] Update all imports and namespaces after migration

### Related
| Rule | `05-rules.md` — Apply One Organizational Pattern Consistently |
| Decision Tree | `07-decision-trees.md` — Consistency Enforcement |

---

## 4. Module Structure Without Bounded Contexts

### Category
Code Organization

### Description
Using `app/Modules/{Module}/Models/` structure when the application does not have clearly defined bounded contexts with independent data ownership and team boundaries.

### Why It Happens
Teams adopt module-based structure from enterprise patterns or boilerplate templates without evaluating whether bounded contexts actually exist.

### Warning Signs
- Models in different modules still reference each other's tables directly
- Multiple modules use the same database tables
- No team ownership boundaries between modules
- Modules are just directory organization, not actual isolation boundaries

### Preferred Alternative
```php
// Domain subdirectories for medium apps without bounded contexts:
app/Models/Billing/Invoice.php
app/Models/Support/Ticket.php
app/Models/Catalog/Product.php
```

### Detection Checklist
- [ ] Verify that bounded contexts actually exist (separate teams, separate data ownership)
- [ ] Check for cross-module foreign key references
- [ ] Simplify to domain subdirectories if bounded contexts are not real

### Related
| Rule | `05-rules.md` — Use Module-Based Structure Only for Bounded Contexts |
| Skill | `06-skills.md` — Organize Models by Domain with Matching Namespaces |

---

## 5. Enums, DTOs, and VOs Inside Models Directory

### Category
Code Organization

### Description
Placing enumerations, Data Transfer Objects, and value objects inside the `app/Models/` directory alongside Eloquent model classes, diluting the directory's purpose.

### Why It Happens
Placing related types near the model is convenient. Developers don't create separate directories for non-entity types until the clutter becomes obvious.

### Warning Signs
- `OrderStatus` enum in `app/Models/OrderStatus.php`
- `OrderData` DTO in `app/Models/OrderData.php`
- `Money` value object in `app/Models/Money.php`
- Cannot distinguish at a glance which files are Eloquent models and which are supporting types

### Preferred Alternative
```php
app/Enums/OrderStatus.php
app/DTOs/OrderData.php
app/ValueObjects/Money.php
app/Models/Order.php
```

### Detection Checklist
- [ ] Identify non-Model classes inside `app/Models/`
- [ ] Move enums to `app/Enums/`, DTOs to `app/DTOs/`, value objects to `app/ValueObjects/`
- [ ] Update all import references after moving

### Related
| Rule | `05-rules.md` — Place Enum and DTO Classes Outside the Models Directory |
| Skill | `06-skills.md` — Organize Models by Domain with Matching Namespaces |

---

## 6. Base Model/Traits Inside Domain Subdirectories

### Category
Code Organization

### Description
Placing the project's base model class or shared model traits inside a domain-specific subdirectory (e.g., `app/Models/Billing/BaseModel.php`) instead of in the root `app/Models/` directory.

### Why It Happens
The base model or trait is created as part of a domain module's development and never moved to a shared location. Other domains must import from that domain to access shared infrastructure.

### Warning Signs
- `use App\Models\Billing\BaseModel` in non-billing models
- Shared traits only exist inside one domain's subdirectory
- Awkward cross-domain import paths for shared infrastructure

### Preferred Alternative
```php
app/Models/BaseModel.php               // Cross-domain, in root
app/Models/Concerns/HasAudit.php       // Shared trait
app/Models/Billing/Invoice.php
app/Models/Support/Ticket.php
```

### Detection Checklist
- [ ] Check where `BaseModel` is defined — is it in a domain subdirectory?
- [ ] Verify shared traits are accessible to all domains without cross-domain imports
- [ ] Move shared infrastructure to `app/Models/` root

### Related
| Rule | `05-rules.md` — Keep Base Model and Traits Outside Domain Subdirectories |
| Skill | `06-skills.md` — Organize Models by Domain with Matching Namespaces |
