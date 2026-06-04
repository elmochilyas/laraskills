# Custom State Machine — Skills

---

## Skill 1: Build a Custom State Machine With PHP Enums

### Purpose
Create a lightweight, zero-dependency state machine using PHP backed enums with explicit transition maps, guard conditions, and a `transitionTo()` method on the model.

### When To Use
- The state machine is simple enough that a package would be overkill
- You want full control over the implementation
- You want zero external dependencies for state management

### When NOT To Use
- The state machine has complex requirements (multiple transitions with side effects)
- You need persistence of transition history
- The state machine is shared across multiple models

### Prerequisites
- PHP backed enum defined with state cases
- Model with enum cast on state column

### Inputs
- State enum with explicit backing values
- Allowed transitions map
- Guard conditions for preconditions

### Workflow

1. **Define the state enum** with an `allowedTransitions()` method:
   ```php
   enum OrderStatus: string
   {
       case Pending = 'pending';
       case Approved = 'approved';
       case Shipped = 'shipped';
       case Delivered = 'delivered';
       case Cancelled = 'cancelled';
   
       public function allowedTransitions(): array
       {
           return match ($this) {
               self::Pending => [self::Approved, self::Cancelled],
               self::Approved => [self::Shipped],
               self::Shipped => [self::Delivered],
               self::Delivered => [],
               self::Cancelled => [],
           };
       }
   }
   ```

2. **Cast the state column** on the model with the enum class

3. **Add a `transitionTo()` method** with guard extraction:
   ```php
   public function transitionTo(OrderStatus $newStatus): void
   {
       $this->guardTransition($newStatus);
       $this->status = $newStatus;
       $this->save();
   }
   ```

4. **Extract guards into separate methods** for testability

5. **Throw domain-specific exceptions** on invalid transitions

6. **Test every valid and invalid transition** path

### Validation Checklist
- [ ] Backed enum represents all states
- [ ] Transition map is explicit and auditable
- [ ] Guards check preconditions before transitions
- [ ] State machine is tested with all valid and invalid transitions

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Invalid transition allowed | Missing guard check | Test full transition matrix |
| Transition logic in controller | Status checks duplicated in HTTP layer | Encapsulate in model method |
| Guard logic mixed with execution | Guards and transition in same method | Extract guard methods |

### Decision Points
- **Simple 2-3 state machine?** → Custom state machine is ideal
- **Complex transitions with side effects?** → Use spatie/laravel-model-states
- **Multiple models share same machine?** → Consider a package for consistency

### Performance Considerations
- Custom state machines add zero overhead beyond enum cast and guard checks
- Guard checks are typically fast (property comparisons, simple validations)

### Related Rules
| Rule | Reference |
|---|---|
| Use PHP backed enums for state representation | `05-rules.md` |
| Define all transitions in a single visible map | `05-rules.md` |
| Separate guard conditions from transition execution | `05-rules.md` |
| Throw domain-specific exceptions on invalid transitions | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Cast an Attribute to a PHP Backed Enum | Foundation for state storage |
| Implement a Transition Guard | Precondition checks for transitions |
| Configure Spatie Model States | Package-based alternative |

### Success Criteria
- State enum has explicit backing values and transition map
- `transitionTo()` guards precondition and validates transition
- Guards are separated from transition execution logic
- Full transition matrix is tested
- No transition logic exists in controllers
