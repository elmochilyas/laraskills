# Transactional Actions — Rules

## Rule 1: Wrap Every Write Action in DB::transaction()
---
## Category
Reliability
---
## Rule
Always wrap write actions in `DB::transaction()` by default; only skip when there is a specific, documented justification.
---
## Reason
Without transactions, a multi-step write (user + profile + settings) that fails at step 3 leaves steps 1-2 committed. The database becomes inconsistent with partial data.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = User::create($dto->toArray());
        $user->profile()->create($dto->profile->toArray());
        $user->settings()->create($dto->settings->toArray());
        return $user;
        // If settings()->create() fails, user and profile are committed
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create($dto->toArray());
            $user->profile()->create($dto->profile->toArray());
            $user->settings()->create($dto->settings->toArray());
            return $user;
        });
    }
}
```
---
## Exceptions
Read-only actions (find, search) do not need transactions. Idempotent single-table writes may also skip with explicit justification.
---
## Consequences Of Violation
Partial data writes, data inconsistency, time-consuming data repair operations in production.
</rule>

## Rule 2: Execute Side Effects AFTER the Transaction Commits
---
## Category
Reliability
---
## Rule
Never perform API calls, email sending, file I/O, or queue dispatch inside a database transaction; execute these after the transaction commits.
---
## Reason
Side effects inside a transaction cannot be rolled back. An email sent inside a transaction cannot be unsent if the transaction rolls back. Long-running side effects also hold database locks, reducing concurrency.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create($dto->toArray());
            Mail::to($user)->send(new WelcomeMail($user)); // ❌ Inside transaction
            return $user;
        });
        // If mail fails, user creation rollback was wasted. If rollback happens, email is already sent.
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = DB::transaction(fn() => User::create($dto->toArray()));
        Mail::to($user)->send(new WelcomeMail($user)); // ✅ After commit
        return $user;
    }
}
```
---
## Exceptions
Use `DB::afterCommit()` callback if the side effect must be guaranteed to run only after a successful commit.
---
## Consequences Of Violation
Sent emails for rolled-back transactions, long lock contention, phantom side effects.
</rule>

## Rule 3: Use the Attempts Parameter for Deadlock Retry
---
## Category
Reliability
---
## Rule
Always pass the `$attempts` parameter (3-5) to `DB::transaction()` for write actions on tables with concurrent write contention.
---
## Reason
Without deadlock retry, a transaction that encounters a deadlock fails immediately with a 500 error. The retry parameter re-executes the transaction when deadlock is detected, providing resilience under concurrent load.
---
## Bad Example
```php
DB::transaction(function () {
    Order::where('id', 1)->lockForUpdate()->update(['status' => 'processing']);
    Inventory::where('id', 5)->lockForUpdate()->decrement('stock');
});
// ❌ No retry — deadlock causes 500 error
```
---
## Good Example
```php
DB::transaction(function () {
    Account::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();
    Order::create([/* ... */]);
    Inventory::where('id', 5)->decrement('stock', 1);
}, attempts: 3);
// ✅ Retries up to 3 times on deadlock
```
---
## Exceptions
Read-only actions and single-table writes with no lock contention do not need retry configuration.
---
## Consequences Of Violation
500 errors under concurrent load, frustrated users, unnecessary downtime.
</rule>

## Rule 4: Never Manage Transactions in Controllers
---
## Category
Layer Isolation
---
## Rule
Never call `DB::beginTransaction()`, `DB::commit()`, or `DB::rollBack()` in a controller; transactions are the responsibility of actions and services.
---
## Reason
Transactions in controllers bypass the business logic layer. Controllers that manage transactions require HTTP tests to verify rollback behavior, and transaction boundaries become inconsistent across different callers.
---
## Bad Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        DB::beginTransaction(); // ❌ Transaction management in controller
        try {
            $user = User::create($request->validated());
            DB::commit();
            return response()->json($user, 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed'], 500);
        }
    }
}
```
---
## Good Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUserAction->execute($dto); // Transaction inside action
        return response()->json($user, 201);
    }
}
```
---
## Exceptions
No common exceptions. Controllers must never manage transactions.
---
## Consequences Of Violation
Inconsistent transaction boundaries, HTTP-coupled rollback logic, unreusable from CLI/queue.
</rule>

## Rule 5: Acquire Locks in Consistent Order Across All Code Paths
---
## Category
Reliability
---
## Rule
Always acquire table locks and row locks in the same order across all code paths to prevent deadlocks.
---
## Reason
If Path A locks Table X then Table Y, and Path B locks Table Y then Table X, concurrent execution creates a deadlock — each path holds one lock the other needs. Consistent ordering eliminates this entirely.
---
## Bad Example
```php
// Path A: Lock order → orders, then inventory
DB::transaction(function () {
    Order::find(1)->lockForUpdate();
    Inventory::find(5)->lockForUpdate();
});

// Path B: Lock order → inventory, then orders (❌ reverse)
DB::transaction(function () {
    Inventory::find(5)->lockForUpdate();
    Order::find(1)->lockForUpdate();
});
// Concurrent execution of A and B causes deadlock
```
---
## Good Example
```php
// Both paths lock in alphabetical order: inventory, then orders
DB::transaction(function () {
    Inventory::find(5)->lockForUpdate();
    Order::find(1)->lockForUpdate();
});

// Path B: Same lock order
DB::transaction(function () {
    Inventory::find(5)->lockForUpdate();
    Order::find(1)->lockForUpdate();
});
```
---
## Exceptions
No common exceptions. Lock ordering is a hard requirement for any code using pessimistic locking.
---
## Consequences Of Violation
Production deadlocks, 500 errors, application downtime during peak concurrent load.
</rule>

## Rule 6: Transaction Boundaries Must Match Action Boundaries
---
## Category
Architecture
---
## Rule
Always align the transaction boundary with the action boundary — one action, one transaction. Never split a single business operation across multiple transactions or combine multiple operations in one transaction.
---
## Reason
A transaction represents a unit of work. If an action spans two transactions, the second can fail after the first commits (partial write). If two actions share one transaction, they cannot be independently tested or composed.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        $user = DB::transaction(fn() => User::create($dto->toArray()));
        // ❌ Second transaction — first is already committed
        $user = DB::transaction(fn() => $user->profile()->create($dto->profile->toArray()));
        return $user;
        // Profile creation fails, user exists without profile
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create($dto->toArray());
            $user->profile()->create($dto->profile->toArray());
            return $user;
        });
        // ✅ Single transaction — all or nothing
    }
}
```
---
## Exceptions
Coordinator actions that compose multiple sub-actions may wrap the entire workflow in a single transaction at the coordinator level.
---
## Consequences Of Violation
Partial writes from split transactions, inconsistent data, inability to compose actions safely.
</rule>
