# Domain Overview

Data & Storage Systems in Laravel encompasses the complete lifecycle of persisting, querying, scaling, and evolving application data. It bridges Laravel's ORM layer (Eloquent, Query Builder) with underlying relational databases (MySQL, MariaDB, PostgreSQL, SQLite) and covers schema design, query optimization, indexing strategies, data distribution (multi-tenancy, sharding, replication), transaction management, connection pooling, and production schema migration patterns. This domain is foundational: every Laravel application above trivial complexity depends on sound data architecture. Poor decisions here cascade into performance degradation, data leaks, compliance failures, and operational toil. Mastery requires understanding both Laravel's abstractions and the database engines beneath them — including their query planners, lock managers, replication protocols, and storage engines.

The domain is best understood through three axes: **structure** (schema, migrations, types, constraints), **access** (query building, indexing, optimization, profiling), and **distribution** (multi-tenancy, sharding, replication, partitioning). These axes intersect: a migration that adds an index changes access patterns; a sharding decision constrains query capabilities; a replication topology determines migration strategies.

Key tension: Laravel's Eloquent ORM prioritizes developer convenience over query transparency. Expressive relationship methods, lazy loading, and implicit hydration conceal expensive database operations. Teams must learn to reason about the SQL generated, not just the PHP written. The database is not a storage detail — it is a constraint-satisfaction engine whose behavior must be understood independently of the ORM.

# Domain Scope

## What Belongs

- **Schema Design & Migration Engineering**: Table creation, column types, constraints (PK, FK, unique, check), defaults, squashing, isolation, zero-downtime patterns (expand-contract, shadow-table, instant DDL), migration orchestration across multi-tenant deployments
- **Query Building & ORM**: Eloquent models, relationships (all cardinalities), query builder, scopes, accessors/mutators, casts, serialization, lazy vs. eager loading, subqueries, unions, raw expressions
- **Database Indexing**: B-Tree, Hash, GiST, GIN, BRIN, SP-GiST indexes; composite, partial, functional/expression, covering, full-text, spatial indexes; index management via migrations; concurrent index creation; index analysis via EXPLAIN
- **Query Optimization & Profiling**: EXPLAIN/EXPLAIN ANALYZE plans, slow query log analysis, sargability, N+1 detection and elimination, eager loading strategy, query plan interpretation, covering index design, pagination strategies (offset, cursor, keyset), chunked processing (chunkById, cursor, lazy collections)
- **Multi-Tenancy**: Shared-table (row-level) with global scopes, schema-per-tenant, database-per-tenant; tenant resolution (domain, subdomain, header, token); connection switching; migration orchestration across tenants; cross-tenant analytics; tenant isolation testing; compliance boundaries
- **Database Sharding**: Horizontal partitioning across database instances; shard key selection; hash, range, directory-based sharding; ID generation (Snowflake, sequence); cross-shard query limitations; shard rebalancing; fan-out queries; Shardable model patterns; package support (allnetru/laravel-sharding)
- **Replication & Read/Write Splitting**: Master-replica topology; Laravel read/write connection configuration; sticky writes; read replica lag monitoring; load balancing across replicas (ProxySQL, HAProxy); connection pooling (PgBouncer); replica promotion and failover
- **Table Partitioning**: Range, list, hash partitioning; partition pruning; partition management (attach, detach); time-based partitioning patterns; partition pruning; integration with Laravel migrations (tpetry/laravel-postgresql-enhanced, orptech/laravel-migration-partition)
- **Transaction Management**: ACID properties, isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE, SNAPSHOT), lock types (row, table, advisory), deadlock detection and prevention, long transaction risks, transaction scoping in Laravel (DB::transaction, database.transactions)
- **Connection Management**: Connection pooling (PgBouncer, RDS Proxy), connection count limits, persistent vs. short-lived connections, Octane compatibility, connection tagging for observability, dynamic connection configuration
- **Production Schema Operations**: Zero-downtime migrations (gh-ost, pt-online-schema-change, pgroll, Spirit), expand-contract pattern, instant DDL (MySQL 8.0+, PostgreSQL 11+), migration locking (isolated option), data backfill strategies, rollback planning
- **Advanced PostgreSQL Features**: JSONB operations and GIN indexes, full-text search (tsvector, tsquery), Common Table Expressions (recursive and non-recursive), window functions, lateral joins, row-level security (RLS), partial/expression/functional indexes, extension management (pgvector, postgis, pg_cron), materialized views, concurrent refresh, PL/pgSQL, triggers and transition tables
- **Advanced MySQL/MariaDB Features**: InnoDB storage engine internals, buffer pool management, spatial indexes (R-Tree), online DDL (ALGORITHM=INPLACE/INSTANT), lock modes, full-text search (MATCH...AGAINST), generated columns, partitioning, group commit
- **Event Sourcing & CQRS**: Event store design, aggregate roots, projections, snapshots, event versioning, temporal queries, outbox pattern, async projection pipelines, replay capability, integration with Laravel queues/Horizon
- **Data Integrity & Constraints**: Foreign key enforcement, cascade rules, unique constraints, exclusion constraints (PostgreSQL), CHECK constraints, soft delete patterns, referential integrity at scale

## What Does Not Belong

- **Caching (Redis/Memcached)**: Separate domain covering cache drivers, TTL strategies, cache invalidation, Laravel cache API — excluded unless directly connected to database query caching (materialized views, query result caching as a DB concern)
- **Search Engines (Elasticsearch, Meilisearch, Algolia)**: Full-text search when offloaded to dedicated search services — excluded except for migration/coexistence patterns with database-backed search
- **File/Object Storage**: S3, local filesystem, CDN — separate storage concern
- **Queue Infrastructure**: Redis/DB-backed queues, Horizon configuration — excluded except where queue job isolation intersects with multi-tenancy or connection management
- **Data Warehousing & OLAP**: Separate analytics pipelines, ETL/ELT workflows, columnar stores (Redshift, ClickHouse, Snowflake) — excluded except for CQRS/read-model overlap
- **Infrastructure Provisioning**: Kubernetes, Terraform, CI/CD pipeline configuration for database servers — excluded except for migration deployment patterns
- **ORM Alternatives (Doctrine, Propel)**: Only Eloquent and Laravel Query Builder are in scope
- **NoSQL Databases (MongoDB, DynamoDB, Cassandra)**: Excluded unless part of a CQRS event store driver consideration
- **Backup & Recovery**: Excluded except where per-tenant backup strategy influences multi-tenancy architecture decisions
- **Database Monitoring/APM Integration**: Separate observability domain — excluded except for slow query logging and EXPLAIN-based analysis

# Major Subdomains

## 1. Schema Design & Migration Engineering
Designing database schemas and evolving them through version-controlled, repeatable migrations. Covers column typing, constraints, normalization, migration creation, ordering, dependencies, squashing, zero-downtime deployment, multi-tenant migrations, and schema versioning.

## 2. Eloquent ORM & Query Builder
Laravel's database abstraction layers: Eloquent models, relationships, query builder, scopes, casts, serialization, lazy vs. eager loading, subquery expressions, unions, raw expressions, hydration, model events.

## 3. Indexing Strategy & Physical Design
Index type selection (B-Tree, GIN, GiST, BRIN, Hash, SP-GiST, R-Tree, full-text, spatial), composite index column ordering (cardinality, equality-first, range-after), partial/functional/covering indexes, index maintenance, concurrent index creation, index alignment with query patterns.

## 4. Query Optimization & Profiling
Systematic improvement of query execution: EXPLAIN plan analysis, slow query log interpretation, sargability rules, N+1 detection, eager loading optimization, pagination strategy selection (offset vs. cursor vs. keyset), chunked processing patterns, query shape governance.

## 5. Multi-Tenancy Architecture
Tenant data isolation strategies (shared-table, schema-per-tenant, database-per-tenant), tenant resolution, connection switching, global scopes, migration orchestration across tenants, compliance boundaries, noisy-neighbor mitigation, tenant segmentation.

## 6. Database Sharding & Horizontal Scaling
Distribution of data across multiple database instances: shard key selection, hash/range/directory sharding, rebalancing, fan-out queries, ID generation (Snowflake, sequence), cross-shard query patterns, integration with Laravel's connection layer.

## 7. Replication & Read/Write Splitting
Master-replica topology configuration in Laravel, automatic query routing (read vs. write connections), sticky writes, replica lag monitoring, load balancing, failover, connection pooling, multi-region replication considerations.

## 8. Table Partitioning & Data Lifecycle
Native database partitioning (range, list, hash) for large tables: partition strategy selection, partition management, partition pruning, time-based partitioning patterns, data archiving, integration with Laravel migration workflows.

## 9. Transaction Management & Concurrency
ACID properties, isolation levels, locking behavior (row-level, table-level, advisory), deadlock prevention, lock wait timeouts, transaction scoping in Laravel, long transaction risks, optimistic vs. pessimistic locking.

## 10. Connection Management & Pooling
Database connection lifecycle: connection pooling (PgBouncer, RDS Proxy, ProxySQL), connection count limits, Octane/long-running-process compatibility, dynamic connection configuration, connection observability.

