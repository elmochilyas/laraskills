# Decision Trees: Module Internal Structure Conventions

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module internal structure conventions
- **Knowledge Unit ID:** MMD-03
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Consistent structure vs per-module custom structure | Code Organization | Module scaffold |
| 2 | Contracts/ as public face vs direct internal imports | Architecture | Inter-module design |
| 3 | Colocated tests vs application-level tests | Testing | Module creation |

---

## Decision 1: Consistent structure vs per-module custom structure

### Context
Every module should follow the same internal directory structure: Contracts/, Models/, Services/, Actions/, Events/, Providers/, database/migrations/, tests/. Consistency across modules is critical — developers must navigate any module without documentation. Custom per-module structures create cognitive overhead and prevent tooling reuse.

### Decision Tree

```
Will this module contain multiple business operations (not just a single service)?
├── YES
│   Will other developers need to navigate this module?
│   ├── YES → Full standard structure required
│   └── NO → Full structure still recommended for future-proofing
└── NO (very simple module — single service, no models)
    Could the module grow in complexity later?
    ├── YES → Scaffold full structure with empty directories
    └── NO → May omit empty directories, but maintain namespace convention
```

### Rationale
Consistency is the primary benefit of a structural convention. Developers should be able to find any class in any module without looking up documentation. The cost of scaffolding empty directories is negligible; the cost of restructuring later is real. Even simple modules benefit from the pattern for future-proofing.

### Recommended Default
Full standard structure for all modules

### Risks
- Inconsistent structure: time wasted searching for files across modules
- Tooling complexity: PHPStan, test runners require per-module configuration
- Extraction harder: restructuring needed before extraction is possible

### Related Rules
- Consistent Internal Structure (MMD-03/05-rules.md)
- Distinct Namespace Per Module (MMD-03/05-rules.md)
- One Service Provider Per Module (MMD-03/05-rules.md)

### Related Skills
- Implement Module Internal Structure Conventions (MMD-03/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)

---

## Decision 2: Contracts/ as public face vs direct internal imports

### Context
Contracts/ is the only directory that other modules should import from (Services/, Models/, Actions/ are internal). Directly importing internal classes from another module defeats the primary isolation mechanism and makes extraction impossible without rewriting consumers.

### Decision Tree

```
Does another module need to interact with this module's functionality?
├── YES
│   Is the interaction synchronous (method call)?
│   ├── YES → Define a contract in Contracts/ and bind the implementation
│   └── NO (async via events)
│       Does the consumer need a return value?
│       ├── YES → Contract needed for request-response
│       └── NO → Events are sufficient; no contract needed
└── NO → No contract needed — keep all classes internal with @internal markers
```

### Rationale
Contracts/ defines the module's public API. Everything else is an implementation detail. If a consumer needs synchronous interaction, the interface goes in Contracts/. For fire-and-forget async notifications, events are sufficient. Internal classes marked with @internal communicate intent that they should not be imported externally.

### Recommended Default
Always use Contracts/ for synchronous inter-module interactions

### Risks
- Direct class imports: internal refactoring breaks consumers
- Empty contracts: maintenance overhead without value
- Bypassed contracts: enforcement must be in place (architecture tests)

### Related Rules
- Contracts/ as Public Face (MMD-03/05-rules.md)
- @internal for Non-Public Classes (MMD-03/05-rules.md)
- Minimal Contracts/ Interfaces (MMD-03/05-rules.md)

### Related Skills
- Implement Module Internal Structure Conventions (MMD-03/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)

---

## Decision 3: Colocated tests vs application-level tests

### Context
Module tests should live inside the module directory (modules/{Module}/tests/), not in the application-level tests/ directory. Colocated tests make module extraction trivial — the entire directory moves with the module. Application-level test directories create a dependency on the monolith's test infrastructure.

### Decision Tree

```
Does the test exercise only this module's code (unit/single-module feature)?
├── YES
│   Will this module potentially be extracted to a microservice?
│   ├── YES → Colocate in module's tests/ directory
│   └── NO → Colocate anyway — extraction readiness is always the rule
└── NO (test exercises multiple modules — integration)
    Keep the test at application-level tests/ directory
    └── Minimize cross-module integration tests; prefer contract testing
```

### Rationale
Extraction-ready design requires that the module is self-contained, including its test suite. Colocated tests eliminate the need to reorganize tests during extraction. Cross-module integration tests are the exception — they test the composition, not the module itself, and belong at the application level.

### Recommended Default
Colocate module tests in modules/{Module}/tests/; minimal integration tests at application level

### Risks
- App-level tests: extraction requires moving and reorganizing test files
- No colocated tests: module CI execution requires filtering by namespace
- Too many integration tests: fragile, slow, cross-module coupling

### Related Rules
- Colocate Module Tests (MMD-03/05-rules.md)
- Consistent Internal Structure (MMD-03/05-rules.md)
- Distinct Namespace Per Module (MMD-03/05-rules.md)

### Related Skills
- Implement Module Internal Structure Conventions (MMD-03/06-skills.md)
- Establish Module Autonomy (MMD-05/06-skills.md)
