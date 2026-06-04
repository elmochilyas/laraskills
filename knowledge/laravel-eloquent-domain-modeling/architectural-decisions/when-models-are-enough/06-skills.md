# When Models Are Enough — Skills

---

## Skill 1: Add a State-Changing Method to a Model

### Purpose
Add a named, explicit state-changing method to an Eloquent model that enforces invariants, encapsulates the state transition, and keeps domain logic visible on the model.

### When To Use
- The operation reads or mutates a single model's own attributes
- The operation touches owned relations (hasMany) within the same aggregate
- You want to replace scattered `update()` calls with a named method

### When NOT To Use
- The operation coordinates two or more aggregate roots
- The operation requires external side-effects (email, API calls)
- The operation is a trivial field update like `last_viewed_at`

### Prerequisites
- Eloquent model class exists
- Understanding of the model's valid state transitions

### Inputs
- State transition to model (e.g., "mark as paid", "archive", "approve")
- Invariants to enforce (e.g., "only sent invoices can be paid")
- Attributes to modify during the transition

### Workflow

1. **Name the method using domain language**: `markAsPaid()`, `archive()`, `cancel()`, `approve()`
   - The verb expresses intent — `updateStatus()` is too vague

2. **Enforce invariants at the start of the method**:
   ```php
   public function markAsPaid(): void
   {
       if ($this->status !== InvoiceStatus::Sent) {
           throw new \DomainException('Only sent invoices can be paid.');
       }
       // ...
   }
   ```

3. **Modify only `$this` attributes and owned relations** — never write to another model's table

4. **Call `$this->save()`** but do not manage the transaction — let the caller do that

5. **Raise events for side effects** instead of calling external services:
   ```php
   public function markAsPaid(): void
   {
       $this->status = InvoiceStatus::Paid;
       $this->paid_at = now();
       $this->save();
       event(new InvoicePaid($this)); // Handler sends email
   }
   ```

6. **Don't wrap in `DB::transaction()`** — the caller manages the transaction boundary

7. **Test with model factories**, not mocks

### Validation Checklist

- [ ] Method name uses domain verb: `markAsPaid()`, `archive()`, not `updateStatus()`
- [ ] Invariants are enforced at the start of the method
- [ ] Method only modifies `$this` attributes and owned relations
- [ ] No cross-aggregate writes (no `OtherModel::where(...)->update()`)
- [ ] No external service calls (no `Mail::to()`, `dispatch()`, `Log::info()`)
- [ ] Side effects use events, not direct service calls
- [ ] Method calls `$this->save()` but does not manage transactions
- [ ] Tested with model factory + database assertion

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Method writes to another model | Cross-aggregate logic in model | Extract to action |
| Method calls external service | Convenience | Replace with event dispatch |
| Method wraps in transaction | Over-protectiveness | Remove; let caller manage |
| Method named `updateStatus()` | Vagueness | Rename to explicit `markAs*()` |
| Method has no invariant check | Missing business rule | Add guard clause at top |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Put within-aggregate logic on the model | `05-rules.md` Rule 1 |
| Rule 2: Keep model methods pure — no external services | `05-rules.md` Rule 2 |
| Rule 3: Use explicit state-changing methods | `05-rules.md` Rule 3 |
| Rule 6: Never write to another model's table | `05-rules.md` Rule 6 |
| Rule 7: Let controllers/actions manage transactions | `05-rules.md` Rule 7 |
| Rule 8: Accessors for presentation only | `05-rules.md` Rule 8 |

### Related Skills

| Skill | Relationship |
|---|---|
| Refactor Inline State Mutation into a Model Method | Extracting scattered update calls into the model |
| Extract a Large Model into Traits | When the model exceeds 300 lines |

### Success Criteria
- Model has a named method for the state transition
- Invariants are enforced (invalid transitions throw)
- Method only touches its own attributes and owned relations
- Tested with factory and database assertion, no mocks

---

## Skill 2: Refactor Inline State Mutation into a Model Method

### Purpose
Replace scattered `$model->update([...])` calls across controllers with a single named model method that enforces invariants consistently.

### When To Use
- The same state transition is done via `update()` in multiple places
- Some callers miss required fields or invariant checks
- You want a single authoritative point of change for state transitions

### When NOT To Use
- The mutation is a simple counter or timestamp with no business rules
- The mutation is truly one-off and will never be reused

### Prerequisites
- Model with valid state transitions defined
- List of all places where `update()` is called with the same pattern

### Inputs
- Model class
- List of callers that mutate the same field(s)
- State transition rules

### Workflow

1. **Search the codebase** for all places where `$model->update(['status' => ...])` or `$model->status = ...` is done for the target model

2. **Identify the state transition pattern** — what fields are always set together?

3. **Create the named method** on the model following Skill 1

4. **Replace each caller** with the named method call:
   ```php
   // Before
   $invoice->update(['status' => 'paid', 'paid_at' => now()]);

   // After
   $invoice->markAsPaid();
   ```

5. **Verify invariants** — some callers may have been skipping checks that the new method now enforces

6. **Remove any duplicate logic** in callers

### Validation Checklist

- [ ] All scattered `update()` calls replaced with the named method
- [ ] Invariants are now consistently enforced
- [ ] No regression in callers that had different requirements
- [ ] Tests pass with the new method
- [ ] The model now has one authoritative method for the transition

### Related Rules

| Rule | Reference |
|---|---|
| Rule 3: Use explicit state-changing methods | `05-rules.md` Rule 3 |

### Success Criteria
- Zero inline `$model->update(['status' => ...])` calls for the transition
- Single model method enforces all invariants
- All callers use the same method

---

## Skill 3: Extract a Large Model into Traits

### Purpose
Split a model exceeding 300 lines into focused traits, each handling a cohesive group of methods (e.g., `HasBilling`, `HasProfile`, `HasNotifications`).

### When To Use
- Model file exceeds 300 lines
- Related methods can be grouped into cohesive concerns
- Multiple developers modify the model and create merge conflicts

### When NOT To Use
- The model is large because of many relationship definitions (not logic)
- The model's methods are all tightly coupled and cannot be separated
- The model is under 300 lines — keep it as one file

### Prerequisites
- Model class with identifiable method groups

### Inputs
- Model class file
- List of method groups (e.g., billing, profile, admin, notifications)

### Workflow

1. **Identify cohesive method groups** — which methods relate to the same concern?

2. **Create a trait for each group**: `HasBilling`, `HasProfile`, `HasNotifications`
   - Follow the `boot{TraitName}` convention for trait boot methods if needed

3. **Move the group's methods** into the trait, including any private helper methods

4. **Update the model** to use the traits:
   ```php
   class User extends Model
   {
       use HasBilling;
       use HasProfile;
       use HasNotifications;
   }
   ```

5. **Keep relationship definitions** on the main model unless they are part of a trait's concern

6. **Move related tests** into separate test files matching each trait

7. **Verify model functionality** — all tests must pass

### Validation Checklist

- [ ] Each trait has a cohesive, single concern
- [ ] Traits follow naming convention: `Has{Concern}`
- [ ] Model uses the traits and stays under 300 lines
- [ ] Boot methods use `boot{TraitName}` convention
- [ ] Tests pass after extraction
- [ ] No circular dependency between traits

### Related Rules

| Rule | Reference |
|---|---|
| Rule 4: Keep models under 300 lines | `05-rules.md` Rule 4 |

### Success Criteria
- Model class is under 300 lines
- Each trait has a single, identifiable concern
- Merge conflicts reduce as multiple developers work on different traits
- Tests pass — no behavioral change from extraction
