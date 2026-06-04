# Anti-Patterns: When Models Are Enough

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When Models Are Enough |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | God Model (500+ Line Model Class) | Design | High |
| 2 | Tight Coupling (Model Calls External Services) | Maintainability | Critical |
| 3 | State Leak (Cross-Aggregate Writes in Model) | Architecture | High |
| 4 | Missing Transaction Safety in Controllers | Reliability | Medium |
| 5 | Anemic Domain Model (No Model Methods) | Architecture | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Scattered `update()` Calls Instead of Named Methods | when-models-are-enough, action-class-patterns | High |
| Model Methods That Call External Services Directly | when-models-are-enough | Critical |
| Accessors With Domain Logic Instead of Formatting | when-models-are-enough, attributes-and-casting | Medium |
| Cross-Aggregate Logic in Model Methods | when-models-are-enough, when-to-use-actions | High |
| Testing Model Methods With Mocks Instead of Factories | when-models-are-enough | Medium |

---

## Anti-Pattern 1: God Model (500+ Line Model Class)

### Category
Design — Single Responsibility Violation

### Description
An Eloquent model class exceeds 500+ lines, containing methods for unrelated concerns: billing, authentication, notifications, reporting, admin utilities, and relationship definitions. The model becomes a dumping ground for any method related to the entity.

### Why It Happens
It is convenient to add a method to the model because "it's about this entity." Without a line-length guideline, developers keep adding. Merge conflicts increase as multiple developers modify the same file.

### Warning Signs
- Model file exceeds 400 lines
- Model uses 5+ traits, each addressing different concerns
- Trait boot methods (boot{Billing}, boot{Profile}) have complex logic
- Model methods reference concerns from different bounded contexts
- Merge conflicts on the model file are frequent

### Why Harmful
God models violate SRP, making the class hard to maintain and test. Related methods are hard to find within the massive file. Multiple developers modify the same file causing merge conflicts. Testing requires complex setup because unrelated methods are coupled in the same class.

### Real-World Consequences
A `User` model at 800 lines has methods for billing (`charge()`, `subscribe()`), profile (`updateAvatar()`, `getFullName()`), notifications (`sendDigest()`), and admin (`ban()`, `impersonate()`). Changing `charge()` requires reviewing all billing tests plus unrelated tests that might break. A billing team member must understand profile and notification code to avoid regression.

### Preferred Alternative
Extract related method groups into traits (`HasBilling`, `HasProfile`) or value objects. Keep the model under ~300 lines.

### Refactoring Strategy
1. Group methods by concern (billing, profile, notifications, admin)
2. Extract each group into a trait named `Has{Concern}` (e.g., `HasBilling`)
3. Use `boot{TraitName}` for trait boot methods if needed
4. Keep relationship definitions and core model configuration on the main model
5. Move related tests into separate files per trait

### Detection Checklist
- [ ] Model file > 400 lines
- [ ] Model uses 5+ traits covering unrelated concerns
- [ ] Methods reference different bounded contexts
- [ ] Frequent merge conflicts on the model file

### Related Rules/Skills/Decision Trees
- **Rule 4**: Keep models under ~300 lines (`05-rules.md`)
- **Skill 3**: Extract a Large Model into Traits (`06-skills.md`)
- **Decision Tree**: Model Method Sufficiency Decision (`07-decision-trees.md`)

---

## Anti-Pattern 2: Tight Coupling (Model Calls External Services)

### Category
Maintainability — Hidden Infrastructure Dependencies

### Description
A model method calls `Mail::to()`, `dispatch()`, `Log::info()`, or an external API directly. The model becomes coupled to mail infrastructure, queue systems, and logging services, making it untestable without faking all external services.

### Why It Happens
It is convenient to add an email notification or log entry directly in the model method. Developers don't consider testability when adding a "quick" side effect.

### Warning Signs
- `Mail::to()` or `mail()` called inside a model method
- `dispatch()` or `dispatchNow()` called inside a model method
- `Log::info()` or `\Log::error()` called inside a model method
- External API calls (HTTP) inside a model method
- Model method tests require `Mail::fake()`, `Queue::fake()`, or `Http::fake()`

