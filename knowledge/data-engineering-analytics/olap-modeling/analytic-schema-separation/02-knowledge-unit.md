# K019: PostgreSQL Analytic Schema Separation (public vs analytics)

## Metadata
- **ID:** K019
- **Tier:** Tier 2 (Extended)
- **Subdomain:** Read Models & CQRS for Analytics
- **Complexity:** Advanced
- **Adoption:** Growing
- **Packages:** PostgreSQL schemas (built-in), spatie/laravel-event-sourcing, Laravel Business Metrics

## Executive Summary
Schema separation is a zero-infrastructure-cost way to isolate analytical data from operational data within the same PostgreSQL database. By placing analytics tables in a dedicated `analytics` schema (separate from the `public` operational schema), you achieve logical separation, per-schema permission control, independent query performance monitoring, and clear organizational boundaries — all within a single database, without separate infrastructure. This is the recommended starting point for Laravel analytics before migrating to dedicated analytical stores like ClickHouse or Snowflake.

## Core Concepts
- **PostgreSQL schema:** A namespace within a database. `public` for operational tables, `analytics` for analytical tables. Queries must reference `analytics.daily_revenue`.
- **`search_path`:** PostgreSQL's schema resolution order. `SET search_path TO analytics, public` — queries check `analytics` first, then `public`.
- **Per-schema permissions:** `GRANT USAGE ON SCHEMA analytics TO analytics_reader; GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;`.
- **Schema-level queries:** `SELECT * FROM information_schema.tables WHERE table_schema = 'analytics'` — manage analytics tables independently.
- **Logical isolation vs physical isolation:** Schema separation is logical — same database, same disk. But performance can be monitored per-schema via `pg_stat_all_tables`.

## Mental Models
- **Two neighborhoods in one city:** `public` schema is the commercial district (high traffic, frequent writes, normalized). `analytics` is the residential area (read-heavy, denormalized, aggregated). Same city services (PostgreSQL), different neighborhoods with separate rules.
- **Schema as namespace:** Like PHP namespaces. `public.users` and `analytics.users` are different tables with different purposes. `analytics.users` might have columns `total_orders, lifetime_value, last_order_date`.
- **Separation without divorce:** You get the benefits of separation (clear ownership, independent schemas, permissions) without the costs of a separate database (replication, connection management, cross-database queries).

## Internal Mechanics
1. Create the schema: `CREATE SCHEMA IF NOT EXISTS analytics;`
2. Set search path per connection: `config('database.connections.pgsql.search_path') = 'analytics,public'` in Laravel config.
3. Create analytics tables: `Schema::create('analytics.daily_revenue', function ($table) { ... })` — notice the schema prefix.
4. Create views joining analytics and public: `CREATE VIEW analytics.customer_summary AS SELECT u.id, u.name, ar.total_revenue FROM public.users u JOIN analytics.revenue ar ON u.id = ar.user_id;`
5. Grant permissions: `GRANT USAGE ON SCHEMA analytics TO dashboard_role;`
6. Configure Metabase/Grafana to use the `analytics` schema with read-only credentials.

## Patterns
- **Laravel migration with schema:** `Schema::connection('pgsql-analytics')->create('daily_revenue', ...)` — dedicated connection with `search_path` set to `analytics`.
- **View-based integration:** Create views in `analytics` that reference `public` tables for real-time access to operational data without duplicating it. `CREATE VIEW analytics.active_users AS SELECT id, name, last_login_at FROM public.users WHERE last_login_at > now() - interval '24 hours'`.
- **Materialized views for performance:** `CREATE MATERIALIZED VIEW analytics.mv_daily_kpi AS ...` — refreshed via `REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_daily_kpi` in a scheduled job.
- **Scheduled materialization:** A nightly Laravel command: `DB::statement("REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_daily_revenue")`.
- **Analytics-only database user:** Create a PostgreSQL user with access ONLY to the `analytics` schema. Metabase/Grafana connect as this user — they cannot see or modify `public` tables.

## Architectural Decisions
| Decision | Options | Trade-off |
|---|---|---|
| Schema vs database | Same DB, different schemas vs Separate databases | Schemas are simpler (same connection, simple cross-schema queries) but share resources; separate databases isolate resources (IO, CPU, connections) but add connection management complexity |
| Table naming | Prefixed (`analytics_daily_revenue`) vs Schema-qualified (`analytics.daily_revenue`) | Prefix is simple but loses schema-native permission control; schema-qualified gives full PostgreSQL schema benefits |
| View vs materialized view | Regular view (always fresh) vs Materialized view (pre-computed, stale) | Regular views are always current but slow for complex aggregations; materialized views are fast but stale between refreshes |
| Connection per schema | Single connection with `search_path` vs Dedicated connection per schema | Single connection is simpler but may expose public tables if search_path is wrong; dedicated connections enforce separation at the application level |

