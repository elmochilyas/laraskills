# Anti-Patterns: Write Model Separation

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Write Model Separation |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Write Model Anemia (All Logic in Handler) | Architecture | High |
| 2 | Command Explosion (100+ Commands for CRUD) | Design | Medium |
| 3 | Stale Write Model (Lost Updates Without Concurrency) | Reliability | Critical |
| 4 | Partial Command (Handler Without Transaction) | Reliability | Critical |
| 5 | Handler Returns Display Data (Mixing Read and Write) | Architecture | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Direct Model Mutation in Controllers (No Command Handler) | write-model-separation, when-to-use-actions | High |
| Command Handler With Domain Invariants Not in Model | write-model-separation | High |
| No Idempotency for Queue-Dispatched Commands | write-model-separation | Critical |
| Query Methods on Write Models | write-model-separation, read-model-separation | Medium |
| No Locking for Concurrent Financial Operations | write-model-separation | Critical |

---

## Anti-Pattern 1: Write Model Anemia (All Logic in Handler)

### Category
Architecture — Anemic Domain

### Description
The command handler contains all business logic, validation, and state transitions, while the write model is a property bag with no methods. The handler tells the model what to do at every step instead of the model encapsulating its own invariants.

### Why It Happens
The team adopts CQRS but only implements the "separate command handler" part — they don't push domain logic into the model. The handler becomes the dumping ground for business rules.

### Warning Signs
- Handler contains `if ($order->status !== 'pending')` checks
- Handler sets model attributes directly: `$order->status = 'cancelled'`
- Handler calls `$order->save()` after direct attribute manipulation
- Write model has no domain methods (no `cancel()`, `markAsPaid()`)
- Same invariant check appears in multiple handlers
- Adding a new command handler requires duplicating business logic

### Why Harmful
Business rules duplicated across handlers are invisible when maintaining the model. When the invariant changes ("cancellation allowed until shipped instead of paid"), developers must find every handler with this check. Handlers that are missed create inconsistencies.

### Real-World Consequences
A `CancelOrderHandler` checks `$order->status !== 'pending'`. A `BulkCancelHandler` checks `!in_array($order->status, ['pending', 'processing'])`. When the business rule changes to allow cancellation until shipped, `CancelOrderHandler` is updated but `BulkCancelHandler` is missed — bulk cancellations still reject processing orders.

### Preferred Alternative
Push all invariants to the write model's domain methods. Handlers call model methods; they do not contain `if` statements about domain state.

### Refactoring Strategy
1. Identify invariant checks in the handler
2. Create a model method that encapsulates the check + state transition
3. Remove the invariant from the handler; replace with model method call
4. Verify no other handler duplicates the same logic
5. Add model tests for each state transition

### Detection Checklist
- [ ] Handler contains `if` statements about model state
- [ ] Handler sets model attributes directly
- [ ] Write model has no domain methods
- [ ] Same invariant appears in multiple handlers

### Related Rules/Skills/Decision Trees
- **Rule 2**: Push invariants to the model, not the command handler (`05-rules.md`)
- **Decision 2**: Model Invariants vs Handler Invariants (`07-decision-trees.md`)
- **Skill 1**: Create a Command Handler with Transaction (`06-skills.md`)

---

## Anti-Pattern 2: Command Explosion (100+ Commands for CRUD)

### Category
Design — Unnecessary Ceremony

### Description
Every trivial CRUD operation has a dedicated command DTO and handler pair — even simple field updates like `UpdateUserNameCommand` -> `UpdateUserNameHandler`. The command pattern is applied to every state change regardless of complexity.

### Why It Happens
Dogmatic application of CQRS principles. "Every state change must go through a command" applied without considering whether the operation is simple.

### Warning Signs
- 100+ command/handler pairs for a simple CRUD application
- Commands with one field: `UpdateLastNameCommand { lastName: string }`
- Handlers that call `$model->update([$field => $value])` directly
- Handler is under 10 lines
- Most commands are invoked from exactly one controller method
- Most commands have no invariants, no validation, no side effects

### Why Harmful
Command explosion multiplies files for trivial operations. The overhead of creating command + handler + test for every field update slows development significantly.

### Real-World Consequences
A `UpdateUserNameCommand` / `UpdateUserNameHandler` pair handles `$user->update(['name' => $data->name])`. The same pattern exists for `UpdateEmailCommand`, `UpdatePhoneCommand`, `UpdateAvatarCommand`, `UpdateBioCommand`. Each is 3 files (command, handler, test). 20 field = 60 files for functionality that could be one model method.

### Preferred Alternative
Use model methods for simple field updates. Reserve commands for complex operations with invariants, multiple model changes, or side effects.

### Refactoring Strategy
1. Identify commands that simply update one or two fields with no invariants
2. Inline the logic into the controller or create a single model method
3. Delete the command DTO and handler files
4. Keep commands for operations with invariants, transactions, or side effects

### Detection Checklist
- [ ] Command has 1-2 fields matching model columns directly
- [ ] Handler under 10 lines with no invariants
- [ ] No transaction, no locking, no side effects
- [ ] 50+ command pairs in a simple CRUD app

### Related Rules/Skills/Decision Trees
- **Decision 1**: Command Handler vs Direct Model Mutation (`07-decision-trees.md`)
- **Skill 1**: Create a Command Handler with Transaction (`06-skills.md`)

---

## Anti-Pattern 3: Stale Write Model (Lost Updates Without Concurrency)

### Category
Reliability — Silent Data Loss

### Description
Two requests load the same aggregate, both modify it, and the second overwrites the first's changes without detection. No optimistic concurrency or pessimistic locking protects against lost updates.

### Why It Happens
The application initially has low traffic and lost updates don't happen. As traffic grows, concurrent requests increase. No one adds concurrency control because "it worked fine before."

