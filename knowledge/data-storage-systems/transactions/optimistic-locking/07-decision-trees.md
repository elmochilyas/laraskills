# 9-14 Optimistic Locking - Decision Trees

## Optimistic vs Pessimistic Locking

---

## Decision Context

Choosing between optimistic locking (version-based, no locks) and pessimistic locking (FOR UPDATE, holds locks) for concurrent write protection.

---

## Decision Criteria

* performance: optimistic has zero read overhead; pessimistic blocks other writers
* architectural: optimistic detects conflicts on write; pessimistic prevents conflicts proactively
* maintainability: optimistic requires version column and retry; pessimistic requires transaction discipline
* security: neither bypasses access controls

---

## Decision Tree

Need to prevent concurrent modifications to the same data?

↓

Are concurrent writes to the same row/record frequent?

NO (low contention) → Use optimistic locking

    ↓
    ```php
    // Add version column to migration
    $table->unsignedInteger('version')->default(0);
    
    // Update with version check
    $affected = DB::table('orders')
        ->where('id', $id)
        ->where('version', $expectedVersion)
        ->update(array_merge($data, [
            'version' => $expectedVersion + 1,
        ]));
    
    if ($affected === 0) {
        throw new OptimisticLockException("Modified by another user");
    }
    ```
    
    ↓
    Zero read overhead — no locks acquired on reads
    Conflicts detected at write time only
    Best for: web forms, read-heavy APIs, low-traffic apps

YES (high contention) → Use pessimistic locking (FOR UPDATE)

    ↓
    ```php
    DB::transaction(function () use ($id, $data) {
        $order = Order::where('id', $id)->lockForUpdate()->first();
        $order->update($data);
    });
    ```
    
    ↓
    Locks prevent concurrent writes proactively
    No retry needed (lock wait serializes access)
    Higher overhead — holds locks for transaction duration
    
    Best for: inventory decrements, balance updates, high-traffic endpoints

---

## Recommended Default

**Default:** Prefer optimistic locking for most web applications; use pessimistic locking only when contention is high
**Reason:** Optimistic locking scales better for read-heavy workloads. Pessimistic locking is necessary when retries are expensive or conflicts are frequent.

---

## Related Rules

* 9-14-1: Always Check Affected Rows for Version Match
* 9-14-2: Prefer Optimistic Locking for Low-Contention Resources

---

## Related Skills

* Implement Optimistic Locking
* Implement Pessimistic Locking
* Implement Transaction Retry Logic



## Version Column vs Timestamp for Optimistic Locking

---

## Decision Context

Choosing between integer version column and timestamp-based optimistic locking for conflict detection.

---

## Decision Criteria

* performance: integer comparison is faster than timestamp parsing
* architectural: integer is monotonic and precise; timestamp may have precision issues
* maintainability: integer is simpler to implement and debug
* security: timestamp could leak row modification time; integer reveals only version

---

## Decision Tree

Implementing optimistic locking with a version column?

↓

Do you need to know when the row was last modified?

NO → Use integer version column (preferred)

    ↓
    ```php
    // Migration
    $table->unsignedInteger('version')->default(0);
    
    // Update
    DB::table('orders')
        ->where('id', $id)
        ->where('version', $currentVersion)
        ->update([
            'status' => 'shipped',
            'version' => $currentVersion + 1,
        ]);
    ```
    
    ↓
    Monotonic: always increments
    No precision issues (unlike timestamps)
    Easy to debug: version 3 → 4 is unambiguous
    Most reliable approach

YES → Use timestamp, but with caveats

    ↓
    ```php
    // Migration
    $table->timestamp('last_modified_at')->nullable();
    
    // Update
    DB::table('orders')
        ->where('id', $id)
        ->where('last_modified_at', $currentTimestamp)
        ->update([
            'status' => 'shipped',
            'last_modified_at' => now(),
        ]);
    ```
    
    ↓
    WARNING: MySQL datetime precision may cause false conflicts
    Two rapid updates within same millisecond → version collision
    Use datetime(6) for microsecond precision if needed
    
    ↓
    Only use if you need the timestamp for audit/history
    Integer version is strictly better for locking

---

## Recommended Default

**Default:** Use integer version column
**Reason:** Monotonic, precise, simple, and avoids timestamp precision issues. Add a separate updated_at column for audit needs.

---

## Related Rules

* 9-14-1: Always Check Affected Rows for Version Match
* 9-14-2: Prefer Optimistic Locking for Low-Contention Resources

---

## Related Skills

* Implement Optimistic Locking
* Handle Concurrent Web Form Submissions
* Implement Transaction Retry Logic
