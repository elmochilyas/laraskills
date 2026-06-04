# K019: PostgreSQL Analytic Schema Separation (public vs analytics)

## Metadata
- **ID:** K019
- **Tier:** Tier 2 (Extended)
- **Subdomain:** Read Models & CQRS for Analytics
- **Complexity:** Advanced
- **Adoption:** Growing
- **Packages:** PostgreSQL schemas (built-in), spatie/laravel-event-sourcing, Laravel Business Metrics

## Overview
Schema separation is a zero-infrastructure-cost way to isolate analytical data from operational data within the same PostgreSQL database. By placing analytics tables in a dedicated `analytics` schema (separate from the `public` operational schema), you achieve logical separation, per-schema permission control, independent query performance monitoring, and clear organizational boundaries — all within a single database, without separate infrastructure. This is the recommended starting point for Laravel analytics before migrating to dedicated analytical stores like ClickHouse or Snowflake.

## Core Concepts
- **PostgreSQL schema:** A namespace within a database. `public` for operational tables, `analytics` for analytical tables. Queries reference `analytics.daily_revenue`.
- **`search_path`:** PostgreSQL's schema resolution order. `SET search_path TO analytics, public` — checks `analytics` first, then `public`.
- **Per-schema permissions:** `GRANT USAGE ON SCHEMA analytics TO analytics_reader; GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;`
- **Logical isolation vs physical isolation:** Schema separation is logical — same database, same disk. Performance can be monitored per-schema via `pg_stat_all_tables`.
- **Materialized views:** Pre-computed query results stored as physical tables in the `analytics` schema, refreshed on a schedule.

## When To Use
- Starting point for any Laravel application that needs analytics alongside operational data — zero additional infrastructure cost.
- Mid-scale analytics (10K-100M events/day) where a separate analytics database is not yet justified.
- Multi-tenant SaaS applications where tenant analytics data must be isolated from operational data.
- Teams that want to give BI tools (Metabase, Grafana) read-only access to analytics without exposing operational tables.

## When NOT To Use
- Analytics data exceeds 100GB or query patterns are OLAP-heavy — PostgreSQL is an OLTP database and will struggle with large analytical queries. Migrate to ClickHouse or a cloud warehouse.
- Multiple applications need to share the same analytics data — a separate analytics database with its own connection pool is cleaner.
- Real-time analytics requiring sub-second query response on billions of rows — PostgreSQL's row-based storage is not designed for this.
- The operational database is already CPU/IO-bound from application traffic — adding analytics queries (even on separate schema) shares the same resources.

