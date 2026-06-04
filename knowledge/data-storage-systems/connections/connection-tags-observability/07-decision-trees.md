# 10.8 Connection Tags and Observability - Decision Trees

## Connection Tagging Strategy: Static vs Dynamic Tags

---

## Decision Context

Choosing the right connection tagging approach — from static application_name in config to dynamic per-request tags — to enable effective database monitoring and debugging.

---

## Decision Criteria

* performance: SET application_name adds ~0.1ms per statement — negligible
* architectural: transaction pooling loses tags; must re-set per transaction
* maintainability: structured tags (pipe-delimited) enable better filtering
* security: avoid PII in tags; tenant IDs are acceptable

---

## Decision Tree

What level of connection tagging?

↓

Multi-tenant application needing per-tenant monitoring?

YES → Dynamic per-request tagging in middleware

    ↓
    Structured tag format: `purpose|env|tenant:id|user:id`
    Set via `DB::statement("SET application_name = '...'")`
    Override default from config/database.php
    
    ↓
    With PgBouncer transaction pooling:
    Tag must be re-set on every transaction start
    Or configure PgBouncer to inject tag via server_check_query

NO → Single-tenant or simple app?

    YES → Static tag in config/database.php
    
        ↓
        `'application_name' => env('APP_NAME').'|'.env('APP_ENV')`
        Purpose tags: `web`, `worker:horizon`, `worker:reporting`
        Visible in pg_stat_activity immediately
        
        ↓
        Differentiate by purpose: web vs Horizon vs CLI
        Each connection type gets its own tag
        
    NO → Non-production environment?
    
        → `application_name = 'dev|user.name'`
        Identify developer responsible for queries
        Helpful in shared dev databases

---

## Recommended Default

**Default:** Static purpose tag in config + dynamic tenant tag in middleware
**Reason:** Static tag identifies the application; dynamic tag identifies the tenant. Both are needed for effective monitoring.

---

## PgBouncer Transaction Pooling Tag Persistence

---

## Decision Context

Handling connection tag loss in PgBouncer transaction pooling, where `SET application_name` is lost when the connection returns to the pool.

---

## Decision Criteria

* performance: re-tagging costs ~0.1ms per transaction
* architectural: tags must survive connection return to pool
* maintainability: per-transaction SET vs PgBouncer-level config
* security: stale tags incorrectly attribute queries to wrong tenant

---

## Decision Tree

Using PgBouncer transaction pooling?

↓

Need per-tenant or per-request tags?

YES → Set application_name at transaction start

    ↓
    Option A: Laravel middleware executes SET on every request
    → Tag is lost on connection return; re-set on next request
    
    Option B: PgBouncer `server_check_query`
    → PgBouncer executes custom SQL on each new connection assignment
    → Cannot set dynamic tenant ID — only static app name
    
    Option C: DB::statement in service provider boot
    → Sets tag once per worker boot (Octane)
    → Persists across requests in same worker

NO → Static tags only?

    → Set in config/database.php
    Tag persists for connection lifetime
    Accept: all queries from this pool share the same tag

---

## Recommended Default

**Default:** Per-request SET in middleware (Option A) for tenant tagging; static config default for app identification
**Reason:** Dynamic tags provide tenant-level observability. The 0.1ms overhead is negligible compared to the debugging value.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Tag Connections for Observability
* Configure Dynamic Connection Configuration
