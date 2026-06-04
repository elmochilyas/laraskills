# PostgreSQL Analytic Schema Separation (public vs analytics)

## Rule 1: Dedicated Analytics Database Connection

### Category
Architecture

### Rule
Always create a dedicated database connection for the analytics schema with explicit `search_path` — never run analytics queries on the default application connection.

### Reason
Mixing `search_path` with the default connection risks exposing `public` tables to analytics queries or vice versa. A dedicated connection with `'search_path' => 'analytics,public'` ensures analytics tables resolve first while still allowing schema-qualified joins to operational data.

### Bad Example
```php
// Default connection — no search_path config
DailyRevenue::all(); // Fails: table not found in public schema
```

### Good Example
```php
'pgsql-analytics' => [
    'driver' => 'pgsql',
    'search_path' => 'analytics,public',
    // ...
]
```

### Exceptions
Single-schema databases with no analytics schema separation (not recommended for any production system).

### Consequences Of Violation
"Table not found" errors, connection confusion, inability to maintain clear schema boundaries, cross-contamination of query workloads.

---

## Rule 2: Schema-Qualified Table Names in Migrations

### Category
Code Organization

### Rule
Always use schema-qualified table names (`analytics.daily_revenue`) in analytics migrations — never create analytics tables in the `public` schema.

### Reason
The schema prefix explicitly documents the table's purpose and ownership. Creating analytics tables in `public` defeats the purpose of schema separation — all tables become mixed, and clear organizational boundaries are lost.

### Bad Example
```php
Schema::create('daily_revenue', function ($table) {
    // Created in public schema — no separation
});
```

### Good Example
```php
Schema::connection('pgsql-analytics')->create('analytics.daily_revenue', function ($table) {
    // Explicitly in analytics schema
});
```

### Exceptions
No common exceptions. Schema-qualified names cost nothing and provide permanent documentation.

### Consequences Of Violation
Schema separation is defeated, tables are mixed with operational data, naming collisions are possible, and BI tool scoping becomes impossible.

---

## Rule 3: Read-Only Database User for BI Tools

### Category
Security

### Rule
Always create a dedicated read-only database user scoped to the analytics schema for BI tools — never share the application database user with Metabase or Grafana.

### Reason
A BI tool connecting with write-capable credentials can accidentally DELETE or DROP tables through SQL queries. A read-only user limited to `USAGE, SELECT` on the analytics schema provides a security boundary even if the BI tool is compromised.

### Bad Example
```sql
-- Using application DB user — can delete analytics data
GRANT ALL PRIVILEGES ON SCHEMA analytics TO dashboard_role;
```

### Good Example
```sql
CREATE USER analytics_reader WITH PASSWORD '...';
GRANT USAGE ON SCHEMA analytics TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO analytics_reader;
```

### Exceptions
No common exceptions. Read-only BI users are non-negotiable for production deployments.

### Consequences Of Violation
Potential data loss from accidental DROP/DELETE, write conflicts with ETL pipelines, security vulnerability from compromised BI credentials.

---

## Rule 4: Unique Indexes on All Materialized Views

### Category
Reliability

### Rule
Always add a unique index to every materialized view that uses `CONCURRENTLY` refresh — never rely on `REFRESH MATERIALIZED VIEW CONCURRENTLY` without one.

### Reason
`REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index on the MV to perform the concurrent swap. Without it, the operation fails silently — no error is raised, no warning is logged, but the MV is not updated. Dashboard data goes stale without any alert.

### Bad Example
```sql
CREATE MATERIALIZED VIEW analytics.mv_daily_kpi AS SELECT ...;
-- No unique index — CONCURRENTLY refresh fails silently
```

### Good Example
```sql
CREATE MATERIALIZED VIEW analytics.mv_daily_kpi AS SELECT ...;
CREATE UNIQUE INDEX idx_mv_daily_kpi_date ON analytics.mv_daily_kpi (date);
-- CONCURRENTLY refresh works correctly
```

### Exceptions
Non-concurrent refresh (`REFRESH MATERIALIZED VIEW`) during maintenance windows with exclusive locks — not recommended for production.

### Consequences Of Violation
Silent MV refresh failures, stale dashboard data, undetected data freshness issues, user frustration with outdated reports.

---

## Rule 5: Distinct Naming for Analytics Tables

### Category
Code Organization

### Rule
Always use clearly distinct names for analytics tables (`user_summary`, `daily_revenue`) — never reuse operational table names (`analytics.users`, `analytics.orders`).

### Reason
Identical table names in `analytics` and `public` schemas create ambiguity. Unqualified queries return different results depending on `search_path` order. Developers become confused about which `users` table a query references.

### Bad Example
```php
// Ambiguous — both exist
Schema::create('analytics.users', function ($table) { ... });
Schema::create('public.users', function ($table) { ... });
```

### Good Example
```php
Schema::create('analytics.user_summary', function ($table) { ... });
// Operational table stays as users in public
```

### Exceptions
No common exceptions. Distinct naming eliminates a whole class of bugs.

### Consequences Of Violation
Ambiguous query results, data quality issues from reading the wrong table, developer confusion, time wasted debugging schema resolution.

---

## Rule 6: Monitor Materialized View Freshness

### Category
Maintainability

### Rule
Always monitor MV refresh age and alert when it exceeds 2x the scheduled interval — never deploy MVs without freshness monitoring.

### Reason
MVs can fail to refresh silently due to unique index issues, deadlocks, or server load. Without freshness monitoring, a failed refresh means stale dashboard data persists for days until users notice.

### Bad Example
```php
// MV scheduled for refresh but no monitoring
$schedule->command('analytics:refresh')->everyFifteenMinutes();
```

### Good Example
```php
// Monitor MV age
$age = DB::select("SELECT now() - mv.refresh_time AS age FROM mv_metadata");
if ($age > 30) { // 2x 15-minute interval
    alert("MV refresh delayed: {$age} minutes stale");
}
```

### Exceptions
Development and staging environments where data freshness is not critical.

### Consequences Of Violation
Stale dashboard data, undetected pipeline failures, delayed incident response, user frustration with outdated analytics.
