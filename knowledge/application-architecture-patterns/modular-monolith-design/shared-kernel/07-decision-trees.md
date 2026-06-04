# Decision Trees: Shared Kernel

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Shared kernel: what belongs in shared vs. modules
- **Knowledge Unit ID:** MMD-08
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Extract to shared vs duplicate across modules | Architecture | Code extraction |
| 2 | Business logic in shared vs module-owned | Architecture | Code placement |
| 3 | Framework imports in shared vs framework-agnostic | Architecture | Shared kernel design |

---

## Decision 1: Extract to shared vs duplicate across modules

### Context
The shared kernel should be minimal — extracted only when three or more independent modules genuinely need the same concept. Premature extraction creates wrong abstractions that are costlier to change than duplication. The "Rule of Three" guards against premature abstraction.

### Decision Tree

```
How many modules need this concept?
├── 1 → Place in that module only (not shared)
├── 2 → Duplicate — duplication is cheaper than wrong abstraction
└── 3+ → Consider extraction to shared kernel
    Is the concept stable (unlikely to diverge per module)?
    ├── YES → Extract to shared kernel
    └── NO → Postpone extraction — divergence will require un-sharing
```

### Rationale
The rule of three prevents premature extraction. When only two modules share a concept, duplication is cheaper and more flexible. The third module is the signal that the concept is genuinely cross-cutting. Even then, the concept must be stable — if it's still evolving, divergence will require costly extraction reversal.

### Recommended Default
Duplicate until the third module emerges; extract only when stable

### Risks
- Premature extraction: wrong abstraction that doesn't fit all consumers
- Premature extraction: shared code changes require coordination across all modules
- Never extraction: excessive duplication across 3+ modules creates maintenance burden

### Related Rules
- Extract at Rule of Three (MMD-08/05-rules.md)
- No Business Logic in Shared Kernel (MMD-08/05-rules.md)
- No Laravel Facades in Shared Kernel (MMD-08/05-rules.md)

### Related Skills
- Implement a Minimal Shared Kernel (MMD-08/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)

---

## Decision 2: Business logic in shared vs module-owned

### Context
Business logic and domain rules must stay in module-specific code. The shared kernel may contain only base value objects, foundation types, and utility interfaces. Shared business logic prevents independent module evolution — all modules are coupled to the same rules.

### Decision Tree

```
Does this code contain business rules or domain logic?
├── YES
│   Is this a cross-cutting compliance/legal rule that MUST apply identically everywhere?
│   ├── YES → May live in shared with comprehensive documentation; prefer duplication
│   └── NO → Business logic MUST stay in module-specific code
└── NO (base types, value objects, utility interfaces)
    Could any module reasonably want a different implementation?
    ├── YES → Place in module, not shared
    └── NO → Shared kernel is appropriate
```

### Rationale
Business logic in the shared kernel means every module is coupled to the same business rules. When Billing needs different tax calculation from Catalog, shared business logic prevents this. The only justifiable exception is compliance/legal rules that apply identically everywhere. For everything else, module ownership of business logic is non-negotiable.

### Recommended Default
Never put business logic in shared kernel

### Risks
- Shared business logic: prevents independent module evolution
- Shared business logic: changes require cross-module coordination
- Compliance exception misuse: developers use it as loophole for convenience

### Related Rules
- No Business Logic in Shared Kernel (MMD-08/05-rules.md)
- Extract at Rule of Three (MMD-08/05-rules.md)
- No Eloquent Models in Shared Kernel (MMD-08/05-rules.md)

### Related Skills
- Implement a Minimal Shared Kernel (MMD-08/06-skills.md)
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)

---

## Decision 3: Framework imports in shared vs framework-agnostic

### Context
The shared kernel should be free of Laravel-specific imports: no facades (`\DB`, `\Cache`, `\Event`), no helpers (`collect()`, `optional()`, `blank()`), no framework-dependent types. Framework imports in shared couple all modules to Laravel and make the shared kernel unusable outside Laravel context.

### Decision Tree

```
Does the import reference a Laravel facade, helper, or concrete class?
├── YES
│   Is there a Laravel contract (interface) that replaces the concrete import?
│   ├── YES → Use the contract interface instead — interfaces are acceptable
│   └── NO → The code belongs in the module's infrastructure layer, not shared
└── NO (pure PHP or PHP-standard interfaces)
    → Acceptable in shared kernel
```

### Rationale
The shared kernel should be as framework-agnostic as possible. Framework contracts (interfaces like `Illuminate\Contracts\Cache\Repository`) used as type hints are acceptable. Concrete framework classes, facades, or helpers create dependency on the framework throughout the shared kernel.

### Recommended Default
Pure PHP in shared kernel; Laravel contracts (interfaces only) as type hints

### Risks
- Facades in shared: all modules implicitly coupled to Laravel facade system
- Helpers in shared: makes testing harder, extraction to non-Laravel context impossible
- No contracts: shared kernel cannot interact with framework's service container

### Related Rules
- No Laravel Facades in Shared Kernel (MMD-08/05-rules.md)
- No Business Logic in Shared Kernel (MMD-08/05-rules.md)
- Assign Shared Kernel Ownership (MMD-08/05-rules.md)
- Keep Shared Kernel Small (MMD-08/05-rules.md)

### Related Skills
- Implement a Minimal Shared Kernel (MMD-08/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Design Shared Kernel for Bounded Contexts (DBC-03/06-skills.md)
