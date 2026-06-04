# ECC Anti-Patterns — HTTP Kernel Internals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Kernel Architecture |
| **Knowledge Unit** | HTTP Kernel Internals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Global Middleware as Catch-All
2. Modifying $middlewarePriority Excessively
3. Extending Kernel handle()
4. Kernel as Service Locator
5. Heavy Logic in terminate()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — kernel handles orchestration, not data access
- Premature Caching — kernel bootstrap should complete before caching decisions

---

## Anti-Pattern 1: Global Middleware as Catch-All

### Category
Performance

### Description
Adding every middleware to the global stack instead of middleware groups or specific routes.

### Why It Happens
Developers add middleware to `$middleware` (global) as default without considering scope.

### Warning Signs
- 10+ middleware in `$middleware` property
- Middleware only needed for web routes in global stack
- All middleware runs on API routes that don't need them

### Why It Is Harmful
Each global middleware runs on 100% of requests — API routes pay the cost of web-specific middleware. With 10+ global middleware, this adds 1-3ms per request.

### Preferred Alternative
Add middleware at the most specific level: route > group > global.

### Detection Checklist
- [ ] Middleware in global stack that could be in a group
- [ ] Global middleware count > 5
- [ ] API routes running web-specific middleware

### Related Rules
HTTP Kernel Internals (05-rules.md): N/A

### Related Skills
HTTP Kernel Internals (06-skills.md): N/A

### Related Decision Trees
HTTP Kernel Internals (07-decision-trees.md): D01 — Global vs Group vs Route Middleware.

---

## Anti-Pattern 2: Modifying $middlewarePriority Excessively

### Category
Architecture

### Description
Using priority to fix ordering issues that should be resolved in group arrays.

### Preferred Alternative
Correctly order middleware in group arrays instead of using global priority.

### Detection Checklist
- [ ] Long `$middlewarePriority` array
- [ ] Priority used for group-specific ordering

### Related Rules
HTTP Kernel Internals (05-rules.md): N/A

### Related Skills
HTTP Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Extending Kernel handle()

### Category
Architecture

### Description
Overriding `handle()` in the kernel instead of using middleware or bootstrappers.

### Preferred Alternative
Use middleware, bootstrappers, or service providers for customization.

### Detection Checklist
- [ ] Custom `handle()` implementation
- [ ] Middleware or bootstrapper would suffice

### Related Rules
HTTP Kernel Internals (05-rules.md): N/A

### Related Skills
HTTP Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Kernel as Service Locator

### Category
Architecture

### Description
Accessing the kernel instance to push middleware from service providers.

### Preferred Alternative
Use `bootstrap/app.php` middleware configuration (Laravel 11+) or add middleware in the kernel class.

### Detection Checklist
- [ ] `$kernel->pushMiddleware()` in service providers
- [ ] Middleware registration scattered across codebase

### Related Rules
HTTP Kernel Internals (05-rules.md): N/A

### Related Skills
HTTP Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Heavy Logic in terminate()

### Category
Performance

### Description
Placing expensive operations (database writes, HTTP calls) in terminable middleware.

### Preferred Alternative
Use queues for heavy post-response work.

### Detection Checklist
- [ ] Heavy I/O in terminable middleware
- [ ] Queue worker blocked by terminate() operations

### Related Rules
HTTP Kernel Internals (05-rules.md): N/A

### Related Skills
HTTP Kernel Internals (06-skills.md): N/A

### Related Decision Trees
N/A
