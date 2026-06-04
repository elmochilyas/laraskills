# Decision Trees: Use Case Classes

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Use Case classes with DTO contracts
- **Knowledge Unit ID:** SLP-06
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Use Case vs Service vs Action | Architecture | Class creation |
| 2 | Business logic in use case vs domain entity | Architecture | Logic placement |
| 3 | Framework coupling in use case vs framework-independent | Architecture | Dependency design |

---

## Decision 1: Use Case vs Service vs Action

### Context
Three patterns for organizing business logic: Use Cases (single business intent, DTO contracts), Services (grouped related operations by entity), Actions (single leaf-node operation). Use Cases are the most formal — they bridge the gap between overly granular actions and overly broad services.

### Decision Tree

```
Is this a complete business intent (user goal)?
├── YES
│   Does the operation need input/output DTOs for multiple delivery mechanisms?
│   ├── YES → Use Case class (formal contract, framework-independent)
│   └── NO → Service method may suffice (simpler, less ceremony)
└── NO (technical operation, not a business goal)
    Is it a single leaf-node operation?
    ├── YES → Action class
    └── NO → Extract to Service class method
```

### Rationale
Use Cases are the right choice when the operation represents a complete business interaction (Register User, Process Checkout) and needs to be invocable from multiple entry points (HTTP, CLI, queue). They provide formal input/output contracts via DTOs. Services and actions are lighter-weight alternatives for simpler scenarios.

### Recommended Default
Use Case for complex business intents with DTO contracts; Service/Action for simpler operations

### Risks
- Use Case for simple CRUD: ceremony without benefit
- Service for complex intents: no formal DTO contract, framework coupling
- Use case proliferation: 100+ uses cases for a simple application

### Related Rules
- Business Logic in Domain, Not Use Cases (SLP-06/05-rules.md)
- Use Case Must Not Call Other Use Cases (SLP-06/05-rules.md)
- Use Cases Manage Transactions (SLP-06/05-rules.md)
- Single Business Intent (SLP-06/05-rules.md)

### Related Skills
- Design Use Case Classes with DTO Contracts (SLP-06/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 2: Business logic in use case vs domain entity

### Context
Use cases orchestrate — they coordinate domain objects, call repositories, and manage side effects. Business rules (discount calculations, state transitions, validations) belong in domain entities or domain services, not in use cases. Placing domain logic in use cases prevents reuse across use cases and violates Clean Architecture layering.

### Decision Tree

```
Is this code a domain rule or workflow step?
├── Domain rule (discount calculation, eligibility check, state validation)
│   → Place in Domain entity or Domain service
│   Can it be expressed as a method on the domain model?
│   ├── YES → Add method to entity (e.g., $order->isEligibleForDiscount())
│   └── NO → Extract to Domain service class
└── Workflow step (call repository, dispatch event, send notification)
    → Keep in Use Case (orchestration is the use case's job)
```

### Rationale
Use cases orchestrate but should not implement domain logic. Domain logic embedded in use cases cannot be shared across use cases. A "user is eligible for discount" rule used in CheckoutUseCase and AdminDiscountUseCase must be in the domain layer, not duplicated in both use cases.

### Recommended Default
Domain rules in domain entities/services; orchestration in use cases

### Risks
- Domain logic in use cases: duplication across multiple use cases
- Domain logic in use cases: harder to test domain rules independently
- No domain layer at all: application becomes transaction scripts, not proper domain modeling

### Related Rules
- Business Logic in Domain, Not Use Cases (SLP-06/05-rules.md)
- Use Case Must Not Call Other Use Cases (SLP-06/05-rules.md)
- Depend on Repository Interfaces (SLP-06/05-rules.md)

### Related Skills
- Design Use Case Classes with DTO Contracts (SLP-06/06-skills.md)
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
- Implement Value Objects (LAP-07/06-skills.md)

---

## Decision 3: Framework coupling in use case vs framework-independent

### Context
Use cases must have no framework imports: no `Illuminate\Http\Request`, no facades (`\DB`, `\Auth`), no service container calls. Use cases should depend only on repository interfaces and DTOs. Framework coupling prevents use cases from being used from CLI, queue, or other non-HTTP contexts.

### Decision Tree

```
Does the use case import any framework-specific code?
├── YES (Illuminate\*, Facades\*, Laravel helpers)
│   Can the dependency be replaced with an interface?
│   ├── YES → Inject the interface instead
│   │   Example: Replace `\DB::transaction()` → interface TransactionManager
│   └── NO → Refactor — use case is too coupled
│       Is this a framework-specific concern (DB, cache, queue)?
│       ├── YES → Abstract behind an interface and inject
│       └── NO → Move the logic out of the use case
└── NO (pure PHP types, interfaces, DTOs only)
    → Framework-independent — correct
```

### Rationale
Framework independence is the key value of use cases. A use case that imports `\Illuminate\Support\Facades\DB` can only run in a Laravel context, defeating the purpose of separating application logic from framework. By depending on interfaces, use cases become testable, portable, and delivery-mechanism-agnostic.

### Recommended Default
Use cases have zero framework imports — only interfaces, DTOs, and domain types

### Risks
- Framework-coupled use cases: cannot be invoked from CLI or queue
- Framework-coupled use cases: hard to test (requires Laravel boot)
- Complete interface abstraction: over-engineering for simple applications

### Related Rules
- No Framework Imports (SLP-06/05-rules.md)
- Depend on Repository Interfaces (SLP-06/05-rules.md)
- Business Logic in Domain, Not Use Cases (SLP-06/05-rules.md)

### Related Skills
- Design Use Case Classes with DTO Contracts (SLP-06/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Build Dependency Injection (SLP-09/06-skills.md)
