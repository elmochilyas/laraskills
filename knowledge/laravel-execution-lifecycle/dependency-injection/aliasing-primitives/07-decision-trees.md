# Decision Trees — Aliasing Primitives

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-07: Aliasing Primitives |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Primitive Binding vs Config Object Injection | Whether to bind individual primitives or inject a configuration object | Every class with config needs | Medium |
| D02 | give() Value Source | Where the value in `give()` should come from (config, env, hardcoded) | Every primitive binding | Medium |
| D03 | Default Value vs Explicit Binding | Whether to rely on a parameter's default value or register an explicit primitive binding | Every constructor with primitives | Medium |

---

## D01: Primitive Binding vs Config Object Injection

### Decision Context
A class needs configuration values (API keys, timeouts, URLs). You can either bind each primitive individually or inject a configuration object.

### Criteria
1. **Primitive count**: How many primitive values does the class need?
2. **Grouping**: Do the values logically belong to a single configuration concern?
3. **Usage pattern**: Are the values used independently or always accessed together?
4. **Testability**: Can a configuration object be easily mocked?

### Decision Tree
```
Class needs configuration values
├── Does the class need 1-3 primitive values?
│   ├── Yes → Use individual primitive bindings (simple, explicit, self-documenting)
│   └── No (4+ primitives) → Do the values logically form a single configuration concept?
│       ├── Yes → Create a configuration DTO/object (cleaner than 4+ individual bindings)
│       └── No → Split the class (sign of over-injection or SRP violation)
├── Are the values used together in every method?
│   ├── Yes → Config object (consolidates related config)
│   └── No (used independently) → Individual primitive bindings (each method gets only what it needs)
```

### Rationale
Individual primitive bindings (`needs('$apiKey')`) are explicit and self-documenting for 1-3 values. Beyond 3, the constructor signature becomes cluttered. A configuration DTO groups related values, keeps the constructor clean, and provides a single point for mocking in tests.

### Default
1-3 primitives → individual bindings. 4+ → configuration DTO.

### Risks
- 5+ individual primitive bindings = cluttered constructor, hard to read.
- Config object that's just a bag of unrelated values = no cohesion.
- Config object that's too specific = needs updating when configuration changes.

### Related Rules/Skills
- Skill: Aliasing Primitives

---

## D02: give() Value Source

### Decision Context
You are writing a primitive binding and need to specify what value `give()` should return.

### Criteria
1. **Value mutability**: Does the value change between environments (dev vs production)?
2. **Sensitivity**: Is the value a secret (API key, password)?
3. **Source of truth**: Where is the canonical value stored (config, env, constant)?
4. **Caching**: Is the value resolved at registration time or build time?

### Decision Tree
```
Deciding what to pass to give()
├── Is the value a secret (API key, password, token)?
│   ├── Yes → Use config()-> referencing .env: give(config('services.stripe.secret'))
│   │   └── NEVER hardcode: give('sk_live_12345') is a security risk
│   └── No → Does the value change between environments?
│       ├── Yes → Use config() or env(): give(config('app.timeout'))
│       └── No (constant across all environments) → Is it truly constant?
│           ├── Yes → Can be a class constant or default value — no binding needed
│           └── No → Use config() for flexibility
```

### Rationale
`give()` accepts any value — hardcoded, config-driven, or computed. Config-driven values (`config('services.key')`) are best because they use the application's configuration system and respect environment-specific `.env` files. Hardcoded values should only be used for true constants that never change. Secrets must never be hardcoded.

### Default
Use `config()`. Never hardcode secrets. Hardcode only true constants.

### Risks
- Hardcoding secrets = exposure in codebase, not env-configurable.
- Using `env()` instead of `config()` = bypasses config caching.
- Config value resolved at registration time = changes to config after registration won't be reflected.

### Related Rules/Skills
- Skill: Aliasing Primitives

---

## D03: Default Value vs Explicit Binding

### Decision Context
A constructor parameter has a primitive type with a sensible default. Should you rely on the default or register an explicit primitive binding?

### Criteria
1. **Value stability**: Does the default value work for all consumers?
2. **Override frequency**: Will this value need to be changed per consumer or per environment?
3. **Testability**: Does the test suite need to swap this value?
4. **Visibility**: Should the bound value be visible in the service provider (documented)?

### Decision Tree
```
Primitive constructor parameter with default
├── Does the default value work for ALL consumers in ALL environments?
│   ├── Yes → No binding needed (default is sufficient)
│   └── No → Do some consumers need different values?
│       ├── Yes → Use contextual primitive binding for those consumers
│       └── No → Does the value change per environment?
│           ├── Yes → Register a global primitive binding with config-driven give()
│           └── No → (default works — no action needed)
├── Does the test suite need to swap this value frequently?
│   ├── Yes → Register binding (makes swapping via app()->instance() easier)
│   └── No → Default is fine
```

### Rationale
Default values are the simplest approach — no binding registration, no maintenance. They work when the default is correct for all consumers. Explicit bindings override defaults and are necessary when different consumers or environments need different values. The tradeoff is maintenance: each binding is another line to manage.

### Default
Rely on default values unless a different value is needed. Register explicit bindings only when the default is wrong for some cases.

### Risks
- No explicit binding when one is needed = wrong default used silently.
- Unnecessary explicit bindings = harder to see what the actual default is.
- Default + binding both defined = binding takes precedence; updating the default has no effect until the binding is removed.

### Related Rules/Skills
- Skill: Aliasing Primitives
