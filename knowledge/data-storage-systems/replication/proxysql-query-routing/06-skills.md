# Skill: Configure ProxySQL Read/Write Query Routing

## Purpose

Set up ProxySQL to automatically route SELECT queries to read replicas and all other queries (INSERT, UPDATE, DELETE, DDL) to the primary write node based on query rules.

## When To Use

- Laravel application with MySQL and multiple read replicas
- Need transparent read/write splitting without application code changes
- ProxySQL already deployed for connection pooling

## When NOT To Use

- PostgreSQL (ProxySQL is MySQL-only — use pgbouncer or pgpool)
- Single database node (no splitting needed)
- Application needs database-agnostic abstraction

## Prerequisites

- ProxySQL installed and running
- MySQL primary and replica(s) accessible from ProxySQL
- MySQL users configured in ProxySQL

## Inputs

- Primary MySQL hostname and port
- Replica MySQL hostnames and ports
- ProxySQL admin credentials
- Query classification rules (SELECT vs non-SELECT)

## Workflow (numbered steps)

1. Add servers to ProxySQL:
   - Writer hostgroup (0): primary host
   - Reader hostgroup (1): all replica hosts
2. Configure query rules in order of priority:
   - Rule 1: `^SELECT.*FOR UPDATE` → hostgroup 0 (writes need primary)
   - Rule 2: `^SELECT` → hostgroup 1 (reads go to replicas)
   - Rule 3: default → hostgroup 0 (all other queries)
3. Configure monitoring user for health checks
4. Load rules to runtime: `LOAD MYSQL QUERY RULES TO RUNTIME`
5. Save to disk: `SAVE MYSQL QUERY RULES TO DISK`
6. Configure Laravel `.env`: point `DB_HOST` to ProxySQL address
7. Test: verify SELECT queries route to replicas, INSERT/UPDATE to primary

## Validation Checklist

- [ ] SELECT queries (non-FOR UPDATE) hit replicas
- [ ] SELECT...FOR UPDATE queries hit primary
- [ ] INSERT, UPDATE, DELETE queries hit primary
- [ ] DDL (ALTER, CREATE, DROP) queries hit primary
- [ ] ProxySQL stats show correct hostgroup distribution

## Common Failures

- `SELECT ... FOR UPDATE` routed to replica — stale locks and data
- Rules in wrong order: FOR UPDATE rule must come before generic SELECT rule
- Proxysql config not saved to disk — lost on restart
- Monitoring user missing — ProxySQL can't health-check servers
- Replica lag unknown to ProxySQL (ProxySQL doesn't check lag natively — use `max_replication_lag`)

## Decision Points

- Rule matching: regex vs digest vs user-based — regex is most flexible
- FOR UPDATE handling: must be first rule to catch before generic SELECT
- Default traffic: route unknown queries to primary as safe default

## Performance Considerations

- ProxySQL adds <0.5ms per query routing
- Query rule evaluation is linear (match first rule) — keep rules minimal (5-10)
- Connection pooling built-in reduces replica connection churn

## Security Considerations

- ProxySQL admin interface must be firewalled (port 6032)
- MySQL user passwords stored in ProxySQL — use encrypted credentials
- TLS between ProxySQL and MySQL is recommended
- ProxySQL should run in private subnet

## Related Rules

- 7-17-1: Always Route SELECT...FOR UPDATE to Primary
- 7-17-2: Place FOR UPDATE Rules Before Generic SELECT Rules

## Related Skills

- Configure Replica Load Balancing Strategy
- Configure Connection Pooling for Read Replicas
- Configure Automatic Query Routing (Laravel)

## Success Criteria

- 100% of SELECT queries (non-FOR UPDATE) routed to replicas
- 100% of write queries routed to primary
- Zero routing errors in ProxySQL logs

---

# Skill: Write ProxySQL Query Rules for Advanced Routing

## Purpose

Create custom ProxySQL query rules for routing specific queries to specific hostgroups based on patterns, users, or digest values.

## When To Use

- Need to route specific queries to specific replicas (e.g., heavy report queries to dedicated replica)
- Different application users need different routing policies
- Need to block or rewrite specific queries at the proxy level

## When NOT To Use

- Simple read/write splitting is sufficient
- Multiple ProxySQL instances would need rule synchronization

## Prerequisites

- ProxySQL installed with read/write splitting working
- List of queries to route differently
- ProxySQL admin access

## Inputs

- Query patterns to match (regex or digest)
- Target hostgroup for each pattern
- Optional: user-based routing rules
- Rule priority (lower number = higher priority)

## Workflow (numbered steps)

1. Capture query digests: `stats_mysql_query_digest` shows most common queries
2. Identify queries that need special routing: heavy reports, admin queries, maintenance
3. Create rules with higher priority than generic SELECT:
   - Rule for heavy report query → reporting replica hostgroup
   - Rule for admin user → primary or admin-specific replica
   - Rule for `SELECT ... FOR UPDATE` → primary
4. Test rules: run queries and verify they match expected hostgroup
5. Monitor `stats_mysql_query_digest` for unexpected matches (queries hitting wrong hostgroup)

## Validation Checklist

- [ ] Custom routing rules match the correct queries
- [ ] Rules are ordered correctly (specific → general)
- [ ] Default rules still handle unmatched queries correctly
- [ ] `stats_mysql_query_digest` shows correct hostgroup distribution

## Common Failures

- Regex too broad: matches unintended queries
- Regex too narrow: queries fall through to wrong default
- Rule priority incorrect: generic rule matches before specific rule
- Digest value changes after query format change — use regex for stability

## Decision Points

- Regex vs digest matching: regex is flexible, digest is exact and faster
- User-based matching: useful for admin queries that need consistent results
- Blacklist rules: route unwanted queries to "null" hostgroup to block

## Performance Considerations

- Each rule is evaluated in order — keep total rules under 50
- Regex matching is fast (<0.1ms per rule)
- Digest matching is faster (hash lookup) — prefer for known queries

## Security Considerations

- Rules can block dangerous queries (e.g., DROP without WHERE) — use blacklist rules
- Admin interface (port 6032) must be restricted
- Rule changes should be reviewed like code changes

## Related Rules

- 7-17-3: Always Test New Query Rules Before Production Deployment

## Related Skills

- Configure ProxySQL Read/Write Query Routing
- Dedicate Read Replicas by Workload Type

## Success Criteria

- All custom-routed queries hit correct hostgroups
- No unintended matches from broad patterns
- Zero blocked queries that should be allowed
