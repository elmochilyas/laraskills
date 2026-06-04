# 7-15 Read Replica Specific Workloads - Decision Trees

## Shared vs Dedicated Replicas by Workload

---

## Decision Context

Choosing between shared replicas (all workloads share the same replicas) and dedicated replicas (separate replicas for reporting, analytics, search indexing, user-facing queries).

---

## Decision Criteria

* performance: heavy reporting queries can starve user-facing queries on shared replicas
* architectural: dedicated replicas isolate workload resource usage
* maintainability: more replicas = more management overhead

---

## Decision Tree

Do reporting/analytics queries consume significant CPU (>20% of total)?

YES → Dedicate replica for reporting/analytics

    ↓
    Provision: larger instance (2x CPU, 4x RAM)
    Connection: DB::connection('mysql_reporting')
    
    ↓
    Reporting replica runs heavy aggregations at 100% CPU
    User-facing replica stays responsive
    
    ↓
    Sizing: reporting 2x CPU, analytics more storage

NO → Do search indexing reads scan large tables?

    YES → Dedicate replica for search indexing
        
        ↓
        Search indexing reads can evict buffer pool cache
        Separate replica prevents cache pollution for user-facing queries

NO → Single application with light read workload?

    → Shared replicas sufficient
    All workloads share same replicas
    Monitor for resource contention
    Add dedicated replicas when contention appears

---

## Recommended Default

**Default:** Start with shared replicas; add dedicated replicas when workload profiling shows resource contention
**Reason:** Dedicated replicas add cost. Only justify when heavy queries degrade user-facing performance.

---

## Named Connection Configuration

---

## Decision Context

Setting up Laravel named database connections for workload-specific replicas, ensuring application code uses the correct connection for each query type.

---

## Decision Criteria

* performance: named connections have zero overhead (resolved at config load)
* architectural: each named connection can have independent pool, timeout, replica host
* maintainability: code must explicitly reference the correct connection name

---

## Decision Tree

Workload types?

↓

Reporting (heavy aggregations, slow queries)?

YES → Create connection: mysql_reporting

    ↓
    'mysql_reporting' => [
        'read' => ['host' => ['reporting-replica']],
        'write' => ['host' => ['primary']],
    ]
    
    ↓
    Use: DB::connection('mysql_reporting')->select(...)
    Heavy queries isolated from user-facing replicas

NO → Analytics (BI tools, Tableau, Metabase)?

    YES → Create connection: mysql_analytics
        
        ↓
        'mysql_analytics' => [
            'read' => ['host' => ['analytics-replica']],
            'write' => ['host' => ['primary']],
        ]
        
        ↓
    Configure BI tool to use this connection
    Accept higher lag (hours-old data is fine)

NO → Search indexing (Elasticsearch, Meilisearch)?

    → Create connection: mysql_search
    Large table scans for indexing
    Separate buffer pool from user-facing queries

---

## Recommended Default

**Default:** `mysql_reporting`, `mysql_analytics` named connections mapped to dedicated replicas
**Reason:** Named connections make workload routing explicit. Every query's replica target is visible in the code.

---

## Related Rules

* Rule 7-15-1: Never Run Heavy Workloads on User-Facing Replicas
* Rule 7-15-2: Always Profile Workloads Before Dedicating Replicas

---

## Related Skills

* Dedicate Read Replicas by Workload Type
* Configure Named Database Connections for Workload-Specific Replicas
