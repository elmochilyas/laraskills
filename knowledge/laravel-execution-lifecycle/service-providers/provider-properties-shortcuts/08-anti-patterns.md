# ECC Anti-Patterns — Provider Properties Shortcuts

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Provider Properties Shortcuts |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Properties Without parent::register()
2. Overusing Properties for Complex Bindings
3. Config Merge After Cache
4. Re-declaring Properties Expecting Merge
5. Using Properties with Non-Existent Classes

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — properties shortcuts are about declarative bindings, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Properties Without parent::register()

### Category
Reliability

### Description
Overriding `register()` without calling `parent::register()` — `$bindings` and `$singletons` silently never register.

### Why It Happens
Developers override `register()` with custom logic and forget to call `parent::register()`.

### Warning Signs
- `register()` overridden without `parent::register()`
- `$bindings`/`$singletons` properties declared but bindings don't exist
- Provider's declared bindings not resolvable

### Why It Is Harmful
The properties are processed in `ServiceProvider::register()`. If the subclass overrides `register()` without calling `parent::register()`, the properties are silently ignored. The code looks correct but does nothing.

### Preferred Alternative
Always call `parent::register()` first when overriding `register()`, or add bindings explicitly with `$this->app->bind()`.

### Detection Checklist
- [ ] `register()` overridden without `parent::register()`
- [ ] `$bindings`/`$singletons` have no effect
- [ ] Bindings not registered despite property declarations

### Related Rules
Provider Properties (05-rules.md): N/A

### Related Skills
Provider Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Overusing Properties for Complex Bindings

### Category
Code Organization

### Description
Using `$bindings`/`$singletons` for factory closures, contextual binding, or conditional logic.

### Preferred Alternative
Use explicit `$this->app->bind()` in `register()` for complex bindings.

### Detection Checklist
- [ ] Properties used where factory logic needed
- [ ] Contextual binding attempted via properties

### Related Rules
Provider Properties (05-rules.md): N/A

### Related Skills
Provider Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Config Merge After Cache

### Category
Reliability

### Description
Calling `mergeConfigFrom()` in `boot()` after config was cached.

### Preferred Alternative
Call `mergeConfigFrom()` in `register()`.

### Detection Checklist
- [ ] `mergeConfigFrom()` in `boot()`
- [ ] Config merge ineffective after cache

### Related Rules
Provider Properties (05-rules.md): N/A

### Related Skills
Provider Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Re-declaring Properties Expecting Merge

### Category
Reliability

### Description
Subclass redeclares `$bindings` expecting to merge with parent's bindings.

### Preferred Alternative
Subclass properties replace — not merge. Use constructor or `register()` to extend.

### Detection Checklist
- [ ] Subclass declares `$bindings` expecting merge
- [ ] Parent bindings silently lost

### Related Rules
Provider Properties (05-rules.md): N/A

### Related Skills
Provider Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Using Properties with Non-Existent Classes

### Category
Reliability

### Description
Declaring `$bindings`/`$singletons` with class names that don't exist.

### Preferred Alternative
Test all bindings in CI.

### Detection Checklist
- [ ] Class referenced in property doesn't exist
- [ ] Error surfaces only on resolution

### Related Rules
Provider Properties (05-rules.md): N/A

### Related Skills
Provider Properties (06-skills.md): N/A

### Related Decision Trees
N/A
