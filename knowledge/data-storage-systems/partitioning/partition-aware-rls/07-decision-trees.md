# 8-17 Partition Aware Rls - Decision Trees

## RLS vs Application-Level Authorization for Partitioned Tables

---

## Decision Context

Choosing between PostgreSQL Row-Level Security (RLS) on partitioned tables and application-level authorization (WHERE clause or middleware) for tenant isolation.

---

## Decision Criteria

* performance: RLS adds per-row check after partition pruning
* architectural: RLS propagates to all partitions automatically; app-level requires code changes
* maintainability: RLS is database-enforced and cannot be bypassed by queries

---

## Decision Tree

Using PostgreSQL?

YES → Need tenant isolation across all partitions?

    YES → Use RLS on partitioned table
        
        ↓
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
        CREATE POLICY tenant_isolation ON orders
            USING (tenant_id = current_setting('app.tenant_id')::int);
        
        ↓
        Applies to current and future partitions automatically
        Cannot be bypassed by queries (even direct SQL)
        Partition pruning works before RLS filtering
        
        ↓
        Best for: multi-tenant apps with strict isolation
        Performance: pruning first, then RLS on reduced set

NO → RLS propagation not needed?

    → Application-level authorization
    
    WHERE clause: ->where('tenant_id', $tenantId)
    Query scopes: GlobalScope or local scope
    
    Simpler to implement
    Can be bypassed by raw SQL queries

NO → Using MySQL?

    → Application-level authorization only
    MySQL doesn't support RLS
    Must use WHERE clauses, query scopes, or views

---

## Recommended Default

**Default:** PostgreSQL RLS for multi-tenant isolation on partitioned tables; application-level for MySQL or simple cases
**Reason:** RLS is database-enforced and automatically covers all partitions. Application-level authorization is MySQL-compatible but can be bypassed.

---

## Detached Partition Security

---

## Decision Context

When a partition is detached (DETACH PARTITION) from a parent table with RLS, the standalone table loses RLS protection — requiring separate security measures.

---

## Decision Criteria

* performance: DETACH is metadata-only; RLS removal is automatic
* architectural: detached partition is a standalone table outside the RLS policy
* maintainability: must re-secure standalone tables manually

---

## Decision Tree

Need to detach a partition for archival?

YES → Understand RLS implications

    ↓
    Before DETACH: RLS policy covers this partition
    After DETACH: standalone table has NO RLS policy
    
    ↓
    Step 1: DETACH PARTITION
    ALTER TABLE orders DETACH PARTITION orders_2020;
    
    Step 2: Re-secure the standalone table
    ALTER TABLE orders_2020 ENABLE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON orders_2020
        USING (tenant_id = current_setting('app.tenant_id')::int);
    
    OR: Revoke all access, only allow admin/read-only

NO → Re-attaching a previously detached partition?

    YES → RLS is re-applied automatically
        
        ↓
        ALTER TABLE orders ATTACH PARTITION orders_2020 ...;
        
        ↓
        Parent RLS policy covers it again
        No manual action needed

NO → Dropping instead of detaching?

    → No security concern (data is gone)
    DROP TABLE orders_2020;
    No RLS implications

---

## Recommended Default

**Default:** After DETACH, explicitly enable RLS or revoke access on the standalone table; re-attachment restores parent RLS automatically
**Reason:** Detached partitions lose RLS protection. Never assume they remain secure. Always re-apply security controls.

---

## Related Rules

* Rule 8-17-1: Always Enable RLS Before Creating Partitions
* Rule 8-17-2: Never Assume RLS Applies to Detached Partitions

---

## Related Skills

* Implement Partition-Aware Row-Level Security
* Implement PostgreSQL Row-Level Security
