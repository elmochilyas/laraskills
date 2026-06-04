# Decision Trees: Module Autonomy

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module autonomy: routes, migrations, config, tests per module
- **Knowledge Unit ID:** MMD-05
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Module routing: module-level vs central routes | Code Organization | Route creation |
| 2 | Module migrations: module-level vs central migrations | Database | Migration creation |
| 3 | Config key namespacing: namespaced vs bare keys | Code Organization | Config creation |

---

## Decision 1: Module-level vs central routes

### Context
Module routes must live in the module directory and be loaded via the provider's `loadRoutesFrom()`. Central route files break extraction readiness — when the module is extracted, its routes must be split out manually.

### Decision Tree

```
Does this route belong to a specific module?
├── YES
│   Is this a globally scoped route (health check, monitoring, webhooks)?
│   ├── YES → May stay in central routes/ directory as application-wide route
│   └── NO → Place in module's routes/ directory, load via provider
└── NO (no module owner) → Central routes/ directory is acceptable
```

### Rationale
Routes are part of the module's responsibility and must move with it during extraction. Central route files create ownership ambiguity and break extraction readiness. The only exceptions are globally scoped infrastructure routes that have no module owner.

### Recommended Default
All module routes in module directory, loaded via provider

### Risks
- Central routes: extraction requires manual route file splitting
- Central routes: unclear ownership — multiple teams modify same file
- Module routes not registered: routes return 404

### Related Rules
- Load Routes from Module (MMD-05/05-rules.md)
- Load Migrations from Module (MMD-05/05-rules.md)
- Namespace Config Keys (MMD-05/05-rules.md)

### Related Skills
- Establish Module Autonomy (MMD-05/06-skills.md)
- Implement Module Internal Structure (MMD-03/06-skills.md)

---

## Decision 2: Module-level vs central migrations

### Context
Module migrations belong in the module's `database/migrations/` directory and are loaded via `loadMigrationsFrom()`. Central migrations create schema ownership ambiguity — extraction requires finding and moving all module migrations.

### Decision Tree

```
Does this migration define schema owned by a module?
├── YES
│   Is this a shared pivot table or application-level schema?
│   ├── YES → Central database/migrations/ (no module owner)
│   └── NO → Module database/migrations/, load via provider
└── NO → Application-level migrations directory is correct
```

### Rationale
Migrations define the module's database schema and must move with it during extraction. Central migrations create ownership ambiguity and make extraction harder. Every domain-owned table must use module migrations. Shared infrastructure tables (pivot tables, settings) have no module owner and stay central.

### Recommended Default
All module migrations in module directory, loaded via provider

### Risks
- Central migrations: extraction requires finding and manually moving migration files
- Central migrations: schema ownership is unclear
- Duplicate migration names across modules: collision on migration file name

### Related Rules
- Load Migrations from Module (MMD-05/05-rules.md)
- Migration Name Prefixing (MMD-05/05-rules.md)
- Document Migration Ordering Strategy (MMD-05/05-rules.md)

### Related Skills
- Establish Module Autonomy (MMD-05/06-skills.md)
- Own Database Schema Per Module (MMD-13/06-skills.md)

---

## Decision 3: Namespaced vs bare config keys

### Context
Module config keys must be namespaced with the module name (`billing.invoice_prefix`), never bare (`invoice_prefix`). Two modules using the same bare key would conflict silently, causing one module to read the other's configuration.

### Decision Tree

```
Is this config value used only within one module?
├── YES
│   Could another module later define a config with the same bare name?
│   ├── YES → Namespace with module name prefix
│   └── NO → Still namespace — defensive practice prevents future collisions
└── NO (shared across modules) → Application-level config is appropriate
```

### Rationale
Namespaced config keys (following Laravel package conventions) prevent collisions and make config ownership clear. Two modules independently adding `config('prefix')` would silently conflict. Namespacing also makes the config's source module obvious.

### Recommended Default
Namespaced config keys with module name prefix

### Risks
- Bare keys: silent collision — wrong config values read at runtime
- Bare keys: unclear ownership — hard to find which module defined a config
- No config at all in module: disincentivizes extraction readiness

### Related Rules
- Namespace Config Keys (MMD-05/05-rules.md)
- Load Routes from Module (MMD-05/05-rules.md)
- Colocate Module Tests (MMD-05/05-rules.md)

### Related Skills
- Establish Module Autonomy (MMD-05/06-skills.md)
- Configure Module Registration (MMD-04/06-skills.md)
