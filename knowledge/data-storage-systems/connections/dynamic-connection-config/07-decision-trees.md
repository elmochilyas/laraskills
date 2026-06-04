# 10.5 Dynamic Connection Configuration - Decision Trees

## Dynamic Connection Strategy: When and How to Switch

---

## Decision Context

Choosing whether to use dynamic connection configuration at runtime, and selecting the right approach for switching between databases in multi-tenant, sharded, or failover scenarios.

---

## Decision Criteria

* performance: `DB::purge()` + reconnect adds 1-50ms per switch
* architectural: dynamic connections add complexity; only use when necessary
* maintainability: must pair config change with purge — missing purge is the most common bug
* security: credentials in dynamic config must come from trusted sources

---

## Decision Tree

Need to switch database at runtime?

↓

Multi-tenant with database-per-tenant?

YES → Use middleware + named connection

    ↓
    Define `tenant` connection template in config/database.php
    In middleware: config()->set() database name → DB::purge('tenant')
    Each request switches once — acceptable 1-50ms overhead
    
    ↓
    Use `DB::reconnect()` for atomic switch
    Tag connection with tenant ID for observability

NO → Sharded database (per-model shard routing)?

    YES → Use model getConnectionName() override
    
        ↓
        Define shard connections in config (shard_0, shard_1, etc.)
        Model::getConnectionName() returns shard name based on attribute
        No manual purge needed — resolved lazily
        
        ↓
        Pre-define all shard connections
        Never create connection names dynamically — risk of SQL injection

NO → Failover or credential rotation?

    YES → Use try-catch with DB::reconnect()
    
        ↓
        Detect connection failure → update config → DB::reconnect()
        Wrap in retry loop with backoff
        Log all connection switches for audit trail

NO → Simple single-database app?

    → Do NOT use dynamic connections
    Shared-table tenancy uses global scopes, not connection switching
    Dynamic config adds unnecessary complexity and failure points

---

## Recommended Default

**Default:** Named connection + middleware + DB::purge() for multi-tenant; getConnectionName() for sharding
**Reason:** Each pattern has a clear match. Middleware for per-request switching; model override for per-instance routing.

---

## Purge/Reconnect vs getConnectionName for Model Routing

---

## Decision Context

Choosing between manual connection switching (config + purge + reconnect) and Eloquent's `getConnectionName()` for routing model queries to different databases.

---

## Decision Criteria

* performance: purge/reconnect per request vs lazy resolution per model
* architectural: purge affects whole request; getConnectionName is per-model
* maintainability: getConnectionName is cleaner but requires predefined connections
* security: dynamic connection names must be validated

---

## Decision Tree

How to route models to different databases?

↓

Switch applies to ALL queries in the request?

YES → Use config + DB::purge() (middleware pattern)

    ↓
    e.g., "All queries for tenant X go to database Y"
    Single switch per request in middleware
    All subsequent queries use the same connection
    
    ↓
    Pro: Simple, one purge per request
    Con: Cannot mix tenants in same request easily

NO → Switch per model instance?

    YES → Use getConnectionName() on the model
    
        ↓
        e.g., "Order #123 is on shard_2"
        Override getConnectionName() to return connection name
        Different models can use different connections in the same request
        
        ↓
        Pro: Granular, lazy resolution, no manual purge
        Con: All shard connections must be predefined in config

NO → Switching per query?

    → Use DB::connection('name') facade method
    Explicit connection per query without purging default
    Suitable for one-off cross-database queries

---

## Recommended Default

**Default:** Middleware + purge for tenant switching; getConnectionName() for shard routing
**Reason:** Match the scope of the switch to the mechanism. Per-request = middleware. Per-model = getConnectionName. Per-query = DB::connection().

---

## Related Rules

* Rule 10-5-1: Always Purge After Config Change
* Rule 10-2-4: Consider Architecture Guidelines

---

## Related Skills

* Manage Connection Purging and Reconnection
* Configure Tenant-Aware Middleware