### Warning Signs
- No `version` column on write model tables
- Handler does not check for concurrent modifications
- Handler does not use `lockForUpdate()`
- Users report "my change was lost" or "that's not what I saved"
- Customer support investigates data that "changed by itself"

### Why Harmful
Silent data loss is the hardest bug to catch. The second user's changes overwrite the first user's work without any notification. Data appears to change spontaneously. Users lose trust in the system.

### Real-World Consequences
Two customer support agents load the same order simultaneously. Agent A changes the shipping address and saves. Agent B changes the status to "refund requested" and saves — overwriting Agent A's address change with the old address. The order ships to the wrong address. No error is raised.

### Preferred Alternative
Use optimistic concurrency (version column) for most write models. Use `lockForUpdate()` for financial operations.

### Refactoring Strategy
1. Add a `version` column to the write model's migration (default: 1)
2. Add auto-increment logic in the model's `boot()` method
3. In the handler, read the version, modify, check version before saving
4. Throw a concurrency exception if the version doesn't match
5. Handle the exception in the controller with a user-facing retry message

### Detection Checklist
- [ ] Write model table has no version column
- [ ] Handler doesn't check for concurrent modifications
- [ ] No `lockForUpdate()` for financial operations
- [ ] Users report lost updates

### Related Rules/Skills/Decision Trees
- **Rule 3**: Use optimistic concurrency with a version column (`05-rules.md`)
- **Decision 3**: Optimistic Concurrency vs Pessimistic Locking (`07-decision-trees.md`)
- **Skill 2**: Implement Optimistic Concurrency for Writes (`06-skills.md`)

---

## Anti-Pattern 4: Partial Command (Handler Without Transaction)

### Category
Reliability — Atomicity Violation

### Description
A command handler performs multiple write operations (update aggregate, record event, update related models) without wrapping them in `DB::transaction()`. If a later operation fails, earlier writes are persisted.

### Why It Happens
The handler looks simple — just calling a few model methods. The developer doesn't realize the operations must be atomic.

### Warning Signs
- Handler modifies multiple models without `DB::transaction()`
- Handler dispatches events inline without `DB::afterCommit()`
- Handler calls model methods that call `save()` and then additional logic
- Partial updates observed after handler exceptions
- Handler does not wrap logic in `DB::transaction()`

### Why Harmful
Partial updates leave the database in an inconsistent state. Financial operations lose data integrity. Debugging requires manual inspection of multiple tables to understand what was and wasn't saved.

### Real-World Consequences
A `ProcessRefundHandler` calls `$payment->markAsRefunded()`, `$payment->save()`, and `$this->gateway->issueRefund($payment)`. If `issueRefund` throws (network error), the payment is marked refunded in the database but no actual refund was issued. The customer doesn't get their money back.

### Preferred Alternative
Wrap all write operations in `DB::transaction()`. Use `DB::afterCommit()` for event dispatching.

### Refactoring Strategy
1. Identify all write operations in the handler
2. Wrap them in `DB::transaction(function () { ... })`
3. Move event dispatching to `DB::afterCommit(fn () => event(...))`
4. Use `lockForUpdate()` for financial operations within the transaction
5. Add rollback tests that assert no state change on failure

### Detection Checklist
- [ ] Handler performs 2+ writes without `DB::transaction()`
- [ ] Handler dispatches events without `DB::afterCommit()`
- [ ] Handler calls external services after database writes
- [ ] No rollback test exists

### Related Rules/Skills/Decision Trees
- **Rule 6**: Always wrap command handlers in transactions (`05-rules.md`)
- **Skill 1**: Create a Command Handler with Transaction (`06-skills.md`)

---

## Anti-Pattern 5: Handler Returns Display Data (Mixing Read and Write)

### Category
Architecture — CQRS Boundary Violation

### Description
A command handler returns data designed for display: serialized models, formatted reports, paginated lists. The write path produces output that should come from a read model or query object, mixing write and read concerns.

### Why It Happens
The controller needs data to return to the client after a command. Rather than making a separate query, the developer has the handler return the formatted data directly.

### Warning Signs
- Handler returns `array` with formatted display data
- Handler eager-loads relations for display purposes
- Handler returns serialized JSON or resource objects
- Controller takes handler's return value and passes it directly to a response
- Handler cannot be queued because it returns data

### Why Harmful
Handlers that return display data cannot be dispatched asynchronously (queued commands don't return values). The handler mixes transactional logic with presentation formatting. Query optimization (eager loading) is coupled to write logic.

### Real-World Consequences
A `CreateOrderHandler` returns `['id' => $order->id, 'total' => $order->total, 'items' => $order->items->toArray()]`. The team wants to queue order creation for better performance. They can't reuse the handler because it returns data synchronously. They must refactor or duplicate the logic.

### Preferred Alternative
Command handlers return `void` or a simple success signal (e.g., the created entity's ID). Display data is fetched separately via a query object or read model.

### Refactoring Strategy
1. Change handler return type to `void` (or return the entity ID as a primitive)
2. Move display data formatting to the controller or a query object
3. The controller calls the handler (writes), then queries a read model or Query Object (reads)
4. If the handler was queued, it now works because it returns void

### Detection Checklist
- [ ] Handler returns formatted arrays or serialized models
- [ ] Handler eager-loads relations for display
- [ ] Handler return type is `array` or a JSON Resource
- [ ] Handler cannot be queued because caller needs return value

### Related Rules/Skills/Decision Trees
- **Rule 7**: Return `void` or a simple success signal (`05-rules.md`)
- **Rule 8**: Write models must not have public query methods (`05-rules.md`)
- **Decision 1**: Command Handler vs Direct Model Mutation (`07-decision-trees.md`)
