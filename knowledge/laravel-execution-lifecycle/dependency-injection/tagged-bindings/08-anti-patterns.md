# ECC Anti-Patterns — Tagged Bindings (ku-06)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Tagged Bindings |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Tag as Interface Replacement
2. Runtime Tag Registration
3. Tagged Service Locator
4. Tag Order Assumptions
5. Over-Tagging

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — tagged bindings are about service collection, not queries
- Premature Caching — tags should be set before any `tagged()` call

---

## Anti-Pattern 1: Tag as Interface Replacement

### Category
Architecture

### Description
Using tags as a substitute for proper interface bindings — tagging services without ensuring they implement a common interface.

### Why It Happens
Developers discover `tag()` and use it as an organizational tool without interface contracts.

### Warning Signs
- Tagged services don't implement a common interface
- `tagged()` returns mixed types that must be checked with `instanceof`
- Type errors when iterating tagged results

### Why It Is Harmful
ku-06 states: "Tags should supplement interface bindings, not replace them." Without a common interface, the consumer of `tagged()` cannot rely on type safety — each tagged item must be individually type-checked.

### Preferred Alternative
Always combine tags with interface bindings. Tagged services should implement the same interface.

### Detection Checklist
- [ ] Tagged items lack a common interface
- [ ] `instanceof` checks needed when iterating tagged results
- [ ] Type safety is bypassed

### Related Rules
ku-06 (05-rules.md): N/A

### Related Skills
ku-06 (06-skills.md): N/A

### Related Decision Trees
ku-06 (07-decision-trees.md): D01 — Tag vs Explicit Aggregation.

---

## Anti-Pattern 2: Runtime Tag Registration

### Category
Architecture

### Description
Registering tags dynamically during a request instead of statically at bootstrap.

### Preferred Alternative
Register all tags in service provider `register()` methods — static registration only.

### Detection Checklist
- [ ] `tag()` called in controllers or middleware
- [ ] Tags registered after bootstrap

### Related Rules
ku-06 (05-rules.md): N/A

### Related Skills
ku-06 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Tagged Service Locator

### Category
Architecture

### Description
Using `app()->tagged('name')` deep in business logic instead of injecting the tagged collection.

### Preferred Alternative
Inject the tagged collection via variadic constructor injection.

### Detection Checklist
- [ ] `tagged()` called in service methods
- [ ] Tag resolution not in composition root

### Related Rules
ku-06 (05-rules.md): N/A

### Related Skills
ku-06 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Tag Order Assumptions

### Category
Reliability

### Description
Relying on a specific iteration order of tagged bindings without documentation.

### Preferred Alternative
Document the expected order or use an explicit priority mechanism.

### Detection Checklist
- [ ] Code assumes specific tag order
- [ ] No documentation of iteration order

### Related Rules
ku-06 (05-rules.md): N/A

### Related Skills
ku-06 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Over-Tagging

### Category
Architecture

### Description
Tagging everything for anticipated future flexibility.

### Preferred Alternative
Only tag services when multiple implementations exist.

### Detection Checklist
- [ ] Tags with only one implementation
- [ ] Complexity from unused tag infrastructure

### Related Rules
ku-06 (05-rules.md): N/A

### Related Skills
ku-06 (06-skills.md): N/A

### Related Decision Trees
ku-06 (07-decision-trees.md): D02 — Tag vs Explicit Collection.
