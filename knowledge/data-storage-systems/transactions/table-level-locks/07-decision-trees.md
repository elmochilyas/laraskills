# 9-6 Table Level Locks - Decision Trees

## Table-Level Lock vs Row-Level Lock vs Advisory Lock

---

## Decision Context

Choosing between `LOCK TABLES`, row-level locks (FOR UPDATE), or advisory locks when exclusive access is needed.

---

## Decision Criteria

* performance: table locks block ALL sessions; row locks block only conflicting operations
* architectural: InnoDB row locks handle >99% of cases
* maintainability: table locks cause implicit commits, incompatible with transactions
* security: table locks can denial-of-service all readers

---

## Decision Tree

Need exclusive access to database resources?

↓

Is this a routine read-write operation?

YES → Use row-level locking (FOR UPDATE)

    ↓
    ```php
    DB::transaction(function () {
        $order = Order::where('id', $id)->lockForUpdate()->first();
        $order->status = 'processing';
        $order->save();
    });
    ```
    
    ↓
    NEVER use `LOCK TABLES ... WRITE` for this
    It blocks ALL access, including reads

NO → Do you need to prevent ALL concurrent access (DDL, bulk ops)?

    YES → Consider alternatives first
        
        ↓
        For DDL (ALTER TABLE, DROP TABLE):
        MySQL handles metadata locks implicitly
        Use online DDL (ALGORITHM=INPLACE, ALGORITHM=INSTANT)
        
        ↓
        For bulk operations:
        Use advisory lock pattern instead of table lock
        ```php
        DB::transaction(function () {
            // Use a row as mutex
            DB::table('table_locks')
                ->where('name', 'orders_bulk')
                ->lockForUpdate()
                ->first();
            // bulk operation
        });
        ```
        
        ↓
        If you MUST use LOCK TABLES (MyISAM):
        ```sql
        LOCK TABLES orders WRITE, users READ;
        -- operations
        UNLOCK TABLES;
        ```
        WARNING: Causes implicit commit, incompatible with InnoDB transactions

---

## Recommended Default

**Default:** Use row-level locks; never use `LOCK TABLES` in InnoDB
**Reason:** Table locks are a hammer for a fly. Row-level locks give far better concurrency. InnoDB's row locks handle virtually every use case.

---

## Related Rules

* 9-6-1: Never Use LOCK TABLES in InnoDB
* 9-6-2: Always Use Row-Level Locking Instead of Table Locks

---

## Related Skills

* Avoid Table-Level Locks in InnoDB
* Use Row-Level Locks
* Implement Advisory Locks
