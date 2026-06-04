# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module autonomy: routes, migrations, config, tests per module
Knowledge Unit ID: MMD-05
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Module autonomy means each module owns its routes, migrations, config, and tests. Routes in the module's route directory, migrations in its `database/migrations/`, config in module directory. This colocation ensures the module is extraction-ready: moving to a separate service requires no route or migration splitting.

---

# Core Concepts

- **Route autonomy**: Module routes defined in module directory, loaded by provider via `loadRoutesFrom()`.
- **Migration autonomy**: Module migrations loaded via `loadMigrationsFrom()`.
- **Config autonomy**: Module config merged via `mergeConfigFrom()` with namespaced keys.
- **Test autonomy**: Module tests colocated, independently runnable.

---

# When To Use

- Any modular monolith with well-defined modules
- Always — module autonomy is the defining characteristic of modular monolith vs. layered monolith

---

# When NOT To Use

- Modules that share all resources (likely not real modules — just directories)
- Before module boundaries are established

---

# Best Practices

- **Always load routes from module, never from central routes file.** WHY: Central routes file should be empty or contain only application-wide routes. Module routes belong in module for extraction readiness.
- **Always load migrations from module.** WHY: Central migrations directory is for application-level schema. Module migrations move with the module.
- **Namespace module config keys** to avoid collision (`billing.invoice_prefix` not `invoice_prefix`). WHY: Two modules using `config('prefix')` would conflict — namespacing prevents this.
- **Use date-prefixed migration names** with module prefix. WHY: Prevents migration name collisions across modules.
- **Make tests independently runnable.** WHY: Enables CI per module and simplifies extraction.

---

# Architecture Guidelines

- Module provider loads: `loadRoutesFrom()`, `loadMigrationsFrom()`, `mergeConfigFrom()`, `loadViewsFrom()`, `loadTranslationsFrom()`.
- Migration ordering requires strategy: alphabetical, dependency-based, or priority-based.
- Config can be published for customization while source stays in module.

---

# Performance Considerations

- Multiple migration directories add ~10-20ms to `migrate` command with 10+ modules.
- Route loading from multiple files is negligible.
- Service provider boot time is the main performance consideration.

---

# Security Considerations

- Module autonomy does not provide security isolation — apply auth at route level.

---

# Common Mistakes

1. **Routes in central file:** Adding module routes to `routes/api.php`. Cause: laziness. Consequence: breaks extraction readiness. Better: always use module route file.

2. **Shared migrations directory:** All migrations in `database/migrations/`. Cause: habit. Consequence: extraction requires splitting migrations.

3. **Config in central directory:** Module config at `config/billing.php` from start. Cause: publishing before source. Consequence: source of truth is unclear. Better: module source → publish to app config.

---

# Anti-Patterns

- **Orphan migrations**: Module disabled but migrations remain in database.
- **Duplicate migration names**: Two modules with same date-prefixed migration name.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-03 Module internal structure | MMD-04 Module registration | MMD-13 Database schema ownership |
| MMD-01 Module vs microservice | MMD-08 Shared kernel | MMD-16 Testing strategies |

---

# AI Agent Notes

- When generating module service providers, include `loadRoutesFrom()`, `loadMigrationsFrom()`, `mergeConfigFrom()`.
- Place routes, migrations, and config inside the module directory, not at application level.
- Namespace module config keys with the module name.

---

# Verification

- [ ] Module routes are in module directory, not central routes file
- [ ] Module migrations are in module directory, not central migrations
- [ ] Module config is namespaced to prevent collision
- [ ] Module tests can run independently
- [ ] Migration order strategy is documented
