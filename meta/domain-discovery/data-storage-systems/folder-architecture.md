# Folder Architecture: Data & Storage Systems

## Structure Rationale

This folder architecture is designed for a Laravel engineering knowledge corpus — a collection of reference materials, patterns, decision frameworks, and training content organized around the 15 subdomains identified in the domain analysis. The architecture prioritizes:

1. **Subdomain-aligned grouping**: Every directory maps to exactly one subdomain, ensuring non-overlapping knowledge sets. Cross-cutting concerns (migration patterns, connection management) are not buried inside other directories — they have their own.

2. **Familiar Laravel naming conventions**: Where possible, directory names mirror Laravel conventions (`migrations/`, `queries/`, `schema/`, `connections/`) to reduce cognitive overhead for Laravel developers.

3. **Progressive depth**: Each subdomain directory contains the same standard sub-structure (`reference/`, `patterns/`, `risks/`, `tools/`, `examples/`), making it predictable to navigate. As the corpus grows, content slots into known locations.

4. **Separation of core vs. advanced vs. enterprise**: The `advanced/` directory groups PostgreSQL-specific, MySQL-specific, and enterprise-scale (sharding, CQRS) content that not every developer needs. This prevents beginners from being overwhelmed while making expert content findable.

5. **Tooling independence**: Zero-downtime migration tools, connection pool managers, and sharding packages live in `tools/` subdirectories rather than being scattered across reference documents. This makes it easy to add new tools without restructuring.

6. **Decision-first design**: The `patterns/tradeoffs/` directory exists specifically to capture decision matrices (multi-tenancy model selection, shard key selection, index type selection) that are the most valuable output of this analysis for practicing engineers.

## Proposed Folder Tree

