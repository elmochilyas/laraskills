# 9-11 Transaction Scoping Laravel - Decision Trees

## DB::transaction vs Manual beginTransaction/commit/rollback

---

## Decision Context

Choosing between Laravel's closure-based `DB::transaction()` and manual transaction control for atomic database operations.

---

## Decision Criteria

* performance: both have same overhead
* architectural: closure is safer; manual needed for loops/conditional logic
* maintainability: closure is cleaner

---

## Decision Tree

Wrapping operations in a transaction?

↓

Is the transaction a simple sequence of operations without branching?

YES → Use `DB::transaction()` (safer, automatic rollback)

    ↓
    ```php
    DB::transaction(function () {
        Order::create([...]);
        Inventory::decrement([...]);
        Payment::charge([...]);
    });
    ```
    
    ↓
    Auto-rollback on any exception
    Auto-commit on success
    Handles nested transactions via savepoints

NO → Need conditional commit/rollback in a loop?

    YES → Use manual control
        
        ```php
        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                // process...
                if ($shouldRollback) {
                    DB::rollBack();
                    break;
                }
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
        ```
        
        ↓
        More flexible, more error-prone
        Always include try/catch with rollback

---

## Recommended Default

**Default:** `DB::transaction()` for most use cases
**Reason:** Simpler, safer, automatic exception handling.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Scope Transactions with DB::transaction
