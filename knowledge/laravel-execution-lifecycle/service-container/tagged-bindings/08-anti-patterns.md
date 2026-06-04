# ECC Anti-Patterns — Tagged Bindings

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Tagged Bindings |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Tagged Bindings for Two Different Concerns Under One Tag
2. Registering Services in Wrong Order (Tagged Order Matters)
3. Using Tagged Bindings When Manual Collection Registration Is Simpler
4. Forgetting to Tag When Iterating With tagged()
5. Not Documenting Tag Contracts

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — tagged bindings collect services, not queries
- Premature Caching — tagged collection is built fresh each time tagged() is called

---

## Anti-Pattern 1: Using Tagged Bindings for Two Different Concerns Under One Tag

### Category
Maintainability

### Description
Tagging both validation rules and event listeners with 'app:services' — consumers expecting only one type get mixed.

### Why It Happens
Tags are unstructured strings. Without documentation, developers add arbitrary services to arbitrary tags.

### Warning Signs
- `tagged('services')` returns services of different types
- Consumer calling `tagged('validation')` gets event handlers
- Type errors from unexpected service types

### Why It Is Harmful
`tagged()` returns an array of resolved instances with no type constraint. If a tag mixes services implementing different interfaces, the consumer cannot reliably call methods on the returned instances. PHP throws type errors or calls the wrong method silently. Tests miss this because test doubles follow the wrong interface.

### Preferred Alternative
Create one tag per logical group. Use interface-based tagging: tag services that implement a common interface.

### Detection Checklist
- [ ] Tag mixing different interface types
- [ ] Consumer iterating without type check
- [ ] Type errors from wrong tag group

### Related Rules
One Concern Per Tag (05-rules.md)

---

## Anti-Pattern 2: Registering Services in Wrong Order (Tagged Order Matters)

### Category
Reliability

### Description
Services registered in random order but consumers assume a specific order when iterating tagged results.

### Preferred Alternative
Use explicit priority in service classes or a registration method.

### Detection Checklist
- [ ] Consumers iterate tagged() and assume order
- [ ] Order-dependent behavior
- [ ] Services registered across providers

---

## Anti-Pattern 3: Using Tagged Bindings When Manual Collection Registration Is Simpler

### Category
Framework Usage

### Description
Using tag() + tagged() for a small, fixed set of services that could be registered as a single collection binding.

### Preferred Alternative
Register an array of services as a binding: `$app->bind(Collection::class, fn() => [ServiceA::class, ServiceB::class])`.

### Detection Checklist
- [ ] 2–3 services in a tag
- [ ] Tag used only once
- [ ] Manual array simpler

---

## Anti-Pattern 4: Forgetting to Tag When Iterating With tagged()

### Category
Reliability

### Description
Calling `tagged('reports')` returns empty array because services were bound but never tagged.

### Preferred Alternative
Register tag calls adjacent to binding calls in the same provider. Verify with a test.

### Detection Checklist
- [ ] `tagged()` returns empty
- [ ] Services bound but not tagged
- [ ] No tag registration in provider

---

## Anti-Pattern 5: Not Documenting Tag Contracts

### Category
Maintainability

### Description
Tags defined without documentation of what interface services must implement to qualify.

### Preferred Alternative
Document each tag's expected interface in a docblock or provider comment.
