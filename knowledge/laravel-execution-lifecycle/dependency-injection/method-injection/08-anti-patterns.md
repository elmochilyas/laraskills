# ECC Anti-Patterns — Method Injection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Method Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Method Injection for Shared Dependencies
2. Wrong Parameter Order
3. Method Injection in Middleware
4. Missing Type-Hints in Injected Methods
5. Method Injection for Every Dependency

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — method injection is about resolution strategy, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Method Injection for Shared Dependencies

### Category
Architecture

### Description
Using method injection for a dependency used across multiple methods instead of constructor injection.

### Warning Signs
- Same type-hint in 3+ method signatures
- Constructor has zero parameters despite many dependencies

### Preferred Alternative
Use constructor injection for dependencies used in multiple methods.

### Detection Checklist
- [ ] Same dep in 3+ method signatures
- [ ] Empty constructor with many shared deps

### Related Rules
Method Injection (04-standardized-knowledge.md): Prefer constructor injection for shared dependencies.

---

## Anti-Pattern 2: Wrong Parameter Order

### Category
Reliability

### Description
Placing container-resolved parameters after route parameters — container tries to resolve the route parameter from the container.

### Preferred Alternative
Put container-resolved parameters before route parameters.

### Detection Checklist
- [ ] Route parameters before type-hinted dependencies
- [ ] `BindingResolutionException` for route params

### Related Rules
Method Injection (04-standardized-knowledge.md): Order parameters: resolved first, runtime second.

---

## Anti-Pattern 3: Method Injection in Middleware

### Category
Architecture

### Description
Adding type-hinted dependencies to middleware `handle()` method.

### Preferred Alternative
Use constructor injection for middleware dependencies.

### Detection Checklist
- [ ] Extra params in `handle()` beyond $request, $next

### Related Rules
Method Injection (04-standardized-knowledge.md): N/A

---

## Anti-Pattern 4: Missing Type-Hints in Injected Methods

### Category
Reliability

### Description
Method parameters without type-hints that developer expects the container to resolve.

### Preferred Alternative
Always provide clear type-hints for container-resolved parameters.

### Detection Checklist
- [ ] Un-typed parameters expected to be resolved
- [ ] Container skips parameters without type-hints

### Related Rules
Method Injection (04-standardized-knowledge.md): Be explicit about injected types.

---

## Anti-Pattern 5: Method Injection for Every Dependency

### Category
Architecture

### Description
Using method injection for ALL dependencies, never using constructor injection.

### Preferred Alternative
Use constructor injection as the default; method injection only for action-specific dependencies.

### Detection Checklist
- [ ] No constructor injection at all
- [ ] All deps injected via method parameters

### Related Rules
Method Injection (04-standardized-knowledge.md): N/A
