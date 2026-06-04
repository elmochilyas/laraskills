# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 09-analytical-queries
**Knowledge Unit:** eloquent-aggregates
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] withSum/withAvg/withCount/withMin/withMax methods understood for aggregate subqueries
- [ ] addSelect with closure subquery pattern understood for advanced aggregation
- [ ] joinSub pattern understood for subquery-based joins
- [ ] whereExists for correlated subquery filtering
- [ ] Generated columns evaluated for pre-computed aggregates on tables
- [ ] JSON aggregation (K020) evaluated as alternative for collecting related data

---

# Architecture Checklist

- [ ] withCount() replaces ->loadCount() N+1 pattern for relationship counts
- [ ] withSum() replaces manual GROUP BY + LEFT JOIN for related table sums
- [ ] addSelect with subquery: Model::addSelect(['total' => fn($q) => $q->from(...)])
- [ ] joinSub: Model::joinSub($subquery, 'alias', 'id', '=', 'alias.user_id')
- [ ] whereExists: Model::whereExists(fn($q) => $q->from('orders')->whereColumn('user_id', 'users.id'))
- [ ] Generated columns: DB::statement("ALTER TABLE users ADD total_spent DECIMAL GENERATED ALWAYS AS (...) STORED")

---

# Implementation Checklist

- [ ] withCount example: User::withCount('orders')->get() -> $user->orders_count
- [ ] withSum example: User::withSum('orders', 'total')->get() -> $user->orders_sum_total
- [ ] addSelect subquery: User::addSelect(['last_order_date' => Order::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1)])
- [ ] joinSub: $sub = Order::selectRaw('user_id, SUM(total) as total_spent')->groupBy('user_id'); User::joinSub($sub, 'order_totals', 'id', '=', 'order_totals.user_id')
- [ ] whereExists: User::whereExists(fn($q) => $q->select(DB::raw(1))->from('orders')->whereColumn('user_id', 'users.id')->havingRaw('COUNT(*) > 5'))
- [ ] Generated column: DB::statement for pre-computed aggregate column

---

# Performance Checklist

- [ ] withCount query plan verified — single query with subquery, not N+1
- [ ] withSum subquery uses index on (foreign_key, aggregate_column)
- [ ] addSelect subquery uses index for ORDER BY + LIMIT 1 (correlated subquery)
- [ ] joinSub avoids full table scan — join columns indexed
- [ ] whereExists subquery uses relevant index for correlated filter
- [ ] Generated column indexable — pre-computed aggregates available for query filtering

---

# Security Checklist

- [ ] Subquery parameters use parameter binding, not string concatenation
- [ ] Aggregate data does not expose individual row PII (aggregates are safe)
- [ ] withSum on sensitive columns (revenue, salary) restricted to authorized roles
- [ ] Subquery in addSelect cannot be used to bypass row-level security
- [ ] Generated columns with sensitive data restricted via column-level permissions

---

# Reliability Checklist

- [ ] Subquery timeout configured for correlated subqueries on large tables
- [ ] joinSub subquery result set limited — subquery returns manageable row count
- [ ] Generated column updated on write — no stale values
- [ ] withSum returns null (not 0) for relations with no rows — null handling in application
- [ ] addSelect subquery returns null if no matching row — null handling required

---

# Testing Checklist

- [ ] Test withCount returns correct count matching manual COUNT query
- [ ] Test withSum returns correct sum matching manual SUM query
- [ ] Test addSelect subquery returns correct value matching manual subquery
- [ ] Test joinSub query plan uses indexes (EXPLAIN verified)
- [ ] Test generated column returns correct pre-computed aggregate
- [ ] Test null handling — withSum/addSelect on empty relation

---

# Maintainability Checklist

- [ ] Complex subqueries extracted to Eloquent query scopes or custom casts
- [ ] addSelect subquery closures documented with purpose column aliases
- [ ] Generated column DDL in version-controlled migration
- [ ] joinSub subquery logic in dedicated query builder class or scope
- [ ] Aggregate method usage documented per model

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use withCount in a loop — defeats purpose of single query
- [ ] Do not mix withSum and withAvg in same query without testing query plan
- [ ] Do not use addSelect subquery without LIMIT 1 — subquery may return multiple rows
- [ ] Do not use joinSub on large unindexed subquery results
- [ ] Do not use generated column for frequently changing values — write overhead

---

# Production Readiness Checklist

- [ ] Prometheus metrics for query count reduction after withCount/withSum adoption
- [ ] Logged warning when addSelect subquery latency exceeds threshold
- [ ] Alert if generated column computation impacts write throughput
- [ ] Subquery query plan verified after database migration
- [ ] Deploy checklist includes generated column migration order
- [ ] Staging query performance validated for withSum/withCount patterns

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: withCount/withSum/addSelect/joinSub/whereExists/generated columns
- [ ] Security requirements satisfied: parameter binding, aggregate safety, column-level permissions
- [ ] Performance requirements satisfied: indexed subqueries, LIMIT 1 for scalar, indexed joins, pre-computed
- [ ] Testing requirements satisfied: count/sum/addSelect/joinSub correctness, EXPLAIN, null handling
- [ ] Anti-pattern checks passed: no loop withCount, no un-LIMITed subquery, indexed joins
- [ ] Production readiness verified: query count metrics, latency alerts, write impact monitoring, staging

---

# Related References

- K020 (JSON Aggregation Optimization): Advanced alternative to withCount for collecting, not counting, relations
- K006 (Star Schema): Aggregate queries over star-schema facts/dimensions
- K011 (Dashboard Widget Provider): Using aggregates in widget data providers
