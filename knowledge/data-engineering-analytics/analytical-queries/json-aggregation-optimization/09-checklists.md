# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 09-analytical-queries
**Knowledge Unit:** json-aggregation-optimization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] JSON aggregation (JSON_ARRAYAGG / json_agg) replaces N+1 relationship loading with single query
- [ ] JSON object aggregation understood for returning structured related data
- [ ] Lateral join approach evaluated for complex multi-relation queries
- [ ] Aggregation vs collection tradeoffs understood — JSON aggregation for read-only, collections for mutable
- [ ] Eloquent withSum/withCount (K007) considered as alternative for scalar aggregates
- [ ] Star schema assessment — JSON aggregation typically not needed when dimensions are already denormalized

---

# Architecture Checklist

- [ ] JSON aggregation: parent query returns rows with relation data as JSON column
- [ ] Single query replaces N+1: 1 query for parents + 0 query for relations
- [ ] JSON object aggregation: json_agg(json_build_object(...)) for specific fields
- [ ] Lateral join: FROM parent LEFT JOIN LATERAL (SELECT json_agg(...) FROM related WHERE ...) ON true
- [ ] Aggregation pattern preferred over collection when related data is read-only and filterable
- [ ] Star schema (K006) facts already denormalized — no JSON aggregation needed for star schemas

---

# Implementation Checklist

- [ ] PostgreSQL json_agg: DB::raw("json_agg(related.*) as related_data")
- [ ] MySQL JSON_ARRAYAGG: DB::raw("JSON_ARRAYAGG(JSON_OBJECT('id', related.id, 'name', related.name))")
- [ ] JSON object aggregation: json_agg(json_build_object('key', col)) for selective field return
- [ ] Lateral join: DB::raw("LEFT JOIN LATERAL (SELECT json_agg(...) FROM related WHERE related.parent_id = parent.id) AS rel ON true")
- [ ] JSON parsed in PHP: json_decode($row->related_data) for collection
- [ ] Aggregation vs collection: Use json_agg when data is read-only, Eloquent collection when updates needed

---

# Performance Checklist

- [ ] Query count comparison: N+1 (N=100 = 101 queries) vs JSON aggregation (1 query)
- [ ] Data transfer comparison: JOIN repeats parent data N times, json_agg sends once
- [ ] json_agg index on (parent_id) for efficient per-parent grouping
- [ ] json_agg memory: PHP parses JSON once per parent, not N times per child
- [ ] Lateral join performance: executes subquery per parent row — index critical
- [ ] MySQL JSON_ARRAYAGG vs PostgreSQL json_agg latency benchmarked for data size

---

# Security Checklist

- [ ] JSON_AGG selects only fields user is authorized to see
- [ ] Sensitive relation fields excluded from json_agg column list
- [ ] Parsed JSON data scoped by user permissions before rendering
- [ ] Lateral join subquery access restricted to allowed tables
- [ ] JSON column not stored in database — computed at query time only

---

# Reliability Checklist

- [ ] json_agg returns empty array (not null) when no related rows — null handling in PHP
- [ ] Lateral join returns null row when no related rows — COALESCE(json_agg, '[]')
- [ ] JSON parsing error caught — malformed JSON returns empty collection, not crash
- [ ] Aggregation query timeout configured for large parent result sets
- [ ] Database JSON function compatibility tested across MySQL/PostgreSQL

---

# Testing Checklist

- [ ] Test json_agg returns correct related data grouped by parent
- [ ] Test json_agg with empty relation returns empty JSON array
- [ ] Test data transfer: N+1 vs json_agg bytes transferred compared
- [ ] Test lateral join returns correct results matching N+1 pattern
- [ ] Test PHP json_decode produces correct collection structure
- [ ] Test star schema alternative — JSON aggregation not needed when facts are dimension-normalized

---

# Maintainability Checklist

- [ ] JSON aggregation queries in dedicated repository class or query scope
- [ ] Aggregation field list documented per query
- [ ] Relationship mapping in query documented (which parent fields map to which child table columns)
- [ ] Lateral join subquery in separate variable for readability
- [ ] Compatibility notes: MySQL vs PostgreSQL syntax differences documented

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use json_agg when star schema already denormalizes — adds unnecessary complexity
- [ ] Do not json_agg all columns — select only needed fields (reduces transfer)
- [ ] Do not parse JSON in Blade view — parse in service/controller before passing to view
- [ ] Do not use json_agg for single-value relations — withSum/withCount (K007) is simpler
- [ ] Do not skip index on (parent_id) — unindexed json_agg full table scan per group-by

---

# Production Readiness Checklist

- [ ] Prometheus metrics for query reduction (N+1 queries avoided) after JSON aggregation adoption
- [ ] Logged warning when json_agg query latency exceeds threshold for large parent sets
- [ ] Alert if JSON parsing error rate exceeds 0.1% (data integrity issue)
- [ ] Data transfer reduction measured (bytes before/after JSON aggregation)
- [ ] Deploy checklist includes query count verification for optimized pages
- [ ] Staging N+1 vs JSON aggregation benchmark validates performance improvement

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: JSON aggregation replaces N+1, lateral join for complex queries, star schema assessment
- [ ] Security requirements satisfied: selected field whitelist, sensitive field exclusion, permission scoping
- [ ] Performance requirements satisfied: query count reduction measured, data transfer compared, indexed grouping
- [ ] Testing requirements satisfied: correctness vs N+1, empty relation handling, data transfer comparison, lateral join
- [ ] Anti-pattern checks passed: star schema not doubled, selective fields, parsed before view, not for scalar relations
- [ ] Production readiness verified: query count metrics, latency alerts, parsing errors, transfer reduction, staging

---

# Related References

- K007 (Eloquent Aggregates): Foundation for understanding SQL aggregation in Eloquent
- K006 (Star Schema): JSON aggregation is typically not needed in star schemas (facts are already denormalized)
- K011 (Dashboard Widget): Widget data providers can use JSON aggregation for efficient relation loading
