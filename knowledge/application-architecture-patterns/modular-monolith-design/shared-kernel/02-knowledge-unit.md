# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Shared kernel: what belongs in shared vs. modules
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The shared kernel is the minimal set of code that multiple modules share. It includes base classes, utility interfaces, value objects, and foundation types that are genuinely cross-cutting. The rule is: shared code must be stable—it changes rarely, and when it does, every module updates simultaneously. Common mistakes include putting too much in shared (modules become coupled via shared code) or too little (code is duplicated across modules). The shared kernel should be the smallest possible set that avoids unacceptable duplication.

---

# Core Concepts

**What belongs in shared kernel:**
- Base value objects (`Money`, `Email`, `Address`)
- Cross-cutting interfaces (`EventBus`, `Logger`)
- Foundation types (`AggregateRoot`, `Entity`, `ValueObject` base classes)
- Utility functions (date formatting, string manipulation)
- Shared constants and enums used across modules
- Contract interfaces that are truly shared (not owned by one module)

**What belongs in modules:**
- Business logic (services, actions, use cases)
- Domain models and Eloquent models
- Module-specific value objects
- Controllers, requests, resources
- Module-specific events

---

# Mental Models

**The "Stable Foundation" model:** The shared kernel is the foundation. Everyone builds on it, but no one changes it without broad coordination. It should be the most stable code in the project.

**The "Duplication is cheaper than Wrong Abstraction" model (Sandi Metz):** Before adding shared code, consider: is this genuinely shared, or would two copies be more maintainable? Wrong shared code creates coupling that's harder to remove than duplication.

**The "Evolutionary Shared Kernel" model:** The shared kernel emerges from duplication, not from upfront design. When the third module uses the same utility, extract it to shared. The first two times, duplication is acceptable.

---

# Internal Mechanics

The shared kernel typically lives in a `app/Shared/` or `src/Shared/` directory with its own PSR-4 prefix:
```json
{
  "psr-4": {
    "App\\": "app/",
    "Shared\\": "src/Shared/"
  }
}
```

Or within the module structure:
```
modules/
├── Shared/
│   ├── ValueObjects/Money.php
│   ├── Contracts/EventBus.php
│   ├── BaseClasses/AggregateRoot.php
│   └── Enums/Currency.php
├── Billing/
└── Catalog/
```

---

# Patterns

**Shared kernel as a module:** Treat `Shared/` as a special module that all other modules depend on. The Shared module has no dependencies on other modules.

**Stable interface principle:** Shared kernel interfaces and classes must have comprehensive tests, thorough documentation, and a higher bar for change.

**Change review process:** Shared kernel changes require broader review than module changes because they affect all modules.

---

# Architectural Decisions

**Extract to shared when:** Three or more independent modules use the same concept, and the concept is stable (unlikely to change differently for different modules).

**Duplicate across modules when:** The concept might diverge between modules, or only two modules use it, or the concept is still evolving.

**Never share:** Business logic, validation rules (if they differ by module), module-specific events, controllers.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eliminates cross-module duplication | Shared code becomes coupling point | Changing shared code affects all modules |
| Single source of truth for value objects | Premature extraction creates wrong abstraction | Extracted before divergence pattern emerges |
| Reduced code volume | Higher change coordination cost | Shared kernel changes need broader review |

---

# Performance Considerations

The shared kernel has no direct performance impact. However, badly designed shared value objects that are instantiated in hot paths (e.g., `Money` in every response) can create GC pressure. Profile if needed.

---

# Production Considerations

Assign shared kernel ownership. A team or individual should be responsible for reviewing all shared kernel changes.

---

# Common Mistakes

**Shared kernel as dumping ground:** Everything that feels "common" goes into shared. Modules become coupled via huge shared namespaces.

**Business logic in shared kernel:** Placing cross-cutting business rules (discount calculation, tax logic) in shared. Business logic belongs in modules.

**Framework imports in shared kernel:** The shared kernel imports Laravel Facades, coupling all modules to Laravel.

---

# Failure Modes

**Shared kernel rot:** The shared kernel grows without structure. Value objects, utility functions, and base classes mix in the same directory. Eventually, no one knows what's in it.

**Tight coupling via shared model:** Placing a shared Eloquent model (`User`) in the shared kernel. Every module accesses it directly, creating implicit coupling between all modules through the shared model.

---

# Ecosystem Usage

The `nwidart/modules` package includes a `Core` module template for common code. Spatie's open source packages typically keep shared code minimal.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-03 Module internal structure | DBC-03 Shared kernel design | DBC-01 Bounded context identification |
| MMD-01 Module vs microservice | CPC-01 Interface contracts | DBC-04 Anti-corruption layer |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
