# Anti-Patterns — Transactional Actions

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Transactional Actions |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Long-Running Transaction Starvation | High | Medium | Code review: transaction includes I/O operations |
| Phantom Reads in Concurrent Transactions | High | Medium | Bug reports: race conditions in concurrent write operations |
| Transaction as Service Layer | Medium | Medium | Code review: controller manages transactions |
| Swallowing Transaction Exceptions | High | Medium | Code review: try-catch around transaction logs and returns null |
| Transactions with Side Effects Inside | High | High | Code review: API calls or email inside DB::transaction() |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Lock Ordering | Tables locked in different orders across different actions | Deadlocks in production under concurrent load |
| No Deadlock Retry | `DB::transaction()` called without `$attempts` parameter | Deadlock causes 500 error instead of transparent retry |
| Transaction in Read-Only Actions | Read queries wrapped in transactions unnecessarily | Logically unnecessary, holds read locks on some databases |

---

## Anti-Pattern Details

### AP-TA-01: Long-Running Transaction Starvation

**Description**: A database transaction is held open for 10+ seconds while the action performs slow I/O operations — file processing, API calls, email sending, image manipulation, or CSV generation. The transaction holds database locks for the entire duration, blocking other requests that need to read or write the same rows.

**Root Cause**: The developer wraps the entire action in a transaction, including I/O operations that have nothing to do with database consistency. The transaction boundary is the entire method body, not just the write operations.

**Impact**:
- Other requests time out waiting for locks held by the long-running transaction
- Application throughput collapses under moderate concurrency
- Database connection pool exhaustion (each long-running transaction holds a connection)
- Deadlock probability increases with transaction duration

**Detection**:
- Code review: `DB::transaction()` surrounds the entire method, including API calls and file processing
- Performance monitoring: database transactions with duration >1 second
- Production incidents: requests timing out during concurrent access to the same table

**Solution**:
- Keep transactions short — only wrap the actual database write operations
- Move I/O operations (API calls, file processing, email) outside the transaction
- If I/O must be coordinated with the transaction, use `afterCommit()` callbacks or queue the operations
- Set explicit timeout limits for transactions in the database configuration

**Example**:
```php
// BEFORE: Long-running transaction with I/O inside
class ProcessOrderAction
{
    public function execute(ProcessOrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $order = Order::create($dto->toArray());
            $this->inventory->reserve($dto->items);
            $pdf = $this->pdfGenerator->generate($order);     // 3 seconds ❌
            $this->fileStorage->upload($pdf);                  // 1 second ❌
            $this->emailService->sendConfirmation($order);     // 2 seconds ❌
            return $order;
        });
    }
}

// AFTER: Short transaction, I/O after commit
class ProcessOrderAction
{
    public function execute(ProcessOrderDto $dto): Order
    {
        $order = DB::transaction(fn() => Order::create($dto->toArray()));
        $this->inventory->reserveSync($dto->items);
        GenerateInvoiceJob::dispatch($order->id); // async
        SendConfirmationJob::dispatch($order->id); // async
        return $order;
    }
}
```

---

### AP-TA-02: Phantom Reads in Concurrent Transactions

**Description**: Two concurrent transactions read the same data, both make decisions based on stale reads, and the second write overwrites the first without incorporating the first's changes. This is a classic lost update problem: Transaction A reads inventory count (5), Transaction B reads inventory count (5), A decrements to 4 and writes, B decrements to 4 and writes — the decrement from A is lost.

**Root Cause**: No pessimistic locking or optimistic locking strategy. The developer assumes concurrent writes don't happen or are handled by the database automatically.

**Impact**:
- Lost updates: one user's changes silently overwrite another's
- Data integrity violations: inventory counts, balances, and seat reservations are wrong
- Bugs that only reproduce under concurrent load, making them hard to detect in testing
- Financial discrepancies: money can be double-spent or lost

**Detection**:
- Bug reports: "my update was lost" in concurrent scenarios
- Code review: no `lockForUpdate()`, no `sharedLock()`, no version column for optimistic locking
- Production incidents: inventory or balance discrepancies under high concurrency

**Solution**:
- Use `lockForUpdate()` (pessimistic lock) for rows that will be updated
- Use optimistic locking (version column) for low-contention scenarios
- Acquire locks in consistent order across all code paths to prevent deadlocks
- Set the transaction isolation level to `REPEATABLE READ` or `SERIALIZABLE` for critical operations

**Example**:
```php
// BEFORE: No locking — phantom reads cause lost updates
class ReserveInventoryAction
{
    public function execute(array $items): void
    {
        DB::transaction(function () use ($items) {
            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    throw new InsufficientStockException($product->id);
                }
                $product->decrement('stock', $item['quantity']); // ❌ concurrent reads get same stock
            }
        });
    }
}

// AFTER: Pessimistic locking
class ReserveInventoryAction
{
    public function execute(array $items): void
    {
        DB::transaction(function () use ($items) {
            $productIds = collect($items)->pluck('product_id')->sort()->values();
            $products = Product::whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate() // ✅ prevents concurrent reads
                ->get()
                ->keyBy('id');
            foreach ($items as $item) {
                $product = $products->get($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    throw new InsufficientStockException($product->id);
                }
                $product->decrement('stock', $item['quantity']);
            }
        });
    }
}
```

---

### AP-TA-03: Transaction as Service Layer

**Description**: Database transactions are managed in the controller layer instead of the action/service layer. A controller wraps multiple action calls in `DB::transaction()`, making the controller responsible for transaction boundaries that should align with business operation boundaries.

**Root Cause**: The developer wants to ensure atomicity across multiple actions and places the transaction at the call site (the controller) rather than at the operation boundary (the action or service).

**Impact**:
- Transaction boundaries are not aligned with business operation boundaries
- Controllers contain infrastructure logic (transaction management)
- Moving an action call to a different controller requires rethinking transaction boundaries
- Transaction management is duplicated across every controller that calls the same action

**Detection**:
- Code review: controller has `DB::transaction()` or `DB::beginTransaction()` calls
- Code review: controller manages commit and rollback logic
- Code review: multiple controllers duplicate the same transaction pattern

**Solution**:
- Place transaction management inside the action or service method
- Each write action is the natural transaction boundary
- Coordinators (composed actions) may wrap multiple sub-actions in a transaction
- Controllers must never manage transactions

**Example**:
```php
// BEFORE: Transaction in controller
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        return DB::transaction(function () use ($dto) { // ❌ controller manages transaction
            $user = $this->createUser->execute($dto);
            $this->assignTeam->execute($user, $dto->team);
            return response()->json($user, 201);
        });
    }
}

// AFTER: Transaction in action
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(fn() => User::create($dto->toArray())); // ✅ transaction here
    }
}

class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUser->execute($dto);
        return response()->json($user, 201);
    }
}
```
