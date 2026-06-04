# ECC Anti-Patterns — Register vs Boot Methods

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Register vs Boot Methods |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Resolution in register()
2. register() as boot()
3. Empty register(), Full boot()
4. Heavy I/O in register()
5. Expecting boot() After All Providers Booted

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — provider methods should not perform I/O
- Premature Caching — providers are about registration, not caching

---

## Anti-Pattern 1: Resolution in register()

### Category
Reliability

### Description
Calling `$this->app->make()` or `resolve()` inside `register()`.

### Warning Signs
- `make()` in `register()`
- Intermittent "Target class does not exist" errors

### Why It Is Harmful
`register()` runs before all providers have registered their bindings. Resolving a service in `register()` may fail if another provider hasn't registered it yet. This creates non-deterministic failures where bootstrap works or fails depending on provider order.

### Preferred Alternative
Use `boot()` for any code that depends on registered services.

### Detection Checklist
- [ ] `$this->app->make()` in `register()`
- [ ] Bootstrap errors dependent on provider ordering

### Related Rules
Register vs Boot (05-rules.md): Keep `register()` pure — bindings only.

### Related Skills
Register vs Boot (06-skills.md): N/A

### Related Decision Trees
Register vs Boot (07-decision-trees.md): D01 — register vs boot allocation.

---

## Anti-Pattern 2: register() as boot()

### Category
Architecture

### Description
Defining routes, event listeners, or view composers in `register()`.

### Preferred Alternative
Use `boot()` for route/view/event registration.

### Detection Checklist
- [ ] `loadRoutesFrom()` in `register()`
- [ ] Event listeners registered in `register()`

### Related Rules
Register vs Boot (05-rules.md): N/A

### Related Skills
Register vs Boot (06-skills.md): N/A

### Related Decision Trees
Register vs Boot (07-decision-trees.md): D01 — register vs boot allocation.

---

## Anti-Pattern 3: Empty register(), Full boot()

### Category
Code Organization

### Description
All logic is in `boot()`, `register()` is empty.

### Preferred Alternative
If `register()` is empty, consider whether the provider needs to exist at all.

### Detection Checklist
- [ ] Empty `register()` method
- [ ] Provider could be a boot-only service

### Related Rules
Register vs Boot (05-rules.md): N/A

### Related Skills
Register vs Boot (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Heavy I/O in register()

### Category
Reliability

### Description
Database queries, file writes, or HTTP calls in `register()`.

### Preferred Alternative
Keep `register()` pure — bindings only. Move I/O to `boot()` or application code.

### Detection Checklist
- [ ] `DB::query()` in `register()`
- [ ] File writes in `register()`

### Related Rules
Register vs Boot (05-rules.md): N/A

### Related Skills
Register vs Boot (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Expecting boot() After All Providers Booted

### Category
Reliability

### Description
Assuming your `boot()` runs after ALL providers have booted.

### Preferred Alternative
Use `$app->booted()` for post-boot actions.

### Detection Checklist
- [ ] Code depends on another provider's boot() effects
- [ ] Order-dependent boot failures

### Related Rules
Register vs Boot (05-rules.md): N/A

### Related Skills
Register vs Boot (06-skills.md): N/A

### Related Decision Trees
N/A
