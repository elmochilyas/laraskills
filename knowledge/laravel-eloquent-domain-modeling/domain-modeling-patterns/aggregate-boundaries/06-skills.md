# Aggregate Boundaries — Skills

---

## Skill 1: Identify and Define an Aggregate Boundary

### Purpose
Define the aggregate boundary for a cluster of domain objects, identifying the aggregate root and establishing transactional consistency zones within the domain model.

### When To Use
- You need clear transaction boundaries for complex domain operations
- You want to prevent objects from being modified outside their owning aggregate
- Multiple related entities must be saved atomically

### When NOT To Use
- The application is simple CRUD with no complex invariants
- All operations are on single models with no child entities
- Transactional boundaries are not a concern

### Prerequisites
- Understanding of DDD aggregate concepts
- Knowledge of the domain's consistency requirements

### Inputs
- Entity relationships and ownership hierarchy
- Business invariants that must be enforced atomically

### Workflow

1. **Identify entities that must be transactionally consistent** — if two entities must always be saved together, they belong to the same aggregate

2. **Designate one entity as the aggregate root** — this is the only entry point for modifications

3. **Reference other aggregates by root ID only** — never by object reference

4. **Wrap root operations in `DB::transaction()`** — ensure atomicity:
   ```php
   public function addItem(Product $product, int $quantity): void
   {
       DB::transaction(function () use ($product, $quantity) {
           $this->items()->create([...]);
           $this->recalculateTotal();
           $this->save();
       });
   }
   ```

5. **One transaction modifies one aggregate** — never modify two roots in one transaction

6. **Validate invariants before and after** every mutation

### Validation Checklist
- [ ] Transaction boundaries align with aggregate boundaries
- [ ] External code references aggregate roots only
- [ ] Cross-aggregate references use IDs, not object references
- [ ] Aggregate operations are wrapped in `DB::transaction()`

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Transaction modifies two aggregates | Logic spans roots in one transaction | Use events for eventual consistency |
| Invariant bypassed | Child collection exposed for direct mutation | Provide domain methods on root |
| Aggregates too large | All entities lumped together | Keep boundaries small |

### Decision Points
- **Entities must be saved together?** → Same aggregate
- **Can be eventually consistent?** → Separate aggregates
- **Cross-aggregate relationship needed?** → Reference by root ID

### Performance Considerations
- Smaller aggregates → smaller transactions, less locking
- Eventual consistency across boundaries improves write throughput
- Loading large aggregates with many children can be expensive

### Security Considerations
- Aggregate roots enforce access control to internal entities
- The root is the enforcement point for all invariants

### Related Rules
| Rule | Reference |
|---|---|
| One transaction modifies only one aggregate | `05-rules.md` |
| Reference other aggregates by root ID | `05-rules.md` |
| Use DB::transaction() for aggregate operations | `05-rules.md` |
| Never expose child collections for direct modification | `05-rules.md` |
| Keep aggregate boundaries small | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Design an Aggregate Root | Root entity within the boundary |
| Implement Domain Methods on Models | Methods that enforce invariants |
| Dispatch Domain Events After Transaction | Cross-aggregate communication |

### Success Criteria
- Aggregate boundary is clearly identified and documented
- Root is the only entry point for modifications
- Cross-aggregate references use IDs, not object references
- Aggregate operations are wrapped in transactions
- Invariants are enforced before and after mutations
