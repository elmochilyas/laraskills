# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module registration and discovery mechanisms
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Modules must be registered with the application so that routes, migrations, config, and service providers are discovered. The two primary mechanisms are explicit registration (manually adding each module's service provider to `config/app.php`) and automatic discovery (convention-based scanning of a modules directory). Explicit registration is simpler and more predictable; automatic discovery is more convenient but can mask module loading issues.

---

# Core Concepts

**Explicit registration:** Each module's service provider is listed in `config/app.php`:
```php
'providers' => [
    Modules\Billing\Providers\BillingServiceProvider::class,
    Modules\Catalog\Providers\CatalogServiceProvider::class,
],
```

**Automatic discovery:** The application scans a modules directory and registers each found module. The `nwidart/modules` package handles this automatically:
```php
// Internal mechanism
$modules = File::directories(base_path('Modules'));
foreach ($modules as $module) {
    $provider = "Modules\\".basename($module)."\\Providers\\".basename($module)."ServiceProvider";
    if (class_exists($provider)) {
        $this->app->register($provider);
    }
}
```

**Service provider responsibilities per module:**
- Register module-specific bindings
- Load module routes
- Register module events/listeners
- Merge module config with application config
- Register module migrations

---

# Mental Models

**The "Plugin" model:** Each module is a plugin that registers itself with the application. The application doesn't need to know module internals—only that the service provider bootstraps it.

**The "Registration as Contract" model:** Registration is the contract between the module and the application. The service provider says "here's what this module provides."

**The "Boot Order" model:** Service providers register in order. Module providers that depend on other modules' registrations must order carefully. Explicit registration gives control; automatic discovery requires convention.

---

# Internal Mechanics

**Explicit registration flow:**
1. Application reads `config/app.php` providers array
2. Laravel instantiates each provider in order
3. Calls `register()` on each (bindings, no side effects)
4. Calls `boot()` on each (after all `register()` calls complete)

**Automatic discovery flow (nwidart):**
1. `ModulesServiceProvider` (registered in app config) initializes
2. Reads `ModulesStatusesFile` or scans `Modules/` directory
3. Finds all module directories with valid `module.json`
4. Registers each module's service provider
5. Loads module routes, migrations, config

---

# Patterns

**Per-module service provider:** Each module has exactly one service provider. The provider handles all bootstrapping for that module. Multiple providers per module indicates the module should be split.

**Module status file:** A `module.json` or `module.php` in each module directory declares metadata: name, version, dependencies, priority:
```json
{
    "name": "Billing",
    "version": "1.0.0",
    "depends": ["Identity"],
    "priority": 10
}
```

**Lazy-loaded modules:** Some architectures support lazy module loading—modules are only bootstrapped when their routes are accessed. This reduces boot time for large applications.

---

# Architectural Decisions

**Use explicit registration when:** Team < 10, module count < 20, and you value predictability over convenience. Explicit is simpler to debug.

**Use automatic discovery when:** Module count is high (>20), modules are developed independently (possibly by different teams), or you need dynamic module enabling/disabling.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Explicit: clear registration order | Explicit: must maintain provider list | New module = modify config/app.php |
| Auto-discovery: zero-config for new modules | Auto-discovery: hidden dependencies | Module boot order is convention-based, not explicit |
| Explicit: easy debugging | Auto-discovery: cache invalidation | Module cache must be cleared manually |

---

# Performance Considerations

Each service provider adds boot time. With 20+ module providers, boot time increases by 50-200ms. Use Laravel's provider deferring (`DeferrableProvider` interface) for providers that only register bindings.

---

# Production Considerations

Document the registration mechanism. New developers need to know: "When I create a module, what do I need to register?" Explicit: add to providers array. Auto: create the module directory.

---

# Common Mistakes

**Missing provider registration:** A module exists but its provider isn't registered. Routes return 404, migrations don't run. Most common with explicit registration.

**Incorrect boot order:** Module A's `boot()` method depends on Module B's bindings, but B is registered after A. This causes resolution failures.

**Multiple modules in one provider:** Trying to reduce boot time by combining module providers. This defeats module independence and makes extraction harder.

---

# Failure Modes

**Duplicate registration:** A module provider registered both explicitly and via discovery. Service providers are idempotent but double booting wastes resources.

**Dead module registered:** A module that is no longer developed but still registered. Its provider runs during every boot but does nothing. Remove orphan registrations.

---

# Ecosystem Usage

The `nwidart/laravel-modules` package is the most popular discovery mechanism in Laravel (12M+ downloads). `Modulate` uses a similar approach with additional enforcement. Custom implementations typically use explicit registration.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-03 Module internal structure | MMD-05 Module autonomy | MMD-09 Module dependency management |
| MMD-01 Module vs microservice | CPC-01 Interface contracts | MMD-12 Isolation enforcement |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
