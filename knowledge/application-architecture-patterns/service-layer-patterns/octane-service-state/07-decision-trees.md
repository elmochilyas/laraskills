# Decision Trees: Service Layer in Octane — State Management

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service layer in Octane: state management considerations
- **Knowledge Unit ID:** SLP-19
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Method parameter vs service property for request data | Architecture | Service design |
| 2 | Transient vs singleton binding under Octane | Architecture | Service registration |
| 3 | Individual parameters vs context object | Architecture | Method signature design |

---

## Decision 1: Method parameter vs service property for request data

### Context
Under Octane's persistent worker model, services are resolved once per worker, not once per request. Storing request-specific data (authenticated user, current tenant, locale) as service properties causes cross-request contamination — Request A's admin user leaks to Request B. All request-specific data must be passed as method parameters.

### Decision Tree

```
Is the data different per request (user, tenant, locale, timezone)?
├── YES → Must be a method parameter, NEVER a service property
│   `getOrders(User $user, ?Tenant $tenant): Collection`
│   Does the service currently store this as a property?
│   ├── YES → Refactor immediately — this is a bug under Octane
│   │   `$this->user = Auth::user()` → `getOrders($user)`
│   └── NO → Good — keep it as method parameter
└── NO (data is application-wide config: API keys, URLs, DB config)
    → Can be constructor dependency (injected once, shared across requests)
    Is the dependency provably stateless?
    ├── YES → Constructor injection is fine
    └── NO → Use factory pattern to create per-request instances
```

### Rationale
Service properties that hold request data are the #1 source of Octane bugs. Under FPM, each request gets a fresh process, so service properties are naturally isolated. Under Octane, the worker persists and so do service properties. Method parameters are the only safe way to pass request-specific data. The rule is absolute: if the value changes per request, it must be a method parameter.

### Recommended Default
All request-specific data as method parameters; constructors only for stateless dependencies

### Risks
- User data leak across requests: critical security and compliance violation
- Tenant cross-contamination in multi-tenant apps: data privacy violation
- Intermittent bugs: state leak appears only under load in production

### Related Rules
- All Request-Specific Data Must Be Method Arguments (SLP-19/05-rules.md)
- No Captured Request Context On Services (SLP-19/05-rules.md)
- No Mutable Properties On Services (SLP-19/05-rules.md)

### Related Skills
- Manage Service State for Octane Compatibility (SLP-19/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Ensure Octane Compatibility (LAP-15/06-skills.md)

---

## Decision 2: Transient vs singleton binding under Octane

### Context
Octane amplifies the risk of singleton services: a singleton with mutable state persists across requests, leaking data. Transient services create a new instance per resolution, preventing state leaks. The default should always be transient. Singleton requires proof of statelessness.

### Decision Tree

```
Is the service provably stateless (no mutable properties, no request-scoped deps)?
├── YES → Singleton is safe
│   Has a statelessness audit been performed and documented?
│   ├── YES → Singleton acceptable with documented audit
│   │   `// Audited stateless on 2024-01-15 by [name]`
│   └── NO → Audit first, then decide
│       Audit checklist: no mutable properties, no Auth/request in constructor
└── NO (service has mutable properties or request-scoped deps)
    → Transient is REQUIRED
    Is instantiation overhead measurable and significant?
    ├── YES → Use factory pattern (per-request factory with caching of expensive deps)
    └── NO → Transient default is correct
        Does the service run under Octane?
        ├── YES → Transient is non-negotiable — safety over performance
        └── NO → Transient is still recommended; singleton adds risk
```

### Rationale
Transient is the safe default under Octane. The performance difference between transient and singleton is negligible (~1-5μs per resolution). PHP 8+ JIT handles transient allocation efficiently. Singleton should be an explicit, documented decision backed by a statelessness audit — never a default. The cost of one undetected state leak bug far exceeds the cost of transient resolution for thousands of requests.

### Recommended Default
Transient for all services; singleton only with documented statelessness audit

### Risks
- Singleton without audit: undetected state leaks in production
- Singleton with mutable state under Octane: cross-request data contamination
- Transient for every resolution: theoretically more allocations, but negligible cost

### Related Rules
- Default To Transient Binding For All Services (SLP-19/05-rules.md)
- Audit Existing Services Before Enabling Octane (SLP-19/05-rules.md)
- Don't Assume FPM Behavior Applies To Octane (SLP-19/05-rules.md)

### Related Skills
- Manage Service State for Octane Compatibility (SLP-19/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Audit Octane Readiness (AEG-09/06-skills.md)

---

## Decision 3: Individual parameters vs context object

### Context
Passing request-specific data as method parameters is safe but can lead to parameter bloat when multiple context values are needed (user, tenant, locale, timezone, IP, device). A context object bundles these values into a single parameter, simplifying method signatures while keeping request data explicit and avoiding stateful properties.

### Decision Tree

```
How many request-specific values does the method need?
├── 1-2 values → Individual parameters are fine
│   `getOrders(User $user): Collection`
│   `createOrder(User $user, ?string $locale = null): Order`
├── 3-5 values → Context object recommended
│   `getDashboard(RequestContext $context): array`
│   Context object: `User $user, Tenant $tenant, string $locale, ?Timezone $tz`
└── 6+ values → Definitely use context object
    Does any intermediate service create or modify the context?
    ├── YES → Consider immutable value object with copy-on-write
    │   `$context->withTenant($tenant)` returns new context
    └── NO → Simple readonly DTO is sufficient
```

### Rationale
Context objects solve the parameter bloat problem while maintaining the safety of explicit method parameters. They bundle user, tenant, locale, and other request-scoped values into one immutable value object. This keeps method signatures manageable (one `$context` parameter instead of 5 individual ones) and makes it easy to add new context values without changing signatures. Pass context to every service method that needs request data.

### Recommended Default
Context object (`RequestContext`) for 3+ request-specific values

### Risks
- Parameter bloat: 5+ parameters on every method — hard to read and maintain
- Context object as magic bag: developers add everything to context, losing explicitness
- Mutable context: context modified mid-request causes confusion — make it immutable

### Related Rules
- Use Context Object Pattern For Request Data (SLP-19/05-rules.md)
- All Request-Specific Data Must Be Method Arguments (SLP-19/05-rules.md)
- No Mutable Properties On Services (SLP-19/05-rules.md)

### Related Skills
- Manage Service State for Octane Compatibility (SLP-19/06-skills.md)
- Implement Data Transfer Objects (SLP-05/06-skills.md)
- Ensure Octane Compatibility (LAP-15/06-skills.md)
