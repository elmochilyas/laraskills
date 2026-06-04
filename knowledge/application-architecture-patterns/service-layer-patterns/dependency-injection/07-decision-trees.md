# Decision Trees: Dependency Injection for Services and Actions

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Dependency injection for services and actions
- **Knowledge Unit ID:** SLP-09
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Constructor injection vs facade/service locator | Architecture | Class creation |
| 2 | Interface vs concrete class for dependency | Architecture | Dependency design |
| 3 | Monitor 5+ constructor dependencies: split vs keep | Architecture | Code review |

---

## Decision 1: Constructor injection vs facade/service locator

### Context
Constructor injection is the default mechanism for all required dependencies in services and actions. Facades (`\Cache::get()`, `\DB::table()`) and service locator (`app()`, `resolve()`) hide dependencies and make testing harder.

### Decision Tree

```
Is this a required dependency for the class to function?
├── YES
│   → Use constructor injection
│   Declare as typed constructor parameter with visibility
│   Is there a reason NOT to use constructor injection?
│   ├── YES (prototype, one-off script) → May accept shortcut with documented exception
│   └── NO → Constructor injection is the only correct approach
└── NO (optional dependency used only in specific methods)
    → Consider method injection or setter injection
    But evaluate: is it truly optional or should the class be split?
```

### Rationale
Constructor injection makes dependencies explicit, testable via mocking, and visible in the constructor signature. Facades hide dependency relationships — a service using `\Cache::get()` has an invisible dependency on the cache. Service locator calls (`app()`) are untestable without container manipulation.

### Recommended Default
Constructor injection for all required dependencies

### Risks
- Facades in services: hidden dependencies, untestable without mocking facades
- Service locator: runtime resolution failures, hard to mock
- Method injection for required deps: unclear what the class needs

### Related Rules
- Use Constructor Injection For Required Dependencies (SLP-09/05-rules.md)
- Depend On Interfaces, Not Concrete Classes (SLP-09/05-rules.md)
- Avoid Facades In Injected Services (SLP-09/05-rules.md)

### Related Skills
- Inject Service Dependencies via Constructor Injection (SLP-09/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)

---

## Decision 2: Interface vs concrete class for dependency

### Context
Services should depend on interfaces rather than concrete classes at variation points — where alternative implementations may exist (payment gateways, notification channels, storage drivers). For single-implementation services, interfaces add ceremony without benefit (YAGNI).

### Decision Tree

```
Could this dependency have multiple implementations (now or in future)?
├── YES (payment gateway, notification channel, storage driver)
│   → Depend on interface
│   Bind concrete implementation in service provider
│   Is there currently only one implementation?
│   ├── YES → Still use interface if variation is anticipated
│   └── NO (multiple exist) → Interface is clearly needed
└── NO (single implementation, no planned alternative)
    → Depend on concrete class directly
    Adding an interface is speculative overhead
```

### Rationale
Interface-based dependencies enable swapping implementations and simplify testing with mocks. However, creating an interface for every single-implementation service adds ceremony without value. The rule: interface at true variation points, concrete for stable single-implementation dependencies.

### Recommended Default
Interface at variation points; concrete for stable single-implementation dependencies

### Risks
- Too many interfaces: ceremony without benefit for single-implementation services
- Too few interfaces: hard to swap implementations, harder to mock
- Interface drift: interface changes without corresponding implementation updates

### Related Rules
- Depend On Interfaces, Not Concrete Classes (SLP-09/05-rules.md)
- Add Interfaces Only When Variation Is Needed (SLP-09/05-rules.md)
- Avoid Facades In Injected Services (SLP-09/05-rules.md)

### Related Skills
- Inject Service Dependencies via Constructor Injection (SLP-09/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)

---

## Decision 3: Monitor 5+ constructor dependencies: split vs keep

### Context
Five or more constructor parameters signals that a class is doing too much. Each dependency represents a responsibility. High dependency count correlates with low cohesion, difficult testing, and frequent changes.

### Decision Tree

```
How many constructor dependencies does this class have?
├── 0-2 → Focused class — healthy
├── 3-4 → Acceptable — monitor for growth
├── 5-7 → Warning — consider splitting
│   Do the dependencies serve distinct, separable concerns?
│   ├── YES → Split class into smaller services
│   └── NO → Dependencies are related to a single concern
│       → Group some into a facade/aggregate service if appropriate
└── 8+ → Red alert — must split
    The class has too many responsibilities
```

### Rationale
Constructor dependencies count is a simple proxy for class cohesion. A class with 8 dependencies touches 8 different subsystems, making it fragile and hard to test. Splitting the class into focused services reduces the dependency count per class and improves maintainability.

### Recommended Default
Split when dependencies reach 5+; must split at 8+

### Risks
- Splitting prematurely: excessive service fragmentation (10 tiny services)
- Not splitting: god service, hard to test, fragile
- Grouping unrelated dependencies into a single "service" facade: hides real coupling

### Related Rules
- Watch For Five-Plus Constructor Dependencies (SLP-09/05-rules.md)
- No Constructor Work — Assign Only (SLP-09/05-rules.md)
- Avoid Circular Dependencies (SLP-09/05-rules.md)

### Related Skills
- Inject Service Dependencies via Constructor Injection (SLP-09/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
