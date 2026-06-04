# Transition Guards — Skills

---

## Skill 1: Implement a Transition Guard for State Changes

### Purpose
Create a guard condition on a state transition that validates business rules before allowing the change, using plain PHP methods or dedicated guard classes for complex preconditions.

### When To Use
- A state transition has preconditions beyond simple state machine rules
- Multiple preconditions must all pass before a transition is allowed
- Preconditions involve cross-model checks or external validation

### When NOT To Use
- The only precondition is the current state (use state machine `transitionTo()` directly)
- The guard logic is trivial (null check, exists check)
- Preconditions are already enforced by domain method body

### Prerequisites
- State machine or transition method on the model
- List of preconditions for each transition

### Inputs
- Transition method (confirm, ship, publish)
- Precondition logic (user permission, order total, relation exists)
- Error message for failing preconditions

### Workflow

1. **Add guard methods** before the state transition:
   ```php
   public function publish(): void
   {
       $this->guardPublishable();
       // state machine transition
   }
   ```

2. **Extract each precondition** into its own method or class:
   ```php
   private function guardPublishable(): void
   {
       if (!$this->isComplete()) {
           throw new \DomainException('Only complete posts can be published.');
       }
       if (!$this->hasRequiredRelations()) {
           throw new \DomainException('Post must have at least one tag.');
       }
   }
   ```

3. **For complex preconditions** (spanning multiple models), extract a dedicated guard:
   ```php
   class OrderConfirmationGuard
   {
       public function __construct(
           private readonly CustomerStatusService $customerStatus,
       ) {}
   
       public function guard(Order $order): void
       {
           if (!$this->customerStatus->isActive($order->customer_id)) {
               throw new \DomainException('Inactive customers cannot confirm orders.');
           }
       }
   }
   ```

4. **Use dedicated exceptions** for each type of guard failure

5. **Test guard conditions** — assert each precondition throws correctly

6. **Keep guard methods fast** — no I/O in inline guards (use dedicated guards for that)

### Validation Checklist

- [ ] Preconditions are checked before each state transition
- [ ] Each precondition has its own method or guard class
- [ ] Guard failures throw domain exceptions with clear messages
- [ ] Complex preconditions are extracted to dedicated guard classes
- [ ] Inline guards have no I/O (use dedicated guards for that)
- [ ] Tests cover both passing and failing guard conditions

### Related Rules

| Rule | Reference |
|---|---|
| Guard transitions before changing state | `05-rules.md` Rule 1 |
| Extract each precondition to its own method | `05-rules.md` Rule 2 |
| Use dedicated guard classes for complex preconditions | `05-rules.md` Rule 3 |
| Throw domain exceptions with clear messages | `05-rules.md` Rule 4 |
| Test both passing and failing guards | `05-rules.md` Rule 5 |

### Success Criteria
- All state transitions are guarded by preconditions
- Each precondition is independently understandable and testable
- Complex preconditions are extracted to named guard classes
- Guards throw clear, specific domain exceptions
- Tests confirm guards reject invalid transitions and accept valid ones
