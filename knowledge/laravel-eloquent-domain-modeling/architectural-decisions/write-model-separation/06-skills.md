# Write Model Separation — Skills

---

## Skill 1: Create a Command Handler with Transaction

### Purpose
Create a command handler class that receives a command DTO, validate state, invoke domain model methods, and persist changes within a transactional boundary.

### When To Use
- Every state mutation should go through a named, auditable handler
- The write operation involves multiple steps that must be atomic
- You want explicit, testable entry points for every state change

### When NOT To Use
- The operation is a trivial field update with no invariants
- The application is simple CRUD with minimal business rules

### Prerequisites
- Domain model with state-changing methods
- Command DTO class defined

### Inputs
- Use case / state mutation to implement
- Domain model and its invariants
- Command DTO fields

### Workflow

1. **Define the command DTO** in `App\Commands\{Domain}\`:
   ```php
   class CancelOrderCommand
   {
       public function __construct(
           public readonly int $orderId,
           public readonly string $reason,
       ) {}
   }
   ```

2. **Create the handler** in `App\Handlers\{Domain}\`:
   ```php
   class CancelOrderHandler
   {
       public function handle(CancelOrderCommand $command): void
       {
           DB::transaction(function () use ($command) {
               $order = Order::lockForUpdate()->findOrFail($command->orderId);
               $order->cancel($command->reason);
               $order->save();
           });
       }
   }
   ```

3. **Push invariants to the model method** — handler should not contain `if` statements about domain state

4. **Use pessimistic locking** (`lockForUpdate()`) for financial operations

5. **Return `void`** — handler executes the command; display data comes from read models

6. **Dispatch the handler** via Laravel's Bus or direct injection

### Validation Checklist

- [ ] Command DTO has only `public readonly` properties — no methods
- [ ] Handler wraps logic in `DB::transaction()`
- [ ] Handler calls model methods that enforce invariants
- [ ] Handler returns `void` (no display data)
- [ ] Handler uses `lockForUpdate()` for financial operations
- [ ] Handler is testable with known initial state → asserted final state

### Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Handler contains invariants | Logic not pushed to model | Move to model method |
| Handler returns display data | Mixing read and write | Return void; use Query Object for display |
| No transaction | Overlooked | Wrap in `DB::transaction()` |
| Stale data on concurrent writes | No locking | Add `lockForUpdate()` or optimistic concurrency |

### Related Rules

| Rule | Reference |
|---|---|
| Rule 1: Route every mutation through a command handler | `05-rules.md` Rule 1 |
| Rule 2: Push invariants to the model | `05-rules.md` Rule 2 |
| Rule 6: Always wrap in transactions | `05-rules.md` Rule 6 |
| Rule 7: Return void or simple signal | `05-rules.md` Rule 7 |

### Related Skills

| Skill | Relationship |
|---|---|
| Implement Optimistic Concurrency for Writes | Alternative to pessimistic locking |
| Add Idempotency to a Command Handler | For handlers that may be called multiple times |

### Success Criteria
- Command handler is the only entry point for the state mutation
- Handler wraps all writes in a transaction
- Model methods enforce invariants (handler does not)
- Handler returns void
- Handler is testable with known initial state and asserted final state

---

## Skill 2: Implement Optimistic Concurrency for Writes

### Purpose
Add a version column to write model tables and use optimistic concurrency control to detect and prevent lost updates from concurrent requests.

### When To Use
- Multiple requests may modify the same aggregate concurrently
- You want to avoid pessimistic locking overhead for most operations
- Data loss from lost updates is unacceptable

### When NOT To Use
- The write model has a single writer (event-sourced stream)
- Contention is low and lost updates are acceptable
- Pessimistic locking is already in use for financial operations

### Prerequisites
- Command handler following Skill 1
- Database migration capability

### Inputs
- Command handler to add concurrency control to
- Model table to add version column to

### Workflow

1. **Add a `version` integer column** to the model's migration (default: 1)

2. **In the model's `boot()` method**, auto-increment the version on save:
   ```php
   protected static function boot(): void
   {
       parent::boot();
       static::saving(fn ($model) => $model->version++);
   }
   ```

3. **In the command handler**, verify version before updating:
   ```php
   public function handle(CancelOrderCommand $command): void
   {
       $order = Order::findOrFail($command->orderId);
       $expectedVersion = $order->version;

       $order->cancel($command->reason);

       $updated = Order::where('id', $order->id)
           ->where('version', $expectedVersion)
           ->update([
               'status' => $order->status,
               'version' => $expectedVersion + 1,
               // other changed fields
           ]);

       if ($updated === 0) {
           throw new OrderConcurrentModificationException($order);
       }
   }
   ```

4. **Handle the exception** in the controller or action with a retry or user-facing error:
   ```php
   catch (OrderConcurrentModificationException $e) {
       return redirect()->back()
           ->with('error', 'This order was modified by another user. Please reload and try again.');
   }
   ```

### Validation Checklist

- [ ] `version` column added via migration with default of 1
- [ ] Model auto-increments version on save
- [ ] Handler checks version before updating
- [ ] `where('version', $expectedVersion)` included in update query
- [ ] Zero-update result triggers a concurrency exception
- [ ] Exception is caught and user-facing message is shown
- [ ] Test covers concurrent modification scenario

### Related Rules

| Rule | Reference |
|---|---|
| Rule 3: Use optimistic concurrency with version column | `05-rules.md` Rule 3 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Command Handler with Transaction | Base pattern before adding concurrency |

### Success Criteria
- Concurrent writes detect conflicts and throw an exception
- Lost updates are prevented (second write fails instead of overwriting)
- User receives a clear error message on conflict
- Version column is automatically incremented

---

## Skill 3: Add Idempotency to a Command Handler

### Purpose
Ensure a command handler can process the same command multiple times without producing duplicate side-effects, using idempotency keys.

### When To Use
- Network retries may cause duplicate command dispatch
- Queue redelivery may process the same job twice
- User double-clicks may submit the same form twice
- Duplicate execution would cause financial or data duplication issues

### When NOT To Use
- Commands are inherently idempotent (e.g., "set user preferences")
- Duplicate execution is safe (read-only commands)
- The command is processed synchronously with no risk of redelivery

### Prerequisites
- Command handler following Skill 1
- Idempotency key storage table

### Inputs
- Command that needs idempotency protection
- Idempotency key source (client-generated UUID or meaningful hash)

### Workflow

1. **Create an idempotency key table** via migration:
   ```php
   Schema::create('processed_commands', function (Blueprint $table) {
       $table->string('idempotency_key')->primary();
       $table->timestamps();
   });
   ```

2. **Add an `idempotencyKey` field** to the command DTO:
   ```php
   class ChargeCustomerCommand
   {
       public function __construct(
           public readonly string $idempotencyKey,
           public readonly int $customerId,
           public readonly Money $amount,
       ) {}
   }
   ```

3. **In the command handler**, check and record the key within a transaction:
   ```php
   public function handle(ChargeCustomerCommand $command): void
   {
       if (ProcessedCommand::where('idempotency_key', $command->idempotencyKey)->exists()) {
           return; // Already processed
       }

       DB::transaction(function () use ($command) {
           $this->gateway->charge($command->amount);
           ProcessedCommand::create([
               'idempotency_key' => $command->idempotencyKey,
           ]);
       });
   }
   ```

4. **Clean up old keys** with a scheduled job or short TTL if using cache:
   ```php
   Cache::remember($idempotencyKey, 3600, fn () => true);
   ```

5. **Test** idempotency by dispatching the same command twice and asserting only one side effect

### Validation Checklist

- [ ] Idempotency key storage exists (table or cache)
- [ ] Command DTO includes an idempotency key field
- [ ] Handler checks for existing key before processing
- [ ] Key is recorded inside the same transaction as the side effect
- [ ] Second dispatch returns without duplicating side-effects
- [ ] Test verifies idempotent behavior
- [ ] Old keys are cleaned up (TTL or scheduled cleanup)

### Related Rules

| Rule | Reference |
|---|---|
| Rule 4: Design command handlers to be idempotent | `05-rules.md` Rule 4 |

### Related Skills

| Skill | Relationship |
|---|---|
| Create a Command Handler with Transaction | Base pattern before adding idempotency |

### Success Criteria
- Same command dispatched twice produces only one side effect
- Idempotency key is stored in the same transaction as the side effect
- No duplicate charges, orders, or notifications
- Old keys are cleaned up to prevent storage bloat
