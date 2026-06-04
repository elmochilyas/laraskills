# Entity vs Value Object — Skills

---

## Skill 1: Distinguish Entity from Value Object in the Domain

### Purpose
Analyze a domain concept and classify it as an entity (has identity, mutable lifecycle) or a value object (defined by attributes, immutable), then implement it accordingly in Laravel.

### When To Use
- You're modeling a new domain concept
- An existing model's classification is unclear (identity rules, immutability)
- You're refactoring toward richer domain modeling

### When NOT To Use
- The concept is obviously an Eloquent model with a primary key (entity)
- The concept is obviously a simple value wrapper (value object)
- You're over-engineering a simple CRUD feature

### Prerequisites
- Understanding of entity vs value object distinction
- Knowledge of the domain concept's lifecycle

### Inputs
- Domain concept to classify
- Identity criteria (what makes it unique)
- Lifecycle characteristics (created, updated, deleted independently)

### Workflow

1. **Ask: does this concept have its own identity?** — If the concept is tracked by a primary key (id) and has an independent lifecycle, it's an entity → implement as Eloquent model

2. **Ask: are two instances with the same properties interchangeable?** — If yes, it's a value object → implement as a plain PHP class with `readonly` properties

3. **Ask: can the concept be changed in-place?** — If the concept must be mutable (status transitions, state changes), it's an entity

4. **Implement entities** as Eloquent models with domain methods

5. **Implement value objects** as plain PHP classes with readonly properties and a custom cast

6. **Embed value objects in entities** via casts or relationships

7. **Use value objects for entity attributes** (Email, Money, Address)

### Validation Checklist

- [ ] Entity has a clear identity (primary key, UUID, natural key)
- [ ] Entity lifecycle is explicit (create → modify → persist)
- [ ] Value object is immutable (readonly properties)
- [ ] Value objects are compared by value equality
- [ ] Value objects have no independent identity or lifecycle
- [ ] Entities embed value objects as typed attributes
- [ ] Classification is documented or obvious from the code

### Related Rules

| Rule | Reference |
|---|---|
| Entities have independent identity and lifecycle | `05-rules.md` Rule 1 |
| Value objects are defined by their attributes | `05-rules.md` Rule 2 |
| Value objects are immutable | `05-rules.md` Rule 3 |
| Embed VOs in entities via casting | `05-rules.md` Rule 4 |
| Compare VOs by value, entities by identity | `05-rules.md` Rule 5 |

### Success Criteria
- Each domain concept is correctly classified as entity or value object
- Entities are Eloquent models with domain methods
- Value objects are immutable plain PHP classes
- Value objects are integrated via custom casting
