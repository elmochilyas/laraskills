# Directory Organization Strategies

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Directory Organization Strategies
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Directory organization strategies define how CRUD architecture layers (controllers, DTOs, actions, services, repositories) are organized into directories and namespaces. The two dominant strategies are layer-first (group by layer type) and domain-first (group by business domain). Mixed strategies combine both. The choice determines how developers navigate the codebase, how features are scoped, and how the architecture evolves as the application grows.

The engineering significance is that directory structure IS architecture — it communicates how the team thinks about the codebase. A layer-first structure (`app/Controllers/`, `app/Services/`, `app/Models/`) says "our primary organization is technical." A domain-first structure (`app/Users/`, `app/Orders/`, `app/Products/`) says "our primary organization is business capability." Neither is objectively correct — the right choice depends on team size, application complexity, and domain characteristics.

---

## Core Concepts

### Layer-First (Technical) Organization

```
app/
  Http/
    Controllers/
      UserController.php
      OrderController.php
      ProductController.php
  Actions/
    CreateUserAction.php
    CreateOrderAction.php
  DTOs/
    CreateUserDto.php
    CreateOrderDto.php
  Services/
    UserService.php
    OrderService.php
  Models/
    User.php
    Order.php
```

**Pros:** Easy to find files by type. Consistent with Laravel's default structure. Works well for small to medium codebases. Framework-idiomatic.

**Cons:** Unrelated code is co-located (all controllers together). As the codebase grows, each directory becomes crowded. No domain boundary enforcement.

### Domain-First (Feature) Organization

```
app/
  Users/
    Controllers/
      UserController.php
    Actions/
      CreateUserAction.php
      UpdateUserAction.php
    DTOs/
      CreateUserDto.php
      UpdateUserDto.php
    Services/
      UserService.php
    Models/
      User.php
  Orders/
    Controllers/
      OrderController.php
    Actions/
      CreateOrderAction.php
      CancelOrderAction.php
    DTOs/
      CreateOrderDto.php
    Services/
      OrderService.php
    Models/
      Order.php
```

**Pros:** Domain boundaries are explicit. Related files are co-located. Features can be understood in isolation. Scales well for large applications.

**Cons:** Requires custom autoloading configuration. Cross-cutting concerns (shared DTOs, shared actions) need careful placement. Not Laravel's default.

### Mixed (Hybrid) Organization

```
app/
  Domain/
    Users/
      UserController.php (or Http/Controllers/Users/)
      UserService.php
      Models/User.php
    Orders/
      OrderController.php
      OrderService.php
      Models/Order.php
  Http/
    Controllers/ (thin wrappers that delegate to Domain)
  Shared/
    Actions/
    DTOs/
```

---

## Mental Models

### The Filing Cabinet

Layer-first is organizing a filing cabinet by document type — all invoices in one drawer, all contracts in another. Domain-first is organizing by project — all documents for Project A in one drawer, all for Project B in another.

### The Library

Layer-first is a library organized by format (all hardcovers together, all paperbacks together). Domain-first is organized by subject (all books about history together, all about science together). Most real libraries use the subject (domain) approach because it's more useful for navigation.

---

## Internal Mechanics

### Autoloading and Namespace Resolution

PHP uses PSR-4 autoloading, which maps namespace prefixes to directory paths. The directory structure directly determines the namespace hierarchy. Moving a file from `app/Http/Controllers/UserController.php` with `namespace App\Http\Controllers;` to `app/Domain/Users/UserController.php` requires either updating the namespace to `App\Domain\Users` or adding a new PSR-4 prefix in `composer.json`.

### IDE Navigation Impact

Directory structure shapes IDE navigation patterns. Layer-first enables "go to controller" via namespace prefix. Domain-first enables "go to user feature" via domain directory. Both work with "Find in Path" and "Navigate to Symbol", but the developer's mental map differs — layer-first trains thinking in technical layers, domain-first trains thinking in business capabilities.

### Team Ownership Boundaries

Directory structure enforces team ownership at the filesystem level. Domain-first directories can be mapped directly to team ownership — Team A owns `app/Domain/Orders/`, Team B owns `app/Domain/Users/`. Layer-first structures scatter each team's code across multiple directories, making ownership boundaries implicit rather than enforced.

---

## Patterns

### Domain-First with Shared Kernel

```php
// app/Domain/Users/ — everything user-related
// app/Domain/Orders/ — everything order-related
// app/Shared/ — cross-cutting concerns
//   Actions/
//   DTOs/
//   Contracts/
```

Shared kernel contains types used by multiple domains. Domains should not depend on each other (avoid `Users/DTOs/UserDto.php` imported by `Orders/`).

### Layer-First with Module Subdirectories

```
app/
  Controllers/
    Users/
      UserController.php
      UserProfileController.php
    Orders/
      OrderController.php
  Services/
    Users/
      UserService.php
    Orders/
      OrderService.php
```

A compromise — layer-first at the top level, domain-first within each layer directory.

### Action-First Organization

For action-heavy codebases, organize actions by domain:

```
app/
  Actions/
    Users/
      CreateUserAction.php
      UpdateUserAction.php
    Orders/
      CreateOrderAction.php
      CancelOrderAction.php
  Http/
    Controllers/
      UserController.php
      OrderController.php
  Models/
    User.php
    Order.php
```

Actions have their own top-level directory with domain subdirectories. Controllers and models remain layer-first.

---

## Architectural Decisions

### Choosing the Right Strategy