```
data-storage-systems/
|
|-- README.md                                         # Domain overview, scope, how to navigate
|
|-- schema/
|   |-- reference/
|   |   |-- column-types.md                           # All Blueprint column types per driver
|   |   |-- column-modifiers.md                       # nullable, default, after, etc.
|   |   |-- constraints.md                            # PK, FK, unique, check, exclusion
|   |   |-- soft-deletes.md                           # SoftDeletes trait, unique constraint interaction
|   |   |-- naming-conventions.md                     # Table, column, index, FK naming
|   |   |-- normalization.md                          # Normal forms, denormalization patterns
|   |
|   |-- migrations/
|   |   |-- creating-migrations.md                    # Artisan commands, file structure
|   |   |-- migration-ordering.md                     # Naming, dependencies, batch tracking
|   |   |-- squashing.md                              # schema:dump, maintenance mode
|   |   |-- migration-locking.md                      # isolated option, multi-server safety
|   |   |-- data-migrations.md                        # Separating schema from data changes
|   |   |-- model-usage-antipattern.md                # Using models in migrations
|   |   |-- rollback-strategies.md                    # Safe vs. destructive rollbacks
|   |   |-- multi-tenant-migrations.md                # Fan-out orchestration, canary, retry
|   |
|   |-- patterns/
|   |   |-- expand-contract.md                        # Add column, dual-write, backfill, drop
|   |   |-- zero-downtime.md                          # Shadow-table, trigger-based, binlog-based
|   |   |-- instant-ddl.md                            # MySQL ALGORITHM=INSTANT, PostgreSQL lazy DEFAULT
|   |   |-- schema-version-tracking.md                # Per-tenant, per-region version ledger
|   |   |-- tradeoffs/
|   |       |-- normalized-vs-denormalized.md
|   |       |-- soft-delete-vs-hard-delete.md
|   |       |-- uuid-vs-auto-increment.md
|   |
|   |-- risks/
|   |   |-- locking-during-migrations.md              # DDL lock types, impact on traffic
|   |   |-- destructive-operation-timing.md           # Column drop, rename compatibility window
|   |   |-- drift-undetected-changes.md               # Manual schema changes, drift detection
|   |
|   |-- tools/
|       |-- gh-ost.md                                 # Configuration, throttling, cut-over
|       |-- pt-online-schema-change.md                # Trigger-based, FK support
|       |-- spirit.md                                 # MySQL 8.0+ successor
|       |-- pgroll.md                                 # PostgreSQL reversible migrations
|       |-- pg-repack.md                              # Bloat/reindex without exclusive lock
|       |-- planetscale-branching.md                  # Branch-based schema deployment
|
|-- queries/
|   |-- reference/
|   |   |-- eloquent-relationships.md                 # All relationship types with SQL generated
|   |   |-- query-builder-methods.md                  # Where, join, union, having, raw
|   |   |-- scopes.md                                 # Global, local, dynamic scopes
|   |   |-- lazy-loading.md                           # Prevention, detection, impact
|   |   |-- eager-loading.md                          # with, load, loadMissing, nested
|   |   |-- subqueries.md                             # addSelect, orderBy, where with subqueries
|   |   |-- raw-expressions.md                        # DB::raw, selectRaw, whereRaw
|   |   |-- upsert-operations.md                      # upsert, insertOrIgnore, updateOrCreate
|   |   |-- chunking-cursors.md                       # chunk, chunkById, cursor, lazy, lazyById
|   |   |-- model-events.md                           # Event lifecycle, observer pattern
|   |   |-- casts.md                                  # Native, custom, Enum, JSON, encrypted
|   |
|   |-- patterns/
|   |   |-- n-plus-one-elimination.md                 # Detection, fixes, tooling
|   |   |-- where-has-optimization.md                 # Avoiding deep nested chains
|   |   |-- relationship-counting.md                  # withCount, withSum, SQL-side aggregation
|   |   |-- query-shape-discipline.md                 # Endpoint-specific queries, list vs detail
|   |   |-- pagination-strategies.md                  # Offset, cursor, keyset, large dataset
|   |   |-- reporting-queries.md                      # When to drop to query builder/raw
|   |   |-- joins-vs-subqueries.md                    # Performance tradeoffs per scenario
|   |   |-- model-hydration-control.md                # select(), narrowing columns
|   |   |-- tradeoffs/
|       |   |-- eloquent-vs-query-builder.md
|       |   |-- eager-vs-lazy-loading.md
|       |   |-- collection-vs-sql-aggregation.md
|
|   |-- risks/
|   |   |-- n-plus-one-cascade.md                     # Hidden in views, resources, accessors
|   |   |-- over-hydration.md                         # Using * in selects for list endpoints
|   |   |-- blind-eager-loading.md                    # Loading relationships no one uses
|   |   |-- duplicate-query-detection.md
|   |
|   |-- tools/
|       |-- laravel-telescope.md                      # Query monitoring, N+1 detection
|       |-- debugbar.md
|       |-- clockwork.md
|       |-- query-logging.md                          # DB::listen, enableQueryLog
|
|-- indexes/
|   |-- reference/
|   |   |-- index-types.md                            # B-Tree, Hash, GiST, GIN, BRIN, SP-GiST, R-Tree
|   |   |-- b-tree.md                                 # Structure, when it applies
|   |   |-- gin-indexes.md                            # JSONB, arrays, tsvector, trigrams
|   |   |-- gist-indexes.md                           # Geometric, full-text, range types
|   |   |-- brin-indexes.md                           # Append-heavy, correlated data
|   |   |-- full-text-indexes.md                      # MySQL FULLTEXT, PostgreSQL GIN tsvector
|   |   |-- spatial-indexes.md                        # MySQL R-Tree, PostgreSQL GiST
|   |   |-- composite-indexes.md                      # Leftmost prefix, column ordering rules
|   |   |-- partial-indexes.md                        # WHERE clause on index (PostgreSQL)
|   |   |-- functional-expression-indexes.md          # Index on expression result
|   |   |-- covering-indexes.md                       # Index-only scans, include columns
|   |   |-- descending-indexes.md                     # ORDER BY DESC alignment
|   |   |-- concurrent-creation.md                    # PostgreSQL CONCURRENTLY, MySQL INPLACE
|   |   |-- index-maintenance.md                      # Bloat, fillfactor, VACUUM, rebuilding
|   |
|   |-- patterns/
|   |   |-- composite-index-design.md                 # Equality-first, range-after, cardinality
|   |   |-- index-alignment-with-explain.md           # Matching EXPLAIN output to index fixes
|   |   |-- covering-index-for-common-queries.md      # Reducing heap fetches
|   |   |-- partial-index-for-filtered-queries.md     # Active-only, non-deleted patterns
|   |   |-- index-for-soft-deletes.md                 # Partial unique + composite with deleted_at
|   |   |-- rls-compatible-indexes.md                 # Index WHERE matches policy USING
|   |   |-- index-review-checklist.md                 # Code review gate for new indexes
|   |   |-- tradeoffs/
|   |       |-- single-vs-composite-indexes.md
|   |       |-- read-speed-vs-write-speed.md
|   |       |-- index-coverage-vs-bloat.md
|   |
|   |-- risks/
|   |   |-- over-indexing.md                          # Write amplification, storage, maintenance
|   |   |-- under-indexing.md                         # Full table scans, filesorts
|   |   |-- index-column-order-mistakes.md            # Wrong column in leading position
|   |   |-- sargability-violations.md                 # Functions on indexed columns
|   |   |-- implicit-conversion-bypass.md             # Type mismatch, index skipped
|   |
|   |-- tools/
|       |-- explain-interpretation.md                 # Reading query plans, key columns
|       |-- mysql-slow-query-log.md                   # Configuration, analysis tools
|       |-- postgres-auto-explain.md
|       |-- pt-query-digest.md
|       |-- pg-stat-user-indexes.md
|       |-- performance-schema.md                     # MySQL index statistics
|
|-- optimization/
|   |-- reference/
|   |   |-- explain-basics.md                         # type, possible_keys, key, rows, Extra
|   |   |-- explain-analyze.md                        # Actual time, loops, actual rows
|   |   |-- slow-query-log-setup.md                   # Both MySQL and PostgreSQL
|   |   |-- sargability-rules.md                      # Complete reference of index-friendly patterns
|   |   |-- pagination-types.md                       # Offset, cursor, keyset comparison
|   |   |-- chunking-patterns.md                      # When each chunk method applies
|   |
|   |-- patterns/
|   |   |-- optimization-workflow.md                  # Profile -> measure -> fix -> verify -> monitor
|   |   |-- endpoint-query-budget.md                  # Max queries, max time per endpoint
|   |   |-- query-shape-governance.md                 # Per-endpoint query shape definition
|   |   |-- cursor-pagination.md                      # Large dataset pagination
|   |   |-- keyset-pagination.md                      # Stable-sort pagination
|   |   |-- memory-optimization.md                    # Reducing hydration memory
|   |   |-- query-caching-strategies.md               # Remember, tagged, materialized views
|   |   |-- reporting-workload-separation.md          # Move analytics off transactional DB
|   |   |-- tradeoffs/
|   |       |-- read-optimization-vs-write.md
|   |       |-- consistency-vs-performance.md
|   |       |-- orm-convenience-vs-control.md
|   |
|   |-- risks/
|   |   |-- optimization-without-measurement.md       # Guesswork optimization
|   |   |-- premature-optimization.md                 # Optimizing cold paths
|   |   |-- production-regression-detection.md        # Performance degradation alerts
|   |
|   |-- tools/
|       |-- profiling-workflow.md                     # Telescope -> Explain -> Fix cycle
|       |-- apm-integration.md                        # Laravel APM tools for query tracing
|       |-- benchmark-comparison.md                   # Before/after measurement methodology
|
|-- multi-tenancy/
|   |-- reference/
|   |   |-- isolation-models.md                       # Shared-table, schema-per-tenant, DB-per-tenant
|   |   |-- tenant-resolution.md                      # Domain, subdomain, header, token, user
|   |   |-- global-scopes.md                          # Implementation, enforcement, testing
|   |   |-- connection-switching.md                   # Middleware, purge/reconnect, dynamic config
|   |   |-- postgresql-rls.md                         # RLS policies, app.current_tenant, partition propagation
|   |   |-- packages.md                               # stancl/tenancy, spatie/laravel-multitenancy
|   |
|   |-- patterns/
|   |   |-- shared-table-pattern.md                   # tenant_id column, global scope discipline
|   |   |-- schema-per-tenant-pattern.md              # Search path switching, migration fan-out
|   |   |-- database-per-tenant-pattern.md            # Provisioning, migration orchestration, backups
|   |   |-- tenant-aware-queue-jobs.md                # Tenant context in job payloads
|   |   |-- tenant-aware-commands.md                  # --tenant option, batch processing
|   |   |-- cross-tenant-analytics.md                 # Warehouse, federated queries, CDC
|   |   |-- tenant-segmentation.md                    # Tiered isolation, whale tenants
|   |   |-- compliance-boundaries.md                  # GDPR, HIPAA, SOC 2, data residency
|   |   |-- tenant-provisioning-lifecycle.md          # Create, migrate, seed, archive, delete
|   |   |-- tradeoffs/
|   |       |-- shared-vs-schema-vs-database.md       # Decision matrix: isolation, cost, complexity
|   |       |-- single-db-vs-db-per-tenant.md
|   |       |-- scope-bypass-risks.md                 # withoutGlobalScope governance
|   |
|   |-- risks/
|   |   |-- cross-tenant-data-leak.md                 # Missing scope, direct DB queries
|   |   |-- noisy-neighbor.md                         # Heavy tenant degrading others
|   |   |-- migration-fan-out-failure.md              # Per-DB migration partial failures
|   |   |-- queue-context-loss.md                     # Jobs running without tenant scope
|   |   |-- connection-storm.md                       # Per-tenant connection exhaustion
|   |   |-- leak-testing-gaps.md                      # Inadequate cross-tenant isolation tests
|   |
|   |-- tools/
|       |-- tenant-testing-fixtures.md                # Cross-tenant leak test patterns
|       |-- migration-orchestration.md                # Canary, batch, sequential fan-out
|       |-- rls-migration-generator.md                # Policy + index generation from annotations
|
|-- sharding/
|   |-- reference/
|   |   |-- sharding-strategies.md                    # Hash, range, directory, consistent hashing
|   |   |-- shard-key-selection.md                    # Cardinality, distribution, query alignment
|   |   |-- id-generation.md                          # Snowflake, sequence, UUID v7
|   |   |-- shard-routing.md                          # Service-side vs. proxy-level routing
|   |   |-- fan-out-queries.md                        # Broadcast, aggregate, merge
|   |   |-- cross-shard-limitations.md                # Joins, transactions, aggregations
|   |   |-- shard-rebalancing.md                      # Data movement, online vs. downtime
|   |   |-- shard-groups.md                           # Co-located tables, shared shard key
|   |   |-- packages.md                               # allnetru/laravel-sharding
|   |
|   |-- patterns/
|   |   |-- hash-sharding.md                          # Modulo, consistent hash, virtual buckets
|   |   |-- range-sharding.md                         # Key ranges, predictable splits
|   |   |-- directory-sharding.md                     # Lookup table, flexible but extra hop
|   |   |-- shard-aware-models.md                     # getConnectionName, Shardable trait
|   |   |-- shard-aware-id-generation.md              # Global uniqueness, sortability
|   |   |-- pre-sharding-vs-progressive.md            # Shard from start or grow into it
|   |   |-- global-reference-tables.md                # Data replicated to all shards
|   |   |-- tradeoffs/
|   |       |-- sharding-vs-partitioning.md
|   |       |-- sharding-vs-replicas.md
|   |       |-- rebalancing-strategies.md
|   |
|   |-- risks/
|   |   |-- hot-shards.md                             # Uneven distribution, hotspot mitigation
|   |   |-- cross-shard-query-cost.md                 # Application-level join complexity
|   |   |-- shard-rebalancing-downtime.md             # Data movement during traffic
|   |   |-- id-collision.md                           # ID generation failure modes
|   |   |-- operational-complexity.md                 # Monitoring, backups, failover per shard
|   |
|   |-- tools/
|       |-- allnetru-sharding-config.md               # Package configuration reference
|       |-- coroutine-fanout.md                       # Octane/Swoole concurrent shard queries
|       |-- proxy-sql-config.md                       # SQL-level routing and caching
|       |-- vitess-integration.md                     # Vitess with Laravel considerations
|
|-- replication/
|   |-- reference/
|   |   |-- master-replica-topology.md                # Async replication fundamentals
|   |   |-- laravel-read-write-config.md              # read/write host arrays, sticky
|   |   |-- automatic-query-routing.md                # SELECT vs INSERT/UPDATE/DELETE routing
|   |   |-- sticky-writes.md                          # Read-from-primary-after-write semantics
|   |   |-- replica-lag.md                            # Causes, measurement, monitoring
|   |   |-- connection-pooling.md                     # PgBouncer modes, ProxySQL, RDS Proxy
|   |
|   |-- patterns/
|   |   |-- read-replica-for-reporting.md             # Offload dashboards, exports, analytics
|   |   |-- load-balancing-across-replicas.md         # Round-robin, least connections
|   |   |-- lag-aware-routing.md                      # Skip replica if lag exceeds threshold
|   |   |-- multi-region-replication.md               # Active-passive, active-active complexity
|   |   |-- replica-promotion-failover.md             # Procedures, automated vs. manual
|   |   |-- connection-pooling-for-replicas.md        # Per-replica pool sizing
|   |   |-- tradeoffs/
|   |       |-- consistency-vs-availability.md
|   |       |-- sync-vs-async-replication.md
|   |       |-- direct-vs-pooled-connections.md
|   |
|   |-- risks/
|   |   |-- stale-reads.md                            # Replica lag, application impact
|   |   |-- connection-exhaustion.md                  # Too many connections to replicas
|   |   |-- failover-inconsistency.md                 # Data loss during promotion
|   |   |-- replication-delay-under-load.md           # Heavy writes slow replication
|   |
|   |-- tools/
|       |-- pgbouncer-configuration.md                # Session/transaction/statement modes
|       |-- proxysql-query-rules.md                   # Query routing, caching, rewrite
|       |-- rds-proxy-config.md
|       |-- lag-monitoring.md                         # seconds_behind_master, pg_stat_replication
|
|-- partitioning/
|   |-- reference/
|   |   |-- partitioning-types.md                     # Range, list, hash, composite
|   |   |-- partition-pruning.md                      # Query optimizer elimination
|   |   |-- partition-management.md                   # Create, attach, detach, drop
|   |   |-- index-design.md                           # Local vs. global, per-partition indexes
|   |   |-- mysql-partition-limitations.md            # Unique key requirement
|   |   |-- postgresql-partitioning.md                # Declarative partitioning features
|   |   |-- packages.md                               # tpetry, orptech migration support
|   |
|   |-- patterns/
|   |   |-- time-based-partitioning.md                # Daily, weekly, monthly, quarterly
|   |   |-- hash-partition-scaling.md                 # Modulus factor approach
|   |   |-- partition-archiving.md                    # Detach old partitions, backup, drop
|   |   |-- partition-rls.md                          # RLS policy propagation to partitions
|   |   |-- tradeoffs/
|   |       |-- partitioning-vs-sharding.md
|   |       |-- time-vs-hash-partitioning.md
|   |       |-- local-vs-global-indexes.md
|   |
|   |-- risks/
|   |   |-- partition-bloat.md                        # Too many partitions
|   |   |-- default-partition-scan.md                 # Unmatched rows routed to default
|   |   |-- partition-key-mismatch.md                 # Wrong key choice, poor pruning
|   |   |-- unique-constraint-limitations.md          # MySQL partition key requirement
|   |
|   |-- tools/
|       |-- partition-migration-commands.md           # Artisan commands for partition management
|       |-- partition-monitoring.md                   # Size, pruning effectiveness
|
|-- transactions/
|   |-- reference/
|   |   |-- acid-properties.md                        # Atomicity, Consistency, Isolation, Durability
|   |   |-- isolation-levels.md                       # READ COMMITTED, REPEATABLE READ, SERIALIZABLE, SNAPSHOT
|   |   |-- mysql-isolation.md                        # InnoDB MVCC, gap locks, next-key locks
|   |   |-- postgresql-isolation.md                   # MVCC, SSI for SERIALIZABLE
|   |   |-- locking-types.md                          # Row-level, table-level, advisory
|   |   |-- deadlocks.md                              # Detection, resolution, prevention
|   |   |-- laravel-transaction-scoping.md            # DB::transaction, savepoints, nesting
|   |
|   |-- patterns/
|   |   |-- short-transactions.md                     # Move I/O outside, indexed WHERE
|   |   |-- optimistic-locking.md                     # Version column, update check
|   |   |-- pessimistic-locking.md                    # sharedLock, lockForUpdate
|   |   |-- deadlock-prevention.md                    # Consistent lock order, batching
|   |   |-- retry-logic.md                            # Deadlock retry, serialization failure retry
|   |   |-- advisory-locks.md                         # pg_advisory_lock, MySQL GET_LOCK
|   |   |-- outbox-pattern.md                         # Transactional outbox for dual-write safety
|   |   |-- tradeoffs/
|   |       |-- consistency-vs-performance.md
|   |       |-- optimistic-vs-pessimistic.md
|   |       |-- short-vs-long-transactions.md
|   |
|   |-- risks/
|   |   |-- long-running-transactions.md              # Bloat, replica lag, lock escalation
|   |   |-- lock-wait-timeouts.md                     # Configuration, mitigation
|   |   |-- write-skew.md                             # Phantom reads, serialization anomalies
|   |   |-- implicit-transaction-spread.md            # External I/O inside transactions
|   |
|   |-- tools/
|       |-- lock-monitoring.md                        # innodb_lock_waits, pg_locks
|       |-- transaction-debugging.md                  # Identifying long-running transactions
|
|-- connections/
|   |-- reference/
|   |   |-- connection-lifecycle.md                   # Config, instantiation, query, teardown
|   |   |-- pool-architecture.md                      # PgBouncer, ProxySQL, RDS Proxy
|   |   |-- pgbouncer-modes.md                        # Session, transaction, statement
|   |   |-- laravel-octane-compatibility.md           # Persistent connections, pooling conflicts
|   |   |-- dynamic-connections.md                    # Runtime config, purge/reconnect
|   |
|   |-- patterns/
|   |   |-- connection-pool-sizing.md                 # Max connections, pool depth calculation
|   |   |-- read-write-pools.md                       # Separate pools for read/write
|   |   |-- per-tenant-connections.md                 # Tenant-specific pool configuration
|   |   |-- per-shard-connections.md                  # Shard-specific pool sizing
|   |   |-- connection-observability.md               # Tagging, monitoring, alerting
|   |   |-- connection-health-checks.md               # Automatic recovery, failover
|   |   |-- multi-region-connections.md               # TLS, latency optimization
|   |   |-- tradeoffs/
|   |       |-- pooled-vs-direct.md
|   |       |-- sticky-vs-non-sticky.md
|   |       |-- persistent-vs-short-lived.md
|   |
|   |-- risks/
|   |   |-- connection-exhaustion.md                  # Max connections breached
|   |   |-- transaction-pooling-limitations.md        # PREPARE/DEALLOCATE, SET session
|   |   |-- connection-leaks.md                       # Unclosed connections in long-running processes
|   |   |-- failover-connection-failure.md            # Pool not reconnecting after failover
|   |
|   |-- tools/
|       |-- pgbouncer-config.md                       # Configuration examples per mode
|       |-- proxysql-setup.md                         # Query rules, monitoring
|       |-- rds-proxy-config.md                       # AWS RDS Proxy configuration
|
|-- advanced/
|   |-- postgresql/
|   |   |-- reference/
|   |   |   |-- jsonb.md                              # Storage, operators, indexing
|   |   |   |-- gin-indexes.md                        # JSONB GIN, jsonb_path_ops, B-Tree on path
|   |   |   |-- full-text-search.md                   # tsvector, tsquery, ranking, highlighting
|   |   |   |-- common-table-expressions.md           # CTE, recursive, materialization control
|   |   |   |-- window-functions.md                   # ROW_NUMBER, RANK, LAG, LEAD, frames
|   |   |   |-- lateral-joins.md                      # Subquery per row in FROM clause
|   |   |   |-- row-level-security.md                 # Policies, partitioning, index alignment
|   |   |   |-- partial-indexes.md                    # WHERE on index, space savings
|   |   |   |-- expression-indexes.md                 # Index on function result
|   |   |   |-- include-columns.md                    # Non-key payload in unique indexes
|   |   |   |-- materialized-views.md                 # Concurrent refresh, unique index requirement
|   |   |   |-- extensions.md                         # pgvector, postgis, pg_cron, pg_trgm
|   |   |   |-- range-types.md                        # int4range, daterange, tsrange
|   |   |   |-- array-columns.md                      # Storage, GIN indexing, operators
|   |   |   |-- triggers-functions.md                 # PL/pgSQL, statement-level, transition tables
|   |   |
|   |   |-- patterns/
|   |   |   |-- jsonb-analytics.md                    # GIN-indexed JSON analytics
|   |   |   |-- tsvector-search.md                    # Trigger-maintained, ranked results
|   |   |   |-- recursive-cte-hierarchies.md          # Tree traversal, adjacency lists
|   |   |   |-- rls-in-multi-tenant.md                # Defense-in-depth isolation
|   |   |   |-- expression-index-case-insensitive.md  # LOWER(email) index
|   |   |   |-- partial-index-filters.md              # Only active, non-deleted, non-archived
|   |   |   |-- materialized-view-reporting.md        # Precomputed dashboard metrics
|   |   |   |-- pgvector-semantic-search.md           # Embeddings, HNSW indexes, cosine similarity
|   |   |   |-- tradeoffs/
|   |   |       |-- jsonb-vs-relational.md
|   |   |       |-- native-search-vs-external-service.md
|   |   |       |-- rls-vs-application-scopes.md
|   |   |
|   |   |-- risks/
|   |       |-- jsonb-bloat.md                        # No VACUUM-like compaction
|   |       |-- rls-index-mismatch.md                 # Post-scan filter overhead
|   |       |-- materialized-view-staleness.md        # Stale data acceptance windows
|   |       |-- extension-compatibility.md            # Version compatibility, upgrade path
|   |
|   |-- mysql/
|   |   |-- reference/
|   |   |   |-- innodb-architecture.md                # Clustered indexes, buffer pool, redo logs
|   |   |   |-- innodb-locking.md                     # Record, gap, next-key, insert intention
|   |   |   |-- online-ddl.md                         # ALGORITHM options, LOCK options
|   |   |   |-- instant-ddl.md                        # Supported operations, 64-version limit
|   |   |   |-- spatial-data.md                       # POINT, R-Tree indexes, MBRContains
|   |   |   |-- full-text-search.md                   # MATCH...AGAINST, FULLTEXT indexes
|   |   |   |-- generated-columns.md                  # VIRTUAL, STORED, index on JSON path
|   |   |   |-- partitioning.md                       # MySQL-specific limitations
|   |   |   |-- character-set-collation.md            # utf8mb4, unicode_ci, bin
|   |   |
|   |   |-- patterns/
|   |   |   |-- buffer-pool-sizing.md                 # Instance count, size calculation
|   |   |   |-- spatial-bounding-box.md               # POINT + R-Tree for location search
|   |   |   |-- generated-column-json-index.md        # Indexing JSON path via generated column
|   |   |   |-- online-schema-change.md               # ALGORITHM selection per operation
|   |   |   |-- tradeoffs/
|   |   |       |-- myisam-vs-innodb.md               # Legacy consideration
|   |   |       |-- charsets-performance.md           # utf8mb4_general_ci vs unicode_ci vs bin
|   |   |
|   |   |-- risks/
|   |       |-- innodb-deadlock-common.md             # Common deadlock patterns in Laravel
|   |       |-- implicit-commit-in-ddl.md             # DDL commits open transaction
|   |       |-- non-sargable-mysql-specific.md        # MySQL-specific sargability issues
|   |
|   |-- enterprise/
|       |-- event-sourcing-cqrs/
|       |   |-- reference/
|       |   |   |-- event-store-design.md             # Append-only log, aggregate streams
|       |   |   |-- aggregate-pattern.md              # Command handling, event application
|       |   |   |-- domain-events.md                  # Immutability, naming, versioning
|       |   |   |-- projections.md                    # Read model building from events
|       |   |   |-- snapshots.md                      # Simple, adaptive, time-based strategies
|       |   |   |-- event-versioning.md               # Upcasting, schema evolution
|       |   |   |-- temporal-queries.md               # Time travel, point-in-time state
|       |   |   |-- outbox-pattern.md                 # Transactional outbox, message relay
|       |   |   |-- packages.md                       # spatie, syeedalireza, theaddresstech
|       |   |
|       |   |-- patterns/
|       |   |   |-- cqrs-read-write-separation.md     # Independent optimization per side
|       |   |   |-- async-projections.md              # Queue-based, eventual consistency
|       |   |   |-- event-replay.md                   # Rebuild projections from stored events
|       |   |   |-- horizon-integration.md            # Workers per event type, priority queues
|       |   |   |-- multi-tenant-event-sourcing.md    # Per-tenant event streams
|       |   |   |-- selective-cqrs.md                 # Event sourcing only for audit-critical domains
|       |   |   |-- tradeoffs/
|       |   |       |-- cqrs-vs-crud.md
|       |   |       |-- eventual-vs-strong-consistency.md
|       |   |       |-- event-sourcing-cost-vs-benefit.md
|       |   |
|       |   |-- risks/
|       |       |-- projection-lag.md                 # Async projection delays
|       |       |-- event-store-growth.md             # Storage, archival strategies
|       |       |-- dead-letter-accumulation.md       # Failed events, retry, alert
|       |       |-- schema-evolution-complexity.md    # Upcasting multiple event versions
|       |
|       |-- integrity-constraints/
|           |-- reference/
|           |   |-- foreign-keys.md                   # Cascade rules, index requirements
|           |   |-- unique-constraints.md             # Composite, NULL behavior, partial unique
|           |   |-- check-constraints.md              # Column-level, table-level, naming
|           |   |-- exclude-constraints.md            # PostgreSQL range/geometric overlap
|           |   |-- not-null.md                       # Production addition caution
|           |   |-- defaults.md                       # Static, expression-based
|           |
|           |-- patterns/
|           |   |-- cascade-behavior.md               # Lock escalation awareness, mass delete risk
|           |   |-- partial-unique-soft-delete.md     # WHERE deleted_at IS NULL unique index
|           |   |-- constraint-deferral.md            # PostgreSQL DEFERRABLE, defer time
|           |   |-- app-vs-db-enforcement.md          # Tradeoffs per constraint type
|           |   |-- tradeoffs/
|           |       |-- db-constraints-vs-app-validation.md
|           |       |-- strict-vs-permissive-schemas.md
|           |
|           |-- risks/
|               |-- fk-check-cost.md                  # Referential integrity at high throughput
|               |-- orphaned-data.md                  # Detection, cleanup strategies
|               |-- cascade-unintended.md             # Accidental mass deletion
|
|-- patterns/
|   |-- decision-frameworks/
|   |   |-- multi-tenancy-model-selection.md          # Decision matrix: isolation, cost, complexity
|   |   |-- database-engine-selection.md              # PostgreSQL vs. MySQL for Laravel
|   |   |-- scaling-strategy-selection.md             # Replicas vs. partitioning vs. sharding
|   |   |-- pagination-strategy-selection.md          # Offset vs. cursor vs. keyset
|   |   |-- index-type-selection.md                   # B-Tree vs. GIN vs. GiST vs. BRIN
|   |
|   |-- anti-patterns/
|   |   |-- n-plus-one-hidden.md                      # In views, resources, accessors
|   |   |-- where-date-sargability.md                 # Silent full table scans
|   |   |-- loop-update.md                            # Updating rows individually in Eloquent loops
|   |   |-- eager-loading-everything.md               # Over-hydration from blind with()
|   |   |-- reporting-through-eloquent.md             # Hydrating full models for aggregate queries
|   |   |-- long-transactions-with-io.md              # API calls inside transactions
|   |   |-- foreign-key-without-index.md              # Full table scans on joins
|   |   |-- model-inside-migration.md                 # Using Eloquent models in migrations
|   |   |-- scope-bypass-in-production.md             # withoutGlobalScope in application code
|   |
|   |-- tradeoffs/
|       |-- read-optimization-vs-write.md
|       |-- consistency-vs-performance.md
|       |-- normalization-vs-denormalization.md
|       |-- orm-convenience-vs-query-control.md
|       |-- isolation-level-performance.md
|       |-- index-coverage-vs-bloat.md
|
|-- risks/
|   |-- data-leaks.md                                 # Multi-tenant, scope bypass, direct DB
|   |-- data-loss.md                                  # Destructive migrations, missing backups
|   |-- performance-degradation.md                    # Missing indexes, N+1, over-hydration
|   |-- schema-drift.md                               # Manual DB changes, environment inconsistencies
|   |-- connection-exhaustion.md                      # Max connections under load
|   |-- lock-escalation.md                            # Row locks escalate to table locks
|   |-- migration-failures.md                         # Partial migration, rollback complexity
|   |-- replication-lag.md                            # Stale reads, consistency violations
|   |-- shard-imbalance.md                            # Hot shards, uneven distribution
```

