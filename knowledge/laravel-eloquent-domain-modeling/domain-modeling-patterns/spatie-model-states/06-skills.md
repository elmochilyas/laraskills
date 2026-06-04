# Spatie Model States — Skills

---

## Skill 1: Implement a State Machine Using Spatie Model States

### Purpose
Configure a state machine using `spatie/laravel-model-states` with dedicated state classes, explicit transition maps, and optional transition classes for side effects.

### When To Use
- You need a formal state machine with explicit transition validation
- You want state-specific behavior encapsulated in state classes
- You need transition lifecycle hooks
- The state machine is complex enough to warrant a package

### When NOT To Use
- The state machine is simple (2-3 states) — an enum + switch is simpler
- You need full control over the implementation
- You don't want the package dependency

### Prerequisites
- `spatie/laravel-model-states` package installed
- Model with a state column (string)

### Inputs
- Base state class extending `Spatie\ModelStates\State`
- State subclasses for each state
- Transition map in each state class

### Workflow

1. **Define the base state class**:
   ```php
   class OrderState extends State
   {
       abstract public function color(): string;
   }
   ```

2. **Create concrete state classes** with `transitionableStates()`:
   ```php
   class Pending extends OrderState
   {
       public function color(): string { return 'yellow'; }
       public function transitionableStates(): array
       {
           return [Approved::class, Cancelled::class];
       }
   }
   
   class Approved extends OrderState
   {
       public function color(): string { return 'green'; }
       public function transitionableStates(): array
       {
           return [Shipped::class];
       }
   }
   ```

3. **Register the state cast** on the model:
   ```php
   protected $casts = [
       'status' => StateCast::class . ':' . OrderState::class,
   ];
   ```

4. **Use transition classes** for side effects:
   ```php
   $order->status->transitionTo(Shipped::class, ShipOrderTransition::class);
   ```

5. **Group state classes per entity** in `App\States\{Entity}\*` namespaces

6. **Test every transition** with actual persisted model instances

### Validation Checklist
- [ ] State classes extend `Spatie\ModelStates\State`
- [ ] `transitionableStates()` defines allowed transitions
- [ ] State field is registered with `StateCast` in `$casts`
- [ ] Transitions are tested with actual model instances

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| All transitions allowed | `transitionableStates()` not overridden | Explicitly define in every state |
| State machine broken | `StateCast` forgotten in `$casts` | Always register the cast |
| Side effects in state class | Business logic in state methods | Extract to Transition classes |

### Decision Points
- **Simple 2-3 states?** → Use enum-based custom state machine
- **Complex with side effects?** → Spatie model states
- **Transition history needed?** → Add event sourcing on top

### Performance Considerations
- State objects are resolved via the custom cast on each read
- Transition validation runs before execution — minimal overhead

### Related Rules
| Rule | Reference |
|---|---|
| Define allowed transitions explicitly in each state class | `05-rules.md` |
| Use transition classes for side effects | `05-rules.md` |
| Keep state classes focused on transition rules | `05-rules.md` |
| Register the state field using StateCast | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Build a Custom State Machine With PHP Enums | Simpler alternative |
| Implement a Transition Guard | Precondition checks for transitions |
| Implement an Aggregate Root | State machine lives on the root |

### Success Criteria
- Each state class extends `State` and defines `transitionableStates()`
- Model casts the state column with `StateCast`
- Transition classes encapsulate side effects
- All transitions are tested with persisted model instances
- State classes are organized per entity namespace
