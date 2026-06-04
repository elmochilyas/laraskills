# Dispatching Domain Events — Skills

---

## Skill 1: Dispatch a Domain Event After Transaction Commit

### Purpose
Dispatch a domain event from a model domain method after the database transaction commits, ensuring the event only fires on successful persistence and carries IDs (not model instances).

### When To Use
- A business operation needs to trigger side effects in other parts of the system
- You need to notify external systems about domain occurrences
- You want to decouple the domain operation from its side effects

### When NOT To Use
- The side effect is tightly coupled and simple (inline call is clearer)
- The event would fire for every model change regardless of business significance
- The listener logic should be in the same transaction

### Prerequisites
- Event class defined (past tense name)
- Listener class registered in `EventServiceProvider`

### Inputs
- Event class name
- Event payload (IDs and value objects, not model instances)
- Transaction context

### Workflow

1. **Define the event class** with ID-based payload:
   ```php
   class OrderPlaced
   {
       public function __construct(
           public readonly int $orderId,
           public readonly int $customerId,
           public readonly int $totalCents,
           public readonly string $correlationId,
       ) {}
   }
   ```

2. **Dispatch after the transaction commits** using `DB::afterCommit()`:
   ```php
   public function place(): void
   {
       DB::transaction(function () {
           $this->status = 'placed';
           $this->save();
           
           DB::afterCommit(fn () => Event::dispatch(
               new OrderPlaced($this->id, $this->user_id, $this->total_cents, Str::uuid())
           ));
       });
   }
   ```

3. **Use the recorded events pattern** for complex multi-step operations:
   ```php
   public function place(): void
   {
       $this->status = 'placed';
       $this->save();
       $this->recordEvent(new OrderPlaced($this->id, ...));
   }
   
   // After transaction:
   DB::afterCommit(fn () => array_map(
       fn ($event) => Event::dispatch($event),
       $order->releaseEvents()
   ));
   ```

4. **Implement `ShouldQueue`** on listeners for non-critical side effects

5. **Carry identity and value objects** — never pass Eloquent model instances

### Validation Checklist
- [ ] Events are dispatched after transaction commits
- [ ] Event payload carries IDs and value objects, not model instances
- [ ] Events are named in past tense
- [ ] Listeners are registered in `EventServiceProvider`

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Event fires on rollback | Dispatched before transaction commits | Use `DB::afterCommit()` |
| Stale data in listener | Model instance passed as payload | Carry IDs only |
| Phantom events | Model event listener dispatches domain event | Dispatch only from domain methods |

### Decision Points
- **Non-critical side effect?** → Use `ShouldQueue`
- **Must be same response?** → Synchronous listener
- **Multiple events in one operation?** → Use recorded events pattern

### Performance Considerations
- Synchronous listeners add time to the request
- Queue domain events for operations that don't need immediate reaction
- Serialization of events (for queuing) should avoid large payloads

### Security Considerations
- Events may contain sensitive data — ensure payload doesn't leak PII to logs or queues
- Authorization is the sender's responsibility, not the event's

### Related Rules
| Rule | Reference |
|---|---|
| Dispatch after transaction commit | `05-rules.md` |
| Carry identity and value objects, not model instances | `05-rules.md` |
| Use recorded events pattern for complex operations | `05-rules.md` |
| Name domain events in past tense | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Distinguish Domain Events From Model Events | Foundation for choosing event type |
| Create an Event Projection | Consuming events for read models |
| Design a Domain Service | Orchestrating multi-aggregate operations |

### Success Criteria
- Event is dispatched only after transaction commits
- Event payload carries IDs, not model instances
- Event is named in past tense
- Listeners are registered centrally
- Correlation ID is included for tracing
