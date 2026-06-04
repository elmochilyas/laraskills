# Rules: Grafana/Metabase Read-Only Integration

## Rule GM-01: Read-Only Database User
BI tool database connections MUST use a database user with SELECT-only privileges. INSERT, UPDATE, DELETE, and DDL privileges must be explicitly revoked.

## Rule GM-02: Schema-Scoped Access
The BI tool's database user MUST be restricted to a dedicated `analytics` schema or specific set of analytics tables. Operational tables must not be accessible.

## Rule GM-03: Use Read Replica
BI tools MUST connect to a read replica, not the primary database. If no read replica exists, one must be provisioned before BI tool integration.

## Rule GM-04: Set Statement Timeout
BI tool database connections MUST have a configured `statement_timeout` (PostgreSQL) or equivalent. Default timeout: 30 seconds.

## Rule GM-05: Use Connection Pooling
BI tools MUST connect through a connection pool (e.g., PgBouncer). Direct database connections from BI tools must not exceed available connection slots.

## Rule GM-06: Monitor BI Queries
Slow queries from BI tools MUST be monitored and alerted. Queries exceeding 5 seconds require optimization or materialized view creation.

## Rule GM-07: Implement RLS for Multi-Tenant
Multi-tenant applications MUST implement Row-Level Security for BI tool connections. Each tenant's data must be isolated.

## Rule GM-08: Document Available Tables
The analytics schema tables and views MUST be documented for BI tool users. Table descriptions must be maintained.

## Rule GM-09: Schedule Analytics Refresh
Materialized views in the analytics schema MUST have a documented refresh schedule. Stale data in BI tools must be communicated.

## Rule GM-10: No DDL from BI Tools
BI tool database user MUST NOT have CREATE, ALTER, or DROP privileges. Schema changes must go through Laravel migrations.
