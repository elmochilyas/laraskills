# Decision Trees: Service Binding Strategies

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service binding strategies: singleton vs. transient
- **Knowledge Unit ID:** SLP-12
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Singleton vs transient binding | Architecture | Service registration |
| 2 | Explicit binding vs auto-resolution | Architecture | Container config |
| 3 | Factory pattern vs transient request-scoped context | Architecture | Stateful service design |

---

## Decision 1: Singleton vs transient binding

### Context
Default to transient binding for all business services. The performance cost is negligible (~1-5μs per resolution). Singleton should only be used for provably stateless infrastructure services. Under Octane, stateful singletons are a top-3 source of production bugs.

### Decision Tree

```
Is the service provably stateless (no mutable properties, no request-scoped deps)?
├── YES
│   Does the service have measurable instantiation overhead?
│   ├── YES → Consider singleton (after statelessness audit)
│   └── NO → Transient is fine (default behavior)
└── NO (service has mutable properties or request-scoped dependencies)
    → Use transient (never singleton)
    Is the service running under Octane?
    ├── YES → Transient is REQUIRED — singletons persist across requests
    └── NO → Transient is still recommended; singleton adds risk
```

### Rationale
Transient is the safe default. The performance difference between transient and singleton is negligible for business services (~4μs per request). Singleton adds risk of state leaks, especially under Octane. Only use singleton when statelessness is strictly audited and instantiation overhead is measured and significant.

### Recommended Default
Transient for all business services

### Risks
- Singleton with mutable state under Octane: cross-request data leaks
- Singleton without audit: undetected state leaks in production
- Transient for every resolution: theoretically more allocations, but negligible

### Related Rules
- Default To Transient Binding For All Business Services (SLP-12/05-rules.md)
- Audit Singleton Services For Statelessness (SLP-12/05-rules.md)
- No Singleton For Convenience Without Audit (SLP-12/05-rules.md)

### Related Skills
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Manage Service State in Octane (SLP-19/06-skills.md)
- Ensure Octane Compatibility (LAP-15/06-skills.md)

---

## Decision 2: Explicit binding vs auto-resolution

### Context
Laravel's container auto-resolves concrete classes without explicit binding. Explicit binding is needed for: interface-to-implementation mapping, singleton registration, contextual binding, and tagged bindings. For most business services, no explicit binding is needed.

### Decision Tree

```
Does the constructor depend on an interface (not concrete class)?
├── YES → Explicit binding required
│   Bind interface to implementation in service provider
│   `$this->app->bind(PaymentGateway::class, StripePaymentGateway::class)`
└── NO (depends on concrete class)
    → No explicit binding needed
    Container auto-resolves concrete classes
    Do you need singleton behavior?
    ├── YES → Explicit singleton binding with statelessness audit
    └── NO → No binding at all (auto-resolve transient)
```

### Rationale
Laravel auto-resolves concrete classes without any binding. This covers most business services. Explicit binding is only needed when you depend on an interface (so the container needs to know which implementation to use) or when you need singleton behavior. Explicit binding for concrete classes adds ceremony without value.

### Recommended Default
No explicit binding for concrete classes; explicit bindings only for interface mappings

### Risks
- Explicit binding for concrete classes: ceremony without value
- Missing interface binding: container throws BindingResolutionException
- Accidental singleton via auto-resolution: container resolves singletons for classes that implement no interface

### Related Rules
- Default To Transient Binding For All Business Services (SLP-12/05-rules.md)
- Audit Singleton Services For Statelessness (SLP-12/05-rules.md)
- Use Factory Pattern For Stateful Services (SLP-12/05-rules.md)

### Related Skills
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Inject Service Dependencies (SLP-09/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)

---

## Decision 3: Factory pattern vs transient request-scoped context

### Context
When a service needs request-scoped context (authenticated user, current tenant), two approaches: pass context as method arguments (simpler, transient-friendly) or use a factory that produces fresh instances with context (decouples context from service). Factories are for services that need context injected in the constructor.

### Decision Tree

```
Does the service need request-scoped context in most methods?
├── YES
│   Can the context be received as a method parameter?
│   ├── YES → Pass as method argument (simpler, no state leak risk)
│   └── NO → Service must have context available (legacy, framework pattern)
│       → Use factory pattern to create fresh instances with context
└── NO → No special handling — regular transient service
```

### Rationale
Passing context as method arguments is always simpler and safer than storing it on the service. It eliminates state leak risk entirely. The factory pattern is a fallback for cases where the context must be injected in the constructor (e.g., framework-required patterns, legacy code). Transient + method parameters is the recommended approach.

### Recommended Default
Pass request-scoped context as method parameters; factory only when context must be injected

### Risks
- Storing context on service (singleton or transient): Octane state leaks if singleton
- Factory for every service: unnecessary complexity
- Method parameter explosion: too many parameters passing the same context everywhere

### Related Rules
- Use Factory Pattern For Stateful Services (SLP-12/05-rules.md)
- No Service Should Store Mutable Request-Scoped State (SLP-12/05-rules.md)
- Under Octane, Prefer Transient For All Services (SLP-12/05-rules.md)

### Related Skills
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Manage Service State in Octane (SLP-19/06-skills.md)
- Inject Service Dependencies (SLP-09/06-skills.md)
