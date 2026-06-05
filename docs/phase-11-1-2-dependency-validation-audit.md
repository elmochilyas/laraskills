# Phase 11.1.2: Dependency Validation Audit

## Problem Statement

The `laravel-ecc validate` command reported that only 2116 of 2321 knowledge units (KUs) were reachable in topological order. With 205 unreachable KUs, the dependency graph contained cycles that blocked downstream KUs from being discovered during retrieval.

## Root Cause Analysis

### Data Sources

The dependency graph is built from two sources:
1. **Explicit prerequisites** — declared in `04-standardized-knowledge.md` metadata tables under `| Dependencies |`
2. **Alias-resolved prerequisites** — `intelligence/json/aliases.json` maps section numbers (e.g., "7.18 Transaction pooling") and K-codes (e.g., "K14") to canonical KU IDs

### Validation Algorithm

The validator in `src/retrieval/index.mjs:154-184` uses Kahn's algorithm for topological sorting:

```
1. Build adjacency list from prerequisite edges
2. Initialize indegree counter for each KU
3. Queue all KUs with indegree 0
4. Process queue: increment visited count, decrement neighbor indegree
5. If indegree reaches 0, add to queue
6. After processing: if visited < total → circular dependency exists
```

### Findings

#### 1. Self-Loops (2 edges)

Two edges where `source === target`:

| Edge | Source File | Cause |
|------|-------------|-------|
| `transaction-pooling-limitations → transaction-pooling-limitations` | `connections/transaction-pooling-limitations/04` | KU references "7.18 Transaction pooling" which aliases to itself |
| `event-sourcing-multi-tenant → event-sourcing-multi-tenant` | `multi-tenancy/event-sourcing-multi-tenant/04` | KU references "14.1 Event store" which aliases to itself |

Created by the alias resolution phase: the KU lists its own alias as a dependency.

#### 2. Two-Node Cycles (12 pairs)

24 KUs formed 12 mutual dependency pairs. Each pair where KU A lists KU B as prerequisite AND KU B lists KU A as prerequisite:

| Domain | Pair |
|--------|------|
| Partitioning | `range-partitioning ↔ partition-management` |
| Connections | `pool-architecture ↔ pgbouncer-pooling-modes`, `pool-architecture ↔ laravel-octane-connections` |
| Schema | `migration-batch-tracking ↔ laravel-migration-file-structure` |
| Sharding | `hash-based-sharding ↔ shard-key-selection-principles`, `modulus-vs-consistent-hashing ↔ hash-based-sharding` |
| Replication | `replica-lag-causes ↔ replica-lag-monitoring`, `automatic-query-routing ↔ laravel-read-write-config` |
| Transactions | `transaction-scoping-laravel ↔ nested-transactions-savepoints` |
| Schema tools | `spirit-tool ↔ gh-ost-tool`, `pt-online-schema-change ↔ zero-downtime-migration-taxonomy` |
| Queries | `upsert ↔ insert-or-ignore` |
| Real-time | `real-time-notifications-broadcast-database ↔ real-time-dashboard-architecture` |
| SSE | `sse-implementation-laravel ↔ laravel-wave-sse-package` |

#### 3. Multi-Node SCCs (3 components)

| SCC Size | KUs | Subdomain |
|----------|-----|-----------|
| 7 | `nginx-websocket-proxy-configuration`, `supervisor-production-process-management`, `sticky-sessions-load-balancing-websocket`, `reconnection-strategies-storm-mitigation`, `redis-dependency-failure-modes`, `websocket-security-tls-cors-auth-cswsh`, `cve-2026-23524-reverb-redis-deserialization` | Real-time systems (deployment, scaling, security) |
| 5 | `pool-architecture`, `connection-count-management`, `laravel-octane-connections`, `pgbouncer-pooling-modes`, `pgbouncer-modes` | Connections management |
| 3 | `sse-implementation-laravel`, `laravel-wave-sse-package`, `websocket-vs-sse-vs-polling-decision-framework` | SSE comparison framework |

#### 4. Alias-Resolved Cycles (10 additional)

After fixing explicit cycles, alias resolution created additional cycles that were hidden inside the larger SCCs. These emerged when the SCCs were broken but individual mutual references remained through aliased section numbers.

#### 5. Broken Aliases (2 entries)

| Alias | Resolved To | Issue |
|-------|-------------|-------|
| "N+1 queries" | `data-storage-systems/queries/n-plus-one-detection-elimination` | KU does not exist (renamed to `optimization/n-plus-one-detection-elimination`) |
| "12.1 JSONB column type" | `data-storage-systems/advanced/jsonb-column-type` | KU does not exist (moved to `schema/blueprint-column-types`) |

### Impact

- **205 unreachable KUs** blocked from retrieval: 177 from `data-storage-systems`, 21 from `real-time-systems`, 7 from `testing-reliability-engineering`
- **7-node SCC in real-time** prevented any real-time WebSocket/scaling/security KUs from being discovered
- **5-node SCC in connections** blocked all pgBouncer/pooling/Octane connection management
- Retrieval would return incomplete context for any query touching these domains

### Detection Gap

The cycle detection in `tools/generation/inject-dependency-edges.ps1` ran BEFORE alias resolution (Phase 7 before Phase 7b). Since cycles were only created by alias-resolved edges, Phase 7 always reported 0 cycles despite real cycles existing in the final graph. The validator caught them because it reads the post-alias `dependencies.json`.
