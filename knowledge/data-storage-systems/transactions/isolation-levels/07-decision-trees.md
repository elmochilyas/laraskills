# 9-2 Isolation Levels - Decision Trees

## REPEATABLE READ vs READ COMMITTED for Production

---

## Decision Context

Choosing between REPEATABLE READ (MySQL default) and READ COMMITTED (PostgreSQL default) for production workloads.

---

## Decision Criteria

* performance: REPEATABLE READ requires more MVCC overhead
* architectural: MySQL/PostgreSQL differences in implementation
* security: phantom reads vs write skew

---

## Decision Tree

Choosing production isolation level?

↓

Using MySQL InnoDB?

YES → Default is REPEATABLE READ

    ↓
    Keeps this default for:
    - Consistent reads within a transaction
    - Phantom read prevention
    - Logical backup consistency
    
    ↓
    Switch to READ COMMITTED for:
    - High-concurrency workloads
    - Reduced gap locking
    - Binlog format ROW compatibility

NO → Using PostgreSQL?

    YES → Default is READ COMMITTED
    
        ↓
        Keeps this default for most workloads
        
        ↓
        Switch to REPEATABLE READ for:
        - Multiple queries in one transaction that must see consistent data
        
        Switch to SERIALIZABLE for:
        - Write skew prevention
        - Full anomaly protection

---

## Recommended Default

**Default:** READ COMMITTED (PostgreSQL default) or REPEATABLE READ (MySQL default)
**Reason:** Both are production-appropriate defaults. Change only when specific anomalies must be prevented.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Transaction Isolation Levels
