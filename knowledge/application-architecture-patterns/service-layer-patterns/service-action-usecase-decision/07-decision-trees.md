# Decision Trees: Service vs. Action vs. Use Case

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service vs. Action vs. Use Case: decision criteria
- **Knowledge Unit ID:** SLP-10
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Service + Action vs Use Case pattern | Architecture | Project inception |
| 2 | Service method vs separate Action class | Architecture | Operation design |
| 3 | Documented single pattern vs per-feature choice | Organization | Team standards |

---

## Decision 1: Service + Action vs Use Case pattern

### Context
Service + Action is the recommended default for most Laravel applications. Use Cases add abstraction layers (interfaces, DTOs, bindings) that are justified when framework independence is required. The decision depends on team size, delivery mechanisms, and Clean Architecture requirements.

### Decision Tree

```
Does the application have multiple delivery mechanisms (HTTP + CLI + queue)?
├── YES
│   Do these mechanisms share the same business logic?
│   ├── YES → Consider Use Cases (framework independence needed)
│   └── NO → Service + Action suffices
└── NO (single delivery mechanism — HTTP)
    Is the team larger than 10 developers?
    ├── YES → Consider Use Cases (formal contracts help coordination)
    │   Is Clean Architecture a stated project requirement?
    │   ├── YES → Use Cases
    │   └── NO → Service + Action is the sweet spot
    └── NO → Service + Action is correct
```

### Rationale
Service + Action provides structure without Clean Architecture overhead. Use Cases add formal input/output DTOs, repository interfaces, and framework independence. The cost is more files and abstraction layers. Only adopt Use Cases when the benefits (framework independence, formal contracts, multi-delivery mechanism) exceed the abstraction cost.

### Recommended Default
Service + Action for most Laravel applications

### Risks
- Use Cases for simple CRUD: over-engineering, slower development
- Service + Action for multi-delivery mechanism: framework coupling, unreusable logic
- Architecture paralysis: debating pattern instead of shipping

### Related Rules
- Default To Service Plus Action For Most Laravel Applications (SLP-10/05-rules.md)
- Adopt Use Cases When Framework Coupling Pain Exceeds Abstraction Cost (SLP-10/05-rules.md)
- Document The Team's Chosen Pattern Explicitly (SLP-10/05-rules.md)

### Related Skills
- Decide Between Service, Action, and Use Case Patterns (SLP-10/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Use Case Classes (SLP-06/06-skills.md)

---

## Decision 2: Service method vs separate Action class

### Context
Within Service + Action, decide whether an operation merits its own Action class or should be a method on a Service. Actions provide independent testability but increase file count. Service methods are simpler but can lead to god services.

### Decision Tree

```
Is this a single leaf-node operation with 2-4 dependencies?
├── YES
│   Could this operation be reused from multiple services?
│   ├── YES → Extract to Action class (reusable)
│   └── NO → Service method may suffice
│       Will the service have more than 10 methods?
│       ├── YES → Extract to Action to prevent god service
│       └── NO → Service method is fine
└── NO (multi-step orchestration with sub-operations)
    → Keep in Service, which may delegate to Actions
```

### Rationale
Actions prevent god services by forcing each operation into its own class. The cost is file count increase; the benefit is independent testability and reuse. Extract to Action when: the operation is a leaf node, has clear boundaries, or the service is growing too large.

### Recommended Default
Service method for simple operations; Action class when independently testable or reusable

### Risks
- Too many actions: class explosion for trivial operations
- Too few actions: god service with 30+ methods
- Action for service's job: action calling actions (bypasses orchestration layer)

### Related Rules
- Default To Service Plus Action For Most Laravel Applications (SLP-10/05-rules.md)
- Use A Decision Tree For What Goes Where (SLP-10/05-rules.md)
- Avoid Pattern Soup (SLP-10/05-rules.md)

### Related Skills
- Decide Between Service, Action, and Use Case Patterns (SLP-10/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 3: Documented single pattern vs per-feature choice

### Context
Consistency matters more than which specific pattern is chosen. A codebase where some features use services, some use actions, and some use use cases — without clear rules — creates confusion and onboarding friction. Document the team's pattern choices explicitly.

### Decision Tree

```
Is the team's architectural pattern documented?
├── YES
│   Is the documentation followed in practice?
│   ├── YES → Consistent — ideal state
│   └── NO → Patterns are drifting — review and enforce
└── NO
    → Document immediately
    Is there one dominant pattern in the existing code?
    ├── YES → Document that as the standard
    └── NO → Pattern soup — choose the best fit and migrate
        Is pattern migration too costly right now?
        ├── YES → Document current patterns and plan migration
        └── NO → Migrate to chosen pattern
```

### Rationale
Inconsistency is worse than any single pattern choice. Developers need to know: "When I create a feature, what pattern do I use?" Without documentation, each developer makes their own choice, creating pattern soup. Document the decision and enforce it in code review.

### Recommended Default
Document the chosen pattern and apply it consistently across the codebase

### Risks
- Pattern soup: different features use different patterns — confusion, onboarding friction
- No documentation: new developers don't know the convention
- Undocumented migration: transitioning patterns without documenting causes inconsistency period

### Related Rules
- Document The Team's Chosen Pattern Explicitly (SLP-10/05-rules.md)
- Avoid Pattern Soup (SLP-10/05-rules.md)
- Avoid Architecture Paralysis (SLP-10/05-rules.md)

### Related Skills
- Decide Between Service, Action, and Use Case Patterns (SLP-10/06-skills.md)
- Document Architecture Decisions (ADR) (AEG-07/06-skills.md)
