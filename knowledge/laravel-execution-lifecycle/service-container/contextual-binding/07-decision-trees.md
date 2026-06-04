# Contextual Binding — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Contextual Binding
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Contextual binding vs separate interfaces | Different consumers need different implementations | Architecture; maintainability; flexibility |
| 2 | Contextual binding vs middleware + scoped binding | Binding decision depends on consumer vs request | Correctness; request-data awareness |
| 3 | Interface contextual vs primitive contextual binding | Binding class vs primitive value | API consistency; type safety |

---

## Decision 1: Contextual Binding vs Separate Interfaces

### Decision Context
Different consumers need different implementations of the same conceptual service. Choose between contextual binding (one interface, per-consumer binding) and separate interfaces (distinct contracts).

### Decision Criteria
- **Number of consumers with unique needs**: 1-3 → contextual binding; 4+ → separate interfaces
- **Do consumers use the same contract?** Same method signatures → contextual binding; Different methods → separate interfaces
- **Will new consumers be added?** Few → contextual binding; Many → separate interfaces scales better
- **Domain semantics**: Same concept → contextual binding; Different concepts → separate interfaces

### Decision Tree
```
Multiple consumers, different implementations?
├── 1-3 CONSUMERS need different implementations
│   ├── Same conceptual service (e.g., ReportFormatter)
│   │   └── Use CONTEXTUAL BINDING — clean, minimal interface
│   └── Different conceptual services
│       └── Use SEPARATE INTERFACES — model the domain correctly
├── 4+ CONSUMERS with unique implementations
│   ├── Each consumer has its own needs
│   │   └── Consider SEPARATE INTERFACES — contextual binding list grows large
│   ├── Some consumers share implementations
│   │   └── Use CONTEXTUAL BINDING for the shared ones
│   └── Unlikely to change
│       └── Either approach works; contextual binding is simpler
├── Implementation VARIES BY RUNTIME DATA, not consumer
│   ├── Based on request, user, or environment
│   │   └── DO NOT use contextual binding — use middleware + scoped binding
│   └── Based on which consumer class is using it
│       └── Use CONTEXTUAL BINDING — this is the right use case
└── Domain modeling perspective
    ├── Same methods, same semantics, different behavior
    │   └── Contextual binding reflects the variation
    ├── Different semantics (even if same methods)
    │   └── Separate interfaces — they represent different concepts
    └── Interface would need parameter to differentiate
        └── Contextual binding eliminates the parameter
```

### Rationale
Contextual binding is ideal for 1-3 consumers with different needs for the same interface. As the number grows, the contextual binding list becomes a maintenance burden, and separate interfaces provide clearer contracts. The key question is whether the consumers truly use the same conceptual service (contextual binding) or different ones (separate interfaces).

### Default
Use contextual binding for 1-3 consumers with the same interface. Use separate interfaces when 4+ consumers have unique needs or the semantics differ.

### Risks
- Too many contextual rules → hard to audit which consumer gets which implementation
- Using separate interfaces when contextual binding would suffice → unnecessary abstraction
- Not using contextual binding → factory methods and `if` statements in consumer code

### Related Rules/Skills
- Use Contextual Binding Instead of Factory Methods for Interface Variation
- Avoid Overusing Contextual Binding — Consider Separate Interfaces
- Skill: Implement Contextual Binding for Interface Variation

---

## Decision 2: Contextual Binding vs Middleware + Scoped Binding

### Decision Context
The correct implementation depends on either the consumer class (compile-time known) or request data (runtime known). Choose the right mechanism.

### Decision Criteria
- **Decision based on consumer identity?** (which class is asking) → contextual binding
- **Decision based on request data?** (auth user, query param, header) → middleware + scoped binding
- **Decision known at registration time?** → contextual binding
- **Decision varies per request?** → middleware + scoped binding

### Decision Tree
```
Implementation varies by...?
├── CONSUMER CLASS IDENTITY (known at registration time)
│   ├── ReportController gets PdfFormatter, AnalyticsController gets CsvFormatter
│   │   └── Use CONTEXTUAL BINDING — consumer-based, registered in provider
│   └── Static, won't change per request
│       └── CONTEXTUAL BINDING is correct
├── REQUEST DATA (known only at request time)
│   ├── Format chosen via ?format=csv query parameter
│   │   └── Use MIDDLEWARE + SCOPED BINDING — reads request, sets binding
│   ├── Different for authenticated vs guest users
│   │   └── Use MIDDLEWARE + SCOPED BINDING — runtime decision
│   └── Varies per request even for same consumer
│       └── MIDDLEWARE + SCOPED BINDING is correct
├── COMBINATION: consumer + request data
│   ├── Different consumers, and each varies by request
│   │   └── Middleware sets scoped binding per request, contextual binding not needed
│   └── Same consumer, variation only by request
│       └── Middleware + scoped binding
└── TESTING override
    ├── Override per test case
    │   └── instance() in test — replace binding temporarily
    └── Override per consumer
        └── Contextual binding — overrides apply in tests too
```

### Rationale
Contextual binding is resolved at construction time based on the consumer class identity — it cannot inspect request data. For runtime-dependent decisions, a middleware that inspects the request and sets a scoped binding provides the correct implementation per request. Using contextual binding for runtime data doesn't work because the closure is resolved once per consumer, not once per request.

### Default
Use contextual binding for consumer-based variation. Use middleware + scoped binding for request-based variation.

### Risks
- Contextual binding for runtime data → closure resolved once, all subsequent requests get the same implementation
- Middleware + scoped binding for consumer variation → more complex than needed; consumer identity is known statically
- Contextual binding with closure that reads request → closure captured at provider registration time, not request time

### Related Rules/Skills
- Do Not Use Contextual Binding for Runtime Request Data
- Skill: Implement Contextual Binding for Interface Variation
