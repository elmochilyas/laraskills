# Decision Trees: Module Registration and Discovery

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module registration and discovery mechanisms
- **Knowledge Unit ID:** MMD-04
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Explicit registration vs auto-discovery | Architecture | Project setup |
| 2 | One provider per module vs multiple providers | Code Organization | Module creation |
| 3 | Deferred provider vs eager provider | Performance | Provider optimization |

---

## Decision 1: Explicit registration vs auto-discovery

### Context
Modules must be registered so their routes, migrations, config, and service providers are discovered. Explicit registration lists each provider manually in `config/app.php`. Auto-discovery scans the modules directory using convention-based detection. The choice depends on team size, module count, and need for boot order control.

### Decision Tree

```
Is the team smaller than 10 engineers?
├── YES
│   Is the module count under 20?
│   ├── YES → Explicit registration (predictable, debuggable, clear boot order)
│   └── NO → Consider auto-discovery (20+ providers make config/app.php unwieldy)
└── NO (team ≥10)
    Are modules developed independently by separate sub-teams in a monorepo?
    ├── YES → Auto-discovery (avoids central coordination for registration)
    └── NO → Explicit registration (clearer governance)
```

### Rationale
Explicit registration is simpler and more predictable for the majority of projects. Boot order is unambiguous, debugging is straightforward, and new developers can see all modules at a glance. Auto-discovery is justified only when module count exceeds 20 or when modules are developed independently by separate teams.

### Recommended Default
Explicit registration in `config/app.php`

### Risks
- Auto-discovery with implicit boot order: resolution failures from wrong ordering
- Missing provider registration: routes return 404, migrations don't run
- Duplicate registration (both explicit and auto): provider boots twice

### Related Rules
- One Provider Per Module (MMD-04/05-rules.md)
- Explicit Registration for Small-Medium Projects (MMD-04/05-rules.md)
- Document Registration Mechanism (MMD-04/05-rules.md)
- Avoid Duplicate Registration (MMD-04/05-rules.md)

### Related Skills
- Configure Module Registration and Discovery (MMD-04/06-skills.md)
- Implement Module Internal Structure (MMD-03/06-skills.md)

---

## Decision 2: One provider per module vs multiple providers

### Context
A module should have exactly one service provider that handles all bootstrapping (bindings, routes, migrations, config, events). Multiple providers per module signal that the module should be split. The single provider creates a clear bootstrap entry point.

### Decision Tree

```
Does the module need only container bindings (no boot-time logic)?
├── YES
│   Is Laravel automatic event discovery needed?
│   ├── YES → One main provider + one EventServiceProvider (max 2 total)
│   └── NO → Single service provider is sufficient
└── NO (module needs routes, migrations, views, events in boot)
    Is boot logic manageable in a single boot() method?
    ├── YES → One provider, group boot logic with clear sections
    └── NO → Module is doing too much — consider splitting the module
```

### Rationale
A single provider creates a predictable, locatable entry point. When boot logic is too large for one method, the module itself is likely too large. The only exception is when Laravel's automatic event discovery requires a separate EventServiceProvider.

### Recommended Default
Exactly one service provider per module

### Risks
- Multiple providers: scattered registration, hard to see what the module does
- Multiple providers: extraction requires provider consolidation
- Too much boot logic: module may need splitting

### Related Rules
- One Provider Per Module (MMD-04/05-rules.md)
- Explicit Registration for Small-Medium Projects (MMD-04/05-rules.md)
- Define Module Boot Order (MMD-04/05-rules.md)

### Related Skills
- Configure Module Registration and Discovery (MMD-04/06-skills.md)
- Establish Module Autonomy (MMD-05/06-skills.md)

---

## Decision 3: Deferred provider vs eager provider

### Context
Providers that only register container bindings (no boot-time logic) can implement `DeferrableProvider` to defer loading until their bindings are resolved. This reduces boot time. Eager providers boot on every request regardless of whether their bindings are used.

### Decision Tree

```
Does the provider only register container bindings in register()?
├── YES
│   Is the boot() method empty or purely optional?
│   ├── YES → DeferrableProvider — reduces boot time
│   └── NO (boot() has logic) → Eager provider — boot logic is needed
└── NO (provider loads routes, migrations, events in boot())
    → Eager provider — boot logic is required on every request
```

### Rationale
Deferred providers reduce application boot time because they only load when their bindings are actually resolved. However, deferred providers sacrifice the ability to run boot-time logic. If a provider has any boot-time responsibilities (routes, migrations, events), it must be eager.

### Recommended Default
Eager provider for modules with routes/migrations; DeferredProvider for pure binding modules

### Risks
- Deferred with boot logic: boot logic never runs, causing missing routes/migrations
- All eager with 20+ modules: 50-200ms boot overhead
- Forgetting to deregister dead modules: wasted boot resources

### Related Rules
- Use Deferred Service Provider (MMD-04/05-rules.md)
- One Provider Per Module (MMD-04/05-rules.md)
- Deregister Dead Modules (MMD-04/05-rules.md)

### Related Skills
- Configure Module Registration and Discovery (MMD-04/06-skills.md)
- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)
