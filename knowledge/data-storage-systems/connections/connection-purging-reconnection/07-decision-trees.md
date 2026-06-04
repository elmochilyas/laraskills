# 10.6 Connection Purging and Reconnection - Decision Trees

## When to Use DB::purge vs DB::reconnect

---

## Decision Context

Choosing between `DB::purge()` (remove from resolver) and `DB::reconnect()` (purge + immediate connect) for runtime connection switching.

---

## Decision Criteria

* performance: purge is <0.01ms; reconnect adds 1-50ms connection latency
* architectural: reconnect eagerly creates connection; purge lazily creates on first query
* maintainability: reconnect is simpler (one call instead of two)
* security: purge ensures stale credentials are garbage collected

---

## Decision Tree

Need to switch database connection at runtime?

↓

Is there a config change (host, database, credentials)?

YES → Is an immediate query needed after the switch?

    YES → Use DB::reconnect(name)
    
        ↓
        Atomic: purge + connect in one call
        Returns new connection ready for use
        Preferred for failover and tenant switching
        
    NO → Use DB::purge(name)
    
        ↓
        Remove from resolver only
        Next query lazily creates connection
        Slightly faster if first query is not immediate

NO → No config change — just stale connection?

    → Use DB::reconnect(name)
    No config change needed — recreate connection
    Purge alone won't help (same config, same stale PDO)

---

## Recommended Default

**Default:** `DB::reconnect($name)` — always prefer reconnect over purge
**Reason:** Reconnect is atomic and reduces the window where stale connections could be used. It handles both config-change and stale-connection scenarios.

---

## Handling Model State After Purge

---

## Decision Context

Managing Eloquent model instances that were hydrated before a connection purge — they hold stale references to the old PDO object.

---

## Decision Criteria

* performance: re-hydrating models adds query overhead
* architectural: model instances cache their connection reference
* maintainability: must re-query or use `fresh()` after purge
* security: stale models could read from wrong database

---

## Decision Tree

Models loaded before connection switch?

↓

Do loaded models need to query again?

YES → Use `$model->fresh()` or re-query

    ↓
    fresh() re-fetches from DB using new connection
    Re-query using the model class (not instance)
    
    ↓
    Model instances loaded before purge → old connection reference
    Queries on loaded model after purge → may use stale PDO
    Always re-hydrate after switching connections

NO → Models are read-only (display only)?

    → Safe to reuse old model instances
    No further queries will be made on them
    Display data from old connection is acceptable

---

## Recommended Default

**Default:** Call `$model->fresh()` on any model that will query after a connection switch
**Reason:** Loaded models cache their PDO reference. Without re-hydrating, subsequent queries may silently use the wrong database.

---

## Related Rules

* Rule 10-5-1: Always Purge After Config Change
* Rule 10-2-4: Consider Architecture Guidelines

---

## Related Skills

* Manage Dynamic Connection Configuration
* Configure Tenant-Aware Middleware
