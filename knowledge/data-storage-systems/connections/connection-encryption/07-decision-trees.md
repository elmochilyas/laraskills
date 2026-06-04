# 10.13 Connection Encryption (TLS/SSL) - Decision Trees

## TLS Mode Selection: prefer vs required vs verify_identity

---

## Decision Context

Choosing the appropriate TLS security mode for database connections, balancing security against operational complexity.

---

## Decision Criteria

* performance: TLS handshake adds 10-50ms per connection (amortized with pooling)
* architectural: verify_identity requires valid CA bundle and hostname match
* maintainability: CA bundle must be monitored for expiry and updated
* security: prefer mode silently downgrades to plaintext — never use in production

---

## Decision Tree

Which TLS mode for production?

↓

Connection traverses public network or cross-region?

YES → Use verify_identity (strictest mode)

    ↓
    Verifies: encryption + server certificate + hostname match
    Requires: valid CA bundle, hostname matching DNS name
    Prevents: MITM attacks, proxy interception
    
    ↓
    Configure: 'ssl' => ['mode' => 'verify_identity']
    Store CA cert in storage_path('ssl/')
    Verify: SHOW STATUS LIKE 'Ssl_cipher'

NO → Connection in same VPC/private network?

    YES → Use required mode
    
        ↓
    Requires TLS — rejects plain connections
    Does NOT verify server certificate or hostname
    Acceptable for private networks with trusted DNS
        
    NO → Local development?
    
        → No TLS needed (localhost)
        TLS adds unnecessary complexity for development
        Use 'prefer' or skip SSL config entirely

---

## Recommended Default

**Default:** `verify_identity` for production; `required` for same-VPC; no SSL for local dev
**Reason:** Public and cross-region connections need full certificate verification. Same-VPC connections are safer but still need encryption.

---

## End-to-End TLS: App to Pooler to Database

---

## Decision Context

Configuring TLS on all hops between the application, connection pooler, and database to prevent unencrypted traffic at any point.

---

## Decision Criteria

* performance: double TLS adds two handshakes; each adds 10-50ms
* architectural: must configure TLS on both app-pooler and pooler-database hops
* maintainability: requires certificates on both application and pooler servers
* security: encryption on all hops is defense-in-depth

---

## Decision Tree

TLS on all connection hops?

↓

Using a connection pooler (PgBouncer/ProxySQL)?

YES → Configure TLS on TWO hops

    ↓
    Hop 1: App → Pooler (PgBouncer)
    Configure: ssl array in Laravel database config
    PgBouncer: client_tls_sslmode = require
    
    Hop 2: Pooler → Database
    Configure: PgBouncer server_tls_sslmode = require
    Pooler must have CA cert to verify database
    
    ↓
    Common mistake: TLS on app→pooler but plaintext on pooler→database
    Defense-in-depth requires encryption on both hops

NO → Direct connection (no pooler)?

    YES → Configure TLS in Laravel database config only
    
        ↓
    One hop: App → Database
    Single SSL configuration point
    Simpler — no pooler certificates needed

NO → Using RDS Proxy?

    → RDS Proxy handles TLS termination
    App → RDS Proxy: TLS required
    RDS Proxy → Database: TLS managed by AWS
    No manual TLS config needed on database side

---

## Recommended Default

**Default:** TLS on all hops with verify_identity mode for production
**Reason:** Unencrypted traffic on any hop is a security vulnerability. Pooler-to-database encryption is often forgotten.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Manage Connection Encryption
* Manage Connection String Management
