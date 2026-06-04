# Decision Trees: Interface Contracts for Services

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Interface contracts for services: when and why
- **Knowledge Unit ID:** SLP-13
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Interface vs no interface | Architecture | Service design phase |
| 2 | Mirroring interface vs abstracted interface | Architecture | Interface definition |
| 3 | Scattered bindings vs centralized provider | Architecture | Service provider registration |

---

## Decision 1: Interface vs no interface

### Context
Interface-per-class without reason is the most common Laravel over-engineering mistake. Interfaces add ceremony (extra files, bindings, indirection) and should only exist at real variation points. Three factors determine the need: implementation multiplicity, module boundary crossing, and architectural style.

### Decision Tree

```
Does the service have (or will have) multiple implementations?
├── YES → Add interface
│   Is the interface consumed across module boundaries?
│   ├── YES → Add interface in shared module
│   └── NO → Add interface in same module as implementations
└── NO (single implementation, no planned alternative)
    Is this a Clean Architecture project with port-adapter requirements?
    ├── YES → Add interface (architectural convention)
    └── NO → Skip interface
        Is the service an infrastructure service (payment, storage, notification)?
        ├── YES → Consider adding interface (variation likely over time)
        └── NO → Skip interface (business service with single implementation)
```

### Rationale
The YAGNI principle applies: do not add interfaces speculatively when only one implementation exists. Infrastructure services (payment, storage, notification) are more likely to gain alternatives over time. Business services (UserService, OrderService) rarely need swapping. Clean Architecture demands interfaces at layer boundaries by convention.

### Recommended Default
No interface for business services with single implementation

### Risks
- Missing interface when swapping needed: harder to swap implementation later
- Interface-per-class syndrome: ceremony without value, increased file count
- Inconsistency: some services have interfaces, others don't — confuses the team

### Related Rules
- Add Interfaces Only At Variation Points (SLP-13/05-rules.md)
- Avoid Interface-Per-Class Syndrome (SLP-13/05-rules.md)
- Be Consistent As A Team (SLP-13/05-rules.md)

### Related Skills
- Design Interface Contracts for Services at Variation Points (SLP-13/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Apply Dependency Rule (LAP-04/06-skills.md)

---

## Decision 2: Mirroring interface vs abstracted interface

### Context
A common anti-pattern is creating an interface that mirrors the implementation's methods exactly — same names, same signatures, same parameters. This provides zero abstraction. A useful interface should represent a meaningful design contract at a different level of abstraction: `PaymentGateway::charge(Money $amount, PaymentSource $source)` rather than `StripePaymentService::chargeStripe()`.

### Decision Tree

```
Does the interface method have the same name and signature as the implementation?
├── YES
│   Does the method represent a stable business concept (not an implementation detail)?
│   ├── YES → Acceptable if the interface groups related operations at a higher level
│   └── NO → Redesign — interface should abstract, not mirror
│       Can you generalize multiple implementations under a unified contract?
│       ├── YES → Define interface at purpose level (what, not how)
│       └── NO → Interface is ceremonial — consider removing
└── NO (interface provides meaningful abstraction)
    → Good — interface captures the contract, not the implementation
```

### Rationale
An interface that mirrors implementation exactly is a leaky abstraction — it provides no indirection, no decoupling, and no test benefit beyond what mocking concrete classes already provides. The interface should capture the "what" (business contract) while the implementation handles the "how" (specific technology). When the interface signature changes with every implementation change, it adds friction without value.

### Recommended Default
Design interface at the business contract level, not the implementation level

### Risks
- Interface mirrors implementation: no abstraction, ceremony without value
- Interface at wrong abstraction level: leaky abstraction, interface churn
- Over-abstracted interface: too generic, loses type safety and usability

### Related Rules
- Avoid Interfaces That Mirror Implementation Exactly (SLP-13/05-rules.md)
- Watch For Interface Pollution (SLP-13/05-rules.md)
- Be Consistent As A Team (SLP-13/05-rules.md)

### Related Skills
- Design Interface Contracts for Services at Variation Points (SLP-13/06-skills.md)
- Design Feature-Oriented Repositories (SLP-15/06-skills.md)
- Apply Domain-Driven Design Boundaries (DBC-01/06-skills.md)

---

## Decision 3: Scattered bindings vs centralized provider

### Context
Interface-to-implementation bindings can be registered inline (`app()->bind()`) throughout the codebase or centralized in a dedicated Service Provider. Scattered bindings are harder to audit, debug, and maintain. A single service provider for all interface bindings provides a contract registry that developers can reference.

### Decision Tree

```
Are bindings currently scattered across controllers, commands, and middleware?
├── YES → Consolidate into a single service provider
│   Do different consumers need different implementations of the same interface?
│   ├── YES → Use contextual binding in the service provider
│   │   $this->app->when(ConsumerA::class)
│   │       ->needs(PaymentGateway::class)
│   │       ->give(StripeGateway::class);
│   └── NO → Simple bind in service provider
│       $this->app->bind(PaymentGateway::class, StripeGateway::class);
└── NO (bindings already in service provider)
    → Maintain single provider for all interface bindings
```

### Rationale
Centralized bindings in a service provider create a single source of truth for the interface-to-implementation mapping. Scattered bindings make it impossible to audit which implementations are used where. Contextual binding in the service provider handles cases where different consumers need different implementations, without scattering bindings.

### Recommended Default
All interface bindings in one dedicated service provider

### Risks
- Scattered bindings: hard to audit, debug, or change globally
- Bindings in controllers: violates single responsibility, hard to test
- Missing binding notification: runtime error when interface is resolved without binding

### Related Rules
- Bind Interface To Implementation In Service Provider (SLP-13/05-rules.md)
- Default To Transient Binding For All Business Services (SLP-12/05-rules.md)
- Audit Singleton Services For Statelessness (SLP-12/05-rules.md)

### Related Skills
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Inject Service Dependencies (SLP-09/06-skills.md)
- Manage Service State in Octane (SLP-19/06-skills.md)
