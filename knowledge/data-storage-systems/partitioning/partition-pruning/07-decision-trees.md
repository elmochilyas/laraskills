# 8-5 Partition Pruning - Decision Trees

## Diagnosing Pruning Failures

---

## Decision Context

When a query on a partitioned table is slow, determine if partition pruning is failing and which condition is preventing it.

---

## Decision Criteria

* performance: full partition scan (pruning disabled) can be 10-100x slower
* architectural: pruning requires the partition key in WHERE with compatible conditions
* maintainability: EXPLAIN output shows which partitions are scanned

---

## Decision Tree

Query is slow on partitioned table?

↓

Run EXPLAIN — Check `partitions` column

↓

Shows `ALL` or all partitions listed?

YES → Pruning is failing — diagnose cause

    ↓
    Does WHERE clause include the partition key?
    
    NO → Missing partition key in WHERE
        → Add partition key condition to WHERE
        Example fix: WHERE created_at >= '2024-01-01' AND status = 'active'
    
    YES → Does WHERE use function wrapper on partition key?
        
        YES → Function prevents pruning
            ❌ WHERE YEAR(created_at) = 2024
            ✅ WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
        
        NO → Check for OR conditions or subqueries
            OR without partition key in both branches?
            → Restructure query, move OR to UNION or separate queries

NO → Shows specific partitions (1-3)?

    → Pruning is working correctly
    Narrow query further if needed (more selective WHERE)
    Check index usage within the pruned partitions

---

## Recommended Default

**Default:** Run EXPLAIN on every query targeting partitioned tables; verify partitions column shows specific partitions (not ALL)
**Reason:** EXPLAIN is the definitive way to verify pruning. A missing partition key or function wrapper silently disables pruning.

---

## Static vs Dynamic Pruning

---

## Decision Context

Choosing between static pruning (constant WHERE values determined at plan time) and dynamic pruning (parameterized queries pruned at execution time).

---

## Decision Criteria

* performance: static pruning is more predictable; dynamic pruning may miss optimizations
* architectural: parameterized queries use dynamic pruning
* maintainability: dynamic pruning works with prepared statements but may need type hints

---

## Decision Tree

Query uses hard-coded constants?

YES → Static pruning

    ↓
    WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'
    
    ↓
    Optimizer knows exact partition(s) at plan time
    Most predictable pruning behavior
    Best performance

NO → Query uses parameters (prepared statements)?

    YES → Dynamic pruning
        
        ↓
        WHERE created_at >= ? AND created_at < ?
        
        ↓
        Pruning happens at execution time (not plan time)
        Works correctly for most cases
        
        ↓
        Watch out for:
        - Type mismatch between parameter and column (pruning may fail)
        - Bind parameter as same type as column
        
    NO → Query uses subquery for partition key?
    
        → Dynamic pruning with subquery
        May not prune in some databases
        Consider JOIN instead of subquery

---

## Recommended Default

**Default:** Dynamic pruning with parameterized queries (prepared statements) is standard practice; verify type matching
**Reason:** Prepared statements prevent SQL injection and enable plan caching. Dynamic pruning works correctly when parameter types match column types.

---

## Related Rules

* Rule 8-5-1: Always Include Partition Key In WHERE
* Rule 8-5-2: Never Use Function Wrapper on Partition Key

---

## Related Skills

* Verify and Optimize Partition Pruning
* Use EXPLAIN for Query Analysis
