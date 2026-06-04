# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Organizing by layer: app/Http, app/Models, app/Services
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Layer-based organization—grouping code by its technical role (Controllers in `app/Http/Controllers/`, Models in `app/Models/`, Services in `app/Services/`)—is the default approach in Laravel and the most intuitive for developers coming from traditional MVC frameworks. It answers "what does this code do?" by placing all HTTP-handling code together, all data-access code together, and all business-logic code together. This axis of organization is simple, predictable, and framework-aligned, but creates cross-cutting concern mixing when different business domains share the same technical layer folder.

---

# Core Concepts

Layer-based organization sorts classes by their architectural role:

- **Presentation layer** (`app/Http/`): Controllers, Middleware, Form Requests, route files.
- **Business logic layer** (`app/Services/`, `app/Actions/`): Service classes, action classes, domain logic.
- **Data access layer** (`app/Models/`, `app/Repositories/`): Eloquent models, repository implementations, query objects.
- **Application configuration** (`app/Providers/`, `app/Console/`): Service providers, artisan commands, broadcasting channels.

Each folder groups all classes of that type regardless of which business domain they serve. `app/Http/Controllers/` might contain `UserController`, `OrderController`, `ProductController`, `InvoiceController`—all in one directory.

The natural extension is adding `app/Services/`, `app/Enums/`, `app/Events/`, `app/Jobs/`, `app/Mail/`, `app/Notifications/`, `app/Policies/`, `app/Rules/` alongside the defaults. Laravel's `composer.json` maps `App\` to `app/`, so any subdirectory automatically becomes a namespace segment.

---

# Mental Models

**The "Technical Concern" axis:** Ask "what is this code's role in the request lifecycle?" rather than "what business problem does this solve?" Controllers handle HTTP, Services handle logic, Models handle data. This maps directly to the MVC mental model.

**The "Framework Mirror" model:** Each technical directory mirrors a Laravel concept. `Http/` mirrors request handling. `Models/` mirrors Eloquent. `Providers/` mirrors service container bootstrapping. Developers learn the framework, then the directory structure is self-explanatory.

**The "One Place for Every Type" model:** Every developer knows where to find all controllers (one folder), all models (one folder), all services (one folder). This simplifies cross-reference but complicates domain-specific grouping.

---

# Internal Mechanics

Laravel's autoloading is PSR-4 based. `App\Http\Controllers\UserController` maps to `app/Http/Controllers/UserController.php`. The `artisan make:` commands use templates that reference these default namespace locations. For example, `make:controller` generates a class in `App\Http\Controllers` namespace.

The service container resolves classes by Fully Qualified Class Name (FQCN). `$this->app->bind(UserService::class, ...)` works because `UserService` in `App\Services` is auto-loaded from `app/Services/`.

---

# Patterns

**Controller-to-Service delegation:** Controller receives request, validates via Form Request, calls Service method, returns response. Service handles business logic. This is the most common layer-based pattern.

**Model-centric layering:** Models are treated as the domain. Services operate on Models. Controllers bridge HTTP to Services. This works well for CRUD-heavy applications but creates anemic domain models when business logic sits in services rather than in the model.

**Sub-layer grouping within layers:** `app/Http/Controllers/Api/` and `app/Http/Controllers/Web/` for interface-specific controllers. `app/Services/Payment/` and `app/Services/Notification/` for domain-area service groupings.

---

# Architectural Decisions

**Add `app/Services/` when:** Controllers contain logic beyond request handling (formatting, orchestration, validation beyond Form Requests). This is the first extension almost all Laravel projects make.

**Add `app/Repositories/` when:** Query logic is duplicated across services, or when you need to abstract data source. Most projects do not need this initially.

**Keep defaults when:** Fewer than 5 engineers, application logic is primarily CRUD, and business rules are simple enough to fit in model methods or simple service classes.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Every developer knows where to find thing | Business-domain concepts are scattered | To understand "ordering" you browse 6+ folders |
| Framework conventions work unchanged | Fat directories at scale | `app/Services/` grows to 50+ unrelated files |
| Easy for new Laravel devs | No domain isolation | Changes to "User" ripple across all layers |
| Shallow namespace hierarchy | Cross-layer coupling | Service layer implicitly depends on Eloquent |

---

# Performance Considerations

Layer-based organization has no direct performance cost. However, large single-layer directories (100+ files in `app/Models/`) slow IDE file-tree operations and increase cognitive load.

---

# Production Considerations

Service layer extraction must be consistent. If some controllers delegate to services and others do not, the codebase becomes unpredictable. Establish a rule: all non-trivial business logic lives in a service class. Enforce via code review.

Layer boundaries cannot be enforced by directory structure alone. Nothing prevents a Controller from calling `User::find()` directly. Enforcement requires architecture tests or static analysis rules (see AEG-01, AEG-03).

---

# Common Mistakes

**The "God Service" accumulation:** `app/Services/UserService.php` grows to handle registration, login, password reset, profile updates, email verification, and notification preferences. This recreates the fat controller problem.

**Elastic directory creep:** Adding `app/Helpers/`, `app/Utilities/`, `app/Common/`, `app/Traits/` as catch-all directories without clear naming conventions. These become dumping grounds.

**Missing services entirely:** Keeping all logic in controllers despite the application growing beyond simple CRUD. This is the most common anti-pattern for Laravel projects that don't adopt any architectural patterns.

---

# Failure Modes

**Circular service dependency:** `UserService` depends on `OrderService` which depends on `UserService`. The service container detects this at construction time but the error is confusing.

**Repository-y service classes:** A service class that looks exactly like a repository: `UserService::find()`, `UserService::create()`, `UserService::update()`—just wrapping Model calls. This is "service in name only" and adds ceremony without value (see SLP-14).

---

# Ecosystem Usage

First-party Laravel packages typically use the layer-based organization for their published assets. Spatie's `laravel-permission` publishes to `app/Models/Role.php`, `app/Models/Permission.php`. Laravel Horizon publishes `app/Providers/HorizonServiceProvider.php`.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 Default structure | COS-05 Feature-based organization | COS-09 When to deviate |
| MVC pattern awareness | COS-06 Domain-based organization | COS-12 File placement decision trees |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