| Factor | Layer-First | Domain-First |
|--------|-------------|--------------|
| Application size | Small-moderate | Large (20+ domains) |
| Team size | 1-5 | 5+ |
| Domain coupling | Tightly coupled domains | Loosely coupled domains |
| Laravel default alignment | Yes | No (requires configuration) |
| New developer onboarding | Faster (expected structure) | Slower (must learn domain layout) |

### The Default: Layer-First

Laravel's default structure is layer-first. For most applications (<50 models), layer-first is the right default. Domain-first should be adopted intentionally when the application size and team size justify it.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Layer-first: Framework-idiomatic, predictable for Laravel devs | Layer-first: Domain files scattered across layer directories | Acceptable for small-medium apps |
| Domain-first: Domain-bounded, feature isolation | Domain-first: Non-default structure, custom autoloading | Requires team alignment |
| Layer-first: Easy to find "all controllers" | Domain-first: Harder to find "all controllers" | IDE project-wide search mitigates this |
| Domain-first: Logical feature ownership | Layer-first: No explicit domain boundaries | Domain boundaries must be documented elsewhere |

---

## Performance Considerations

Directory structure has zero performance impact. Autoloading is based on namespace-to-path mapping, not directory structure. OpCache caches compiled files regardless of directory layout.

---

## Production Considerations

### Namespace Consistency

Whatever structure is chosen, the namespace must match the directory:

```php
// Domain-first: namespace matches directory
namespace App\Users\Controllers;
namespace App\Users\Actions;
namespace App\Users\Models;

// Layer-first: namespace matches directory
namespace App\Http\Controllers;
namespace App\Actions;
namespace App\Models;
```

### Autoloading Configuration

Domain-first structures require PSR-4 autoloading configuration in `composer.json`:

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "App\\Users\\": "app/Domain/Users/",
            "App\\Orders\\": "app/Domain/Orders/"
        }
    }
}
```

Run `composer dump-autoload` after adding new domain directories.

### Migration Path

Migrating from layer-first to domain-first:
1. Identify domain boundaries (User, Order, Product)
2. Create domain directories with PSR-4 mappings
3. Move files one domain at a time
4. Update namespaces
5. Update imports across the codebase

Each domain takes 1-2 hours. Do not attempt the migration in a single commit.

---

## Common Mistakes

### Mixing Strategies Inconsistently
Why it happens: Starting layer-first, adding domain-first for one feature because "it makes sense for this feature." Why it's harmful: Developers must remember two different organization strategies — files are scattered unpredictably. Better approach: Choose one primary strategy and apply it consistently. Use subdirectories within that strategy for grouping.

### Premature Domain-First
Why it happens: Adopting domain-first for a 10-model application because "it's what big applications use." Why it's harmful: Excessive directory structure with mostly-empty domain directories. Better approach: Start layer-first. Adopt domain-first when the application has 20+ domains or 5+ team members.

### Incorrect Namespace Mapping
Why it happens: Moving files to domain directories without updating namespaces. Why it's harmful: Autoloading fails, classes can't be found. Better approach: Update namespaces and autoloading configuration simultaneously. Run `composer dump-autoload` and verify with `php artisan tinker`.

---

## Failure Modes

### Directory Proliferation
A domain-first structure where every entity gets its own domain directory, including lookup tables and pivot models. The directory structure is deeper than it needs to be — developers spend more time navigating directories than reading code. Collapse small entities into a `Shared` domain.

### Namespace Confusion
Layer-first structure with domain subdirectories, but the namespace doesn't match. `app/Controllers/Users/UserController.php` has namespace `App\Http\Controllers\Users` — is it `App\Http\Controllers\Users` or `App\Controllers\Users`? Inconsistent namespace mapping causes autoloading errors.

### Circular Domain Dependencies
Domain A depends on Domain B's DTOs, which depend on Domain A's services. The domain boundaries are not actually bounded — they're cross-coupled. Extract shared types to a `Shared` directory.

---

## Ecosystem Usage

### Laravel Default
Laravel's default structure is layer-first. `app/Http/Controllers/`, `app/Models/`, `app/Providers/`. The framework does not prescribe a structure beyond these directories.

### Monica CRM
Monica uses a domain-like structure: `app/Models/` for all models (layer-first), `app/Services/` with domain subdirectories. A mixed approach.

### Enterprise Laravel
Enterprise codebases often use domain-first with a `app/Domain/` root containing all domain modules. Each domain is a self-contained module with its own controllers, actions, DTOs, and models.

---

## Related Knowledge Units

### Prerequisites
- All CRUD Architecture KUs — Each KU defines a layer type that must be organized

### Related Topics
- Action Organization — Where action files go
- DTO Organization — Where DTO files go
- Service Organization — Where service files go

### Advanced Follow-up Topics
- Modular Laravel — Domain modules with service providers
- Package Development — When to extract domains into separate packages

---

## Research Notes

### Source Analysis
- Laravel default: Layer-first structure since Laravel 4
- Monica CRM: Mixed approach (models layer-first, services domain-organized)
- Enterprise codebases: Domain-first common in applications >100k LOC
- Community survey (2024): 60% layer-first, 25% domain-first, 15% mixed

### Key Insight
Directory structure is a communication tool. It tells developers what the team thinks is important. Layer-first communicates technical architecture (controllers, services, models). Domain-first communicates business architecture (users, orders, products). Both are valid — the choice should match the team's mental model, not follow a trend.

### Version-Specific Notes
- Laravel 11+: No changes to directory structure conventions
- PHP 8.0+: PSR-4 autoloading continues to work with any directory structure
- `composer.json` PSR-4 configuration is the key to custom directory structures
