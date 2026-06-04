# State Machine Patterns — Skills

---

## Skill 1: Implement a State Machine on a Model

### Purpose
Model an entity's lifecycle using a state machine pattern that explicitly defines allowed transitions, guards, and side effects, replacing scattered if/else state checks with declarative transitions.

### When To Use
- An entity has a well-defined set of states (draft → published → archived)
- Transition logic is scattered across the codebase in conditionals
- You need to enforce valid transitions (prevent invalid state changes)

### When NOT To Use
- The entity has only two states (active/inactive) — simpler patterns suffice
- States change freely without constraints (no real state machine)
- A status column with simple assignment is sufficient

### Prerequisites
- List of all possible states for the entity
- List of all allowed transitions between states
- Side effects for each transition

### Inputs
- Entity model class
- States (status constants or backed enum)
- Allowed transitions (state_from → state_to)

### Workflow

1. **Define states** as constants or a backed enum:
   ```php
   class Order extends Model
   {
       public const STATUS_PENDING = 'pending';
       public const STATUS_CONFIRMED = 'confirmed';
       public const STATUS_SHIPPED = 'shipped';
       public const STATUS_DELIVERED = 'delivered';
       public const STATUS_CANCELLED = 'cancelled';
   ```

2. **Define allowed transitions** — map each state to its valid next states:
   ```php
   private const ALLOWED_TRANSITIONS = [
       self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
       self::STATUS_CONFIRMED => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
       self::STATUS_SHIPPED => [self::STATUS_DELIVERED],
       self::STATUS_DELIVERED => [],
       self::STATUS_CANCELLED => [],
   ];
   ```

3. **Add a `transitionTo()` method** that checks the map and transitions:
   ```php
   public function transitionTo(string $newStatus): void
   {
       if (!in_array($newStatus, self::ALLOWED_TRANSITIONS[$this->status] ?? [])) {
           throw new \DomainException("Cannot transition from {$this->status} to $newStatus");
       }
       $this->status = $newStatus;
   }
   ```

4. **Add shorthand transition methods** for common transitions:
   ```php
   public function confirm(): void { $this->transitionTo(self::STATUS_CONFIRMED); }
   public function ship(): void { $this->transitionTo(self::STATUS_SHIPPED); }
   ```

5. **Dispatch domain events** inside the transition method

6. **Test each transition** — assert allowed transitions succeed, invalid ones throw

### Validation Checklist

- [ ] All states are enumerated (constants or backed enum)
- [ ] Allowed transitions are defined in a central map
- [ ] `transitionTo()` enforces the map and throws on invalid
- [ ] Shorthand methods exist for common transitions
- [ ] Domain events are dispatched on transition
- [ ] Every allowed transition has a test
- [ ] Every invalid transition is tested (throws)

### Related Rules

| Rule | Reference |
|---|---|
| Define all states as constants or backed enum | `05-rules.md` Rule 1 |
| Define allowed transitions in a central map | `05-rules.md` Rule 2 |
| Guard transitions with domain exceptions | `05-rules.md` Rule 3 |
| Add shorthand methods for common transitions | `05-rules.md` Rule 4 |
| Test allowed and invalid transitions | `05-rules.md` Rule 5 |

### Success Criteria
- All entity states are enumerated
- State transitions go through a central `transitionTo()` method
- Invalid transitions throw domain exceptions
- Shorthand transition methods exist for common flows
- Domain events fire on each meaningful transition
