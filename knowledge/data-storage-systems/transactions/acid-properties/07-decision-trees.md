# 9-1 ACID Properties - Decision Trees

## Isolation Level Selection Based on ACID Requirements

---

## Decision Context

Choosing the right isolation level for transactions, balancing between ACID guarantees and concurrency performance.

---

## Decision Criteria

* performance: higher isolation = more locking/blocking
* architectural: different databases implement levels differently
* security: prevents data anomalies

---

## Decision Tree

Which isolation level for your transaction?

↓

Can you tolerate dirty reads or non-repeatable reads?

NO → Is write skew acceptable?

    YES → Is the transaction read-only?
    
        YES → READ COMMITTED (sufficient, best performance)
        
        NO → Does the transaction need consistent snapshots?
        
            YES → REPEATABLE READ (MySQL default, prevents phantom reads)
            
            NO → READ COMMITTED (PostgreSQL default, good balance)

NO → Must prevent ALL anomalies?

    YES → SERIALIZABLE
        
        ↓
        Expect: more conflicts, lower throughput, possible serialization failures
        Handle: retry logic for serialization errors
        
        ↓
        PostgreSQL uses Serializable Snapshot Isolation (SSI) — optimistic, less blocking
        MySQL uses pessimistic locking — more blocking

---

## Recommended Default

**Default:** READ COMMITTED for most workloads
**Reason:** Good balance of consistency and concurrency. Default for PostgreSQL. MySQL's default REPEATABLE READ is also acceptable.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Transaction Isolation Levels
