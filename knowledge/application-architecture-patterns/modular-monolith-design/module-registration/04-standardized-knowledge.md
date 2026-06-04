# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module registration and discovery mechanisms
Knowledge Unit ID: MMD-04
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Modules must be registered so routes, migrations, config, and service providers are discovered. Two primary mechanisms: explicit registration (manual provider list in `config/app.php`) and automatic discovery (convention-based scanning). Explicit is simpler and predictable; automatic is more convenient.

---

# Core Concepts

- **Explicit registration**: Each module's service provider listed in `config/app.php` providers array.
- **Automatic discovery**: Application scans modules directory, registers each found module's provider.
- **Per-module service provider**: Handles all bootstrapping — bindings, routes, events, migrations, config.
- **Module status file**: `module.json` declaring name, version, dependencies, priority.

---

# When To Use

Explicit: Team <10, module count <20, predictability valued over convenience.
Auto-discovery: Module count >20, modules developed independently, dynamic enabling/disabling needed.

---

# When NOT To Use

- Auto-discovery when boot order matters and is hard to control with conventions.
- Combining both explicit and auto-discovery for the same module (duplicate registration risk).

---

# Best Practices

- **Use explicit registration for small to medium projects.** WHY: Easier to debug, clear boot order, no hidden dependencies. When boot order matters, explicit is simpler.
- **Document the registration mechanism.** WHY: New developers need to know: "When I create a module, what do I need to register?"
- **Keep one service provider per module.** WHY: Multiple providers per module signals the module should be split.
- **Use `DeferrableProvider` for providers that only register bindings.** WHY: Reduces boot time — deferred providers only load when their bindings are resolved.

---

# Architecture Guidelines

- Service provider responsibilities: bindings (register), routes/migrations/events (boot).
- Module providers register in order — dependency order must be explicit or convention-based.
- Auto-discovery requires cache invalidation when modules change.
- Lazy-loaded modules reduce boot time but add complexity.

---

# Performance Considerations

- Each service provider adds boot time — 20+ module providers add 50-200ms.
- Deferred providers reduce boot impact.
- Route caching and config caching mitigate boot time.

---

# Security Considerations

- Module registration does not provide security isolation — all modules share the same application security context.

---

# Common Mistakes

1. **Missing provider registration:** Module exists but provider isn't registered. Cause: explicit registration forgotten. Consequence: routes 404, migrations don't run. Better: automate checks.

2. **Incorrect boot order:** Module A's boot() depends on B's bindings, but B is after A. Cause: ordering not considered. Consequence: resolution failures. Better: document and test boot order.

3. **Multiple modules in one provider:** Combining providers to reduce boot time. Cause: premature optimization. Consequence: defeats module independence. Better: one provider per module.

---

# Anti-Patterns

- **Duplicate registration**: Module registered both explicitly and via discovery — double booting.
- **Dead module registered**: Module no longer developed but still registered — wastes boot resources.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-03 Module internal structure | MMD-05 Module autonomy | MMD-09 Module dependency management |
| MMD-01 Module vs microservice | CPC-01 Interface contracts | MMD-12 Isolation enforcement |

---

# AI Agent Notes

- Always include a service provider in each generated module.
- Default to explicit registration for teams under 10 engineers.
- Generate `module.json` with metadata when scaffolding modules.

---

# Verification

- [ ] Each module has exactly one service provider
- [ ] Registration mechanism (explicit/auto) is documented
- [ ] Boot order is defined and tested
- [ ] No duplicate registration exists
- [ ] Dead/orphan modules are deregistered
