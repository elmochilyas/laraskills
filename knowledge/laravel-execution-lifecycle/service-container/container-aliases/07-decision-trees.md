# Container Aliases — Decision Trees

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **KU:** Container Aliases
- **Last Updated:** 2026-06-02

---

## Decision Inventory

| # | Decision | Typical Context | Impact |
|---|----------|-----------------|--------|
| 1 | Register alias vs use FQCN directly | Creating alternative name for a binding | Convenience; discoverability; maintenance |
| 2 | Single alias vs multiple aliases per binding | Backward compatibility vs simplicity | Complexity; collision risk |
| 3 | Override core alias vs create new alias | Framework alias conflicts with custom needs | Framework stability; package compatibility |

---

## Decision 1: Register Alias vs Use FQCN Directly

### Decision Context
A service needs to be accessible by a key. Choose between registering an alias for convenience or using the FQCN directly.

### Decision Criteria
- **FQCN is long and used frequently?** → alias improves readability
- **Facade support needed?** → alias maps Facade accessor to binding
- **Backward compatibility needed?** (refactored class name) → alias for old name
- **Type-hinting in constructors?** Use FQCN; aliases are for string-based resolution

### Decision Tree
```
Convenience name for a service binding?
├── Service is accessed via STRING-BASED RESOLUTION
│   ├── Facade: getFacadeAccessor() returns a string
│   │   └── MUST register alias — Facade resolves via the string key
│   ├── Helper function: app('cache'), config('app')
│   │   └── Alias provides short-hand
│   └── Dynamic resolution: resolve('payments')
│       └── Alias makes dynamic resolution cleaner
├── Service is accessed via TYPE-HINTING
│   ├── Constructor injection uses interface/class name
│   │   └── Use FQCN — type-hints work with the canonical name
│   └── Alias not needed for constructor injection
├── BACKWARD COMPATIBILITY
│   ├── Refactored class/interface name
│   │   └── Register alias: alias(NewClass::class, OldClass::class)
│   ├── Old code still uses old class name in type-hints
│   │   └── Alias resolves OldClass → NewClass
│   └── Allows gradual migration
└── READABILITY
    ├── FQCN is long (>50 chars) and used in multiple places
    │   └── Register short alias: 'payments' for PaymentGateway::class
    ├── FQCN is short and clear
    │   └── Alias not needed — use FQCN directly
    └── Alias makes code more concise
        └── Register alias if used in many route/controller definitions
```

### Rationale
Aliases are primarily for string-based resolution (Facades, helpers) and backward compatibility. For constructor injection, the FQCN is the correct identifier — aliases don't add value there. Registering an alias for every binding creates unnecessary indirection.

### Default
Register aliases for Facade accessors and backward compatibility. Use FQCN directly for constructor injection.

### Risks
- Alias for non-existent binding → `BindingResolutionException` at resolution time
- Too many aliases → maintenance burden, unclear which is canonical
- Alias collision with package alias → silent override

### Related Rules/Skills
- Register Alias in the Same Provider as the Target Binding
- Use Canonical Name for `bound()` and `forgetInstance()` Checks
- Skill: Register and Resolve Container Aliases

---

## Decision 2: Single vs Multiple Aliases per Binding

### Decision Context
A binding may need multiple names. Choose between one alias for simplicity or multiple for flexibility.

### Decision Criteria
- **Multiple Facades referencing same service?** → multiple aliases
- **Interface + class aliases for same binding?** → multiple (backward compat)
- **Need both short name and FQCN?** → alias short name; FQCN works natively

### Decision Tree
```
How many aliases for this binding?
├── Single primary name (most common)
│   ├── One clear canonical alias
│   │   └── Register ONE alias — 'cache' for CacheManager
│   ├── One Facade accessor
│   │   └── Register ONE alias — matches Facade string
│   └── Simplest, clearest approach
│       └── SINGLE alias
├── Multiple names for backward compatibility
│   ├── Old interface name → New class name
│   │   └── Register alias for old name
│   ├── Multiple old names referencing same service
│   │   └── Register separate aliases for each old name
│   └── Each alias maintains compatibility for different consumers
├── Multiple Facades or helpers
│   ├── Cache:: and CacheManager facade → same instance
│   │   └── Multiple aliases — one per accessor
│   └── app('cache') and app('cache.store') → same instance
│       └── Multiple aliases — both resolve to same singleton
└── Risks of multiple aliases
    ├── `bound()` returns true for any alias — may be misleading
    ├── `forgetInstance('alias')` may not clear the correct cached instance
    └── More names = more maintenance when refactoring
```

### Rationale
A single canonical alias per binding is clearest. Multiple aliases add value for backward compatibility and multiple-Facade scenarios but increase complexity. The core framework pattern of having 2-3 aliases per binding (short name + FQCN variants) is a reasonable guide.

### Default
One alias per binding. Add more only when backward compatibility or multiple Facades require it.

### Risks
- Too many aliases → maintenance burden, unclear which is primary
- `forgetInstance('alias')` behavior: uses canonical name; alias may not work
- Alias-to-alias chains → add unnecessary indirection

### Related Rules/Skills
- Register Alias in the Same Provider as the Target Binding
- Avoid Creating Circular Alias Chains
- Skill: Register and Resolve Container Aliases

---

## Decision 3: Override Core Alias vs Create New Alias

### Decision Context
A custom service has a name that conflicts with a framework core alias. Decide whether to override the core alias or choose a different name.

### Decision Criteria
- **Semantic match?** Your service is a replacement for the core? → override (careful); Different service → new alias
- **Impact on packages**: Overriding core alias may break packages relying on original
- **Documented override**: Intentional, tested, documented → override acceptable

### Decision Tree
```
Alias name conflicts with a core framework alias?
├── Custom service REPLACES the core service
│   ├── Custom cache driver, custom mailer
│   │   └── Override core alias intentionally
│   ├── Must test EVERYTHING — packages may depend on original
│   │   └── Override if necessary; document impact
│   └── Consider: does the replacement implement the same contract?
│       └── Must implement same interface for compatibility
├── Custom service is UNRELATED to the core service
│   ├── Your 'cache' service is a report cache, not CacheManager
│   │   └── DO NOT override — use a DIFFERENT name
│   ├── Your 'auth' service is a custom auth mechanism
│   │   └── DO NOT override 'auth' — use 'auth.custom' or similar
│   └── Choose distinctive name to prevent collision
├── Impact analysis
│   ├── Packages that resolve make('cache')
│   │   └── Get your service instead of CacheManager — may break
│   ├── Facade accessor: Cache::getFacadeAccessor() returns 'cache'
│   │   └── Overriding breaks Cache facade
│   └── Third-party providers expect original alias → your override breaks them
└── Better alternatives
    ├── Register your service under a different alias
    │   └── $app->alias(YourService::class, 'your-service')
    ├── Bind to a different abstract
    │   └── $app->singleton(YourService::class)
    └── Only override if you intend to replace the core service AND have tested all downstream consumers
```

### Rationale
Core aliases are used by packages, Facades, and framework internals. Overriding them can silently break third-party code that depends on the original mapping. If your service genuinely replaces the core service (implements the same interface, intended as a drop-in), overriding may be appropriate but must be thoroughly tested.

### Default
Do NOT override core aliases. Use a distinctive, namespaced alias name for custom services.

### Risks
- Breaking packages that use `make('cache')`, `app('db')`, etc.
- Cache facade returning custom service instead of CacheManager
- Hard-to-debug "service returned wrong type" errors in third-party packages

### Related Rules/Skills
- Avoid Creating Circular Alias Chains
- Skill: Debug Alias Chain Failures
