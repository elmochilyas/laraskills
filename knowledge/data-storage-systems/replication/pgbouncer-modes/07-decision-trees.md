# 7-18 Pgbouncer Modes - Decision Trees

## Pooling Mode Selection

---

## Decision Context

Choosing between session, transaction, and statement pooling modes in PgBouncer for PostgreSQL — balancing connection efficiency against application compatibility.

---

## Decision Criteria

* performance: transaction pooling gives 10-50x connection reduction; session pooling gives 1x
* architectural: session pooling preserves all PostgreSQL features; transaction pooling breaks session-level features
* maintainability: transaction pooling requires application audit; session pooling is drop-in

---

## Decision Tree

Does the application use session-level features (SET SESSION, LISTEN/NOTIFY, temp tables, cursors, named prepared statements)?

YES → Use session pooling

    ↓
    pool_mode = session
    default_pool_size = connections_needed (close to max_connections)
    
    ↓
    Pro: Full PostgreSQL compatibility
    Pro: No application changes needed
    Pro: Still reduces connections vs direct (idle timeout)
    
    ↓
    Con: One connection per client (least efficient)
    Con: Higher PostgreSQL connection count

NO → Does the application use prepared statements?

    YES → Use transaction pooling with ATTR_EMULATE_PREPARES
        
        ↓
        pool_mode = transaction
        Laravel: 'options' => [PDO::ATTR_EMULATE_PREPARES => true]
        
        ↓
        Prepared statements are session-level — fail in transaction mode
        Emulated prepares are per-request, not persistent across connections
        10-50x connection reduction
        Negligible performance impact vs real prepared statements

NO → Standard web application (short-lived transactions)?

    → Use transaction pooling (recommended default)
    pool_mode = transaction
    default_pool_size = 25
    max_client_conn = 200
    No session-level features to worry about
    Maximum connection efficiency

---

## Recommended Default

**Default:** Transaction pooling for web applications; session pooling only when app requires session-level features
**Reason:** Transaction pooling provides 10-50x connection reduction. Only incur the session pooling cost when app features mandate it.

---

## Statement Pooling Viability

---

## Decision Context

Evaluating whether statement pooling (`pool_mode = statement`) is appropriate — returning the connection to the pool after each individual statement.

---

## Decision Criteria

* performance: statement pooling is technically fastest (connection freed immediately)
* architectural: breaks transactions (connection changes between statements)
* maintainability: extremely limited — only stateless single-statement usage

---

## Decision Tree

Single-statement-only application (no multi-statement transactions)?

YES → Can use statement pooling

    ↓
    pool_mode = statement
    Connection returned to pool after each statement
    Fastest mode — zero transaction overhead
    
    ↓
    Con: NO transaction support across statements
    Con: NO session state of any kind
    Con: Extremely rare use case

NO → Multi-statement transactions required?

    YES → Use transaction pooling
        
        ↓
        If transaction mode works (no session features)
        Switch to transaction pooling — supports transactions
        
        ↓
        If session features are needed → session pooling
        Statement pooling is never the right choice

NO → Standard web application?

    → Never use statement pooling
    Virtually all web apps need multi-statement transactions
    Statement pooling will silently break transaction atomicity
    If in doubt: choose transaction pooling over statement pooling

---

## Recommended Default

**Default:** Never use statement pooling for web applications
**Reason:** Statement pooling breaks transaction boundaries. Transaction pooling provides the same efficiency with full transaction support.

---

## Related Rules

* Rule 7-18-1: Prefer Transaction Pooling for Web Applications
* Rule 7-18-2: Never Use Statement Pooling with Web Applications
* Rule 7-18-3: Always Test Application Features Against Chosen Pool Mode

---

## Related Skills

* Select and Configure pgbouncer Pooling Mode
* Troubleshoot pgbouncer Pooling Mode Issues
