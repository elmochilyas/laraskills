# 7-17 Proxysql Query Routing - Decision Trees

## SELECT FOR UPDATE Routing

---

## Decision Context

Creating ProxySQL query rules that correctly route `SELECT ... FOR UPDATE` to the write primary while routing regular `SELECT` queries to read replicas.

---

## Decision Criteria

* performance: FOR UPDATE must go to primary to get correct locks
* architectural: rule ordering matters — FOR UPDATE rule must precede generic SELECT
* maintainability: missing FOR UPDATE rule causes locking bugs

---

## Decision Tree

Query contains FOR UPDATE?

YES → Route to writer hostgroup (primary)

    ↓
    Rule 1: ^SELECT.*FOR UPDATE → hostgroup 0 (writers)
    Priority: highest (must match before generic SELECT)
    
    ↓
    SELECT ... FOR UPDATE needs row locks
    Replicas are read-only — can't acquire locks
    Correct locks on primary maintain data consistency

NO → Query is plain SELECT?

    YES → Route to reader hostgroup (replicas)
        
        ↓
        Rule 2: ^SELECT → hostgroup 1 (readers)
        Lower priority than FOR UPDATE rule
        
        ↓
        All regular SELECT queries go to replicas
        Read scaling, reduced primary load

NO → Any other query (INSERT, UPDATE, DELETE, DDL, etc.)?

    → Default: route to writer hostgroup (primary)
    All non-SELECT queries go to primary
    Includes DDL, SET, transactions

---

## Recommended Default

**Default:** FOR UPDATE rule (priority 1) → writers; SELECT rule (priority 2) → readers; default → writers
**Reason:** FOR UPDATE must acquire locks on the primary. Rule ordering prevents FOR UPDATE from matching the generic SELECT rule.

---

## ProxySQL vs Laravel Routing

---

## Decision Context

Choosing between ProxySQL-level query routing (transparent to application) and Laravel-level routing (read/write config in database.php) for read/write splitting.

---

## Decision Criteria

* performance: ProxySQL adds <0.5ms per query; Laravel routing is application-level
* architectural: ProxySQL routing is database-agnostic; Laravel routing is framework-native
* maintainability: ProxySQL rules are infrastructure; Laravel config is in code

---

## Decision Tree

Need connection pooling alongside routing?

YES → Use ProxySQL

    ↓
    ProxySQL provides:
    - Read/write query routing
    - Connection pooling (reduce replica connections)
    - Health checks and auto-failover
    - Query caching and firewall
    
    ↓
    Laravel connects to ProxySQL (single DB_HOST)
    All routing handled by ProxySQL rules

NO → Need complex query-level routing?

    YES → ProxySQL advanced rules
        
        ↓
        Regex-based: route specific queries to specific hostgroups
        User-based: admin reads from primary, users from replicas
        Digest-based: route known heavy queries to dedicated replicas

NO → Simple read/write split sufficient?

    → Use Laravel config
    'read' => ['host' => ['replica1']], 'write' => ['host' => ['primary']]
    No external infrastructure needed
    Simpler for small-to-medium deployments

---

## Recommended Default

**Default:** Laravel config for simple deployments; ProxySQL when connection pooling or advanced routing is needed
**Reason:** Laravel config is zero-infrastructure. ProxySQL justifies its complexity when pooling, health checks, or fine-grained routing rules are required.

---

## Related Rules

* Rule 7-17-1: Always Route SELECT...FOR UPDATE to Primary
* Rule 7-17-2: Place FOR UPDATE Rules Before Generic SELECT Rules

---

## Related Skills

* Configure ProxySQL Read/Write Query Routing
* Write ProxySQL Query Rules for Advanced Routing