## Best Practices
- **Create a dedicated database connection for the analytics schema** because mixing `search_path` with the default connection risks exposing `public` tables to analytics queries or vice versa. Define a `pgsql-analytics` connection in `config/database.php` with `'search_path' => 'analytics,public'` — this ensures queries check analytics tables first but can still reference operational data when needed via schema-qualified names.
- **Use schema-qualified table names in migrations** — `Schema::create('analytics.daily_revenue', ...)` — because this makes the schema explicit and avoids confusion. Never create analytics tables in the `public` schema. The schema prefix documents the table's purpose and ownership.
- **Create a read-only database user for BI tools** because Metabase or Grafana connecting with the application database user can accidentally DELETE or DROP tables. Create `analytics_reader` with `GRANT USAGE ON SCHEMA analytics TO analytics_reader; GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;`. The BI tool can only see the analytics schema — no access to operational tables.
- **Use materialized views for complex aggregations** because regular views execute their query every time, which can be slow for multi-table JOINs with aggregations. `CREATE MATERIALIZED VIEW analytics.mv_daily_revenue AS ...` and refresh it via `php artisan schedule` — `REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_daily_revenue`. The `CONCURRENTLY` option avoids table locks during refresh.
- **Add a unique index to every materialized view** because `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index — without one, the refresh fails silently (no error, no refresh). Add a unique index on the MV's natural key or a surrogate ID column.

## Architecture Guidelines
- **Scaling path from schema separation:** `public` schema (all tables) → `analytics` schema (logical separation) → analytics on read replica (resource isolation) → ClickHouse/warehouse (dedicated analytical infrastructure). Schema separation is step 1 — it works for years for most applications.
- **Naming convention for analytics tables:** Use clearly different names from operational tables. `analytics.daily_revenue` (not `analytics.orders`), `analytics.user_summary` (not `analytics.users`). This prevents confusion with `public.orders` and `public.users`.
- **Schedule MV refreshes during low-traffic periods** because `REFRESH MATERIALIZED VIEW` is I/O-intensive. Daily MVs refresh at 3 AM. Hourly MVs refresh at :00 past the hour. Add jitter to prevent multiple MVs from refreshing simultaneously.
- **Monitor MV freshness:** Track `SELECT now() - mv.refresh_time` for each MV. Alert if any MV's age exceeds 2x the scheduled refresh interval. A silently failing MV means stale dashboard data.

## Performance Considerations
- Schema separation adds zero query overhead — PostgreSQL's optimizer doesn't distinguish between schemas.
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index — without it, the operation fails silently.
- Materialized views consume disk storage equal to the result set. A daily revenue MV with 365 rows/year is negligible. A customer summary MV with 100K rows is ~10MB.
- Vacuum/autovacuum operates per-table. Analytics tables (append-heavy, large) may need custom autovacuum settings (`autovacuum_vacuum_scale_factor = 0.01` instead of default 0.2).

## Security Considerations
- Schema-based permission control is the primary security benefit. A read-only user on the `analytics` schema cannot access `public` tables even via SQL injection.
- Materialized views may expose aggregated data that is sensitive across tenants. Apply row-level security on MV base tables or create per-tenant MVs.
- The analytics connection's `search_path` must include both `analytics` and `public` to prevent "table not found" errors for queries that need to join analytical and operational data. But be careful — `search_path = analytics, public` means unqualified table names check analytics first.
- Backups of the analytics schema (`pg_dump --schema=analytics`) should have different retention and access controls if analytics data contains sensitive aggregated metrics.

## Common Mistakes

### Forgetting search_path configuration
- **Description:** Laravel connection config does not set `search_path`, so queries default to `public` only.
- **Cause:** Developer creates the analytics schema and tables but forgets to configure the database connection.
- **Consequence:** All queries fail with "relation analytics.daily_revenue does not exist" or Laravel cannot find the table.
- **Better:** Always explicitly set `'search_path' => 'analytics,public'` in the database connection config for analytics connections.

### No unique index on materialized views
- **Description:** MV is created without a unique index, then `REFRESH MATERIALIZED VIEW CONCURRENTLY` is called.
- **Cause:** Developer assumes CONCURRENTLY works without additional setup.
- **Consequence:** The refresh fails silently — no error, no warning, but the MV is not updated. Dashboard data goes stale.
- **Better:** Always add a unique index after creating an MV. Verify the refresh is working by checking the MV's age.

### Cross-schema naming collisions
- **Description:** `analytics.users` and `public.users` exist. Queries are ambiguous.
- **Cause:** Developer uses the same table name in both schemas.
- **Consequence:** Unqualified `users` in queries returns the wrong table depending on `search_path`. Developers are confused.
- **Better:** Use distinct names for analytics tables. `analytics.user_summary`, `analytics.customer_metrics` — never `analytics.users`.

## Anti-Patterns

### Granting ALL PRIVILEGES on the analytics schema
Giving `ALL PRIVILEGES ON SCHEMA analytics TO dashboard_role`. The dashboard user can create, alter, and drop tables in the analytics schema. A compromised BI tool credential can destroy all analytics data. Grant only `USAGE, SELECT` for read-only access.

### Using the default connection for analytics
Running analytics queries on the same database connection as application queries without configuring `search_path`. The connection might have `search_path = public`, so `DailyRevenue::all()` fails. Use a dedicated `pgsql-analytics` connection.

### Never using schema separation
Keeping all tables in `public` — `public.orders`, `public.daily_revenue`, `public.user_summary`. As the project grows, the `public` schema becomes a mess of operational and analytical tables with no clear ownership. Schema separation is a one-line setup that pays dividends forever.

## Examples

### Dedicated analytics connection configuration
```php
// config/database.php
'connections' => [
    'pgsql' => [
        'driver' => 'pgsql',
        'url' => env('DATABASE_URL'),
        'search_path' => 'public',
        // ... standard config
    ],
    'pgsql-analytics' => [
        'driver' => 'pgsql',
        'url' => env('ANALYTICS_DATABASE_URL'),
        'search_path' => 'analytics,public',
        'host' => env('DB_HOST'),
        'port' => env('DB_PORT'),
        'database' => env('DB_DATABASE'),
        'username' => env('DB_USERNAME'),
        'password' => env('DB_PASSWORD'),
        'charset' => 'utf8',
    ],
];
```

### Analytics schema migration with materialized view
```php
class CreateAnalyticsSchema extends Migration
{
    public function up(): void
    {
        DB::connection('pgsql-analytics')->statement('CREATE SCHEMA IF NOT EXISTS analytics');

        Schema::connection('pgsql-analytics')->create('daily_revenue', function (Blueprint $table) {
            $table->date('date')->primary();
            $table->decimal('revenue', 12, 2);
            $table->integer('order_count');
            $table->timestamps();
        });

        DB::connection('pgsql-analytics')->statement("
            CREATE MATERIALIZED VIEW analytics.mv_daily_kpi AS
            SELECT
                date,
                revenue,
                order_count,
                revenue / NULLIF(order_count, 0) as avg_order_value
            FROM analytics.daily_revenue
        ");

        DB::connection('pgsql-analytics')->statement("
            CREATE UNIQUE INDEX idx_mv_daily_kpi_date ON analytics.mv_daily_kpi (date)
        ");
    }
}
```

### Read-only analytics user for BI tools
```sql
CREATE USER analytics_reader WITH PASSWORD '...';
GRANT USAGE ON SCHEMA analytics TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
    GRANT SELECT ON TABLES TO analytics_reader;
```

## Related Topics
- **K008 (CQRS Read Models):** Analytics tables ARE read models in the `analytics` schema.
- **K006 (Star Schema):** Fact/dimension tables created in `analytics` schema.
- **K023 (Grafana/Metabase):** BI tools configured with read-only access to `analytics` schema.

## AI Agent Notes
- Start with schema separation — zero-cost, high-value architectural improvement.
- Use a dedicated database connection for analytics with `search_path` set.
- Use schema-qualified names in migrations: `Schema::create('analytics.daily_revenue', ...)`.
- Create a read-only database user for BI tools on the analytics schema.
- Always add unique indexes to materialized views for CONCURRENTLY refreshes.
- Use clearly different table names from operational tables (avoid `analytics.users`).

## Verification
- [ ] Analytics database connection has `search_path` set to `analytics,public`.
- [ ] All analytics tables are created in the `analytics` schema — zero analytics tables in `public`.
- [ ] Materialized views have unique indexes for CONCURRENTLY refresh.
- [ ] A read-only database user exists with access only to the `analytics` schema.
- [ ] MV freshness is monitored — alerts trigger when age exceeds 2x refresh interval.
- [ ] Table names are distinct from operational tables (no `analytics.users`, `analytics.orders`).
- [ ] The `analytics` schema supports custom autovacuum settings for large append-heavy tables.
