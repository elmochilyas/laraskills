# 7-3 Automatic Query Routing - Decision Trees

## Routing DB::statement vs DB::select for Raw Queries

---

## Decision Context

Choosing the correct Laravel facade for raw SQL — `DB::statement()` routes to write, `DB::select()` routes to read — to avoid misrouting SELECT queries to the write connection.

---

## Decision Criteria

* performance: misrouted SELECT to primary adds unnecessary load to the write node
* architectural: keyword-based routing is simple but coarse
* maintainability: explicit facade usage ensures correct routing

---

## Decision Tree

Query type?

↓

SELECT (read data)?

YES → Use `DB::select()`

    ↓
    DB::select('SELECT * FROM orders WHERE id = ?', [$id]);
    
    ↓
    Routes to read replica
    Acceptable for: all SELECT, SHOW, DESCRIBE, EXPLAIN statements

NO → INSERT/UPDATE/DELETE (write data)?

    YES → Use DB facade for write
        
        ↓
        DB::insert('INSERT INTO orders ...', [...]);
        DB::update('UPDATE orders SET ... WHERE ...', [...]);
        DB::delete('DELETE FROM orders WHERE ...', [...]);
        
        ↓
        Routes to write (primary) connection

NO → Mixed operations (stored procedure, DDL, SELECT ... FOR UPDATE)?

    YES → Use `DB::statement()` (routes to write)
        
        ↓
        DB::statement('CALL calculate_totals()');
        DB::statement('ALTER TABLE orders ADD COLUMN ...');
        DB::statement('SELECT ... FOR UPDATE');
        
        ↓
        All DB::statement() goes to write connection
        Safe for: DDL, writes, SELECT FOR UPDATE
        
    NO → Transaction-scoped queries?
    
        → In transaction, ALL queries use write connection
        Whether SELECT or write — transaction = write routing

---

## Recommended Default

**Default:** `DB::select()` for read queries; `DB::insert/update/delete()` for writes; `DB::statement()` for mixed operations only
**Reason:** Using the correct facade prevents unintended write traffic on the primary. `DB::statement()` is a write router regardless of SQL content.

---

## Transaction Routing Override

---

## Decision Context

When a transaction is active, Laravel routes ALL queries to the write connection — even SELECTs. Deciding whether this behavior is correct or needs override.

---

## Decision Criteria

* performance: SELECTs in transaction hit the primary (not replicas)
* architectural: transaction must have read-your-writes consistency
* maintainability: Laravel's behavior is correct for most cases

---

## Decision Tree

Running queries inside a transaction?

YES → All queries use write connection automatically

    ↓
    DB::beginTransaction();
    DB::select('...');      // write connection
    DB::insert('...');       // write connection
    DB::commit();
    
    ↓
    Correct: transaction needs consistent reads within the transaction
    All statements must see the same state

NO → Transaction purely for read consistency (no writes)?

    YES → Use DB::connection('mysql::read')->transaction()
        
        ↓
        Force transaction on read connection
        Avoids sending read transaction to primary
        
        ↓
        Less common — only if transaction has NO writes

NO → Explicit read connection override needed?

    → Force read connection for specific query
    DB::connection('mysql::read')->select('...')
    Overrides default routing
    Use carefully — may cause stale reads

---

## Recommended Default

**Default:** Let Laravel handle routing — all queries in transaction use write connection
**Reason:** Transactions require read-your-writes consistency. Overriding read routing inside a transaction risks inconsistent reads.

---

## Related Rules

* Rule 7-3-1: Always Use DB::select For Read Queries
* Rule 7-3-2: Never Use DB::statement For SELECT Queries

---

## Related Skills

* Implement Automatic Query Routing
* Configure Laravel Read/Write Connections
