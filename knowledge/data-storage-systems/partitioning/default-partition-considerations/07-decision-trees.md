# 8-13 Default Partition Considerations - Decision Trees

## Default Partition vs Pre-Creation

---

## Decision Context

Choosing between including a default/catch-all partition (MAXVALUE or DEFAULT) that silently captures all unmatched data vs omitting it so INSERTs fail — forcing partition creation.

---

## Decision Criteria

* performance: default partition grows unbounded if management is neglected
* architectural: no-default means INSERTs error on missing partitions — immediate alert
* maintainability: default requires active monitoring; no-default requires reliable automation

---

## Decision Tree

Can you guarantee all needed partitions are created before data arrives?

YES → Omit default partition (recommended)

    ↓
    No MAXVALUE (range) or DEFAULT (list)
    Pre-create partitions via automation
    
    ↓
    INSERT for unpartitioned range → error
    Error = immediate alert: partition creation missed
    Forces proactive partition management

NO → Need a safety net for unexpected data?

    YES → Include default partition with monitoring
        
        ↓
        Range: PARTITION p_future VALUES LESS THAN (MAXVALUE)
        List: PARTITION p_other VALUES IN (DEFAULT)
        
        ↓
        REQUIRED MONITORING:
        - Default partition row count < 10% of total
        - Alert on default partition growth
        - Monthly review of default values
        
        ↓
        If default grows: REORGANIZE to split out known values
        Schedule partition creation before current range ends

NO → Team reliability culture?

    → Omit default
    Teams with strong automation and monitoring prefer errors over silent catch-all
    INSERT failure is a forcing function

---

## Recommended Default

**Default:** Omit default partition and pre-create all needed partitions; only include default when data arrival cannot be predicted and monitoring is in place
**Reason:** No-default forces proactive management. Default partitions silently degrade performance when neglected.

---

## Remediating a Grown Default Partition

---

## Decision Context

When the default partition (MAXVALUE or DEFAULT) has grown too large and needs to be split — reorganizing the overfull partition into proper ranges.

---

## Decision Criteria

* performance: REORGANIZE copies data — I/O intensive
* architectural: split default into explicit partitions; create new default for future
* maintainability: ensure automation prevents recurrence

---

## Decision Tree

Default partition is > 10% of table size?

YES → Remediate immediately

    ↓
    Step 1: Identify what's in the default
    
    For range (MAXVALUE):
    SELECT MIN(created_at), MAX(created_at) FROM orders PARTITION (p_future);
    
    For list (DEFAULT):
    SELECT DISTINCT status FROM orders PARTITION (p_other);
    
    ↓
    Step 2: REORGANIZE default into explicit partitions
    
    Range: ALTER TABLE orders REORGANIZE PARTITION p_future INTO (
        PARTITION p2024 VALUES LESS THAN (TO_DAYS('2025-01-01')),
        PARTITION p2025 VALUES LESS THAN (TO_DAYS('2026-01-01')),
        PARTITION p_future VALUES LESS THAN (MAXVALUE)  -- new default
    );
    
    List: REORGANIZE to split known values out of DEFAULT
    
    ↓
    Step 3: Fix automation to create partitions before they're needed
    Step 4: Set alerts for default partition growth

NO → Default is small but growing?

    YES → Monitor and plan proactive split
        
        ↓
        Review next partition boundary
        Add partition before current range fills
        Example: next month's range partition created this month

NO → No default partition defined?

    → Ensure pre-creation covers all expected ranges
    Verify next partition is created before current ends
    Test: run INSERT with future date to verify error

---

## Recommended Default

**Default:** Proactive split when default exceeds 5% of table; REORGANIZE into explicit ranges with monitoring
**Reason:** Small default is harmless. Growing default degrades performance. Fix the root cause (missed pre-creation) not just the symptom.

---

## Related Rules

* Rule 8-13-1: Always Monitor Default Partition Size
* Rule 8-13-2: Never Rely on MAXVALUE as Permanent Catch-All

---

## Related Skills

* Manage Default Partitions Safely
* Automate Partition Creation
