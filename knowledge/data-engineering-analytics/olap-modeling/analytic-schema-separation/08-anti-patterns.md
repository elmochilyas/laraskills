# Anti-Patterns: PostgreSQL Analytic Schema Separation

## Metadata

| | |
|---|---|
| **KU ID** | K019 |
| **Subdomain** | Read Models & CQRS for Analytics |
| **Topic** | Analytic Schema Separation |
| **Complexity** | Advanced |
| **Maturity** | Growing |
| **Domain** | Data Engineering & Analytics |
| **Subdomain Path** | 05-olap-modeling/read-models |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Granting ALL PRIVILEGES on the Analytics Schema | Security | Critical |
| 2 | Using the Default Connection for Analytics | Reliability | High |
| 3 | Never Using Schema Separation | Design | Medium |
| 4 | No Unique Index on Materialized Views | Reliability | High |
| 5 | Cross-Schema Naming Collisions | Maintainability | Medium |

## Repository-Wide Anti-Patterns

- **All-Privileges-Analytics**: Giving `ALL PRIVILEGES ON SCHEMA analytics TO dashboard_role`
- **Default-Connection-Analytics**: Running analytics queries on the same database connection without configuring `search_path`
- **Public-Mess**: Keeping all tables in `public` schema with no separation

---

## 1. Granting ALL PRIVILEGES on the Analytics Schema

**Category:** Security

**Description:** Giving `ALL PRIVILEGES ON SCHEMA analytics TO dashboard_role`, allowing the BI tool user to create, alter, and drop tables.

**Why It Happens:** Convenience — `ALL PRIVILEGES` is the default grant. Developers do not think about what the BI tool user actually needs.

**Warning Signs:**
- BI tool database user has `ALL PRIVILEGES` on the analytics schema
- BI tool can CREATE, ALTER, or DROP tables
- No separation between read-only and read-write users
- Grant audit shows `ALL PRIVILEGES` for non-admin roles

**Why Harmful:** A compromised BI tool credential can destroy all analytics data. The dashboard user can drop tables, alter schemas, or create tables that conflict with ETL processes. A single SQL injection in an embedded dashboard query can delete the entire analytics schema.

**Consequences:**
- Accidental or malicious table drops
- Schema corruption from BI tool operations
- Data loss from compromised credentials
- Difficulty auditing who changed what

**Alternative:** Grant only `USAGE, SELECT` for read-only access. Use separate roles for read-only dashboards and read-write ETL.

**Refactoring Strategy:**
1. Create a dedicated read-only role for BI tools
2. Revoke `ALL PRIVILEGES` from the BI tool user
3. Grant `USAGE ON SCHEMA analytics` and `SELECT ON ALL TABLES IN SCHEMA analytics`
4. Set default privileges for future tables
5. Rotate BI tool credentials

**Detection Checklist:**
- [ ] Is there a read-only user for BI tools?
- [ ] Is `ALL PRIVILEGES` granted to any non-admin role?
- [ ] Can the BI tool user create or drop tables?
- [ ] Are default privileges configured?

**Related Rules/Skills/Trees:**
- Rule: Create Read-Only User for BI Tools (`04-standardized-knowledge.md:36-37`)

---

## 2. Using the Default Connection for Analytics

**Category:** Reliability

**Description:** Running analytics queries on the same database connection as application queries without configuring `search_path`.

**Why It Happens:** Simplicity — one connection for everything. Developers do not set up a dedicated analytics connection.

**Warning Signs:**
- Analytics models use the default `pgsql` connection
- No `search_path` configured for analytics
- Queries fail with "table not found" for analytics tables
- Connection is shared between operational and analytical queries

**Why Harmful:** The connection might have `search_path = public`, so `DailyRevenue::all()` fails if the table is in the `analytics` schema. When it works, analytical queries compete with operational queries for the same connection pool, causing performance contention.

**Consequences:**
- "Table not found" errors for analytics models
- Analytics queries contend with operational traffic
- Harder to monitor analytics query performance
- Connection pool exhaustion from analytical workloads

**Alternative:** Use a dedicated `pgsql-analytics` connection with `'search_path' => 'analytics,public'`.

**Refactoring Strategy:**
1. Create a dedicated analytics database connection
2. Set `search_path` to `analytics,public`
3. Update analytics models to use the new connection
4. Route analytics queries through the dedicated connection

**Detection Checklist:**
- [ ] Is there a dedicated analytics database connection?
- [ ] Is `search_path` configured for analytics connections?
- [ ] Do analytics models use the correct connection?
- [ ] Is query performance monitored per connection?

**Related Rules/Skills/Trees:**
- Rule: Create Dedicated Analytics Connection (`04-standardized-knowledge.md:34-35`)

---

## 3. Never Using Schema Separation

**Category:** Design

**Description:** Keeping all tables — operational and analytical — in the `public` schema with no separation.