## 11. Production Schema Operations
Safe schema evolution under live traffic: zero-downtime migration tools (gh-ost, pt-online-schema-change, pgroll, Spirit), expand-contract patterns, data backfill strategies, migration locking, rollback planning, canary tenant migrations.

## 12. Advanced PostgreSQL Features
PostgreSQL-specific capabilities: JSONB/GIN indexing, full-text search (tsvector/tsquery), CTEs (recursive/non-recursive), window functions, lateral joins, row-level security (RLS), partial/expression indexes, extension management (pgvector, postgis, pg_cron), materialized views, PL/pgSQL, triggers with transition tables.

## 13. Advanced MySQL/MariaDB Features
MySQL-specific patterns: InnoDB internals, buffer pool tuning, online DDL modes, spatial indexes (R-Tree), full-text search (MATCH...AGAINST), generated columns, lock modes (none, shared, exclusive), instant DDL.

## 14. Event Sourcing & CQRS
Event store architecture, aggregate design, projection building, snapshot strategies, event versioning, temporal queries, outbox pattern, async projection pipelines, event replay, integration with Laravel queues and Horizon.

## 15. Data Integrity & Constraints
Database-level integrity enforcement: foreign key constraints and reference options, unique constraints (including partial unique), exclusion constraints (PostgreSQL), CHECK constraints, soft delete patterns, cascade behavior, deferred constraint validation.

# Complete Knowledge Inventory

## Subdomain 1: Schema Design & Migration Engineering
1.1 Laravel migration file structure (class, up/down, shouldRun)
1.2 Blueprint column types (all available types per driver)
1.3 Column modifiers (nullable, default, after, comment, charset, collation, autoIncrement, unsigned, virtual/stored generated)
1.4 Foreign key definition (constrained, onDelete, onUpdate, cascade/restrict/set null)
1.5 Index definition via migrations (index, unique, primary, fullText, spatial)
1.6 Migration ordering and naming conventions (YYYY_MM_DD_HHmmss)
1.7 Migration batch tracking and the migrations table
1.8 Migration squashing (schema:dump, database/schema directory)
1.9 Migration isolation (isolated option, cache lock)
1.10 Zero-downtime migration patterns (expand-contract, shadow-table)
1.11 gh-ost tool (binlog-based, trigger-free, pause/resume, test-on-replica)
1.12 pt-online-schema-change (trigger-based, FK support, Percona Toolkit)
1.13 Spirit tool (gh-ost successor for MySQL 8.0+)
1.14 pgroll tool (PostgreSQL, reversible expand-contract)
1.15 pg_repack (bloat/index reorganization without ACCESS EXCLUSIVE lock)
1.16 MySQL instant DDL (ALGORITHM=INSTANT, 64-version limit)
1.17 PostgreSQL lazy ADD COLUMN DEFAULT (PostgreSQL 11+)
1.18 Expand-contract pattern (add column, dual-write, backfill, dual-read, remove old)
1.19 Data backfill strategies (chunked, queued, low-priority, throttled)
1.20 Migration immutability (no editing deployed migrations)
1.21 Multi-tenant migration orchestration (per-tenant DB, sequential/parallel, queued)
1.22 Migration version ledger per tenant (schema_version tracking)
1.23 Model usage inside migrations anti-pattern (use DB::table or raw SQL instead)
1.24 Schema and data migration separation (data changes in separate files/jobs)
1.25 Rollback strategy per migration type (additive safe, destructive requires compatibility window)
1.26 MySQL ALGORITHM options (INPLACE, COPY, INSTANT) and LOCK options (NONE, SHARED, EXCLUSIVE, DEFAULT)
1.27 Online index creation in PostgreSQL/SQL Server (.online() modifier)
1.28 Migration testing in CI (same engine and version as production)
1.29 Foreign key constraint management in PlanetScale/Vitess environments
1.30 Schema comparison and drift detection

## Subdomain 2: Eloquent ORM & Query Builder
2.1 Model definition conventions (table name, primary key, timestamps, connection)
2.2 Relationship types (hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, hasOneThrough, morphMany, morphToMany, morphedByMany)
3.2 Eager loading (with, load, loadMissing, nested dot notation)
2.4 Lazy loading prevention (Model::preventLazyLoading)
2.5 Constrained eager loading (with + where constraints on relationship)
2.6 Relationship existence filtering (whereHas, whereDoesntHave, orWhereHas)
2.7 Relationship counting (withCount, withMin, withMax, withSum, withAvg, withExists)
2.8 Subquery selects (addSelect with subquery)
2.9 Subquery ordering (orderBy with subquery)
2.10 Query builder methods (select, where, join, groupBy, having, orderBy, limit, offset)
2.11 Where clause types (where, orWhere, whereIn, whereBetween, whereNull, whereDate, whereColumn, whereExists)
2.12 whereRaw and addBinding for raw expressions
2.13 Joins (inner, left, right, cross, joinSub)
2.14 Unions (union, unionAll)
2.15 Scopes (global scopes, local scopes, dynamic scopes)
2.16 Accessors and mutators (get{Attribute}Attribute, set{Attribute}Attribute)
2.17 Casts (native types, Enum, custom casts, JSON, encrypted)
2.18 Model serialization (toArray, toJson, hidden, visible, append)
2.19 Model events (retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashed, forceDeleted)
2.20 Hydration (hydrate, hydrateRaw)
2.21 upsert operation (upsert, upsert with unique keys)
2.22 insertOrIgnore
2.23 chunk/chunkById/lazy/lazyById cursor processing
2.24 replicate, fill, forceFill, forceCreate
2.25 touch, touchOwners
2.26 updateOrCreate, firstOrCreate, firstOrNew
2.27 API resource classes and data shaping
2.28 N+1 detection via Laravel Telescope, Debugbar, or manual logging
2.29 Query logging (DB::listen, enableQueryLog)
2.30 Strict mode (preventSilentlyDiscardingAttributes, preventAccessingMissingAttributes)

## Subdomain 3: Indexing Strategy & Physical Design
3.1 B-Tree index structure and when it applies (equality, range, sort)
3.2 Hash indexes (equality only, PostgreSQL)
3.3 GiST indexes (geometric, full-text, range types)
3.4 GIN indexes (JSONB, arrays, full-text tsvector, trigrams)
3.5 BRIN indexes (correlated physical ordering, large append-only tables)
3.6 SP-GiST indexes (quadtrees, k-d trees, radix trees)
3.7 R-Tree indexes (MySQL spatial data)
3.8 Composite/compound indexes: leftmost prefix rule, column ordering
3.9 Composite index best practices: equality columns first, range columns after
3.10 Covering indexes (index-only scans, avoid heap fetches)
3.11 Partial indexes (WHERE clause on index, PostgreSQL)
3.12 Functional/expression indexes (index by expression result, PostgreSQL/MySQL)
3.13 Full-text indexes (MySQL FULLTEXT, PostgreSQL GIN tsvector)
3.14 Spatial indexes (MySQL R-Tree, PostgreSQL GiST)
3.15 Descending indexes (order by DESC aligned with index order)
3.16 INCLUDE columns (PostgreSQL, non-key columns in unique index)
3.17 Nulls NOT DISTINCT (PostgreSQL 15+ unique indexes allowing nulls)
3.18 Composite index selectivity and cardinality analysis
3.19 Index maintenance (bloat, fillfactor, rebuilding, VACUUM)
3.20 Concurrent index creation (PostgreSQL CONCURRENTLY, MySQL INPLACE)
3.21 Index management in Laravel migrations (index, unique, fullText, spatial, raw DB::statement)
3.22 Index size estimation and monitoring
3.23 Over-indexing risks (write amplification, storage cost)
3.24 Indexing foreign key columns (automatic via constrained)
3.25 Index usage statistics (pg_stat_user_indexes, MySQL schema).index_statistics, performance_schema)
3.26 Index alignment with WHERE + JOIN + ORDER BY patterns
3.27 Soft delete column indexing impact (deleted_at as filter)
3.28 Sargability rule: functions on indexed columns break index usage
3.29 Implicit type conversion and index bypass
3.30 RLS-compatible partial indexes (index WHERE matches policy USING)