## Domain-to-Subdomain Mapping

| Top-Level Folder | Subdomain(s) | Rationale |
|---|---|---|
| `schema/` | 1 (Schema Design & Migration Engineering), 11 (Production Schema Operations), 15 (Data Integrity & Constraints) | Schema design, migrations, zero-downtime ops, and constraints are tightly coupled — all involve the CREATE/ALTER/DROP lifecycle |
| `queries/` | 2 (Eloquent ORM & Query Builder) | Laravel's query interface — Eloquent, query builder, relationships, raw SQL |
| `indexes/` | 3 (Indexing Strategy & Physical Design) | Pure index knowledge — type selection, composite design, maintenance |
| `optimization/` | 4 (Query Optimization & Profiling) | Systematic query improvement — EXPLAIN, profiling, measurement |
| `multi-tenancy/` | 5 (Multi-Tenancy Architecture) | Tenant isolation — standalone because of its broad impact across the entire codebase |
| `sharding/` | 6 (Database Sharding & Horizontal Scaling) | Horizontal scaling — separate from partitioning due to fundamentally different operational complexity |
| `replication/` | 7 (Replication & Read/Write Splitting) | Topology + routing — closely tied to connection management but deserves own directory for topology-specific content |
| `partitioning/` | 8 (Table Partitioning & Data Lifecycle) | In-database table splitting — creation, management, archiving |
| `transactions/` | 9 (Transaction Management & Concurrency) | ACID, isolation, locking — cross-cutting concern affecting all write operations |
| `connections/` | 10 (Connection Management & Pooling) | Connection lifecycle, pooling — close to replication but focused on application<->DB link |
| `advanced/postgresql/` | 12 (Advanced PostgreSQL Features) | PostgreSQL-specific — JSONB, full-text, CTEs, RLS, window functions, extensions |
| `advanced/mysql/` | 13 (Advanced MySQL/MariaDB Features) | MySQL-specific — InnoDB internals, online DDL, spatial |
| `advanced/enterprise/event-sourcing-cqrs/` | 14 (Event Sourcing & CQRS) | Enterprise pattern — separate due to high complexity and optionality |
| `advanced/enterprise/integrity-constraints/` | 15 (Data Integrity & Constraints) — advanced section | Deeper constraint patterns — partial unique, exclude, deferral |
| `patterns/` | Cross-cutting | Decision frameworks, anti-patterns, and tradeoff analyses that span multiple subdomains |
| `risks/` | Cross-cutting | Consolidated risk register — points to detailed risk docs in each subdomain directory |

