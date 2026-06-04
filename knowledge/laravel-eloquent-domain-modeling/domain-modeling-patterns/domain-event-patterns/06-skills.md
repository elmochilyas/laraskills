# Domain Event Patterns — Skills

---

## Skill 1: Dispatch a Domain Event from a Model

### Purpose
Emit a domain event when a meaningful state change occurs in a model, enabling decoupled side effects (notifications, logging, projections) without inline coupling.

### When To Use
- Multiple side effects should happen when a model changes state (email, log, sync)
- You want to decouple side effects from the operation that triggers them
- The same event needs to be handled by different subscribers in different environments

### When NOT To Use
- The side effect is tightly coupled and always happens inline (use action class)
- The side effect is a simple, one-line log statement
- Event complexity outweighs the benefit in a small project

### Prerequisites
- Event class implementing `ShouldDispatch` or extending `Dispatchable`
- Understanding of Laravel's event system

### Inputs
- Event class name
- Domain payload (model, context, metadata)
- List of intended listeners

### Workflow

1. **Create the event class** — plain PHP object with readonly properties:
   ```php
   class OrderPlaced
   {
       public function __construct(
           public readonly Order $order,
           public readonly Carbon $occurredAt = new Carbon(),
       ) {}
   }
   ```

2. **Dispatch from the model's domain method** — not from the controller:
   ```php
   public function place(): void
   {
       if ($this->status !== self::STATUS_PENDING) {
           throw new \DomainException('Only pending orders can be placed.');
       }
       $this->status = self::STATUS_PLACED;
       $this->save();
       event(new OrderPlaced($this));
   }
   ```

3. **Create listeners** for each concern (email, log, audit, projection)

4. **Register events and listeners** in `EventServiceProvider`

5. **Test the event** — assert the event was dispatched when the domain method runs

6. **Keep event payloads minimal** — prefer IDs over full models for durability

### Validation Checklist

- [ ] Event class has meaningful name (past tense, domain concept)
- [ ] Event is dispatched from a domain method, not a controller
- [ ] Listeners are registered in EventServiceProvider
- [ ] Event payloads are minimal (IDs preferred for queued listeners)
- [ ] Event dispatching is tested (assert event was dispatched)
- [ ] Listeners are queued for expensive side effects

### Related Rules

| Rule | Reference |
|---|---|
| Dispatch events from domain methods | `05-rules.md` Rule 1 |
| Name events in past tense | `05-rules.md` Rule 2 |
| Keep event payloads minimal | `05-rules.md` Rule 3 |
| Queue expensive listeners | `05-rules.md` Rule 4 |
| Test that events are dispatched | `05-rules.md` Rule 5 |

### Success Criteria
- Event is dispatched as part of a domain state change
- Listeners execute decoupled side effects
- Event name reflects the domain concept (past tense)
- Tests verify event dispatch on the correct state change
