# Skill: Debug Auto-Resolution Failures

## Purpose
Diagnose and fix container auto-resolution failures caused by interface type-hints without bindings, missing primitive defaults, and unresolvable dependencies.

## When To Use
- When `BindingResolutionException: "Target [Interface] is not instantiable"` is thrown
- When `Unresolvable dependency resolving` errors appear for primitive parameters
- When a class cannot be resolved through `make()` but has a valid constructor

## When NOT To Use
- When the failure is caused by a circular dependency (use circular dependency detection skills instead)
- When the issue is a missing binding registration (use binding resolution skills)

## Prerequisites
- Container Fundamentals
- Binding Types
- PHP Reflection API basics

## Inputs
- Abstract name that fails resolution
- Full exception message and build stack trace
- Constructor signature of the failing class

## Workflow
1. Identify the abstract name in the exception message
2. Check if the abstract is a class or interface: `$ref = new ReflectionClass($abstract)`
3. If interface/abstract class: locate the missing binding registration and add `$app->bind(Interface::class, Concrete::class)`
4. If concrete class: inspect constructor via `ReflectionClass::getConstructor()`
5. For each primitive parameter without a default value, either add a default or switch to `makeWith()`
6. For nullable optional dependencies, change type-hint to `?Type $param = null`
7. Verify resolution succeeds: `$app->make($abstract)`

## Validation Checklist
- [ ] Every interface/abstract type-hint has a registered binding
- [ ] Every primitive constructor parameter has a default value or uses `makeWith()`
- [ ] Optional dependencies use nullable type-hints with null defaults
- [ ] Resolution succeeds without exceptions

## Common Failures
- Interface type-hint registered in wrong provider — binding not yet available
- Primitive parameter added without default — all existing `make()` callers break
- Constructor parameter renamed — `makeWith()` callers use old name
- Class depends on another class that depends on an unregistered interface

## Decision Points
- When the class requires primitives: add defaults vs use `makeWith()` vs register explicit binding
- When the dependency is optional: nullable type-hint vs separate registration condition
- When multiple implementations exist: standard `bind()` vs contextual binding

## Performance Considerations
- Each auto-resolution triggers reflection — ~50-200μs per chain
- Pre-register hot-path classes as explicit bindings to bypass reflection
- Enable ReflectionCache in Laravel 12+ for Octane deployments

## Security Considerations
- Auto-resolution can instantiate framework internal classes — use explicit bindings for sensitive services
- Constructor parameter names visible via reflection — avoid sensitive parameter names

## Related Rules
- Register Bindings for Every Interface Type-Hint
- Provide Default Values for Primitive Constructor Parameters
- Do Not Rely on Auto-Resolution for Classes with Required Primitives

## Related Skills
- Bind Services with the Correct Binding Type
- Debug Resolution Chain Failures
- Resolve Services Correctly with make()

## Success Criteria
- All auto-resolved classes resolve successfully via `$app->make()`
- No `BindingResolutionException` thrown during normal resolution paths
- Hot-path services optionally pre-registered as explicit bindings for performance

---

# Skill: Optimize Reflection Resolution for Hot Paths

## Purpose
Reduce resolution latency by replacing auto-resolution with explicit bindings for services resolved on every request or job, and enabling reflection caching in long-running processes.

## Purpose

## When To Use
- When profiling shows auto-resolution overhead on hot code paths
- When deploying Octane with Laravel 12+
- When a class with deep dependency chains (~3+ levels) is resolved per-request

## When NOT To Use
- During prototyping or low-traffic applications where overhead is negligible (<2μs)
- For classes with zero constructor dependencies (trivial reflection cost)

## Prerequisites
- Container Fundamentals
- Binding Types
- Auto-Resolution via Reflection basics

## Inputs
- List of services resolved on every request or job
- Profile data showing resolution latency
- Laravel version (10/11 vs 12+)

## Workflow
1. Profile resolution time with microtime or Laravel Debugbar: `$start = microtime(true); $app->make($service); $elapsed = (microtime(true) - $start) * 1e6;`
2. Identify hot-path services resolved per-request (controllers, middleware, jobs)
3. For each hot service with >10μs resolution time, register explicit binding: `$app->bind(Service::class, fn($app) => new Service($app->make(Dependency::class)))`
4. If on Laravel 12+ with Octane, enable ReflectionCache: `$app->enableReflectionCache()` in `bootstrap/app.php`
5. For Octane, pre-resolve during boot: call `$app->make(HotService::class)` in `boot()`
6. Verify resolution time reduction with micro-benchmark

## Validation Checklist
- [ ] Hot-path services pre-registered as explicit bindings
- [ ] Resolution time reduced by ~10x on pre-registered services
- [ ] ReflectionCache enabled in Laravel 12+ Octane deployments
- [ ] Pre-resolved services do not depend on request-time data

## Common Failures
- Pre-resolving services that depend on request-time data causes boot-time failure
- Enabling ReflectionCache on Laravel 10-11 uses non-existent API
- Self-binding `$app->bind(Service::class)` without proper registration still triggers reflection

## Decision Points
- Closure binding vs self-binding: use closure when constructor needs custom parameters, self-binding when pure DI
- Pre-resolution during boot vs lazy: pre-resolve only for truly request-independent services

## Performance Considerations
- Explicit closure bindings resolve ~10x faster than auto-resolution (5μs vs 50μs)
- ReflectionCache persists per-worker in Octane — cost paid once per worker per class
- Pre-resolving during boot moves overhead from first request to boot time

## Security Considerations
- Pre-resolved services are available globally after boot — ensure they hold no request-specific secrets at construction
- ReflectionCache stores reflection data in memory — no security implications

## Related Rules
- Pre-register Hot-Path Bindings to Bypass Reflection
- Enable ReflectionCache in Laravel 12+ for Octane Deployments
- Pre-Resolve Hot Services During Boot to Front-Load Cost

## Related Skills
- Debug Auto-Resolution Failures
- Select the Correct Binding Type
- Configure the Service Container

## Success Criteria
- Hot-path services resolve in <10μs per chain
- Reflection overhead eliminated on per-request hot paths
- Octane workers show consistent response times from first request
