# ECC Anti-Patterns — Interface Binding Resolution

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Interface Binding Resolution |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Interface Explosion
2. Not Binding Interfaces at All
3. Concrete-to-Concrete Binding
4. Binding in boot() Instead of register()
5. Interface Bound to Non-Instantiable Class

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — interface binding is about abstraction, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Interface Explosion

### Category
Architecture

### Description
Creating interfaces for every class, even those with only one implementation and no foreseeable alternative.

### Warning Signs
- Interface for every domain class
- Interface and implementation are tightly coupled
- Changing the interface requires changing every consumer and the implementation

### Why It Is Harmful
ku-04 Standardized Knowledge warns: "Not every class needs an interface." Interfaces add maintenance burden without benefit when polymorphism is not needed.

### Preferred Alternative
Create interfaces only when you need polymorphism, testability through DI, or API boundaries.

### Detection Checklist
- [ ] Interface with single implementation
- [ ] No alternate implementation planned
- [ ] Interface adds no abstraction value

### Related Rules
Interface Binding Resolution (05-rules.md): N/A

### Related Skills
Interface Binding Resolution (06-skills.md): N/A

### Related Decision Trees
Interface Binding Resolution (07-decision-trees.md): D02 — Interface vs Concrete Type Binding.

---

## Anti-Pattern 2: Not Binding Interfaces at All

### Category
Reliability

### Description
Type-hinting interfaces but never registering them in service providers.

### Preferred Alternative
Always register interface-to-concrete bindings in service provider `register()` methods.

### Detection Checklist
- [ ] Interface type-hinted without binding
- [ ] `TargetInterfaceNotInstantiableException`

### Related Rules
Interface Binding Resolution (05-rules.md): N/A

### Related Skills
Interface Binding Resolution (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Concrete-to-Concrete Binding

### Category
Code Organization

### Description
Using `bind(Service::class, Service::class)` — redundant with auto-resolution.

### Preferred Alternative
Remove the binding — auto-resolution handles concretes.

### Detection Checklist
- [ ] Identical abstract and concrete in bind()
- [ ] Redundant registration

### Related Rules
Interface Binding Resolution (05-rules.md): N/A

### Related Skills
Interface Binding Resolution (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Binding in boot() Instead of register()

### Category
Reliability

### Description
Registering interface bindings in `boot()` — consumers may resolve before binding exists.

### Preferred Alternative
Register all bindings in `register()`.

### Detection Checklist
- [ ] Bindings in `boot()`
- [ ] Consumers resolved before binding takes effect

### Related Rules
Interface Binding Resolution (05-rules.md): N/A

### Related Skills
Interface Binding Resolution (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Interface Bound to Non-Instantiable Class

### Category
Reliability

### Description
Binding an interface to an abstract class that cannot be instantiated.

### Preferred Alternative
Bind interfaces to concrete classes only.

### Detection Checklist
- [ ] Abstract class as concrete in binding
- [ ] `BindingResolutionException` on resolution

### Related Rules
Interface Binding Resolution (05-rules.md): N/A

### Related Skills
Interface Binding Resolution (06-skills.md): N/A

### Related Decision Trees
N/A
