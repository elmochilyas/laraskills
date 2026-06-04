# Domain Methods on Models — Skills

---

## Skill 1: Add a Domain Method With Invariant Enforcement

### Purpose
Create a domain method on an Eloquent model that expresses a business operation in ubiquitous language, guards preconditions, and persists state changes atomically.

### When To Use
- The operation expresses a domain concept (markAsPaid, cancel, approve)
- The method only accesses `$this` attributes and owned relationships
- The same domain logic would be duplicated across controllers/actions

### When NOT To Use
- The operation spans multiple aggregates (use an action class or domain service)
- The method requires external side effects (email, API calls)
- The method would exceed reasonable complexity for a single model

### Prerequisites
- Eloquent model class
- Understanding of the business operation

### Inputs
- Method name in ubiquitous language
- Precondition logic
- State mutation logic

### Workflow

1. **Name the method in ubiquitous language** — business term, not technical:
   ```php
   public function markAsPaid(): void // Not updateStatus('paid')
   ```

2. **Guard preconditions at the start** — fail fast:
   ```php
   if ($this->status === 'paid') {
       throw new InvoiceAlreadyPaidException($this->id);
   }
   ```

3. **Mutate state and call `$this->save()`**:
   ```php
   $this->status = 'paid';
   $this->paid_at = now();
   $this->save();
   ```

4. **Do not include external side effects** — no email, events, or API calls

5. **Throw domain-specific exceptions** — not generic `\DomainException`

6. **Keep one responsibility per method** — no boolean flags changing behavior

### Validation Checklist
- [ ] Domain method is named in ubiquitous language
- [ ] Method checks preconditions and throws on violation
- [ ] Method does not call external services or dispatch jobs
- [ ] Method has single responsibility

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Business logic in controller | No domain method exists | Extract to model method |
| Precondition checked too late | Validation after mutation | Guard at method entry |
| Side effects hidden in method | Email/event inside domain method | Defer to caller or listener |

### Decision Points
- **Operates on single model state?** → Domain method on model
- **Coordinates multiple aggregates?** → Domain service
- **Requires external I/O?** → Action class or event listener

### Performance Considerations
- Domain methods add no overhead — standard PHP method calls
- Each method typically calls `save()` once

### Related Rules
| Rule | Reference |
|---|---|
| Name domain methods in ubiquitous language | `05-rules.md` |
| Guard preconditions at the start of every domain method | `05-rules.md` |
| Keep domain methods free of external side effects | `05-rules.md` |
| Give each domain method a single responsibility | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Implement an Aggregate Root | Domain methods on the root entity |
| Design a Domain Service | Cross-aggregate orchestration |
| Dispatch a Domain Event After Transaction | Triggering side effects from domain methods |

### Success Criteria
- Method name uses business terminology stakeholders recognize
- Preconditions are checked and enforced at method entry
- State is mutated and `save()` is called internally
- No external side effects exist in the method
- Method throws domain-specific exceptions
