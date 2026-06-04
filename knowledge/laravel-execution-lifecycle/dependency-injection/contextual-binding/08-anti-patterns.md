# ECC Anti-Patterns — Contextual Binding (ku-05)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Contextual Binding |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Contextual Binding Sprawl
2. Wrong Consumer Class
3. Registering in `boot()` Instead of `register()`
4. Forgetting `$` Prefix for Primitives
5. Runtime Conditions in `give()`

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — contextual binding is about dependency wiring, not queries
- Premature Caching — contextual bindings should be established before any resolution

---

## Anti-Pattern 1: Contextual Binding Sprawl

### Category
Architecture

### Description
50+ contextual bindings for the same interface — indicating the architecture needs simplification.

### Why It Happens
Developers use contextual binding to paper over poor architecture where many consumers need different implementations.

### Warning Signs
- Dozens of `when()->needs()->give()` chains for the same interface
- Complex web of contextual bindings that is hard to reason about
- Each new consumer requires another contextual binding

### Why It Is Harmful
ku-05 warns: "Avoid hundreds of contextual bindings — consider whether the architecture needs simplification." Sprawling contextual bindings indicate the interface boundary is wrong — what should be separate interfaces are collapsed into one.

### Real-World Consequences
An application has 60 contextual bindings for `PaymentGatewayInterface` — each consumer needs a different gateway. Adding a new consumer requires adding another binding. The correct fix is to split `PaymentGatewayInterface` into `StripeGateway`, `PayPalGateway`, etc., each bound globally.

### Preferred Alternative
Split the interface into multiple interfaces or use a strategy pattern with a factory.

### Detection Checklist
- [ ] 10+ contextual bindings for the same interface
- [ ] Each new consumer needs a new binding
- [ ] Architecture is tightly coupled to contextual bindings

### Related Rules
ku-05 (05-rules.md): N/A

### Related Skills
ku-05 (06-skills.md): N/A

### Related Decision Trees
ku-05 (07-decision-trees.md): D01 — Contextual Binding vs Restructuring.

---

## Anti-Pattern 2: Wrong Consumer Class

### Category
Reliability

### Description
Specifying the parent class or interface instead of the concrete consumer in `when()`.

### Why It Happens
Developers confuse the consumer with the abstract type being bound.

### Warning Signs
- Contextual binding never applies
- Correct implementation is not injected
- `when(Interface::class)` instead of `when(ConcreteConsumer::class)`

### Why It Is Harmful
ku-05 states: "`when()` expects the consumer class — the class that needs the dependency." If you specify an interface or parent class in `when()`, the binding never matches any resolution — the container stores it under the wrong key.

### Preferred Alternative
Always use the concrete consumer class in `when()`.

### Detection Checklist
- [ ] Interface or abstract class in `when()`
- [ ] Contextual binding has no effect
- [ ] Wrong implementation resolved

### Related Rules
ku-05 (05-rules.md): N/A

### Related Skills
ku-05 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Registering in `boot()` Instead of `register()`

### Category
Reliability

### Description
Registering contextual bindings in `boot()` after the consumer may have already been resolved.

### Why It Happens
Developers treat `boot()` as the universal hook for all registration.

### Preferred Alternative
Register contextual bindings in `register()` to ensure they exist before any resolution.

### Detection Checklist
- [ ] Contextual binding in `boot()`
- [ ] Binding has no effect on already-resolved consumers

### Related Rules
ku-05 (05-rules.md): N/A

### Related Skills
ku-05 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Forgetting `$` Prefix for Primitives

### Category
Reliability

### Description
Using `needs('apiKey')` instead of `needs('$apiKey')` for primitive parameters.

### Preferred Alternative
Use `$` prefix: `needs('$apiKey')`.

### Detection Checklist
- [ ] Missing `$` prefix in `needs()`
- [ ] Primitive binding silently ignored

### Related Rules
ku-05 (05-rules.md): N/A

### Related Skills
ku-05 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Runtime Conditions in `give()`

### Category
Architecture

### Description
Using request data or runtime state inside the `give()` Closure to decide the implementation.

### Preferred Alternative
Use middleware or scoped singletons for runtime-dependent resolution.

### Detection Checklist
- [ ] Request data in `give()` Closure
- [ ] Runtime condition determines binding

### Related Rules
ku-05 (05-rules.md): N/A

### Related Skills
ku-05 (06-skills.md): N/A

### Related Decision Trees
N/A
