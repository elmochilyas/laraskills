# 10.10 Transaction Pooling Limitations - Decision Trees

## Transaction Pooling vs Session Pooling: Compatibility vs Efficiency

---

## Decision Context

Choosing between transaction pooling (maximum connection multiplexing) and session pooling (full compatibility with session state) based on application requirements.

---

## Decision Criteria

* performance: transaction pooling gives 5-10× multiplexing; session pooling gives ~1×
* architectural: session state (SET, LISTEN, temp tables) incompatible with transaction pooling
* maintainability: transaction pooling requires `PDO::ATTR_EMULATE_PREPARES` and no session state
* security: without `DISCARD ALL`, state leaks between connections in transaction pooling

---

## Decision Tree

Which pooling mode for your application?

↓

Application uses PostgreSQL LISTEN/NOTIFY?

YES → Must use session pooling

    ↓
    LISTEN registration is per-connection
    Lost when connection returns to pool in transaction mode
    Dedicated session-mode port for notification listeners

NO → Application uses temporary tables across transactions?

    YES → Must use session pooling
    
        ↓
    Temporary tables are per-session
    Disappear in transaction pooling when connection returns
    Consider CTEs or subqueries as alternatives

NO → Application uses SET SESSION variables?

    YES → Can use transaction pooling with per-transaction SET LOCAL
    
        ↓
        Replace SET SESSION with SET LOCAL inside transactions
        Or move session state to application layer (PHP)
        Verify no middleware executes SET SESSION commands

NO → Standard Laravel web app?

    → Transaction pooling is recommended
    Must enable: `PDO::ATTR_EMULATE_PREPARES = true`
    Must configure: `server_reset_query = DISCARD ALL`
    
    ↓
    Provides 5-10× multiplexing efficiency
    50 backend connections serve 250-500 PHP-FPM workers

---

## Recommended Default

**Default:** Transaction pooling for web traffic; session pooling for admin tools
**Reason:** Transaction pooling maximizes connection efficiency for typical Laravel workloads. A separate session-mode port handles admin tools that need session state.

---

## DISCARD ALL vs RESET ALL

---

## Decision Context

Choosing the right connection reset query for PgBouncer to prevent cross-request state leakage while preserving performance.

---

## Decision Criteria

* performance: DISCARD ALL drops prepared statements, temp tables, advisory locks
* architectural: RESET ALL only resets GUC parameters — insufficient for full isolation
* maintainability: configured once in PgBouncer config
* security: MUST prevent state leakage between connections

---

## Decision Tree

Which server_reset_query?

↓

Using transaction pooling?

YES → Use `server_reset_query = DISCARD ALL`

    ↓
    Resets: GUC parameters, prepared statements, temp tables, advisory locks, LISTEN registrations
    Essential — without it, next user on same connection inherits previous state
    Non-negotiable for security (cross-request data leak)

NO → Session pooling?

    YES → `RESET ALL` is sufficient
    
        ↓
        Session pool: same client holds connection for entire session
        No cross-request state leakage risk
        RESET ALL cleans GUC parameters only

NO → Direct connections (no pooler)?

    → No reset query needed
    Connection created per request (PHP-FPM)
    No state persists between requests

---

## Recommended Default

**Default:** `server_reset_query = DISCARD ALL` for all PgBouncer configurations
**Reason:** DISCARD ALL provides complete isolation. The performance cost is negligible compared to the security risk of state leakage.

---

## Related Rules

* Rule 10-3-1: Always Use Transaction Mode for Laravel
* Rule 10-3-2: Always Enable PDO::ATTR_EMULATE_PREPARES with Transaction Pooling

---

## Related Skills

* Configure PgBouncer Pooling Modes