## Subdomain 4: Query Optimization & Profiling
4.1 EXPLAIN output interpretation (type, possible_keys, key, rows, Extra, filtered)
4.2 EXPLAIN ANALYZE (actual time, loops, actual rows)
4.3 Type column values: system, const, eq_ref, ref, range, index, ALL
4.4 Extra column flags: Using index (covering), Using filesort, Using temporary, Using where, Using index condition
4.5 MySQL Slow Query Log configuration and analysis (mysqldumpslow, pt-query-digest)
4.6 PostgreSQL slow query configuration (log_min_duration_statement, auto_explain)
4.7 Sargable vs. non-sargable query patterns
4.8 whereDate/whereMonth/whereYear/whereDay/whereTime sargability breakage
4.9 LIKE with leading wildcard sargability breakage
4.10 function wraps in WHERE clause (LOWER, CAST: index bypass)
4.11 orWhere on composite index without grouping
4.12 Type mismatch implicit casts (string vs integer comparison)
4.13 N+1 detection and elimination strategies
4.14 Eager loading depth governance (max nesting, selective loading)
4.15 SQL-side aggregation (withCount, raw aggregates) vs. collection-side
4.16 Offset pagination deep-page problems (scanning discarded rows)
4.17 Cursor pagination (whereValueOrderBy, seek method)
4.18 Keyset pagination (efficient for large datasets, stable sort required)
4.19 chunk vs chunkById vs cursor vs lazy vs lazyById tradeoffs
4.20 Memory optimization for large result sets
4.21 Query shape discipline: list views vs. detail views
4.22 Eloquent anti-patterns: nested whereHas chains, broad orWhereHas, sorting by related columns, polymorphic filters on large tables, repeated aggregate subqueries
4.23 When to drop to query builder or raw SQL (reporting, complex aggregation)
4.24 Join optimization (join type selection, join order, index requirements for joins)
4.25 Subquery optimization (lateral joins in PostgreSQL, derived table optimization)
4.26 Correlation between row count and query response time
4.27 Profiling tools (Laravel Telescope, Debugbar, Clockwork, APM integrations)
4.28 Endpoint-level query governance (max queries per request, max query time)
4.29 Query caching strategies (remember, tagged cache, materialized views)
4.30 Production optimization workflow: profile -> identify -> measure -> fix -> verify -> monitor

## Subdomain 5: Multi-Tenancy Architecture
5.1 Shared-table (single DB, tenant_id column with global scope)
5.2 Schema-per-tenant (single DB, separate schemas/prefixes per tenant)
5.3 Database-per-tenant (separate DB per tenant)
5.4 Tenant resolution strategies (domain, subdomain, header, token, authenticated user)
5.5 Eloquent global scopes for tenant isolation (bootTraits, addGlobalScope)
5.6 Tenant-aware middleware (IdentifyTenant, SetTenantConnection)
5.7 Tenant-aware queue jobs (tenant_id in payload, re-bind context in handle)
5.8 Tenant-aware commands (--tenant option, batch processing)
5.9 Migration orchestration across tenants (single DB, per-schema, per-DB)
5.10 Tenant provisioning and lifecycle (create, migrate, seed, deactivate, archive, delete)
5.11 Cross-tenant data leak prevention (testing, code review, bypass gating)
5.12 withoutGlobalScope guardrails (permitted uses, review requirements)
5.13 Tenant connection caching and pooling
5.14 PostgreSQL Row-Level Security as defense-in-depth (RLS policies, app.current_tenant)
5.15 Noisy neighbor detection and mitigation (tenant-level rate limiting, resource quotas)
5.16 Per-tenant scaling (whale tenants on dedicated resources)
5.17 Tenant segmentation (grouped tiers, graduated isolation)
5.18 Cross-tenant analytics (federated queries, warehouse, CDC pipeline)
5.19 Schema version ledger per tenant
5.20 Tenant-aware file storage isolation
5.21 Billing alignment with isolation model (DB-per-tenant for spend correlation)
5.22 Compliance-driven isolation (GDPR, HIPAA, SOC 2)
5.23 Multi-region tenant placement (data residency requirements)
5.24 Packages: stancl/tenancy, spatie/laravel-multitenancy
5.25 Tenant bootstrapper pattern (central vs. tenant connections)
5.26 Event sourcing in multi-tenant contexts (per-tenant event streams)
5.27 Per-tenant database backups and restore
5.28 Deployment stamp pattern (full infrastructure per tenant group)
5.29 Tenant migration priority and canary rollout
5.30 Tenant-aware caching (cache prefix isolation)

## Subdomain 6: Database Sharding & Horizontal Scaling
6.1 Shard key selection principles (high cardinality, even distribution, query alignment)
6.2 Hash-based sharding (consistent hashing, modulo ring, virtual buckets)
6.3 Range-based sharding (key ranges, predictable splits)
6.4 Directory-based sharding (lookup table, flexible but extra hop)
6.5 Shard mapping and routing (service-side routing, proxy-level routing)
6.6 Shard-aware ID generation (Snowflake, database sequences, UUID v7)
6.7 Fan-out queries (broadcast to all shards, aggregate results)
6.8 Cross-shard join limitations (alternative: denormalization, application-level joins)
6.9 Cross-shard transaction impossibility (distributed transaction complexity)
6.10 Shard rebalancing: data movement, downtime vs. online migration
6.11 Shard splitting (hot shard detected, split into smaller shards)
6.12 Adding new shards (rehashing, double-writing during transition)
6.13 Shard groups (co-located tables that share shard key for joins)
6.14 Shard-aware model traits (getConnectionName, Shardable)
6.15 Packages: allnetru/laravel-sharding (hash, range, db_range, redis strategies; Snowflake/sequence ID; coroutine fan-out)
6.16 Swoole/Octane coroutine-aware shard dispatching
6.17 Read replica per shard (shard-level read scaling)
6.18 Shard-level backups, monitoring, and observability
6.19 Shard proxy considerations (ProxySQL, Vitess)
6.20 Modulus vs. consistent hashing for rebalancing efficiency
6.21 Time-based sharding (partition by time period, natural data lifecycle)
6.22 Shard vs. partition distinction (shard = separate server, partition = within same server)
6.23 Pre-sharding vs. progressive sharding strategy
6.24 Hot shard mitigation (split, move tenants, rebalance)
6.25 Global tables (reference data replicated to all shards)

## Subdomain 7: Replication & Read/Write Splitting
7.1 Master-replica topology fundamentals (async replication, WAL shipping)
7.2 Laravel read/write connection configuration (read array, write array, sticky)
7.3 Automatic query routing (SELECT -> read, INSERT/UPDATE/DELETE -> write)
7.4 Sticky writes (reads from primary if write happened in same request)
7.5 Replica lag causes (long-running writes, overloaded replicas, network latency)
7.6 Replica lag monitoring and alerting (seconds_behind_master, pg_stat_replication)
7.7 Lag-aware read splitting (bypass replica if lag exceeds threshold)
7.8 Connection pooling for replicas (PgBouncer per replica, connection distribution)
7.9 Load balancing across multiple replicas (round-robin, least connections, ProxySQL)
7.10 Multi-region replication (active-passive, active-active complexity)
7.11 Replica promotion and failover procedures
7.12 Cascading replication (replica of replica, reduced primary load)
7.13 Synchronous replication (PostgreSQL synchronous_commit, MySQL semi-sync)
7.14 Connection pooling in Laravel Octane (persistent connections, transaction handling)
7.15 Read replica for specific workloads (reporting, analytics, exports) off primary
7.16 Read replica sizing and independent scaling
7.17 ProxySQL for query routing, caching, and connection pooling
7.18 PgBouncer modes (session, transaction, statement pooling)
7.19 RDS Proxy and Aurora Auto Scaling
7.20 Migration compatibility with replication (locking impact on replicas)
7.21 Monitoring read replica health (connection count, query latency, lag)

## Subdomain 8: Table Partitioning & Data Lifecycle
8.1 Range partitioning (by date, numeric ranges)
8.2 List partitioning (by discrete values, categories, regions)
8.3 Hash partitioning (by modulo, even distribution)
8.4 Composite partitioning (sub-partitioning combinations)
8.5 Partition pruning (query optimizer eliminates irrelevant partitions)
8.6 Partition management: create, attach, detach, drop partitions
8.7 Time-based partitioning patterns (daily, weekly, monthly, quarterly)
8.8 Partition index design (local vs. global indexes)
8.9 Partitioning in Laravel migrations (tpetry, orptech packages)
8.10 MySQL partition limitations (partition key must be part of all unique keys)
8.11 PostgreSQL partitioning features (partition pruning, declarative partitioning)
8.12 Hash partition incremental scaling (modulus factor approach)
8.13 Default partition considerations (scan overhead, routing fallback)
8.14 Partition-level backup and restore
8.15 Partition switching for fast data archiving (exchanging partitions)
8.16 Data retention policies enforced via partitioning
8.17 Partition-aware RLS (policy propagation to partitions)
8.18 Partitioning vs. sharding decision framework

## Subdomain 9: Transaction Management & Concurrency
9.1 ACID properties (Atomicity, Consistency, Isolation, Durability)
9.2 Isolation levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE
9.3 PostgreSQL isolation specifics (MVCC, SNAPSHOT isolation, SSI for SERIALIZABLE)
9.4 MySQL InnoDB isolation specifics (MVCC, gap locks, next-key locks)
9.5 Row-level locks (SELECT...FOR UPDATE, FOR SHARE, SKIP LOCKED, NOWAIT)
9.6 Table-level locks (LOCK TABLES in MySQL, advisory locks in PostgreSQL)
9.7 Advisory locks (pg_advisory_lock, MySQL GET_LOCK)
9.8 Deadlock detection and resolution (deadlock victim rollback)
9.9 Deadlock prevention patterns (consistent lock order, indexed WHERE, shorter transactions)
9.10 Lock wait timeout configuration (innodb_lock_wait_timeout, lock_timeout)
9.11 Transaction scoping in Laravel (DB::transaction, database.transactions config)
9.12 Nested transactions and savepoints
9.13 Transaction length management (move API calls, file I/O outside)
9.14 Optimistic locking (version column, check on update)
9.15 Pessimistic locking (sharedLock, lockForUpdate)
9.16 Phantom reads vs. non-repeatable reads per isolation level
9.17 SERIALIZABLE snapshot isolation (SSI) in PostgreSQL
9.18 Write skew and its prevention
9.19 Long-running transaction risks (bloat, replication lag, connection pool exhaustion)
9.20 Transaction retry logic (especially for SERIALIZABLE failures)
9.21 Implicit transactions in Laravel (model events, observers within transactions)

