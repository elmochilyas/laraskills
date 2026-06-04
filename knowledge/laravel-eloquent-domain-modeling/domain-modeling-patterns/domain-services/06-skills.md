# Domain Services — Skills

---

## Skill 1: Design a Domain Service for Cross-Aggregate Orchestration

### Purpose
Create a stateless domain service class that orchestrates operations across multiple aggregate roots, encapsulating business logic that doesn't fit on a single entity.

### When To Use
- A calculation or process involves multiple domain objects
- A business rule spans multiple aggregate roots
- The operation doesn't have a natural home on any single entity

### When NOT To Use
- The logic fits naturally on a single entity (use a model method)
- The operation is purely infrastructure (send email, write log)
- The service would have no domain logic — just delegating to repositories

### Prerequisites
- Aggregate roots defined for each domain concept
- Repository interfaces if persistence is needed

### Inputs
- Domain objects (aggregate roots, value objects)
- Domain interfaces (repositories, other services)

### Workflow

1. **Name the service as a verb process** — `OrderFulfillmentService`, `PricingCalculator`

2. **Inject domain interfaces**, not concrete implementations:
   ```php
   class OrderFulfillmentService
   {
       public function __construct(
           private InventoryService $inventory,
           private PricingCalculator $pricing,
       ) {}
   }
   ```

3. **Keep the service stateless** — all state lives in passed domain objects

4. **Return domain objects or value objects** — never HTTP responses

5. **Contain domain logic, not infrastructure** — no HTTP calls, DB queries, or file I/O

6. **One service per business process** — split if it gains multiple responsibilities

### Validation Checklist
- [ ] Service name describes the process (verb-based)
- [ ] Service is stateless — no mutable properties
- [ ] Service depends on interfaces, not concrete implementations
- [ ] Service contains domain logic, not infrastructure concerns

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Bloated service class | Multiple responsibilities in one service | Split into single-process services |
| Infrastructure coupling | HTTP/DB calls in domain service | Extract behind interfaces |
| Stateful service | Mutable properties across methods | Keep all state in method parameters |

### Decision Points
- **Multiple aggregates involved?** → Domain service
- **Single entity operation?** → Domain method on model
- **Infrastructure-only operation?** → Application service or job

### Performance Considerations
- Domain services add one method call layer — negligible overhead
- Services querying multiple repositories may trigger N+1 — ensure eager loading

### Related Rules
| Rule | Reference |
|---|---|
| Name domain services as verbs describing a process | `05-rules.md` |
| Keep domain services stateless | `05-rules.md` |
| Inject domain interfaces, not concrete implementations | `05-rules.md` |
| Ensure domain services contain domain logic, not infrastructure | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Add a Domain Method With Invariant Enforcement | Single-entity operations |
| Create a Repository Interface for an Aggregate Root | Dependency of domain services |
| Implement an Aggregate Root | Objects the service orchestrates |

### Success Criteria
- Service name is a verb describing the business process
- Service is stateless with no mutable properties
- Dependencies are interfaces, not concrete implementations
- Service contains domain logic, not infrastructure calls
- Service returns domain objects, not HTTP responses
