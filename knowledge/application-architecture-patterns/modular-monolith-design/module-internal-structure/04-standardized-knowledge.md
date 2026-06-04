# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module internal structure conventions
Knowledge Unit ID: MMD-03
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Each module should have a consistent internal structure with a miniature layered architecture: own Models, Services, Contracts, Events, and optionally Http/Controllers, Jobs, and Tests. Consistency across modules is critical — developers should navigate any module without documentation.

---

# Core Concepts

Standard structure:
```
modules/Billing/
├── src/
│   ├── Contracts/     # Public interfaces for inter-module communication
│   ├── Models/        # Eloquent models (owned by this module)
│   ├── Services/      # Internal business logic
│   ├── Actions/       # Single-operation classes
│   ├── Events/        # Module-domain events
│   ├── Listeners/
│   ├── Jobs/
│   ├── Http/Controllers/, Requests/, Resources/
│   ├── Providers/     # BillingServiceProvider.php
│   └── routes/        # api.php, web.php
├── database/migrations/, factories/
├── config/
└── tests/Feature/, Unit/
```

---

# When To Use

- Any modular monolith with 2+ modules
- New module creation — scaffold with standard structure
- Refactoring existing modules for consistency

---

# When NOT To Use

- Modules with very simple logic (single file may suffice for tiny modules)
- Before module boundaries are stable (avoid re-scaffolding)

---

# Best Practices

- **Define Contracts/ as the public face of the module.** WHY: Other modules only depend on contracts, never internal classes. This is the primary isolation mechanism.
- **Follow the same structure across all modules.** WHY: Developers navigate any module without documentation — structure is predictable.
- **Use `@internal` docblocks or PHP 8 internal attributes** for non-public classes. WHY: Communicates intent that these classes should not be imported from other modules.
- **Colocate tests within the module.** WHY: Makes module extraction cleaner — the test directory moves with the module.
- **Each module has its own service provider** for routes, bindings, events. WHY: The provider is the module's bootstrap entry point and registration mechanism.

---

# Architecture Guidelines

- Module has own namespace: `Modules\Billing`, `Modules\Catalog`.
- Own service provider registered in `config/app.php`.
- Own route files loaded by provider.
- Own migrations in dedicated directory.
- Contracts-first: interface-available, implementation-hidden.
- HTTP layer in module if module exposes endpoints.
- Views in module for monolith with server-rendered pages.

---

# Performance Considerations

- Module structure doesn't affect runtime performance.
- Service provider boot time scales with number of providers, not directory depth.

---

# Security Considerations

- Module internal structure doesn't provide security isolation — apply auth at route level.

---

# Common Mistakes

1. **Inconsistent structure across modules:** Some have Contracts/, some don't. Cause: no template. Consequence: unpredictable navigation. Better: enforce module template.

2. **Internal classes imported from other modules.** Cause: bypassing Contracts/. Consequence: module isolation defeated. Better: enforce with architecture tests.

3. **Empty contracts:** Contracts/ mirrors every internal class. Cause: not designing interfaces for consumers. Consequence: maintenance overhead without value. Better: expose only what other modules need.

---

# Anti-Patterns

- **Module structure abandonment:** Files added to modules without following conventions over time.
- **Missing module boundary enforcement**: Contracts exist but are routinely bypassed.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-01 Module vs microservice | MMD-04 Module registration | MMD-05 Module autonomy |
| MMD-02 Boundary identification | MMD-08 Shared kernel | MMD-12 Isolation enforcement |

---

# AI Agent Notes

- When generating new modules, scaffold the full standard structure including Contracts/, Models/, Services/, Providers/.
- Place inter-module communication interfaces in Contracts/ — never suggest importing internal classes from other modules.
- Include a service provider in every module.

---

# Verification

- [ ] All modules follow the same internal structure convention
- [ ] Contracts/ is the only directory imported from other modules
- [ ] Each module has its own service provider
- [ ] Module migrations are in module-specific directory
- [ ] Module tests are colocated