## Subdomain 10: Connection Management & Pooling
10.1 Database connection lifecycle in Laravel (configuration, instantiation, query execution)
10.2 Connection pool architecture (PgBouncer, ProxySQL, RDS Proxy)
10.3 PgBouncer pooling modes: session, transaction, statement
10.4 Laravel Octane connection management (prevent connection pooling conflicts)
10.5 Dynamic connection configuration (runtime, per-tenant, per-shard)
10.6 Connection purging and reconnection (DB::purge, DB::reconnect)
10.7 Connection count management (max connections per server, pool size tuning)
10.8 Connection tags for observability (tenant_id, shard_id in connection metadata)
10.9 Read/write connection separation (separate pools for read vs. write workloads)
10.10 Transaction pooling limitations (PREPARE/DEALLOCATE, SET session commands)
10.11 Connection string management for replicas and shards
10.12 PHP-FPM vs. Octane vs. Swoole connection lifecycle differences
10.13 Connection encryption (TLS/SSL for multi-region connections)
10.14 Connection health checks and automatic recovery
10.15 ProxySQL query rules (read/write split, caching, rewrite)
10.16 Failover connection behavior

## Subdomain 11: Production Schema Operations
11.1 Zero-downtime migration taxonomy (shadow-table, expand-contract, instant DDL)
11.2 gh-ost: binlog consumption, trigger-free, pause, throttle, test-on-replica, cut-over locking
11.3 pt-online-schema-change: trigger-based, FK support, chunk-size, replication throttling
11.4 Spirit: modern gh-ost successor, MySQL 8.0+
11.5 pgroll: PostgreSQL-specific, view-based expand-contract, reversible
11.6 Expand-contract detailed: add column (nullable), dual-write (code deploy), backfill, dual-read, drop old column
11.7 Add column with DEFAULT in PostgreSQL 11+ (metadata-only, no rewrite)
11.8 MySQL ALGORITHM=INSTANT (8.0.12+), ALGORITHM=INPLACE, ALGORITHM=COPY
11.9 Data backfill best practices: chunked, queued, throttled, with retry, idempotent
11.10 Verification during migrations (Scientist-style comparison, checksums)
11.11 Rollback planning: keep old structures 24-48h, test rollback before proceeding
11.12 Migration locking in Laravel (isolated option, atomic cache lock)
11.13 Destructive operations: separate deploy, compatibility window, never in same deploy as code removal
11.14 Schema version tracking (per-tenant, per-region)
11.15 Migration canary patterns (run on subset of tenants, verify, then roll out)
11.16 Testing migrations in CI (with production-like schema and data volume)
11.17 Migration order dependencies (no circular dependencies between migrations)
11.18 Last-mile migration validation (verify row counts, hashes, query plans)

