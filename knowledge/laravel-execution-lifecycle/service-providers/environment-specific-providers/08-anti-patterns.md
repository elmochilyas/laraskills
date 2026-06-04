# ECC Anti-Patterns — Environment-Specific Providers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Environment-Specific Providers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Guard in boot() Only
2. Environment String Hard-Coding
3. Partial Deferral of Dev-Only Providers
4. Development Providers in Production
5. Environment Guards in Deferred Providers

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — environment guards prevent runtime checks, not queries
- Premature Caching — environment checks must happen before caching

---

## Anti-Pattern 1: Guard in boot() Only

### Category
Security

### Description
Guarding provider logic only in `boot()` but not in `register()` — bindings still register in production.

### Warning Signs
- `if (app()->environment('local'))` only in `boot()`
- Provider bindings still registered in production
- Development bindings affect production behavior

### Why It Is Harmful
If only `boot()` is guarded, `register()` still runs and registers bindings in all environments. Development-specific bindings (stub implementations, mock services) may override production bindings.

### Preferred Alternative
Use compile-time exclusion — conditionally register via `$app->register()` at the provider level, not inside the provider.

### Detection Checklist
- [ ] Environment check only in `boot()`
- [ ] Provider registered in production with guarded boot
- [ ] Bindings from `register()` affect production

### Related Rules
Environment Providers (05-rules.md): N/A

### Related Skills
Environment Providers (06-skills.md): N/A

### Related Decision Trees
Environment Providers (07-decision-trees.md): D01 — Registration Guard vs Runtime Guard.

---

## Anti-Pattern 2: Environment String Hard-Coding

### Category
Maintainability

### Description
Using `app()->environment('local')` instead of config-driven check.

### Preferred Alternative
Use `config('app.debug')` or similar config-driven checks.

### Detection Checklist
- [ ] Hard-coded `'local'` strings
- [ ] Environment renames break guards

### Related Rules
Environment Providers (05-rules.md): N/A

### Related Skills
Environment Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Partial Deferral of Dev-Only Providers

### Category
Architecture

### Description
Making a development-only provider deferred but still listing it in the providers array.

### Preferred Alternative
Use compile-time exclusion instead of deferral for dev-only providers.

### Detection Checklist
- [ ] Dev-only provider listed but deferred
- [ ] Provider still resolvable in production

### Related Rules
Environment Providers (05-rules.md): N/A

### Related Skills
Environment Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Development Providers in Production

### Category
Security

### Description
Debugbar, Telescope, or IDE helpers deployed and registered in production.

### Preferred Alternative
Audit production provider list and use `dont-discover` + conditional registration.

### Detection Checklist
- [ ] Debugbar/Telescope in production
- [ ] Development providers registered in production

### Related Rules
Environment Providers (05-rules.md): N/A

### Related Skills
Environment Providers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Environment Guards in Deferred Providers

### Category
Reliability

### Description
Using environment checks inside deferred provider — environment may differ between manifest build and load time.

### Preferred Alternative
Guard at registration time, not inside deferred provider.

### Detection Checklist
- [ ] Environment check in deferred provider
- [ ] Inconsistent behavior based on load timing

### Related Rules
Environment Providers (05-rules.md): N/A

### Related Skills
Environment Providers (06-skills.md): N/A

### Related Decision Trees
N/A
