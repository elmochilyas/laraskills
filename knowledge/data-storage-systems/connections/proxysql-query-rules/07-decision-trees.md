# 10.15 ProxySQL Query Rules and Connection Handling - Decision Trees

## ProxySQL Query Routing: Read/Write Splitting Strategy

---

## Decision Context

Configuring ProxySQL query rules to route SELECT queries to read replicas and write queries (including SELECT FOR UPDATE) to the primary.

---

## Decision Criteria

* performance: ProxySQL adds <0.1ms per query; query caching can reduce DB load 50-90%
* architectural: routing rules centralize logic — eliminates Laravel read/write config
* maintainability: rules must be ordered by priority (lower rule_id = higher)
* security: FOR UPDATE queries must always go to primary

---

## Decision Tree

How to route queries through ProxySQL?

↓

Query is SELECT ... FOR UPDATE?

YES → Route to hostgroup 0 (primary) — rule_id = 1

    ↓
    FOR UPDATE acquires write locks
    Read replicas cannot handle write locks
    Priority: highest (rule_id = 1) — must match before general SELECT
    Example: ^SELECT.*FOR UPDATE → hostgroup 0

NO → Query is regular SELECT (no FOR UPDATE)?

    YES → Route to hostgroup 1 (replicas) — rule_id = 2
    
        ↓
    All read-only SELECTs go to replicas
    Round-robin across replicas in hostgroup
    Example: ^SELECT → hostgroup 1 (apply=1)

NO → All other queries (INSERT, UPDATE, DELETE)?

    → Route to hostgroup 0 (primary) — rule_id = 3
    Default catch-all rule
    All writes go to primary
    
    ↓
    Rule priority order:
    1. FOR UPDATE → primary
    2. SELECT → replicas
    3. Everything else → primary

---

## Recommended Default

**Default:** Three-rule setup: FOR UPDATE→primary, SELECT→replicas, catch-all→primary
**Reason:** Correct rule ordering prevents FOR UPDATE queries from hitting read-only replicas. ProxySQL routing simplifies Laravel config (no read/write arrays needed).

---

## Connection Multiplexing: Enable or Disable

---

## Decision Context

Choosing whether to enable ProxySQL's connection multiplexing, which shares backend connections across clients but has the same session-state limitations as PgBouncer transaction pooling.

---

## Decision Criteria

* performance: multiplexing reduces backend connections by 5-10×
* architectural: incompatible with session state (SET, temp tables)
* maintainability: disable if application uses session-level variables
* security: state leakage between clients without multiplexing isolation

---

## Decision Tree

Enable ProxySQL connection multiplexing?

↓

Application uses SET SESSION, temporary tables, or session-level variables?

YES → Disable multiplexing (mysql-multiplexing = false)

    ↓
    Session state leaks between clients with multiplexing enabled
    Each client needs dedicated backend connection for session state
    Oracle's PDO may still work if only prepared statements are used
    
    ↓
    Test thoroughly — some Laravel packages use SET SESSION
    Safer to disable multiplexing unless proven compatible

NO → Standard Laravel app with PDO::ATTR_EMULATE_PREPARES?

    YES → Enable multiplexing (mysql-multiplexing = true, default)
    
        ↓
    Provides 5-10× connection reduction
    Requires: no SET SESSION, no temp tables, no LISTEN/NOTIFY
    Same constraints as PgBouncer transaction pooling
    
    ↓
    Verify: PDO::ATTR_EMULATE_PREPARES = true
    Verify: no SET SESSION commands in middleware
    Verify: server_reset_query configured

---

## Recommended Default

**Default:** Enable multiplexing for standard Laravel apps; disable if session state is used
**Reason:** Multiplexing significantly reduces backend connections. The constraints are well-understood and manageable for typical Laravel applications.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Configure Read/Write Connection Separation
* Configure ProxySQL Query Rules
