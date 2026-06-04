# State Pattern Fundamentals — Skills

---

## Skill 1: Model a Finite State Machine With Backed Enums

### Purpose
Represent a finite set of states using PHP backed enums with explicit transition maps, separate state data from transition logic, and enforce valid transitions at the type level.

### When To Use
- An object's behavior changes based on its current state
- There are well-defined, constrained state transitions
- You need explicit documentation of allowed state transitions

### When NOT To Use
- The state space is small (2-3 states) with simple transitions (use if statements)
- States don't affect behavior — only data filtering
- The transition logic changes with every business rule update

### Prerequisites
- PHP backed enum class defined
- Understanding of finite state machine concepts

### Inputs
- State enum with explicit backing values
- Allowed transitions map
- Transition guard conditions

### Workflow

1. **Define the state as a backed enum** with explicit backing values:
   ```php
   enum OrderStatus: string
   {
       case Pending = 'pending';
       case Approved = 'approved';
       case Shipped = 'shipped';
       case Delivered = 'delivered';
       case Cancelled = 'cancelled';
   }
   ```

2. **Define the complete transition map** in a single location:
   ```php
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
   ```

3. **Separate state data from transition behavior** — enum holds data, model methods or a state machine class holds behavior

4. **Use Eloquent's `enum` cast** for the state column:
   ```php
   protected $casts = ['status' => OrderStatus::class];
   ```

5. **Centralize guards** in the transition logic, not in callers

6. **Test the complete transition matrix** — all valid and invalid paths

### Validation Checklist
- [ ] States are represented as backed enums
- [ ] Allowed transitions are explicitly defined
- [ ] Invalid state combinations cannot be created
- [ ] Transition guards enforce preconditions

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Invalid state stored | No enum cast on column | Always use `enum` cast |
| Transition map scattered | Rules in individual methods | Consolidate in one place |
| Guard bypassed | Preconditions checked in controllers | Enforce at state machine level |

### Decision Points
- **Simple states with no transitions?** → Enum with no transition map needed
- **Complex state-specific behavior?** → State classes (Spatie or custom)
- **Transitions with side effects?** → Add guard and transition classes

### Performance Considerations
- State resolution adds minimal overhead
- Complex transition guards may add validation overhead for frequent transitions

### Related Rules
| Rule | Reference |
|---|---|
| Represent each state as a backed PHP enum | `05-rules.md` |
| Make invalid state transitions impossible at the type level | `05-rules.md` |
| Separate state data from state behavior | `05-rules.md` |
| Define the complete transition map in one location | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Build a Custom State Machine With PHP Enums | Applying these fundamentals |
| Cast an Attribute to a PHP Backed Enum | Storing the state in DB |
| Implement a Transition Guard | Enforcing preconditions |

### Success Criteria
- States are backed enums stored via `enum` cast
- Complete transition map is defined in a single location
- State data (enum) is separate from transition behavior (logic)
- Guards are centralized, not duplicated in callers
- Full transition matrix is tested