## Subdomain 12: Advanced PostgreSQL Features
12.1 JSONB column type and binary storage format
12.2 GIN indexes on JSONB (containment, key existence, path operators)
12.3 JSONB operators (@>, ?, ?|, ?&, ->, ->>, #>, #>>)
12.4 B-Tree index on specific JSONB path (expression index)
12.5 jsonb_path_ops GIN index optimization
12.6 Full-text search: tsvector, tsquery, to_tsvector, to_tsquery, plainto_tsquery, phraseto_tsquery
12.7 Full-text ranking: ts_rank, ts_rank_cd
12.8 Full-text highlighting: ts_headline
12.9 Full-text configuration per language (english, simple, unaccent)
12.10 Trigger-maintained tsvector columns (BEFORE INSERT OR UPDATE)
12.11 GIN index on tsvector for full-text search
12.12 Common Table Expressions (CTEs): WITH, non-recursive and recursive
12.13 Recursive CTEs: union all, working table iteration, cycle detection
12.14 CTE materialization control (MATERIALIZED, NOT MATERIALIZED)
12.15 SEARCH (depth-first, breadth-first) and CYCLE clauses
12.16 Window functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD, FIRST_VALUE, LAST_VALUE
12.17 Window frames: ROWS, RANGE, GROUPS, framing boundaries
12.18 Lateral joins (LATERAL, cross-reference subqueries per row)
12.19 Row-Level Security: CREATE POLICY, USING, WITH CHECK, PERMISSIVE/RESTRICTIVE
12.20 RLS: ENABLE/FORCE ROW LEVEL SECURITY, policy propagation to partitions
12.21 RLS-compatible index design (partial indexes matching policy USING)
12.22 Partial indexes (CREATE INDEX ... WHERE)
12.23 Expression/functional indexes (index result of expression)
12.24 Index INCLUDE columns (non-key payload in unique index)
12.25 NULLS NOT DISTINCT for unique indexes (PostgreSQL 15+)
12.26 Extension management: pgvector, postgis, pg_cron, pg_trgm, unaccent, uuid-ossp
12.27 Materialized views (REFRESH MATERIALIZED VIEW CONCURRENTLY)
12.28 PL/pgSQL functions and procedures
12.29 Statement-level triggers with transition tables (REFERENCING NEW TABLE, OLD TABLE)
12.30 Temporal indexes (tpetry/laravel-postgresql-enhanced temporal types)
12.31 Domain types
12.32 Range types (int4range, daterange, tsrange, tstzrange)
12.33 Array columns and GIN indexing
12.34 Hstore key-value store
12.35 Bit string types
12.36 Case-insensitive text (citext)
12.37 Network address types (inet, cidr)
12.38 XML and JSON operations
12.39 Generated columns (stored, virtual)
12.40 pgvector extension (vector embeddings, HNSW indexes, cosine similarity)

## Subdomain 13: Advanced MySQL/MariaDB Features
13.1 InnoDB storage engine: clustered indexes, buffer pool, change buffer, doublewrite buffer, adaptive hash index
13.2 InnoDB transaction model: MVCC, undo logs, redo logs, purge threads
13.3 InnoDB lock types: record locks, gap locks, next-key locks, insert intention locks, AUTO-INC locks
13.4 Buffer pool sizing and management (innodb_buffer_pool_size, multiple instances)
13.5 Online DDL: ALGORITHM options, LOCK options, concurrent DML during DDL
13.6 ALGORITHM=INSTANT: operations supported, 64-version limit
13.7 ALGORITHM=INPLACE: rebuilds table, allows concurrent DML
13.8 ALGORITHM=COPY: full table copy, blocks DML
13.9 LOCK modes: NONE, SHARED, EXCLUSIVE, DEFAULT
13.10 Instant column addition (MySQL 8.0.29+, append only)
13.11 Spatial data types (POINT, LINESTRING, POLYGON, GEOMETRY)
13.12 Spatial indexes (R-Tree) and functions (MBRContains, ST_Distance_Sphere)
13.13 Full-text search: MATCH...AGAINST, FULLTEXT indexes, query expansion, boolean mode
13.14 Generated columns (VIRTUAL, STORED, functional index replacement)
13.15 Generated column indexing (index on JSON column path via generated column)
13.16 MySQL partitioning: RANGE, LIST, HASH, KEY; subpartitioning; partition pruning
13.17 Partition limitations: all unique keys must include partition key
13.18 Implicit type casting rules and sargability impact
13.19 Character sets and collations: utf8mb4, utf8mb4_unicode_ci, utf8mb4_bin
13.20 Group commit for write-heavy workloads
13.21 Adaptive hash index tradeoffs
17.22 Performance schema (performance_schema, sys schema) for query analysis
17.23 MySQL 8.0+ descending indexes
17.24 Invisible indexes (for testing removal impact without dropping)
17.25 Skip Scan (MySQL 8.0.13+, index scan for non-leading columns)
17.26 MRR (Multi-Range Read) optimization
17.27 Index condition pushdown (ICP)

## Subdomain 14: Event Sourcing & CQRS
14.1 Event store design (append-only log, partition by aggregate ID)
14.2 Aggregate root pattern (consistency boundary, command handling, event application)
14.3 Domain events (immutable, named past tense, versioned schema)
14.4 Command bus pattern (dispatch, validation, authorization, handler)
14.5 Query bus pattern (separate read models, optimized for query patterns)
14.6 Projection building (event handlers that update read models)
14.7 Snapshot strategies: simple (n events), adaptive (by change rate), time-based
14.8 Event versioning and schema evolution (upcasting, migration)
14.9 Temporal queries ("state at point in time", time travel)
14.10 Event replay (rebuild projections from stored events)
14.11 Async projections (queue-based, eventual consistency)
14.12 Outbox pattern (transactional outbox + message relay, prevent dual-write failures)
14.13 Dead letter handling (failed projection events, retry, alert)
14.14 Integration with Laravel Horizon (workers per event type, priority queues)
14.15 Event store storage drivers (PostgreSQL, MySQL, MongoDB)
14.16 Packages: spatie/laravel-event-sourcing, syeedalireza/laravel-eventsource, theaddresstech/laravel-modular-ddd
14.17 Snapshot store design (separate table, aggregate_id + version + state)
14.18 Projection idempotency (handle event at-least-once, upsert pattern)
14.19 CQRS read model materialization (denormalized tables, optimized indexes)
14.20 CQRS write model normalization (domain purity, validation, invariants)
14.21 Hybrid CQRS (selective: event sourcing only for audit-critical domains)
14.22 Event store indexes (aggregate_id + version unique, event_type, timestamp)
14.23 Aggregate stream optimization (partition per aggregate, sequential reads)

## Subdomain 15: Data Integrity & Constraints
15.1 Foreign key constraints (REFERENCES, ON DELETE CASCADE/RESTRICT/SET NULL/SET DEFAULT/NO ACTION)
15.2 Foreign key index requirements (indexing FK columns)
15.3 UNIQUE constraints (single column, composite, NULL behavior per DB)
15.4 Partial unique indexes (PostgreSQL: UNIQUE WHERE condition)
15.5 NULLS NOT DISTINCT (PostgreSQL 15+: unique index treats NULLs as equal)
15.6 CHECK constraints (column-level, table-level, naming conventions)
15.7 PostgreSQL EXCLUDE constraints (range overlap, geometric containment)
15.8 NOT NULL constraints (column-level, addition in production requires caution)
15.9 DEFAULT values (static, expressions, PostgreSQL DEFAULT ... GENERATED)
15.10 Soft delete pattern (deleted_at nullable, SoftDeletes trait, query scoping)
15.11 Soft delete with unique constraints (partial unique index WHERE deleted_at IS NULL)
15.12 Foreign key cascade implications (accidental mass deletes, lock escalation)
15.13 Constraint deferral (PostgreSQL DEFERRABLE INITIALLY DEFERRED)
15.14 Referential integrity at scale (cost of FK checks in high-throughput tables)
15.15 Orphaned data detection and cleanup
15.16 Application-level vs. database-level enforcement tradeoffs
15.17 CONSTRAINT naming conventions for migration reversibility
15.18 Disabling constraints for bulk operations (PostgreSQL session_replication_role)

# Knowledge Classification

Classification Key:
- **F** = Foundational (must-know for any level)
- **I** = Intermediate (requires foundational knowledge first)
- **A** = Advanced (production-scale, non-trivial)
- **E** = Expert (deep mastery, edge cases, internals)
- **Ent** = Enterprise (large-scale, multi-team, multi-service)

## Subdomain 1: Schema Design & Migration Engineering
1.1 F | 1.2 F | 1.3 F | 1.4 F | 1.5 F | 1.6 F | 1.7 F | 1.8 I | 1.9 I
1.10 E | 1.11 E | 1.12 A | 1.13 A | 1.14 E | 1.15 A | 1.16 A | 1.17 A | 1.18 A
1.19 A | 1.20 F | 1.21 E | 1.22 E | 1.23 I | 1.24 A | 1.25 A | 1.26 A | 1.27 A
1.28 I | 1.29 A | 1.30 E

## Subdomain 2: Eloquent ORM & Query Builder
2.1 F | 2.2 F | 2.3 F | 2.4 I | 2.5 I | 2.6 I | 2.7 I | 2.8 A | 2.9 A | 2.10 F
2.11 F | 2.12 A | 2.13 I | 2.14 I | 2.15 I | 2.16 F | 2.17 I | 2.18 F | 2.19 F | 2.20 I
2.21 A | 2.22 I | 2.23 A | 2.24 I | 2.25 A | 2.26 F | 2.27 I | 2.28 F | 2.29 F | 2.30 I

## Subdomain 3: Indexing Strategy & Physical Design
3.1 F | 3.2 A | 3.3 A | 3.4 A | 3.5 A | 3.6 E | 3.7 I | 3.8 F | 3.9 I | 3.10 A
3.11 A | 3.12 A | 3.13 I | 3.14 I | 3.15 A | 3.16 A | 3.17 A | 3.18 A | 3.19 A | 3.20 A
3.21 F | 3.22 A | 3.23 I | 3.24 F | 3.25 A | 3.26 I | 3.27 I | 3.28 F | 3.29 I | 3.30 E

## Subdomain 4: Query Optimization & Profiling
4.1 F | 4.2 I | 4.3 F | 4.4 I | 4.5 I | 4.6 I | 4.7 I | 4.8 I | 4.9 I | 4.10 A
4.11 I | 4.12 I | 4.13 F | 4.14 I | 4.15 I | 4.16 I | 4.17 A | 4.18 A | 4.19 A | 4.20 A
4.21 I | 4.22 A | 4.23 I | 4.24 I | 4.25 A | 4.26 I | 4.27 I | 4.28 A | 4.29 I | 4.30 A

## Subdomain 5: Multi-Tenancy Architecture
5.1 I | 5.2 A | 5.3 A | 5.4 I | 5.5 I | 5.6 I | 5.7 A | 5.8 A | 5.9 E | 5.10 A
5.11 A | 5.12 I | 5.13 E | 5.14 E | 5.15 E | 5.16 E | 5.17 E | 5.18 E | 5.19 E | 5.20 A
5.21 E | 5.22 E | 5.23 E | 5.24 A | 5.25 A | 5.26 E | 5.27 E | 5.28 E | 5.29 E | 5.30 A

## Subdomain 6: Database Sharding & Horizontal Scaling
6.1 A | 6.2 A | 6.3 A | 6.4 A | 6.5 A | 6.6 A | 6.7 A | 6.8 A | 6.9 E | 6.10 E
6.11 E | 6.12 E | 6.13 A | 6.14 A | 6.15 A | 6.16 E | 6.17 E | 6.18 E | 6.19 E | 6.20 E
6.21 A | 6.22 I | 6.23 E | 6.24 E | 6.25 A

## Subdomain 7: Replication & Read/Write Splitting
7.1 I | 7.2 I | 7.3 I | 7.4 I | 7.5 I | 7.6 A | 7.7 E | 7.8 A | 7.9 A | 7.10 E
7.11 A | 7.12 A | 7.13 A | 7.14 A | 7.15 I | 7.16 A | 7.17 A | 7.18 A | 7.19 I | 7.20 A
7.21 I

## Subdomain 8: Table Partitioning & Data Lifecycle
8.1 A | 8.2 A | 8.3 A | 8.4 A | 8.5 A | 8.6 A | 8.7 I | 8.8 A | 8.9 A | 8.10 A
8.11 A | 8.12 E | 8.13 A | 8.14 E | 8.15 A | 8.16 I | 8.17 E | 8.18 A

## Subdomain 9: Transaction Management & Concurrency
9.1 F | 9.2 I | 9.3 A | 9.4 A | 9.5 A | 9.6 I | 9.7 A | 9.8 A | 9.9 A | 9.10 A
9.11 F | 9.12 I | 9.13 I | 9.14 I | 9.15 A | 9.16 I | 9.17 E | 9.18 E | 9.19 I | 9.20 A
9.21 I

## Subdomain 10: Connection Management & Pooling
10.1 F | 10.2 I | 10.3 A | 10.4 A | 10.5 A | 10.6 A | 10.7 I | 10.8 A | 10.9 A | 10.10 E
10.11 A | 10.12 A | 10.13 I | 10.14 A | 10.15 A | 10.16 A

## Subdomain 11: Production Schema Operations
11.1 E | 11.2 E | 11.3 E | 11.4 A | 11.5 E | 11.6 A | 11.7 A | 11.8 A | 11.9 A | 11.10 E
11.11 A | 11.12 I | 11.13 A | 11.14 E | 11.15 E | 11.16 A | 11.17 I | 11.18 E

## Subdomain 12: Advanced PostgreSQL Features
12.1 A | 12.2 A | 12.3 A | 12.4 A | 12.5 A | 12.6 A | 12.7 A | 12.8 A | 12.9 A | 12.10 A
12.11 A | 12.12 A | 12.13 A | 12.14 A | 12.15 E | 12.16 A | 12.17 A | 12.18 E | 12.19 E | 12.20 E
12.21 E | 12.22 A | 12.23 A | 12.24 A | 12.25 A | 12.26 A | 12.27 A | 12.28 A | 12.29 E | 12.30 E
12.31 A | 12.32 A | 12.33 A | 12.34 A | 12.35 A | 12.36 A | 12.37 A | 12.38 A | 12.39 A | 12.40 E

## Subdomain 13: Advanced MySQL/MariaDB Features
13.1 A | 13.2 A | 13.3 E | 13.4 A | 13.5 A | 13.6 A | 13.7 A | 13.8 A | 13.9 A | 13.10 A
13.11 I | 13.12 A | 13.13 A | 13.14 I | 13.15 A | 13.16 A | 13.17 A | 13.18 I | 13.19 F | 13.20 A
13.21 A | 13.22 A | 13.23 A | 13.24 A | 13.25 E | 13.26 A | 13.27 A

## Subdomain 14: Event Sourcing & CQRS
14.1 E | 14.2 E | 14.3 A | 14.4 A | 14.5 A | 14.6 A | 14.7 E | 14.8 E | 14.9 E | 14.10 E
14.11 E | 14.12 E | 14.13 E | 14.14 A | 14.15 A | 14.16 A | 14.17 A | 14.18 E | 14.19 A | 14.20 E
14.21 A | 14.22 A | 14.23 E

## Subdomain 15: Data Integrity & Constraints
15.1 F | 15.2 F | 15.3 F | 15.4 A | 15.5 A | 15.6 I | 15.7 E | 15.8 F | 15.9 F | 15.10 I
15.11 I | 15.12 A | 15.13 E | 15.14 A | 15.15 I | 15.16 I | 15.17 I | 15.18 A

# Dependency Map

```
Subdomain Dependencies (X -> Y means X depends on Y):

Schema Design & Migration Engineering (1) -> Eloquent ORM & Query Builder (2) [weak]
1 depends on 2 for understanding what schemas support; weak because migrations precede models

Eloquent ORM & Query Builder (2) -> Schema Design & Migration Engineering (1)
2 depends on 1 for table structure, column types, constraints

Indexing Strategy & Physical Design (3) -> Schema Design & Migration Engineering (1)
3 depends on 1 because indexes are part of schema

Query Optimization & Profiling (4) -> Eloquent ORM & Query Builder (2)
4 depends on 2 because optimized queries run through Eloquent/Query Builder

Query Optimization & Profiling (4) -> Indexing Strategy & Physical Design (3)
4 depends on 3 because execution plans depend on indexes

Multi-Tenancy Architecture (5) -> Schema Design & Migration Engineering (1)
5 depends on 1 (tenant_id columns, per-tenant schemas, per-tenant databases)

Multi-Tenancy Architecture (5) -> Eloquent ORM & Query Builder (2)
5 depends on 2 (global scopes, connection switching)

Multi-Tenancy Architecture (5) -> Transaction Management & Concurrency (9)
5 depends on 9 (transactional tenant provisioning)

Multi-Tenancy Architecture (5) -> Connection Management & Pooling (10)
5 depends on 10 (per-tenant connection pools, dynamic connection config)

Database Sharding & Horizontal Scaling (6) -> Indexing Strategy & Physical Design (3)
6 depends on 3 (shard key indexing, per-shard indexes)

Database Sharding & Horizontal Scaling (6) -> Multi-Tenancy Architecture (5)
6 depends on 5 (shard per tenant group, shard key = tenant_id)

Database Sharding & Horizontal Scaling (6) -> Connection Management & Pooling (10)
6 depends on 10 (per-shard connections, fan-out dispatching)

Replication & Read/Write Splitting (7) -> Connection Management & Pooling (10)
7 depends on 10 (read/write connection pools, sticky writes)

Replication & Read/Write Splitting (7) -> Transaction Management & Concurrency (9)
7 depends on 9 (replica lag consistency, async replication side effects)

Table Partitioning & Data Lifecycle (8) -> Schema Design & Migration Engineering (1)
8 depends on 1 (partition creation in migrations, DDL)

Table Partitioning & Data Lifecycle (8) -> Indexing Strategy & Physical Design (3)
8 depends on 3 (local vs. global indexes, partition-level index design)

Transaction Management & Concurrency (9) -> Schema Design & Migration Engineering (1)
9 depends on 1 (isolation level impact on schema operations, lock behavior of DDL)

Connection Management & Pooling (10) -> Replication & Read/Write Splitting (7)
10 implements routing used by 7

Production Schema Operations (11) -> Schema Design & Migration Engineering (1)
11 depends on 1 (all production ops are schema changes at core)

Production Schema Operations (11) -> Replication & Read/Write Splitting (7)
11 depends on 7 (DDL locking impact on replicas, replication-aware throttling)

Production Schema Operations (11) -> Transaction Management & Concurrency (9)
11 depends on 9 (lock management during migration cut-over)

Advanced PostgreSQL Features (12) -> Indexing Strategy & Physical Design (3)
12 depends on 3 (GIN, GiST, BRIN, partial, expression indexes)

Advanced PostgreSQL Features (12) -> Query Optimization & Profiling (4)
12 depends on 4 (tsvector ranking, window functions in optimized queries)

Advanced PostgreSQL Features (12) -> Eloquent ORM & Query Builder (2)
12 depends on 2 (raw expressions for PostgreSQL-specific features)

Advanced MySQL/MariaDB Features (13) -> Indexing Strategy & Physical Design (3)
13 depends on 3 (InnoDB-specific index behavior, spatial indexes)

Advanced MySQL/MariaDB Features (13) -> Query Optimization & Profiling (4)
13 depends on 4 (InnoDB execution plans, buffer pool-aware optimization)

Event Sourcing & CQRS (14) -> Schema Design & Migration Engineering (1)
14 depends on 1 (event store schema, read model tables)

Event Sourcing & CQRS (14) -> Transaction Management & Concurrency (9)
14 depends on 9 (outbox pattern consistency, atomic event storage)

Event Sourcing & CQRS (14) -> Connection Management & Pooling (10)
14 depends on 10 (event store connections, projection database connections)

Data Integrity & Constraints (15) -> Schema Design & Migration Engineering (1)
15 depends on 1 (FK, unique, check constraints in schema)

Data Integrity & Constraints (15) -> Eloquent ORM & Query Builder (2)
15 depends on 2 (cascade behavior in relationships)

```

**Cross-Cutting Concerns:**
- **Observability** touches all subdomains: logging, profiling, monitoring EXPLAIN plans, replica lag, lock waits
- **Security** touches 5 (multi-tenancy isolation), 12 (RLS), 15 (constraint-based integrity)
- **Performance** touches 3, 4, 6, 7, 8, 9, 12, 13 — with tradeoffs across subdomains
- **Operational Complexity** escalates: 1 (basic) -> 5 (multi-tenancy) -> 6 (sharding) -> 11 (production migrations) -> 14 (CQRS)

# Missing Knowledge Risk Analysis

## High-Risk Gaps (must address early)

| Gap | Impact | Affected Subdomains |
|-----|--------|---------------------|
| No understanding of query plans (EXPLAIN / EXPLAIN ANALYZE) | Invisible performance degradation; guesswork optimization rather than evidence-based | 3, 4 |
| Sargability ignorance (whereDate, LIKE %%, function wraps) | Full table scans on multi-million row tables; performance blamed on "slow ORM" | 3, 4 |
| Missing multi-tenancy design until demanded | Costly schema refactoring across entire codebase; data leak incidents during migration | 5 |
| Equating "more indexes = faster" | Write degradation; index bloat; no composite index coverage | 3 |
| No read replica strategy after 100k+ users | Primary DB overload; reporting queries compete with transactional traffic | 7 |
| Lazy loading in production (no prevention guard) | N+1 cascade; unpredictable response times; database CPU spikes | 2, 4 |
| No zero-downtime migration plan for production | Lock wait timeouts; downtime during schema changes; failed deployments | 11 |
| Sharding without proper shard key analysis | Hot shards; cross-shard query explosion; irrecoverable imbalance | 6 |
| Ignoring PostgreSQL-specific features in PG-backed projects | Missed performance gains; over-reliance on generic patterns | 12 |

## Medium-Risk Gaps (should address before scaling)

| Gap | Impact | Affected Subdomains |
|-----|--------|---------------------|
| Over-reliance on Eloquent for reporting queries | Hydration memory blowups; slow dashboards | 2, 4 |
| No connection pooling strategy | Connection exhaustion under load; failed deployments | 10 |
| No composite index strategy (single indexes only) | Inefficient index usage; filesorts under load | 3 |
| Ignoring partition strategy for time-series tables | Table bloat; slow archiving/deletion; backup overhead | 8 |
| No sticky write configuration for read replicas | Stale reads after writes; eventual consistency bugs | 7 |
| Soft deletes without partial unique indexes | Unique constraint violations on "deleted" rows; data integrity issues | 15 |
| No migration lock configuration in multi-server deploys | Race conditions during deployment; partial migration state | 1, 11 |
| No tenant isolation testing for shared-table tenancy | Cross-tenant data leaks in production | 5 |
| Transaction scoping includes external I/O (API calls, file ops) | Extended lock holding; deadlocks; blocked queries | 9 |
| Missing `EXPLAIN` in code review process | Silent performance regressions merged to production | 3, 4 |

## Low-Risk Gaps (address when pain is felt)

| Gap | Impact | Affected Subdomains |
|-----|--------|---------------------|
| CQRS/Event Sourcing not adopted | Sufficient for 90%+ of Laravel applications; unnecessary complexity unless audit/event-driven requirements | 14 |
| No sharding strategy | Most apps never need sharding; replicas + optimization suffice for large scale | 6 |
| No gh-ost/pt-online-schema-change integration | Acceptable < 10M rows; ~1-5 minute DDL locks may be tolerable | 11 |
| Partial/expression indexes not used | Standard indexes are acceptable for typical workloads; gap matters at B2B/enterprise scale | 3, 12 |
| PostgreSQL RLS not used | Global scopes + disciplined code suffice; RLS is defense-in-depth layer only | 5, 12 |
| No distributed tracing for queries | Acceptable for single-region, single-database deployments | 4, 6 |

## Mitigation Strategy

1. **Tier 1 (Immediate)**: Build EXPLAIN interpretation and composite index design into skill foundation. Teach sargability as non-negotiable. Enforce lazy loading prevention guard in all non-production environments. Require EXPLAIN in code review for any query change touching tables > 100k rows.

2. **Tier 2 (Before Scale)**: Integrate replication configuration, connection pooling, sticky writes, and migration locking into deployment playbooks. Formalize multi-tenancy isolation testing. Build composite index review checklist for high-traffic endpoints.

3. **Tier 3 (At Scale)**: Develop shard feasibility assessment, zero-downtime migration tooling, and PostgreSQL advanced feature playbooks as separate training modules. CQRS/Event Sourcing as a specialized track for audit-heavy domains.

4. **Continuous**: Maintain a performance budget per endpoint (max queries, max query time). Run EXPLAIN on top 10 slow queries weekly. Monitor replica lag, lock waits, and connection pool utilization in production dashboards.

# Research Findings

## Core Recommendations

1. **Treat Query Shape as Part of the Endpoint Contract**: The SQL a hot route generates is not an implementation detail — it is part of the feature. Define what data each endpoint needs (columns, relationships, aggregations) and then write the query to match. Never let an endpoint's query shape be an accidental byproduct of model convenience. The most scalable Laravel teams treat list views and detail views as distinct query profiles, not opportunities to reuse an oversized model load.

2. **Measure Before Optimizing — and Use EXPLAIN as the Primary Diagnostic**: The single most impactful habit is running EXPLAIN on queries before and after changes. EXPLAIN removes guesswork: it shows whether indexes are used, how many rows are scanned, whether filesorts or temporary tables are created. Teams that skip EXPLAIN default to cargo-cult indexing and random optimization. Enable slow query logging from day one (set `long_query_time` to 0.1–0.5s in development) and review weekly in production.

3. **Composite Indexes Over Single-Column Indexes**: Real queries filter on multiple columns simultaneously. A pile of individual indexes does not cover composite `WHERE + ORDER BY` patterns. Composite indexes must follow leftmost prefix rules — equality columns first, range/order columns after. The most common production performance fix is replacing 3 unrelated indexes with 1 well-designed composite index matching the actual access path.

4. **Eager Loading Discipline is Non-Negotiable**: Prevent lazy loading outside production (`Model::preventLazyLoading`). But also avoid blind eager loading — loading every relationship on every endpoint transfers waste from query count to data volume. Narrow eager loading to exactly the columns each endpoint needs. Use `withCount`, `withSum`, etc. for aggregations instead of hydrating full collections. The rule: if you only need a count, don't load the collection.

5. **Multi-Tenancy Isolation Must Be Enforced at the Framework Level, Not via Developer Discipline**: Global scopes on every tenant-scoped model are the minimum. Add trait-based enforcement, middleware that resolves tenant context, queue jobs that re-bind tenant context, and test suites that explicitly assert cross-tenant isolation. PostgreSQL RLS provides defense-in-depth for regulated environments. The most common production incident in multi-tenant Laravel apps is a missing global scope or a queue job that forgot to set tenant context.

## Key Patterns and Tradeoffs

### Multi-Tenancy Decision Framework
- **Shared-table (tenant_id)**: Default for most SaaS. Low ops cost, easy cross-tenant analytics. Requires strict scope discipline. Suitable for < 50 tenants or uniform load.
- **Schema-per-tenant**: Medium isolation. Good for mid-growth (50-500 tenants). Stronger isolation without per-server cost. Migration fan-out becomes real.
- **Database-per-tenant**: Maximum isolation. Required for compliance (GDPR, HIPAA, SOC 2). Enables per-tenant backup, restore, and resource allocation. Ops cost scales with tenant count. Cross-tenant analytics requires warehouse.

The single most expensive mistake in SaaS architecture is refactoring multi-tenancy after 100+ tenants. Make the decision before your first paying customer, but default to shared-table until compliance or customer demand proves otherwise.

### Sharding vs. Replicas vs. Partitioning
- **Read replicas** solve read-load problems. Add first, before sharding. Laravel has native support. Operational complexity is low.
- **Partitioning** solves table-size problems (deletion, archiving, time-range queries). Done within a single database. No application changes required for partition pruning.
- **Sharding** solves scale-beyond-single-machine problems. Highest complexity, hardest to reverse. Only pursue after read replicas, optimization, and partitioning are exhausted.

### PostgreSQL vs. MySQL in Laravel
- **PostgreSQL advantages**: JSONB with GIN indexing, full-text search (tsvector), CTEs, window functions, RLS, partial/expression indexes, concurrent index creation, materialized views, extension ecosystem (pgvector, postgis, pg_cron). Better for analytics-adjacent workloads and complex queries.
- **MySQL advantages**: InnoDB mature replication ecosystem, PlanetScale/Vitess compatibility, online DDL (ALGORITHM=INSTANT), extensive hosting options (RDS, Aurora), broader PHP/Laravel hosting familiarity. Better for straightforward CRUD-heavy apps.
- **Recommendation**: New projects default to PostgreSQL unless the hosting ecosystem or team expertise dictates MySQL. PostgreSQL's advanced features (especially JSONB, partial indexes, RLS) provide a longer runway before needing sharding or external services.

## Common Misconceptions

1. **"Eloquent is slow"**: Eloquent is not inherently slow. The problem is undisciplined use: lazy loading, over-hydration, non-sargable queries, missing indexes. Eloquent generates the same SQL a developer would write — the difference is that Eloquent makes expensive database behavior invisible. The fix is query profiling, not abandoning the ORM.

2. **"More indexes = faster queries"**: Every index slows writes (INSERT, UPDATE, DELETE). Indexes also consume disk and memory. The goal is the right indexes, not many indexes. Composite indexes covering real query patterns are far more valuable than individual indexes on every column.

3. **"We'll just shard when we need to"**: Sharding is one of the hardest operational changes to make on a live system. It requires application-level routing, cross-shard query awareness, shard key analysis, data rebalancing, and testing at production scale. Read replicas, query optimization, and table partitioning should be exhausted first. Most Laravel applications never need sharding.

4. **"Database-per-tenant is more secure"**: Database-per-tenant provides stronger isolation but does not automatically prevent application-level data leaks. The routing logic that determines which database to connect to can still have bugs. Security requires defense-in-depth — database isolation plus application-level enforcement plus testing.

5. **"The ORM abstracts the database, so I don't need to understand the database"**: This is dangerously wrong. Every Eloquent query generates SQL, and every SQL query has an execution plan determined by the database's query planner. Understanding indexes, EXPLAIN, sargability, locking, and transaction isolation is essential for building performant Laravel applications. The database is not abstracted away — it is the execution engine for every operation.

6. **"Indexes on foreign keys are automatic"**: Laravel's `constrained()` helper adds the index. Manually defining foreign keys (`$table->foreignId('user_id')->references('id')->on('users')`) does NOT automatically add an index. Unindexed foreign keys cause full table scans on every join.

7. **"Soft deletes are free"**: Soft deletes add `WHERE deleted_at IS NULL` to every query on the model. On large tables without a composite index covering the filter columns + `deleted_at`, this adds scan overhead. Soft deletes also complicate unique constraints (need partial unique indexes in PostgreSQL).

8. **"chunkById is always better than chunk"**: `chunkById` uses a stable, ordered key to paginate and is generally safer for production data processing. `chunk` uses offset-based pagination internally and can miss or duplicate rows if records are modified during iteration. However, `chunkById` requires a reliable, monotonically increasing column.

9. **"Database migrations are just schema definitions"**: Migrations are also deployment operations. A migration that takes 30 minutes locks tables and blocks deploys. A migration that fails halfway requires a rollback plan. In multi-tenant environments, migrations may need to run across hundreds or thousands of databases, each taking time proportional to data volume.

10. **"RLS in PostgreSQL is a set-and-forget security layer"**: RLS policies on partitioned tables must be propagated to each partition. Indexes must align with RLS `USING` expressions or the planner will add expensive post-scan filters. `FORCE ROW LEVEL SECURITY` is required to prevent table owner bypass. RLS requires ongoing maintenance as application roles evolve.

## Production Patterns That Scale

1. **Query shape governance**: Each endpoint explicitly defines its data requirements (columns, relationships, aggregations). Controls: max relationships loaded, max columns selected, max query count per request.

2. **EXPLAIN in CI**: For every migration that changes query patterns, include EXPLAIN output in the PR. Automate EXPLAIN comparison with database matching production schema and row count.

3. **Expand-contract by default**: Never drop a column in the same deploy that stops using it. Add column (nullable or with default), deploy code that stops reading old column, then drop in a separate deploy. This makes deployments reversible and decouples schema changes from application code.

4. **Partitioning as data lifecycle management**: Partition time-series tables by month or quarter from the start — even before the table is large. Adding partitions to an existing large table requires backfilling. Setting up partitioning on an empty table is trivial.

5. **Read replica for reporting**: Move dashboards, exports, and analytics queries to a read replica from the beginning. This protects transactional write performance and allows independent scaling of read capacity.

6. **Connection pooling layer**: Use PgBouncer (PostgreSQL) or ProxySQL (MySQL) between application and database. This prevents connection storms, manages connection counts, and provides a buffer during failover.

7. **Tenant context in every queued job**: Every job that touches tenant-scoped data must carry `tenant_id` in its payload and re-bind tenant context at the start of `handle()`. This is the single most common source of multi-tenant data leaks in Laravel.

8. **Migration isolation across servers**: Use `php artisan migrate --isolated` in deployment pipelines to prevent two servers from migrating simultaneously. This avoids race conditions and partial migration states.

# Future Expansion Opportunities

## Short-term (6-12 months)
- **Database-specific migration generators**: Tools that scaffold partition-based migrations (create monthly partitions for events, log tables) or generate expand-contract migration pairs automatically
- **Query governance middleware**: Pluggable middleware that enforces per-route query budgets (max count, max time, max joins) and warns or blocks violations
- **EXPLAIN visualization tools**: Package that takes EXPLAIN output and renders a visual query plan tree with optimization suggestions for Laravel developers

## Medium-term (1-2 years)
- **Automated composite index suggestions**: Integration with Laravel Telescope or APM tools that analyzes real query patterns and suggests composite indexes with EXPLAIN validation
- **Multi-tenant migration orchestrator**: Artisan command that manages schema version per tenant, batches migrations, handles failures, and provides rollback per tenant
- **Shard management dashboard**: Web-based interface for viewing shard distribution, detecting hot shards, initiating rebalancing, and monitoring fan-out query performance
- **PostgreSQL RLS migration generator**: Artisan command that generates RLS policies and matching partial indexes from model annotations or tenant configuration

## Long-term (2-5 years)
- **Distributed query execution for shards**: Native Laravel support for cross-shard queries with automatic fan-out, result merging, and pagination — similar to Citus or Vitess patterns
- **Adaptive connection pool management**: Dynamic pool sizing based on real-time query latency, replica lag, and connection count — integrated with Laravel's service container
- **Schema drift detection and autofix**: Continuous comparison of actual database schema against migration state, with automated generation of corrective migrations
- **Predictive scaling for database resources**: ML-based prediction of database bottlenecks (index degradation, partition bloat, connection exhaustion) with proactive recommendations
- **Event sourcing visual debugger**: GUI for replaying events, inspecting aggregate state at any point in time, and debugging projection pipelines — integrated with Laravel Horizon
- **Cross-database multi-tenancy standards**: Emerging standard patterns and tooling for hybrid multi-tenancy where tenant groups are on different isolation models (some shared, some dedicated) within the same application

# Sources Consulted

## Tier 1: Official Documentation
- Laravel 13.x Migrations Documentation (laravel.com/docs/13.x/migrations)
- Laravel 13.x Database & Query Builder Documentation (laravel.com/docs/13.x/database)
- Laravel 13.x Eloquent ORM Documentation (laravel.com/docs/13.x/eloquent)
- Laravel 13.x Scout Documentation (laravel.com/docs/13.x/scout)
- PostgreSQL 18 Documentation: DDL (Row Security Policies, CREATE TABLE Partitioning)
- PostgreSQL 18 Documentation: WITH Queries (Common Table Expressions)
- PostgreSQL 15 Documentation: CREATE POLICY
- MySQL 8.0 Online DDL Documentation

## Tier 2: Community & Expert Content
- Nuffing.com — "How to systematically optimize Laravel databases in production" (Jan 2026)
- QCode — "Why Your Laravel Eloquent Queries Bottleneck Under Load and How to Fix Them" (Apr 2026)
- Hafiz Riaz — "6 Eloquent Patterns That Kill Your MySQL Index" (May 2026)
- Richard Joseph Porter — "Laravel Database Performance: Fixing N+1 Queries and Indexing for Sub-100ms Responses" (Feb 2026)
- IMarkerz — "Database Performance for Enterprise Laravel (2026): Indexing, Deadlocks, Lock Waits, and Fast Reporting" (Jan 2026)
- Dev.to — "Laravel Eloquent: Advanced Query Optimization and Profiling Techniques" (Aug 2025)
- Florentin Pomirleanu — "Optimizing Laravel Queries with Database Indexes" (Jan 2026)
- Naim BD — "Handling 5 Million Rows: Optimizing Eloquent Queries for High-Traffic Directories" (Feb 2026)
- AcquaintSoft — "How to Scale Your Laravel SaaS App: Full Guide for Developers & CTOs" (Jul 2025)
- AcquaintSoft — "Laravel SaaS Architecture: From MVP to Scale in 2026" (Mar 2026)

## Tier 3: Open Source & Packages
- tpetry/laravel-postgresql-enhanced — PostgreSQL extensions (partial indexes, full-text, CTEs, temporal)
- staudenmeir/laravel-cte — Common Table Expressions in Laravel query builder
- allnetru/laravel-sharding — Horizontal sharding toolkit (hash/range/redis strategies, Snowflake IDs, coroutine fan-out)
- uumbrellio/laravel-pg-extensions — PostgreSQL schema extensions (partitions, unique indexes, exclude constraints)
- orptech/laravel-migration-partition — Partitioned table creation via Laravel migrations
- Daursu/laravel-zero-downtime-migration — Zero-downtime MySQL migrations with gh-ost and pt-online-schema-change
- syeedalireza/laravel-eventsource — Enterprise-grade Event Sourcing and CQRS for Laravel
- theaddresstech/laravel-modular-ddd — Modular DDD with CQRS, event sourcing, and performance monitoring
- spatie/laravel-event-sourcing — Event Sourcing implementation (projectors, reactors, event stores)
- stancl/tenancy — Multi-tenancy for Laravel (database-per-tenant, schema-per-tenant, shared-table)
- planetscale/planetscale-laravel-mysql — PlanetScale MySQL integration with Laravel

## Tier 4: Community Discussions & Analysis
- Sujeet Jaiswal — "Database Migrations at Scale" (Feb 2026) — gh-ost, pt-osc, Spirit, pgroll deep analysis
- AWS Database Blog — "Scale your relational database for SaaS, Part 1: Common scaling patterns" (Apr 2024)
- Mohamad Shahkhajeh — "Multi-Tenancy at Scale in PHP/Laravel: Should You Go Database-Per-Tenant or Row-Level Isolation?" (Nov 2025)
- Hasan Sidawi — "Multi-Tenancy in Laravel: A Complete Architecture Guide" (Jan 2026)
- Kenodo — "Multi-tenant SaaS in Laravel: one codebase, many clients, without losing control" (Apr 2026)
- Gurpreet Singh — "Multi-Tenant SaaS in Laravel: Step-by-Step Guide" (Apr 2026)
- Curotec — "Building Multi-Tenant SaaS Applications with Laravel in 2026" (May 2026)
- Shaon Majumder – "Sharding MySQL in Laravel: A Guide to Horizontal Scaling" (Apr 2025)
- OneUptime — "How to Use Laravel with PostgreSQL" (Jan 2026)
- Gold Lapel — "Laravel PostgreSQL Performance Tuning Guide" (Mar 2026)
- M-Caneda — "Advanced Laravel Query Builder Tips for PostgreSQL Databases" (Apr 2025)
- Aditya Nursyahbani — "Laravel PostgreSQL Partitioning and TimescaleDB in 2026" (May 2026)
- Aditya Nursyahbani — "Event Sourcing and CQRS in Laravel: Building Scalable Enterprise Systems" (May 2026)
- Dev.to (Paresh Prajapati) — "Master PostgreSQL Partial and Functional Indexes in Laravel" (Apr 2026)
- Neon Database — "Read Replica Laravel Guide" (postgres, read/write splitting)
- Microsoft Azure Architecture Center — "Architectural Approaches for Storage and Data in Multitenant Solutions"
- Rajarsi Saha — "Implementing Row-Level Security on Billion-Row Hash-Partitioned PostgreSQL Tables" (Apr 2026)
- SaasForgeKit — "How to Deploy a Laravel SaaS to Production with Zero Downtime (2026 Guide)" (Mar 2026)
- Sajid Bashir — "LMS PostgreSQL Scaling Patterns" (data engineering case study, PL/pgSQL, materialized views, triggers, CTEs)
- Buana Coding — "Laravel Database Migration Best Practices" (Sep 2025)
- Interoke Digital — "MySQL and MariaDB Patterns for Laravel Startups" (May 2026)
- PlanetScale — "Versioned Schema Migrations" (Apr 2023)
