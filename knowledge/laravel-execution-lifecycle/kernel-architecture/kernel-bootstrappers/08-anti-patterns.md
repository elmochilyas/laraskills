# ECC Anti-Patterns — Kernel Bootstrappers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Kernel Architecture |
| **Knowledge Unit** | Kernel Bootstrappers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Bootstrapper as Service Provider
2. Heavy Bootstrapper
3. Custom Bootstrapper Duplicating Core
4. Removing Core Bootstrappers
5. Assuming Bootstrapper Order Is Configurable

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — bootstrappers are initialization steps, not data access
- Premature Caching — bootstrappers prepare the container before caching

---

## Anti-Pattern 1: Bootstrapper as Service Provider

### Category
Architecture

### Description
Putting provider-registration logic in bootstrappers instead of using the Service Provider class.

### Why It Happens
Developers discover `bootstrapWith()` and use it for general initialization.

### Warning Signs
- Custom bootstrapper calls `$app->bind()` or `$app->singleton()`
- Bootstrapper imports service classes
- Bootstrapper logic belongs in a provider

### Why It Is Harmful
Service providers are the intended mechanism for binding registration. Using bootstrappers for this creates an inconsistent configuration surface — some bindings in providers, some in bootstrappers. Bootstrappers have no provider lifecycle like `deferrable`, `boot()`, or `provides()`.

### Preferred Alternative
Use service providers for binding registration. Use bootstrappers only for framework-level concerns.

### Detection Checklist
- [ ] Custom bootstrapper registers container bindings
- [ ] Bootstrapper duplicates provider functionality
- [ ] Logic could be a service provider

### Related Rules
Kernel Bootstrappers (05-rules.md): N/A

### Related Skills
Kernel Bootstrappers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Heavy Bootstrapper

### Category
Performance

### Description
Adding HTTP calls, complex computations, or I/O in a bootstrapper.

### Preferred Alternative
Keep bootstrappers fast — they delay every request.

### Detection Checklist
- [ ] Database queries in bootstrapper
- [ ] HTTP calls in bootstrapper

### Related Rules
Kernel Bootstrappers (05-rules.md): N/A

### Related Skills
Kernel Bootstrappers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Custom Bootstrapper Duplicating Core

### Category
Code Organization

### Description
Creating a bootstrapper that loads configuration or environment — duplicating existing framework bootstrappers.

### Preferred Alternative
Use the core bootstrappers. Add custom logic after the pre-existing chain.

### Detection Checklist
- [ ] Custom config/env loading bootstrapper
- [ ] Duplicates `LoadConfiguration` or `LoadEnvironmentVariables`

### Related Rules
Kernel Bootstrappers (05-rules.md): N/A

### Related Skills
Kernel Bootstrappers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Removing Core Bootstrappers

### Category
Reliability

### Description
Attempting to skip `RegisterFacades` or other core bootstrappers to "optimize."

### Preferred Alternative
Do not remove core bootstrappers — they are required for framework functionality.

### Detection Checklist
- [ ] Core bootstrapper removed from kernel array
- [ ] Missing framework functionality

### Related Rules
Kernel Bootstrappers (05-rules.md): N/A

### Related Skills
Kernel Bootstrappers (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Assuming Bootstrapper Order Is Configurable

### Category
Architecture

### Description
Thinking custom bootstrappers can be injected between core bootstrappers.

### Preferred Alternative
Custom bootstrappers run before or after the entire sequence — use service providers for between-step ordering.

### Detection Checklist
- [ ] Expecting custom bootstrapper between core steps
- [ ] Order-dependent initialization fails

### Related Rules
Kernel Bootstrappers (05-rules.md): N/A

### Related Skills
Kernel Bootstrappers (06-skills.md): N/A

### Related Decision Trees
N/A