### Why Harmful
Model methods become untestable in isolation — tests must fake mail, queue, and HTTP infrastructure. External service failures break model operations. The model cannot be used without Laravel infrastructure booted. Side effects are hidden from callers.

### Real-World Consequences
An `Invoice` model's `markAsPaid()` sends an email via `Mail::to()`. When the mail driver configuration changes (e.g., from SES to SendGrid), the model method must be updated. The unit test must configure `Mail::fake()`, which means it's testing the mail infrastructure, not the business rule. An email sending failure prevents the invoice from being marked as paid.

### Preferred Alternative
Model methods raise events for side effects. Event handlers handle mail, queue, and logging concerns.

### Refactoring Strategy
1. Replace `Mail::to()`, `dispatch()`, `Log::info()` with `event(new ...)` calls
2. Create event classes and listener/handler classes for each side effect
3. Move external service logic to listeners
4. Remove `Mail::fake()` / `Queue::fake()` from model method tests
5. Test model method assertions without faking infrastructure

### Detection Checklist
- [ ] Model method calls any Facade (`Mail`, `Queue`, `Log`, `Cache`, `Http`)
- [ ] Model method calls `dispatch()` or `dispatchNow()`
- [ ] Model method tests require `Mail::fake()` or `Queue::fake()`
- [ ] Model method creates HTTP requests or sends emails

### Related Rules/Skills/Decision Trees
- **Rule 2**: Keep model methods pure — never call external services (`05-rules.md`)
- **Skill 1**: Add a State-Changing Method to a Model (`06-skills.md`)

---

## Anti-Pattern 3: State Leak (Cross-Aggregate Writes in Model)

### Category
Architecture — Aggregate Boundary Violation

### Description
A model method modifies the state of another model directly — `OtherModel::where('x', $y)->update()` or `$differentModel->save()` — bypassing the other aggregate's invariants and crossing aggregate boundaries.

### Why It Happens
It is convenient to update a related model's state in the same method. The developer doesn't recognize aggregate boundaries and sees all database tables as freely writable from any model.

### Warning Signs
- Model method calls `OtherModel::where(...)->update(...)`
- Model method calls `$differentModel->save()` or `$differentModel->delete()`
- Model method dispatches `DB::update()` on a different table
- Model method writes to tables outside its own aggregate boundary
- Tests for a model method affect data in unrelated tables

### Why Harmful
Cross-aggregate writes in model methods circumvent invariants on the other aggregate. The write is not wrapped in a transaction with the caller's operation, risking partial updates. The model gains responsibilities outside its boundary.

### Real-World Consequences
`Order::cancel()` calls `Inventory::where('order_id', $this->id)->increment('stock')`. An `Order` method now manages inventory. When the inventory policy changes (e.g., multi-warehouse stock management), the `Order` model must be updated — something the Order team should not need to know. The action that calls `cancel()` cannot easily wrap both in a transaction.

### Preferred Alternative
Model methods only modify `$this` attributes and owned relations (within the same aggregate). Cross-aggregate operations go in action classes with `DB::transaction()`.

### Refactoring Strategy
1. Remove `OtherModel::where(...)` and `$differentModel->save()` calls from the model method
2. Raise an event for the cross-aggregate side effect
3. Create an action class that handles the cross-aggregate operation with a transaction
4. The action calls the model method and handles the other aggregate's update
5. Update callers to use the action instead of the model method directly

### Detection Checklist
- [ ] Model method writes to a different model's table
- [ ] Model method calls `save()` or `delete()` on a different model instance
- [ ] Model method uses `DB::table('other_table')` for writes
- [ ] Model method dispatches cross-aggregate events without action coordination

### Related Rules/Skills/Decision Trees
- **Rule 6**: Never write to another model's table from a model method (`05-rules.md`)
- **Skill 1**: Add a State-Changing Method to a Model (`06-skills.md`)

---

## Anti-Pattern 4: Missing Transaction Safety in Controllers

### Category
Reliability — Partial Write Risk

### Description
Controllers or actions call model methods that call `$this->save()`, but the controller does not wrap the operation in `DB::transaction()`. If the controller calls multiple model methods and one fails, earlier saves are not rolled back.

