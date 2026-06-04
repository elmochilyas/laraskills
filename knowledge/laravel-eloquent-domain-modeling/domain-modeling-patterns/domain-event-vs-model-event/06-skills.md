# Domain Event vs Model Event — Skills

---

## Skill 1: Choose the Correct Event Type for a Side Effect

### Purpose
Determine whether a side effect should be handled by an Eloquent model event (persistence concern) or a domain event (business occurrence), and implement it correctly.

### When To Use
- You need to decide which event system to use for a side effect
- You want to prevent business logic from leaking into model events
- You need to distinguish between persistence activity and business occurrences

### When NOT To Use
- The side effect is trivial and inline code is clearer
- Both model and domain events would work — choose the one matching the concern

### Prerequisites
- Understanding of Eloquent model lifecycle
- Understanding of domain event concepts

### Inputs
- Side effect description (cache invalidation, email sending, search indexing)
- Trigger event type (save operation vs business occurrence)

### Workflow

1. **Classify the side effect** — is it infrastructure or business?
   - **Infrastructure**: cache invalidation, logging, search index → model event
   - **Business**: notifications, cross-aggregate workflows, projections → domain event

2. **For infrastructure side effects**, use model event observers:
   ```php
   class OrderObserver
   {
       public function saved(Order $order): void
       {
           Cache::forget("order:{$order->id}");
       }
   }
   ```

3. **For business side effects**, dispatch domain events explicitly from domain methods:
   ```php
   class Order extends Model
   {
       public function place(): void
       {
           $this->status = 'placed';
           $this->save();
           Event::dispatch(new OrderPlaced($this->id, $this->user_id, $this->total_cents));
       }
   }
   ```

4. **Never dispatch domain events from model event listeners** — model events fire on every save

5. **Use `saveQuietly()` for bulk operations** where model event side effects are unnecessary

### Validation Checklist
- [ ] Model events are used for infrastructure side effects only
- [ ] Domain events are dispatched explicitly from domain methods
- [ ] Domain events are named in past tense
- [ ] No business logic in model event listeners

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Email sent on touch() | Business logic in model event | Use domain event for business reactions |
| Phantom domain events | Domain event dispatched from model event | Dispatch only from domain methods |
| Side effects during seeding | Observers fire on factory creation | Use `saveQuietly()` for seeding |

### Decision Points
- **Cache/log/search?** → Model event observer
- **Send notification, update workflow?** → Domain event
- **Bulk import/seed?** → `saveQuietly()` or `withoutEvents()`

### Performance Considerations
- Model events fire on every save — even on `touch()` calls
- Domain events fire only on explicit business operations
- Use `saveQuietly()` for bulk operations that don't need model event side effects

### Related Rules
| Rule | Reference |
|---|---|
| Use model events only for infrastructure side effects | `05-rules.md` |
| Dispatch domain events explicitly from domain methods | `05-rules.md` |
| Name domain events in past tense | `05-rules.md` |
| Carry IDs in domain events, model instances in model events | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Dispatch a Domain Event After Transaction | Implementing domain events |
| Register an Eloquent Model Observer | Implementing model events |
| Create an Event Projection | Consuming domain events |

### Success Criteria
- Infrastructure side effects use model event observers
- Business side effects use explicit domain events
- No business logic exists in model event listeners
- Domain events are never dispatched from model event hooks
- Bulk operations suppress unnecessary model events
