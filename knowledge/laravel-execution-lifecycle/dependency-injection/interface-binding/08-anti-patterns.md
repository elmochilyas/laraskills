# ECC Anti-Patterns — Interface Binding (ku-08)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Interface Binding |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Interface Explosion
2. No Interface at All
3. Binding to Self
4. Forgetting to Bind
5. Binding in Wrong Provider

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — interface binding is about abstracting dependencies, not database
- Premature Caching — interface bindings should be established before resolution

---

## Anti-Pattern 1: Interface Explosion

### Category
Architecture

### Description
Creating an interface for every class "just in case" — unnecessary abstraction.

### Why It Happens
Developers follow "program to an interface, not an implementation" dogmatically.

### Warning Signs
- Interface for every domain class, even internal-only classes
- Interface has only one implementation and no foreseeable need for another
- Interface and implementation are in the same namespace and module

### Why It Is Harmful
ku-08 warns: "Interface explosion — creating interfaces for every class 'just in case' — only abstract when you need polymorphism." Each interface adds maintenance cost (update both interface and implementation on signature change) with no benefit when there's only one implementation.

### Preferred Alternative
Create interfaces only when you need polymorphism — multiple implementations, testing with mocks, or swapping.

### Detection Checklist
- [ ] Interface with single implementation
- [ ] No foreseeable need for alternate implementations
- [ ] Interface adds maintenance without benefit

### Related Rules
ku-08 (05-rules.md): N/A

### Related Skills
ku-08 (06-skills.md): N/A

### Related Decision Trees
ku-08 (07-decision-trees.md): D02 — Interface vs Concrete Type Binding.

---

## Anti-Pattern 2: No Interface at All

### Category
Architecture

### Description
Type-hinting concrete classes everywhere without any interface abstraction.

### Why It Happens
Developers skip interface creation for speed.

### Preferred Alternative
Use interfaces at architectural boundaries (repositories, services, infrastructure adapters).

### Detection Checklist
- [ ] All constructor params are concrete classes
- [ ] No interface bindings in providers

### Related Rules
ku-08 (05-rules.md): N/A

### Related Skills
ku-08 (06-skills.md): N/A

### Related Decision Trees
ku-08 (07-decision-trees.md): D02 — Interface vs Concrete Type Binding.

---

## Anti-Pattern 3: Binding to Self

### Category
Code Organization

### Description
Using `bind(Service::class, Service::class)` — identical abstract and concrete.

### Preferred Alternative
Remove the binding — auto-resolution handles concrete classes.

### Detection Checklist
- [ ] `bind(Concrete::class, Concrete::class)`
- [ ] Redundant registration

### Related Rules
ku-08 (05-rules.md): N/A

### Related Skills
ku-08 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Forgetting to Bind

### Category
Reliability

### Description
Type-hinting an interface in a constructor without registering a binding.

### Preferred Alternative
Always register interface bindings in service providers.

### Detection Checklist
- [ ] Interface used without binding
- [ ] `TargetInterfaceNotInstantiableException` at runtime

### Related Rules
ku-08 (05-rules.md): N/A

### Related Skills
ku-08 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Binding in Wrong Provider

### Category
Code Organization

### Description
Scattering related interface bindings across unrelated service providers.

### Preferred Alternative
Group bindings by feature or domain in dedicated providers.

### Detection Checklist
- [ ] Bindings scattered across providers
- [ ] Hard to find and maintain

### Related Rules
ku-08 (05-rules.md): N/A

### Related Skills
ku-08 (06-skills.md): N/A

### Related Decision Trees
N/A