### Why It Happens
Model methods call `save()` internally for convenience. Developers assume the model method handles everything, not realizing that the caller must manage the transaction for cross-method atomicity.

### Warning Signs
- Model methods call `$this->save()` internally
- Controllers call multiple model methods without `DB::transaction()`
- Controllers call model methods and then perform other writes
- Partial updates are observed in the database after exceptions
- Transaction tests are missing for controller/action operations

### Why Harmful
When a controller calls `$invoice->markAsPaid()` (which saves) and then `Notification::send($invoice)` (which fails), the invoice is already marked paid. The system shows an invoice as paid but the customer hasn't received a receipt.

### Preferred Alternative
Model methods call `$this->save()` but do not manage transactions. Controllers and actions wrap multi-step operations in `DB::transaction()`.

### Refactoring Strategy
1. Remove `DB::transaction()` from model methods (if present)
2. Ensure model methods call `$this->save()` but no outer transaction wrapping
3. Add `DB::transaction()` around action/controller code that calls multiple model methods
4. Verify transaction rollback tests pass

### Detection Checklist
- [ ] Model method calls `$this->save()` and caller does not manage transaction
- [ ] Controller calls multiple model methods without `DB::transaction()`
- [ ] Partial commits observed in database after failures
- [ ] No rollback test exists

### Related Rules/Skills/Decision Trees
- **Rule 7**: Let controllers or actions manage the transaction boundary (`05-rules.md`)
- **Decision Tree**: Model Method Sufficiency Decision (`07-decision-trees.md`)

---

## Anti-Pattern 5: Anemic Domain Model (No Model Methods)

### Category
Architecture — Logic in Wrong Layer

### Description
The Eloquent model has no domain methods — it is a property bag with accessors, mutators, and relationships only. All business logic (validation, state transitions, calculations) lives in controllers, actions, or services. The model is "anemic" — it knows how to persist but not how to behave.

### Why It Happens
A misguided application of "thin models, fat services" or "separation of concerns." The team puts all logic in services/actions because "models should only handle persistence." The Active Record pattern is rejected without understanding its benefits.

### Warning Signs
- Model has no public methods besides `__construct`, accessors, and mutators
- Controllers contain `$model->update(['status' => 'paid'])` (scattered state transitions)
- Actions contain `if` statements about model state, validation rules, and calculations
- Business rule changes require updating multiple action files
- Model tests only test accessors and relationships — no behavior tests

### Why Harmful
Business logic is scattered across actions and controllers, making it invisible when reasoning about the model. When a business rule changes, the developer must find every action that touches the model's state. The model's behavior is not encapsulated — any new action can mutate the model without enforcing invariants.

### Real-World Consequences
A `Subscription` model has no `cancel()` or `renew()` methods. Actions perform `$subscription->update(['status' => 'cancelled', 'cancelled_at' => now()])` in 5 different places. When the business rule changes to require a cancellation reason, the developer must find and update all 5 actions. Two are missed, causing cancellations without reasons for 40% of customers.

### Preferred Alternative
Push domain logic to model methods. Models should have named methods for every meaningful state transition, with invariant enforcement at the start of each method.

### Refactoring Strategy
1. Identify all scattered `$model->update([...])` calls across the codebase for a given model
2. Group them by the state transition they represent
3. Create a named model method for each transition (e.g., `cancel(string $reason)`)
4. Enforce invariants (guard clauses) at the method start
5. Replace all scattered `update()` calls with the named method
6. Update action classes to call model methods instead of directly manipulating attributes

### Detection Checklist
- [ ] Model has no public domain methods — only getters/setters
- [ ] `$model->update(['status' => ...])` appears in multiple controllers/actions
- [ ] Actions contain business rules about the model's state
- [ ] Business rule changes require changes in >3 different files

### Related Rules/Skills/Decision Trees
- **Rule 1**: Put within-aggregate logic on the model (`05-rules.md`)
- **Rule 3**: Use explicit state-changing methods (`05-rules.md`)
- **Skill 2**: Refactor Inline State Mutation into a Model Method (`06-skills.md`)
- **Decision Tree**: Model Method vs Action Class (`07-decision-trees.md`)
