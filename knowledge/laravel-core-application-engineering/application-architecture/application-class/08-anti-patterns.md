# ECC Anti-Patterns — Application Class

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Application Class |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God Application (Business Logic in Application Class)
2. Extending Application for Simple Customizations (Ignoring Fluent API)
3. Post-Boot Binding Registration (Late Container Modifications)
4. Business Logic in bootstrap/app.php (Uncacheable Per-Request Code)

---

## Repository-Wide Anti-Patterns

- Service Locator via `app()` Helper (hidden dependencies in business classes)
- Global State via `app()->instance()` (managing application-wide state through container instead of proper services)

---

## Anti-Pattern 1: God Application

### Category
Architecture

### Description
Adding business logic, complex initialization, custom resolvers, or feature orchestration to the Application class instead of dedicated services.

### Why It Happens
The Application is the first class loaded and seems like a convenient place to "set everything up."

### Warning Signs
- Application class contains DB queries, API calls, or business rules
- Application class has hundreds of lines of non-path-related code
- Application class references domain models or services directly

### Preferred Alternative
Application should only bootstrap the framework. Business logic belongs in services, actions, and domain classes.

### Related Rules
- Rule: Keep bootstrap/app.php Free of Business Logic

---

## Anti-Pattern 2: Extending Application for Simple Customizations

### Category
Framework Usage

### Description
Creating a custom Application class just to add middleware, exception handling, or routing — tasks the `bootstrap/app.php` fluent API handles in Laravel 11+.

### Why It Happens
Developer is unaware of the fluent API (Laravel 11+ change) or is copying patterns from Laravel 10- projects.

### Warning Signs
- Custom Application class exists but only adds middleware/exceptions/routes
- `bootstrap/app.php` instantiates a custom class instead of using `Application::configure()`
- The custom Application could be entirely replaced by `->withMiddleware()`

### Preferred Alternative
Use `->withMiddleware()`, `->withExceptions()`, `->withRouting()` in `bootstrap/app.php`. Only extend Application for path resolution or core lifecycle changes.

### Related Rules
- Rule: Prefer Fluent API Over Class Extension

---

## Anti-Pattern 3: Post-Boot Binding Registration

### Category
Architecture

### Description
Calling `$app->bind()` or `$app->singleton()` outside of a service provider's `register()` method after the Application has booted.

### Why It Happens
Developers add bindings in controllers, middleware, or event listeners because "it works" — the binding takes effect for subsequent resolutions. The problem is that services already resolved before the late binding use the old implementation.

### Warning Signs
- `app()->bind()`, `app()->singleton()`, or `app()->instance()` calls outside of service providers
- Bindings registered conditionally based on request data
- Intermittent resolution failures where some services get the old implementation and others get the new one

### Preferred Alternative
Register all bindings in service provider `register()` methods. Use deferred providers for lazy-loaded bindings.

### Related Rules
- Rule: Avoid Post-Boot Binding Registration

---

## Anti-Pattern 4: Business Logic in bootstrap/app.php

### Category
Performance | Maintainability

### Description
Placing environment checks, validation, or conditional configuration in `bootstrap/app.php`.

### Why It Happens
Developers think "this needs to run before anything else" and put it in bootstrap.

### Warning Signs
- `if (app()->environment(...))` in `bootstrap/app.php`
- `env()` calls directly in `bootstrap/app.php`
- Exceptions thrown from `bootstrap/app.php`
- Database queries in `bootstrap/app.php`

### Preferred Alternative
Keep `bootstrap/app.php` to fluent API calls only. Extract validation to service providers, deferred initialization to dedicated classes.

### Related Rules
- Rule: Keep bootstrap/app.php Free of Business Logic
