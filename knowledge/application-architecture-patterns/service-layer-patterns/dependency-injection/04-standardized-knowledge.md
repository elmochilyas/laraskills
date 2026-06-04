# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Dependency injection for services and actions
Knowledge Unit ID: SLP-09
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Dependency injection (DI) supplies services and actions with their dependencies. Laravel's service container automatically resolves constructor dependencies, making DI transparent. Key patterns: constructor injection for required dependencies (preferred), method injection for variability (less common), explicit binding in service providers for interface-implementation mapping.

---

# Core Concepts

- **Constructor injection**: Dependencies declared as constructor parameters. Container resolves automatically. The default choice.
- **Method injection**: Dependencies injected into specific methods. Rare in services, common in controllers.
- **Interface binding**: Services depend on interfaces; container resolves implementations via service provider bindings.
- **Constructor is a contract**: The constructor signature documents what the class needs. More dependencies = more responsibilities.

---

# When To Use

- Always. Constructor injection should be the default mechanism for all services and actions.

---

# When NOT To Use

- Prototype-stage where DI setup overhead isn't justified.
- Trivial scripts or one-off commands.

---

# Best Practices

- **Use constructor injection for all required dependencies.** WHY: Makes dependencies explicit, testable via mocking, and visible at a glance. No hidden dependencies.
- **Depend on interfaces, not concrete classes.** WHY: Enables swapping implementations without changing consumers. Critical for testability and flexibility.
- **Avoid facades in injected services.** WHY: Facades hide dependencies. `\Cache::get()` inside a service creates an invisible dependency on the cache implementation.
- **Watch for 5+ constructor dependencies.** WHY: 5+ dependencies signals the class is doing too much. Consider splitting.

---

# Architecture Guidelines

- Container resolves constructor dependencies recursively.
- Contextual binding: use when different services need different implementations of the same interface.
- No constructor work: constructors should only assign parameters, not perform logic.
- Add interfaces only when variation is needed — not every service needs an interface.

---

# Performance Considerations

- Container uses Reflection for unresolvable parameters. Cached after first resolution. With `optimize` command, resolution is fast.

---

# Security Considerations

- No direct implications. DI is structural.

---

# Common Mistakes

1. **Facade usage in injected services:** Using `\Cache::get()` instead of injecting `Cache` interface. Cause: habit. Consequence: hidden dependency. Better: inject cache contract.

2. **Constructor work:** Performing logic (connecting to services, loading data) in constructor. Cause: eager initialization. Consequence: side effects during resolution. Better: constructors assign only.

3. **Too many interfaces:** Interface for every service with only one implementation. Cause: over-engineering. Consequence: unnecessary binding overhead. Better: interface only when variation is needed.

---

# Anti-Patterns

- **Circular dependency**: Service A depends on Service B which depends on Service A. Container throws `CircularDependencyException`.
- **Resolution failure**: Missing container binding for interface. Results in `BindingResolutionException`.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| Laravel Service Container | SLP-12 Service binding strategies | SLP-13 Interface contracts |
| SLP-01 Service classes | SLP-02 Action classes | SLP-19 Octane service state |

---

# AI Agent Notes

- Default to constructor injection for all services and actions.
- Depend on interfaces, bind implementations in service providers.
- Monitor constructor dependency count — flag 5+.
- No constructor work (side effects) in services/actions.

---

# Verification

- [ ] Constructor injection is the default pattern
- [ ] Services depend on interfaces, not concrete classes
- [ ] No facades used in services/actions
- [ ] No constructor performs logic (only assignment)
- [ ] No class has 5+ constructor dependencies
