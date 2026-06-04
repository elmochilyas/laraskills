# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Application Builder Configuration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Builder chain terminates with `->create()` returning an Application instance
- [ ] `withRouting()` configures route file paths but does not load routes
- [ ] `withMiddleware()` configures global middleware stack
- [ ] `->create()` is the final method call in the builder chain
- [ ] All `with*()` method signatures match the current Laravel version (11+)
- [ ] No request-scoped variables (`$request`, user data) are captured in closures
- [ ] Always terminate the builder chain with ->create(). followed
- [ ] Never capture request-scoped variables in builder closures. followed
- [ ] Prefer Application::configure() over manual kernel binding overwrites. followed
- [ ] Never place business logic inside builder closures. followed
- [ ] Call withRouting() before withMiddleware() when middleware depends on route configuration. followed
- [ ] Do not register the same binding in both withSingletons() and a service provider. followed
- [ ] Call `withRouting()` before `withMiddleware()` applied
- [ ] Use conditional logic with `$app->runningInConsole()` applied
- [ ] Keep `withSingletons()` lean applied
- [ ] Avoid capturing request-scoped variables applied
- [ ] Business Logic in Bootstrap Closures prevented
- [ ] Global State in Builder Closures prevented
- [ ] Calling withSingletons() with keys already bound by providers prevented
- [ ] Expecting withRouting() to load routes prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always terminate the builder chain with ->create(). followed
- [ ] Never capture request-scoped variables in builder closures. followed
- [ ] Prefer Application::configure() over manual kernel binding overwrites. followed
- [ ] Never place business logic inside builder closures. followed
- [ ] Call withRouting() before withMiddleware() when middleware depends on route configuration. followed
- [ ] Call `withRouting()` before `withMiddleware()` applied
- [ ] Use conditional logic with `$app->runningInConsole()` applied
- [ ] Keep `withSingletons()` lean applied
- [ ] Avoid capturing request-scoped variables applied
- [ ] Calling withSingletons() with keys already bound by providers prevented
- [ ] Expecting withRouting() to load routes prevented
- [ ] Capturing $request in booting() closure prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Business Logic in Bootstrap Closures prevented
- [ ] Global State in Builder Closures prevented
- [ ] Duplicate Binding Registration prevented
- [ ] Over-Chaining Unused Builder Methods prevented
- [ ] Capturing Request-Scoped Variables in Builder Closures prevented
- [ ] Always terminate the builder chain with ->create(). followed
- [ ] Never capture request-scoped variables in builder closures. followed
- [ ] Prefer Application::configure() over manual kernel binding overwrites. followed
- [ ] Never place business logic inside builder closures. followed
- [ ] Call withRouting() before withMiddleware() when middleware depends on route configuration. followed
- [ ] Do not register the same binding in both withSingletons() and a service provider. followed

---

# Testing Checklist

- [ ] `->create()` is the final method call in the builder chain
- [ ] All `with*()` method signatures match the current Laravel version (11+)
- [ ] No request-scoped variables (`$request`, user data) are captured in closures
- [ ] No duplicate binding registration between builder and service providers
- [ ] Builder chain terminates with `->create()` returning an Application instance
- [ ] `withRouting()` configures route file paths but does not load routes
- [ ] `withMiddleware()` configures global middleware stack
- [ ] `withExceptions()` configures exception handling callbacks
- [ ] bootstrap/app.php returns an Illuminate\Foundation\Application instance
- [ ] Routing, middleware, and exceptions are configured correctly per the application's needs
- [ ] Container bindings registered via the builder resolve correctly in service providers and controllers
- [ ] All entry points (index.php, artisan, Octane) load the application without errors

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Business Logic in Bootstrap Closures prevented
- [ ] Global State in Builder Closures prevented
- [ ] Duplicate Binding Registration prevented
- [ ] Over-Chaining Unused Builder Methods prevented
- [ ] Capturing Request-Scoped Variables in Builder Closures prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- [Application Class Construction](./application-class-construction/02-knowledge-unit.md)
- [Service Container Fundamentals] â€” bindings registered via the builder resolve through the container.
- [Bootstrap App PHP File](./bootstrap-app-php-file/02-knowledge-unit.md)
- [Bootstrapper Sequence](./bootstrapper-sequence/02-knowledge-unit.md)
- [Path Helpers and Environment Detection](./path-helpers-and-environment-detection/02-knowledge-unit.md)

---