## Future Growth Considerations

1. **Multi-engine compatibility**: As Laravel adopts more database drivers (e.g., native Snowflake, ClickHouse, or enhanced SQLite support), new top-level directories under `advanced/` can be added without restructuring. Each engine directory follows the same `reference/`, `patterns/`, `risks/` structure.

2. **New tooling**: When new migration tools, sharding packages, or connection pool managers emerge, they slot into the existing `tools/` directories under the relevant subdomain. The naming convention is `{tool-name}.md`.

3. **Orchestration layer**: As the corpus grows, a `workflows/` directory could be added at top level to define multi-step procedures that cross subdomains (e.g., "Scaling a Laravel app from 10k to 1M users" would reference content from optimization, replication, partitioning, and sharding).

4. **Version-pinning**: Each reference document could eventually include a `versions:` front-matter section noting which Laravel/MySQL/PostgreSQL versions the content applies to. This enables automated staleness checks when versions advance.

5. **Decision tree generation**: The `patterns/decision-frameworks/` directory is designed to be the input for an interactive decision-tree tool — each framework document contains the branching logic, criteria, and outcomes that could be encoded as a CLI wizard or web tool.

6. **Expansion boundaries**: If a subdomain grows beyond ~20 documents, consider splitting into subdirectories (e.g., `schema/migrations/` already subdivided; `advanced/postgresql/` could split into `jsonb/`, `fulltext/`, `rls/`, `extensions/`). The threshold for splitting is when any directory reaches 15+ files and navigation becomes difficult.

7. **Training progression**: The F/I/A/E/Ent classification from the domain analysis maps naturally to a learning path. A `curriculum/` directory could be added to define training sequences: Foundation (F documents first), then Intermediate (I), and so on — with assessments at each level.
