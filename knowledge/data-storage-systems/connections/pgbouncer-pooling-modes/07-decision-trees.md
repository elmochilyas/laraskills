# 10.3 PgBouncer Pooling Modes - Decision Trees

## PgBouncer Pooling Mode Selection: Transaction vs Session vs Statement

---

## Decision Context

Choosing between PgBouncer's three pooling modes — transaction, session, and statement — balancing connection multiplexing efficiency against application compatibility.

---

## Decision Criteria

* performance: transaction mode gives 5-10× multiplexing; session mode gives ~1×
* architectural: mode determines whether session state (prepared statements, SET, LISTEN/NOTIFY) persists
* maintainability: transaction mode requires `PDO::ATTR_EMULATE_PREPARES` and `DISCARD ALL`
* security: session state leaks possible without proper reset configuration

---

## Decision Tree

Which PgBouncer pooling mode?

↓

Is the application a Laravel web app?

YES → Use transaction mode (default_pool_size=50, max_client_conn=500)

    ↓
    Requires: `PDO::ATTR_EMULATE_PREPARES = true` in Laravel config
    Requires: `server_reset_query = DISCARD ALL` in PgBouncer config
    Requires: No SET SESSION commands in middleware
    
    ↓
    Multiplexing: 50 backend connections serve 250-500 PHP-FPM workers
    Session state lost between transactions — use SET LOCAL within transactions
    
    ↓
    NEVER use LISTEN/NOTIFY — registrations lost on connection return

NO → Is it an admin tool or psql session?

    YES → Use session mode (separate port, e.g., 7432)
    
        ↓
        Connection held for entire session duration
        Supports: SET SESSION, LISTEN/NOTIFY, temporary tables
        No multiplexing — each session = 1 backend connection
        Suitable for: low-traffic admin panels, database migrations
        
    NO → Is it a single-statement-only application?
    
        YES → Statement mode (rarest, least compatible)
        
            ↓
            Connection returned after each statement
            Highest multiplexing efficiency
            Breaks: prepared statements, Eloquent, most ORMs
            Never use with Laravel
            
        NO → Default to transaction mode with appropriate fallback

---

## Recommended Default

**Default:** Transaction mode with `PDO::ATTR_EMULATE_PREPARES = true` and `server_reset_query = DISCARD ALL`
**Reason:** Best balance of multiplexing efficiency (5-10×) and application compatibility for Laravel web workloads.

---

## Dual-Port Configuration: App vs Admin

---

## Decision Context

Configuring PgBouncer with separate ports for application traffic (transaction mode) and administrative tools (session mode) to isolate workloads.

---

## Decision Criteria

* performance: admin tools don't consume application pool connections
* architectural: one PgBouncer instance, two logical pools
* maintainability: single PgBouncer config with multiple listen ports
* security: session-mode port can have stricter auth

---

## Decision Tree

Single PgBouncer or separate for app vs admin?

↓

Need admin tools with session state (psql, migrations, LISTEN/NOTIFY)?

YES → Use dual-port PgBouncer

    ↓
    Port 6432: transaction mode (application pool)
    Port 7432: session mode (admin pool)
    Same PgBouncer instance, same backend database
    
    ↓
    Config: two [database] sections pointing to same DB
    `listen_port` and `listen_port2` in [pgbouncer] section
    `pool_mode = transaction` for app pool
    Session-mode pool inherits from default or separate section
    
    ↓
    Advantage: Admin queries don't contend with app traffic
    Disadvantage: All backends share same PostgreSQL max_connections

NO → Admin-only or no admin access needed?

    → Single port, transaction mode only
    Admin tools connect via same port — limited to transaction mode
    Accept: temporary tables, LISTEN/NOTIFY unavailable in admin tools

---

## Recommended Default

**Default:** Dual-port configuration — 6432 transaction (app), 7432 session (admin)
**Reason:** Admin tools need session state. Isolating them prevents admin queries from starving the application pool and avoids compatibility issues.

---

## Related Rules

* Rule 10-3-1: Always Use Transaction Mode for Laravel
* Rule 10-3-2: Always Enable `PDO::ATTR_EMULATE_PREPARES` with Transaction Pooling
* Rule 10-2-1: Deploy Server-Side Pooler for PHP-FPM

---

## Related Skills

* Configure PgBouncer Pooling Modes
* Configure Pool Architecture
* Manage Connection Count
