# ECC Anti-Patterns — Container Aliases

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Container Aliases |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Overriding Framework-Reserved Aliases
2. Creating Ambiguous Alias Names
3. Using Aliases as Namespace Shortcuts
4. Aliasing Concrete Classes Instead of Interfaces
5. Forgetting That Aliases Skip Auto-Resolution

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — aliases are string-to-string mappings, not query sources
- Premature Caching — aliases are resolved once and cached by the resolved instance

---

## Anti-Pattern 1: Overriding Framework-Reserved Aliases

### Category
Security

### Description
Blindly registering `$app->alias('events', ...)` or overwriting `config`, `db`, `cache` — breaks framework internals silently.

### Why It Happens
Developers choose short, convenient alias names without checking whether the framework already uses them internally.

### Warning Signs
- Framework components stop working after alias registration
- `app('events')` returns unexpected type
- Third-party packages fail silently

### Why It Is Harmful
Laravel registers 60+ built-in aliases (`app`, `config`, `db`, `events`, `files`, `cache`, `auth`, `session`, `redirect`, `request`, `response`, `router`, `encrypter`, `hash`, `validator`, `log`, `view`, `url`, `mail`, `queue`, `redirect`, `cookie`). Overwriting one of these means every internal framework class that calls `resolve('events')` or `$app['events']` gets your bound class instead of the expected `Illuminate\Events\Dispatcher`. Core behavior silently changes or breaks.

### Preferred Alternative
Use fully-qualified class names or unambiguous custom aliases. Check `$app->getBindings()` before registering.

### Detection Checklist
- [ ] Overwriting known framework alias
- [ ] Internal components broken
- [ ] Third-party package conflict

### Related Rules
Do Not Override Built-in Aliases (05-rules.md)

---

## Anti-Pattern 2: Creating Ambiguous Alias Names

### Category
Maintainability

### Description
Registering aliases like `'mailer'` or `'payment'` — too generic, likely to collide with packages.

### Preferred Alternative
Prefix custom aliases with your vendor or package namespace: `'acme-mailer'`.

### Detection Checklist
- [ ] Generic alias name
- [ ] Collision with common packages
- [ ] Ambiguous resolution

---

## Anti-Pattern 3: Using Aliases as Namespace Shortcuts

### Category
Framework Usage

### Description
Aliasing `'reports'` to a concrete class — no interface abstraction, just shortening the import path.

### Preferred Alternative
Use facades or class imports. Aliases should map interfaces to short symbolic names.

### Detection Checklist
- [ ] Alias maps to concrete class
- [ ] No abstraction layer
- [ ] Used only to avoid import

---

## Anti-Pattern 4: Aliasing Concrete Classes Instead of Interfaces

### Category
Architecture

### Description
`$app->alias(ConcreteService::class, 'service')` — couples consumers to concrete implementation.

### Preferred Alternative
Alias an interface: `$app->alias(ServiceInterface::class, 'service')`.

### Detection Checklist
- [ ] Concrete class aliased
- [ ] Consumers coupled to implementation
- [ ] Swapping implementation requires re-alias

---

## Anti-Pattern 5: Forgetting That Aliases Skip Auto-Resolution

### Category
Framework Usage

### Description
Registering an alias without a binding — `resolve('alias')` fails because aliases only resolve against registered bindings.

### Preferred Alternative
Always pair an alias with a binding.
