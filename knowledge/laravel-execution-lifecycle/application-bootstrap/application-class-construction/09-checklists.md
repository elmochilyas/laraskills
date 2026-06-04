# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Application Class Construction
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Application resolves `app()` helper correctly immediately after construction
- [ ] `Container::getInstance()` returns the same instance as `app()`
- [ ] Base path binding exists via `$app->make('path.base')`
- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance as `$app->make('app')`
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` also returns the same instance
- [ ] Always use Application::configure()->create() instead of new Application() in Laravel 11+. followed
- [ ] Never modify the Application constructor or add bindings in constructor subclasses. followed
- [ ] Never call app('config') or any non-base binding immediately after construction. followed
- [ ] Always pass an explicit basePath to Application::configure() in non-standard directory layouts. followed
- [ ] Never call $this->make() inside registerBaseBindings() or registerBaseServiceProviders(). followed
- [ ] Always use `Application::configure()->create()` applied
- [ ] Do not modify the constructor applied
- [ ] Pass an explicit base path applied
- [ ] Guard against constructor modification in Octane applied
- [ ] Direct Constructor Invocation in Application Code prevented
- [ ] Constructor Modification via Inheritance prevented
- [ ] Calling app('config') immediately after construction prevented
- [ ] Expecting registerBaseServiceProviders() to load all services prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use Application::configure()->create() instead of new Application() in Laravel 11+. followed
- [ ] Never modify the Application constructor or add bindings in constructor subclasses. followed
- [ ] Never call app('config') or any non-base binding immediately after construction. followed
- [ ] Always pass an explicit basePath to Application::configure() in non-standard directory layouts. followed
- [ ] Never call $this->make() inside registerBaseBindings() or registerBaseServiceProviders(). followed
- [ ] Always use `Application::configure()->create()` applied
- [ ] Do not modify the constructor applied
- [ ] Pass an explicit base path applied
- [ ] Guard against constructor modification in Octane applied
- [ ] Calling app('config') immediately after construction prevented
- [ ] Expecting registerBaseServiceProviders() to load all services prevented
- [ ] Mutating container in register() and expecting persistence after flush prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Direct Constructor Invocation in Application Code prevented
- [ ] Constructor Modification via Inheritance prevented
- [ ] Missing Base Path in Non-Standard Deployments prevented
- [ ] Eager Resolution Inside Constructor Chain prevented
- [ ] Always use Application::configure()->create() instead of new Application() in Laravel 11+. followed
- [ ] Never modify the Application constructor or add bindings in constructor subclasses. followed
- [ ] Never call app('config') or any non-base binding immediately after construction. followed
- [ ] Always pass an explicit basePath to Application::configure() in non-standard directory layouts. followed
- [ ] Never call $this->make() inside registerBaseBindings() or registerBaseServiceProviders(). followed

---

# Testing Checklist

- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance as `$app->make('app')`
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` also returns the same instance
- [ ] All three base service providers (Event, Log, Routing) are registered (not yet booted)
- [ ] Application resolves `app()` helper correctly immediately after construction
- [ ] `Container::getInstance()` returns the same instance as `app()`
- [ ] Base path binding exists via `$app->make('path.base')`
- [ ] All three base service providers are registered (not yet booted)
- [ ] Application instance is fully constructed with all base bindings in place
- [ ] All three entry points (index.php, artisan, Octane) accept and use the instance
- [ ] $app->make('app') succeeds immediately after construction
- [ ] The instance is ready for the bootstrapper sequence to run

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Direct Constructor Invocation in Application Code prevented
- [ ] Constructor Modification via Inheritance prevented
- [ ] Missing Base Path in Non-Standard Deployments prevented
- [ ] Eager Resolution Inside Constructor Chain prevented

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

- [Service Container Fundamentals] â€” understanding `Illuminate\Container\Container` is essential; all constructor mechanics build on container primitives.
- [Base Bindings and Core Aliases](./base-bindings-and-core-aliases/02-knowledge-unit.md)
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md)
- [Bootstrapper Sequence](./bootstrapper-sequence/02-knowledge-unit.md)

---


