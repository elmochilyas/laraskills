# Decision Trees: Facade Pattern Risks at Context Boundaries

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Facade pattern risks at context boundaries
- **Knowledge Unit ID:** CPC-12
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Context-level facade vs capability-based interfaces | Architecture | Cross-context contract structure |
| 2 | Single facade vs multiple small facades | Architecture | Facade scope and splitting |
| 3 | Facade as only entry point vs direct capability interface access | Architecture | Consumer access pattern |

---

## Decision 1: Context-level facade vs capability-based interfaces

### Context
A context-level facade (`BillingFacade`) exposes all capabilities of a bounded context through a single class. Capability-based interfaces expose each capability through its own interface (`PaymentProcessor`, `InvoiceGenerator`, `TaxCalculator`). The facade provides a unified API but creates coupling — every consumer depends on the entire context. Capability interfaces allow each consumer to depend only on what it actually uses.

### Decision Tree

```
Is this for a third-party library or an internal context boundary?
├── Third-party library (Stripe, Twilio, Mailchimp)
│   → Facade is acceptable
│   The facade isolates the third-party API from the rest of the application
│   Changes in the third-party library only affect the facade
│   └── Is the third-party API complex enough to warrant a facade?
│       ├── YES → Use a facade
│       └── NO → Consider direct dependency with an anti-corruption layer
├── Internal context boundary (cross-context call)
│   → Capability-based interfaces are REQUIRED
│   One interface per capability, not one facade per context
│   └── How many capabilities does the context expose?
│       ├── 1 → One interface is fine (not a facade, just an interface)
│       ├── 2-5 → Multiple small interfaces
│       └── 6+ → Definitely not a single facade — split
│           Each capability gets its own focused interface
└── Mixed (context with third-party integrations)
    → Use facades for third-party wrappers, capability interfaces for internal boundaries
    These are separate concerns — don't mix them in one facade
```

### Rationale
Context-level facades become god objects. When a context exposes 15 capabilities through a single facade, every consumer depends on all 15 methods even if they only use 1. Every change to any capability potentially affects all consumers. Capability-based interfaces solve this: consumers depend only on what they use, changes are isolated, and the dependency graph is explicit. The only exception is third-party library wrapping, where a facade is appropriate to isolate the external API.

### Recommended Default
Capability-based interfaces; reserve facades for third-party library wrappers

### Risks
- Context facade: god object, every consumer coupled to all capabilities
- Capability interfaces with no grouping: too many tiny interfaces are hard to discover
- Facade for internal boundary: unnecessary coupling hub

### Related Rules
- Never use context-level facades (CPC-12/05-rules.md)
- Cap small facades at 5-7 methods (CPC-12/05-rules.md)
- Never expose internal types through the facade (CPC-12/05-rules.md)

### Related Skills
- Avoid Facade Pattern Risks at Context Boundaries (CPC-12/06-skills.md)
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)

---

## Decision 2: Single facade vs multiple small facades

### Decision Tree

```
How many methods does the facade currently have?
├── 1-5 methods covering a single concern
│   → Keep as is if it's a true single-concern facade
│   Examples: `PaymentGatewayFacade` (charge, refund, status)
│   This is appropriate scope for a third-party wrapper
│   └── Is the facade exposing multiple concerns?
│       ├── YES → Split (see below)
│       └── NO → Keep — it's appropriately scoped
├── 6-10 methods — approaching the threshold
│   → Evaluate for splitting
│   Do the methods cover multiple concerns?
│   ├── YES → Split into capability interfaces
│   │   Payment + Invoicing + Tax → three separate interfaces
│   └── NO (single concern, 8 methods) → Still consider split
│       8 methods in one interface is borderline
│       Can any methods be grouped into sub-interfaces?
├── 11+ methods — must split
│   → This is already a god facade
│   Split into multiple capability-based interfaces immediately
│   Each new interface covers one capability (1-5 methods each)
└── Is the facade for a third-party library?
    ├── YES → Still cap at 5-7 methods
    │   Complex third-party → multiple facades per service area
    └── NO (internal) → It shouldn't exist at all
        Replace with capability-based interfaces
```

### Rationale
A facade that keeps growing is a sign it needs decomposition. The 5-7 method threshold is a guideline — when a facade covers multiple concerns, it should be split regardless of method count. Each facade or interface should cover a single, well-defined capability. A `ShippingFacade` with 12 methods covering rate calculation, label generation, tracking, address validation, pickup scheduling, and insurance is actually multiple capabilities pushed into one class.

### Recommended Default
Split facades at 5-7 methods; one capability per interface

### Risks
- God facade: coupling hub, every consumer depends on everything
- Too many tiny interfaces: interface explosion, hard to discover/discoverability
- No facade at all for third-party: direct dependency on external API

### Related Rules
- Cap small facades at 5-7 methods (CPC-12/05-rules.md)
- Never use context-level facades (CPC-12/05-rules.md)
- Do not make the facade the only entry point (CPC-12/05-rules.md)

### Related Skills
- Avoid Facade Pattern Risks at Context Boundaries (CPC-12/06-skills.md)
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Enforce Interface Segregation Principle (COS-03/06-skills.md)

---

## Decision 3: Facade as only entry point vs direct capability interface access

### Decision Tree

```
Can consumers use capability interfaces directly?
├── YES — facade is optional, not mandatory
│   → Correct approach
│   Consumers can inject capability interfaces directly:
│   `public function __construct(private PaymentProcessor $payment)`
│   The facade exists as a convenience for complex multi-step operations
│   But simple operations don't need to go through the facade
│   Pros: consumers aren't forced through a bloated facade
├── NO — facade is the only way to access the context's functionality
│   → Anti-pattern — facade is a bottleneck
│   Every consumer must go through the facade even for simple operations
│   Even simple reads like `getPaymentHistory` require the facade
│   └── Why is the facade the only entry point?
│       ├── Design decision → Change it
│       │   Expose capability interfaces directly through DI
│       │   Make the facade optional
│       └── Accidental → Refactor to expose interfaces
│           The facade was the first implementation; add interfaces
└── Does the consumer need complex multi-step orchestration?
    ├── YES → Facade is useful for this specific orchestration
    │   A facade orchestrating: validate address → calculate shipping → generate label
    │   Consumer gets a single method: `$shipping->ship($order)`
    └── NO → Capability interface direct access is sufficient
```

### Rationale
Making the facade the only entry point forces every consumer through the same gateway, regardless of how simple the operation is. This creates a bottleneck: the facade grows as every new feature adds a method to it, and every consumer is coupled to the entire surface area. Capability interfaces should be the primary access mechanism — consumers inject what they need. The facade should be a convenience, not a requirement. For complex orchestration, a facade or a dedicated orchestrator service is appropriate, but simple operations should bypass it.

### Recommended Default
Capability interfaces as the primary entry point; facade as optional convenience

### Risks
- Facade-only access: bottleneck, coupling, forces all consumers through one class
- No facade for complex orchestration: consumer must orchestrate multi-step processes
- Facade too thin: adds no value, just delegation boilerplate

### Related Rules
- Do not make the facade the only entry point (CPC-12/05-rules.md)
- Never use context-level facades (CPC-12/05-rules.md)
- Never expose internal types through the facade (CPC-12/05-rules.md)

### Related Skills
- Avoid Facade Pattern Risks at Context Boundaries (CPC-12/06-skills.md)
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Structure Module Dependencies (MMD-04/06-skills.md)
