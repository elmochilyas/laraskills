# Registry pattern (Service Container) — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Registry
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand the Service Container and Dependency Injection
- [ ] Know the difference between Registry pattern and Service Locator anti-pattern
- [ ] Familiar with Singleton pattern and how container manages instance lifetime

## Implementation Checklist
- [ ] Services registered in ServiceContainer via `bind()` / `singleton()` / `scoped()`
- [ ] `app()` or `resolve()` not called directly from business logic (inject dependencies)
- [ ] `config()` used for static configuration, not runtime state
- [ ] Mutable objects not stored in registry (unexpected side effects in long-running processes)
- [ ] Services resolved via constructor injection, not `app()` facades
- [ ] `register()` method only used for service binding, not resolution

## Verification Checklist
- [ ] No `app()` calls scattered through business logic
- [ ] `config()` not used for runtime/session state
- [ ] All dependencies explicit via constructor injection
- [ ] No service locator pattern in domain classes
- [ ] Container bindings tested (resolved correctly)

## Security Checklist
- [ ] Registered services don't expose sensitive configuration
- [ ] Service overrides don't bypass security controls
- [ ] Singleton instances don't accumulate sensitive request data

## Performance Checklist
- [ ] Container access: array lookup + optional construction
- [ ] Cached instances (singleton): array lookup only
- [ ] Config access: array lookup (cached after first access)
- [ ] Reflection-based resolution: first-call cost for unregistered classes

## Production Readiness Checklist
- [ ] Service registration organized by provider
- [ ] Deferred providers used for performance where applicable
- [ ] Container instance management understood for Octane (scoped vs singleton)
- [ ] Service override lifecycle documented (which providers load in which order)

## Common Mistakes to Avoid
- [ ] `app()` calls scattered through business logic (hidden dependencies, hard to test)
- [ ] `config()` used for runtime state (config is for static configuration)
- [ ] Storing mutable objects in registry (side effects in long-running processes)
- [ ] Using registry as service locator (every class resolves its own dependencies)
- [ ] Overriding registered services without understanding lifecycle (stale instances)