**Why It Happens:** No immediate pain. The application works, so schema separation seems unnecessary.

**Warning Signs:**
- All tables in `public` — `public.orders`, `public.daily_revenue`, `public.user_summary`
- No clear boundary between operational and analytical tables
- Permission control is all-or-nothing
- Unqualified table names are ambiguous

**Why Harmful:** As the project grows, the `public` schema becomes a mess of operational and analytical tables with no clear ownership. Permissions cannot be granted granularly (you cannot give read-only access to analytics without exposing operational tables). Schema separation is a one-line setup that pays dividends forever.

**Consequences:**
- Cannot grant analytics-only access to BI tools
- Operational and analytical tables mixed together
- Harder to find and maintain tables
- Migration to dedicated analytics infrastructure is harder

**Alternative:** Create an `analytics` schema and move all analytical tables there. Schema separation is a one-time setup that prevents years of pain.

**Refactoring Strategy:**
1. Create the `analytics` schema
2. Create new tables in the `analytics` schema
3. Move existing analytical tables via `CREATE TABLE analytics.x AS SELECT * FROM public.x` + drop
4. Update models to use `analytics.` prefix
5. Configure read-only user for analytics schema

**Detection Checklist:**
- [ ] Are there analytical tables in the `public` schema?
- [ ] Is there an `analytics` schema?
- [ ] Can BI tools access analytics without seeing operational tables?
- [ ] Is schema separation documented?

**Related Rules/Skills/Trees:**
- Rule: Use Schema Separation from Day One (`04-standardized-knowledge.md:34-36`)

---

## 4. No Unique Index on Materialized Views

**Category:** Reliability

**Description:** Creating a materialized view without a unique index, then calling `REFRESH MATERIALIZED VIEW CONCURRENTLY` which fails silently.

**Why It Happens:** Developers assume CONCURRENTLY works without additional setup. The documentation requirement for a unique index is easy to miss.

**Warning Signs:**
- MV refresh uses `CONCURRENTLY`
- MV has no unique index
- Dashboard data goes stale without errors
- `REFRESH` command succeeds but data is not updated

**Why Harmful:** `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index — without one, the operation fails silently. No error, no warning, but the MV is not updated. Dashboard data goes stale. The only way to detect the failure is to check the MV's age.

**Consequences:**
- Stale dashboard data without any error signal
- Silent failures that are only noticed by users
- Data freshness cannot be trusted
- Time wasted debugging "why is the dashboard not updating"

**Alternative:** Always add a unique index after creating an MV. Verify the refresh is working by checking the MV's age.

**Refactoring Strategy:**
1. Add a unique index to all MVs without one
2. Verify each MV's refresh works
3. Set up monitoring on MV freshness
4. Add unique index creation to the migration template

**Detection Checklist:**
- [ ] Does every MV have a unique index?
- [ ] Is CONCURRENTLY refresh used without a unique index?
- [ ] Is MV freshness monitored?
- [ ] Are there alerts for stale MVs?

**Related Rules/Skills/Trees:**
- Rule: Add Unique Index to Every Materialized View (`04-standardized-knowledge.md:38`)

---

## 5. Cross-Schema Naming Collisions

**Category:** Maintainability

**Description:** Using the same table name in both `public` and `analytics` schemas — e.g., `public.users` and `analytics.users`.

**Why It Happens:** Developers use natural names without considering schema qualification. The table needs a name, and `users` is the obvious choice.

**Warning Signs:**
- `analytics.users` and `public.users` both exist
- Unqualified `users` in queries returns the wrong table
- Developers frequently confused about which `users` they are querying
- Production incidents from queries hitting the wrong table

**Why Harmful:** Unqualified `users` in queries returns the wrong table depending on `search_path`. If `search_path = analytics,public`, unqualified `users` points to `analytics.users`. A developer running a migration against `public.users` while connected to the analytics connection quietly modifies the wrong table.

**Consequences:**
- Production incidents from wrong-table queries
- Developer confusion and lost productivity
- Data corruption from modifying the wrong table
- Code that relies on implicit schema resolution is fragile

**Alternative:** Use clearly different names for analytics tables. `analytics.user_summary`, `analytics.customer_metrics`, `analytics.daily_active_users` — never `analytics.users`.

**Refactoring Strategy:**
1. Rename any analytics tables that share names with operational tables
2. Update all references to use the new names
3. Add a CI check that prevents naming collisions
4. Document the naming convention

**Detection Checklist:**
- [ ] Do any analytics tables share names with operational tables?
- [ ] Are all queries schema-qualified or using consistent names?
- [ ] Is there a naming convention for analytics tables?
- [ ] Are there CI checks for naming collisions?

**Related Rules/Skills/Trees:**
- Rule: Use Distinct Names for Analytics Tables (`04-standardized-knowledge.md:37`)