## Tradeoffs
- **Zero infrastructure cost vs scaling limit:** Schema separation adds zero cost (same DB, same server) but PostgreSQL is still an OLTP database — analytical queries consume shared resources (CPU, IO, buffer cache). This works well up to ~100GB of analytics data. Beyond that, consider a dedicated analytics store.
- **Cross-schema queries vs performance:** Joining `analytics` and `public` tables in the same query is convenient but mixes query patterns — PostgreSQL's optimizer may choose suboptimal plans for mixed OLTP+OLAP queries. Consider views or ETL for complex cross-schema queries.
- **Security vs convenience:** Schema-based permission control means Metabase users can't accidentally access `public` tables. But it also means developers need schema-qualified or `search_path`-based access, adding complexity to database tooling.

## Performance Considerations
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index on the MV. Without it, `CONCURRENTLY` fails silently — the MV is not refreshed.
- Schema separation enables `pg_stat_all_tables` filtering: `SELECT * FROM pg_stat_all_tables WHERE schemaname = 'analytics'` — monitor analytics query performance independently of operational queries.
- PostgreSQL's query planner doesn't distinguish between schemas — a query on `analytics.daily_revenue` uses the same execution engine as `public.users`. There's no performance penalty for schema separation.
- Vacuum and autovacuum operate per-table, not per-schema. Analytics tables (append-heavy, large) may need custom autovacuum settings.

## Production Considerations
- **Backup strategy:** Schema separation doesn't affect backups — `pg_dump` dumps all schemas. If analytics data is large, consider `pg_dump --schema=analytics` for separate analytics backups with different retention policies.
- **Read replica routing:** Connect Laravel dashboard endpoints to a read replica. The read replica has the `analytics` schema (and `public` schema, but it's read-only). Dashboard queries don't compete with main database writes.
- **Migration management:** Schema-prefixed table names in Laravel migrations work but add verbosity. Consider dedicated migration files for `analytics` schema with a helper method: `$this->analyticsTable('daily_revenue')`.
- **Schema documentation:** Maintain `COMMENT ON SCHEMA analytics IS 'Analytics data marts for dashboard queries';` and `COMMENT ON TABLE analytics.daily_revenue IS 'Aggregated daily revenue, refreshed hourly';`. PostgreSQL stores comments in `information_schema`.

## Common Mistakes
- **Forgetting `search_path`:** Laravel connection config must explicitly set `search_path`. If not set, queries look in `public` first and fail to find `analytics` tables.
- **No unique index on MV:** `REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_*` fails silently without unique index. The MV is not refreshed but no error is raised.
- **Cross-schema naming collisions:** `analytics.users` and `public.users` — confusion in queries. Use clearly different names: `analytics.user_summary`.
- **Granting too much access:** Granting `ALL PRIVILEGES ON SCHEMA analytics TO dashboard_role` — dashboard users can create tables in analytics schema. Use minimal grants: `USAGE, SELECT`.

## Failure Modes
- **Materialized view staleness:** Scheduled refresh fails (disk full, lock timeout) → dashboard shows stale data. Mitigation: monitor MV refresh age, alert if > 2x scheduled interval.
- **`search_path` misconfiguration:** Laravel connection accidentally has `search_path = analytics` without `public` → model queries referencing `users` fail (table not found). Mitigation: search_path should be `analytics, public` — check `analytics` first for analytical queries, fall back to `public` for operational.
- **Schema drop accident:** A migration or DBA script drops the `analytics` schema — all analytical data lost. Mitigation: test all migration scripts in staging. Back up analytics schema separately.

## Ecosystem Usage
- **Laravel Business Metrics (Multek-Company):** Uses `analytics.*` schema pattern with `public.business_events` (append-only event log) → scheduled report jobs → `analytics.*` tables → Grafana. This is the reference implementation of the pattern.
- **Laravel Star Schema (skylence-be):** Creates facts/dimensions in a configurable schema (default `analytics`). Provides Schema Builder helpers for schema-qualified table creation.
- **Laravel Nightwatch:** Uses PostgreSQL for operational data (not analytics). Analytics data lives in ClickHouse (separate infrastructure). Schema separation is the starting point before graduating to dedicated analytical stores.

## Related Knowledge Units
- K008 (CQRS Read Models): Analytics tables ARE read models in the `analytics` schema
- K006 (Star Schema): Fact/dimension tables created in `analytics`. schema
- K023 (Grafana/Metabase): BI tools configured with read-only access to `analytics` schema

## Research Notes
- The `analytics.*` schema pattern was popularized in the Laravel ecosystem by the `laravel-business-metrics` package (2023). It's been adopted as a best practice for mid-scale analytics (10K-100M events/day) before infrastructure investment in ClickHouse or cloud warehouses.
- PostgreSQL's schema feature is underutilized in Laravel — most projects use only the default `public` schema. Schema separation for analytics is a zero-cost architectural improvement that pays dividends in maintainability, security, and performance monitoring.
- Scaling path: `public` schema (all tables) → `analytics` schema (logical separation) → `analytics` on read replica (resource isolation) → ClickHouse/DW (dedicated analytical infrastructure). Schema separation is step 1.
