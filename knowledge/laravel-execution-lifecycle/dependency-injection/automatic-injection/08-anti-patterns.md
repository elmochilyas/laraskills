# ECC Anti-Patterns — Automatic Injection (ku-04)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Automatic Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Reliance on Auto-Resolution
2. Auto-Resolution for Interfaces
3. Auto-Resolution on Hot Paths
4. Forgetting Primitive Parameters
5. Auto-Resolving Wrong Implementation

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — auto-resolution is about construction, not querying
- Premature Caching — auto-resolution Reflection cannot be cached

---

## Anti-Pattern 1: Over-Reliance on Auto-Resolution

### Category
Architecture

### Description
Relying entirely on auto-resolution for all classes without any explicit bindings.

### Why It Happens
Developers enjoy the "magic" of auto-resolution and never register explicit bindings.

### Warning Signs
- Zero bindings in any service provider
- All classes are concrete with simple constructors
- Constructor change breaks resolution silently

### Why It Is Harmful
ku-04 warns: "Auto-resolution does NOT cache Reflection results — each `make()` re-inspects the constructor." Over-reliance leads to brittle code: changing a constructor parameter breaks all resolutions with no warning. No binding means no explicit contract between interface and implementation.

### Preferred Alternative
Bind interfaces explicitly. Use auto-resolution only for concrete utility classes.

### Detection Checklist
- [ ] No explicit bindings in providers
- [ ] All resolution is auto-resolution
- [ ] Constructor changes break silently

### Related Rules
ku-04 (05-rules.md): N/A

### Related Skills
ku-04 (06-skills.md): N/A

### Related Decision Trees
ku-04 (07-decision-trees.md): D01 — Auto-Resolution vs Explicit Binding.

---

## Anti-Pattern 2: Auto-Resolution for Interfaces

### Category
Reliability

### Description
Type-hinting interfaces without registering explicit bindings.

### Preferred Alternative
Always bind interfaces in service providers.

### Detection Checklist
- [ ] Interface type-hinted without binding
- [ ] `TargetInterfaceNotInstantiableException` at runtime

### Related Rules
ku-04 (05-rules.md): N/A

### Related Skills
ku-04 (06-skills.md): N/A

### Related Decision Trees
ku-04 (07-decision-trees.md): D02 — Interface vs Concrete Type Binding.

---

## Anti-Pattern 3: Auto-Resolution on Hot Paths

### Category
Performance

### Description
Using auto-resolution (with Reflection) on every request for hot-path classes.

### Preferred Alternative
Register explicit bindings (ideally singletons) for hot-path classes.

### Detection Checklist
- [ ] Hot-path class resolved via auto-resolution
- [ ] Reflection overhead visible in profiling

### Related Rules
ku-04 (05-rules.md): N/A

### Related Skills
ku-04 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Forgetting Primitive Parameters

### Category
Reliability

### Description
Constructor has primitive parameters (int, string, array) without defaults or bindings.

### Preferred Alternative
Provide default values or use contextual binding for primitive parameters.

### Detection Checklist
- [ ] Constructor with untyped or primitive parameters
- [ ] `BindingResolutionException` at runtime

### Related Rules
ku-04 (05-rules.md): N/A

### Related Skills
ku-04 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Auto-Resolving Wrong Implementation

### Category
Reliability

### Description
A concrete class with multiple possible implementations is auto-resolved, selecting the wrong one.

### Preferred Alternative
Bind interfaces to the correct implementation explicitly.

### Detection Checklist
- [ ] Concrete class with multiple implementations
- [ ] Wrong implementation resolved at runtime

### Related Rules
ku-04 (05-rules.md): N/A

### Related Skills
ku-04 (06-skills.md): N/A

### Related Decision Trees
ku-04 (07-decision-trees.md): D02 — Interface vs Concrete Type Binding.
