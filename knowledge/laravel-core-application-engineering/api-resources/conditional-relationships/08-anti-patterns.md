# ECC Anti-Patterns — Conditional Relationships

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Conditional Relationships |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Lazy Loading in Resources (Missing `whenLoaded()`)
2. Accessing Relationships Without Eager Loading in Controller
3. Nested Resource Without Independent `whenLoaded()` Checks

---

## Repository-Wide Anti-Patterns

- N+1 Query Problem (primary anti-pattern this KU prevents)
- Hidden Database Queries (lazy loading inside resource `toArray()`)

---

## Anti-Pattern 1: Lazy Loading in Resources

### Category
Performance | Reliability

### Description
Accessing a relationship directly in a resource (`$this->posts` instead of `$this->whenLoaded('posts', ...)`) without `whenLoaded()`, triggering lazy loading queries inside the resource.

### Why It Happens
Direct property access on the model is simpler and works in development with small datasets. The N+1 only appears in production under load.

### Warning Signs
- Relationship accessed as `$this->relation` directly in `toArray()`
- No `whenLoaded()` wrapper for any relationship
- Collection responses produce N+1 queries for each item's relation
- Resource works in development but is slow in production

### Why It Is Harmful
Each collection item triggers a separate query for each unloaded relationship. With 100 items and 3 relationships: 301 queries.

### Real-World Consequences
A `/api/users` endpoint with 100 users accessing `$this->posts` without `whenLoaded()` generates 101 queries. Response time jumps from 50ms to 5 seconds.

### Preferred Alternative
Always use `whenLoaded()` for relationship access in resources. Eager-load every relationship in the controller.

### Refactoring Strategy
1. Replace all `$this->relation` direct accesses with `$this->whenLoaded('relation', fn() => ...)`.
2. Add eager loading in the controller for every relationship the resource uses.
3. Add N+1 detection (Laravel's `N+1` detector or Telescope) to catch violations.
4. Test with `assertQueryCountLessThan()` to prevent regressions.

### Detection Checklist
- [ ] Grep for `$this->` relationship access without `whenLoaded` in resource files
- [ ] Check if relationship loading is guaranteed in the controller

### Related Rules
- Rule: Use `whenLoaded()` for Every Relationship Access in Resources

### Related Skills
- Skill: Design a Resource with Conditional Relationships

---

## Anti-Pattern 2: Accessing Relationships Without Eager Loading in Controller

### Category
Architecture | Performance

### Description
The resource uses `whenLoaded()` correctly, but the controller does not eager-load the relationship, so the field is always omitted. Clients never see the relationship data.

### Why It Happens
The developer writes the resource and controller independently. The resource knows which relations to conditionally include, but the controller doesn't load them.

### Warning Signs
- `whenLoaded()` conditions are always false in responses
- Controller uses `Model::all()` instead of `Model::with('relation')->get()`
- Relationship field never appears in the response

### Preferred Alternative
Document required eager loads in the resource class docblock. The controller must eager-load everything the resource uses.

### Refactoring Strategy
1. In the resource, add a docblock listing required eager loads.
2. In the controller, add `->with()` for each required relationship.
3. Add a test that asserts the relationship field is present in the response.

### Detection Checklist
- [ ] Do `whenLoaded()` conditions ever evaluate to true?
- [ ] Check the controller for matching `->with()` calls
