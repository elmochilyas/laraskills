# Skill: Configure Connection Encryption (TLS/SSL)

## Purpose

Encrypt database connections in transit using TLS with `verify_identity` mode, proper certificate management, and end-to-end encryption (app-to-pooler and pooler-to-database).

## When To Use

- All production database connections — TLS should be the default
- Cross-region connections (app in one region, database in another)
- Connections traversing public networks
- Compliance requirements (PCI-DSS, HIPAA, SOC 2)
- CI/CD pipeline connections to databases

## When NOT To Use

- Local development (localhost connections in container)
- Same-VPC private connections in trusted networks
- Legacy database versions without TLS support

## Prerequisites

- Database TLS support enabled
- CA certificate bundle
- Client certificates (if using mTLS)
- Understanding of connection lifecycle (10-1)

## Inputs

- Database SSL mode requirement
- CA certificate file path
- Client certificate and key paths (for mTLS)
- RDS CA bundle version (if using AWS RDS)

## Workflow (numbered steps)

1. Configure TLS mode in `config/database.php`:
   ```php
   'mysql' => [
       'ssl' => [
           'mode' => env('DB_SSL_MODE', 'verify_identity'),
           'ca' => env('DB_SSL_CA', storage_path('ssl/rds-ca-2019-root.pem')),
           'verify_peer' => true,
           'verify_peer_name' => true,
       ],
   ],
   ```
   Use `verify_identity` for production (most secure).

2. Configure TLS between app and pooler (if using PgBouncer):
   ```ini
   [pgbouncer]
   client_tls_sslmode = require
   client_tls_ca_file = /etc/ssl/certs/ca-certificates.crt
   ```

3. Configure TLS between pooler and database:
   ```ini
   server_tls_sslmode = require
   server_tls_ca_file = /etc/ssl/certs/ca-certificates.crt
   ```

4. Store certificates securely:
   - CA certs: `storage_path('ssl/...')` or mounted secrets
   - Client keys: file permissions 600, never in version control

5. Monitor certificate expiration:
   - Add certificate expiry monitoring to observability platform
   - Update RDS CA bundles before the old CA expires

6. Verify TLS is active:
   - PostgreSQL: `SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();`
   - MySQL: `SHOW STATUS LIKE 'Ssl_cipher';`

7. Test TLS enforcement in staging before enabling in production

## Validation Checklist

- [ ] SSL mode is `required` or `verify_identity` (not `prefer`) in production
- [ ] CA certificate bundle is valid and not expired
- [ ] Client certificates stored securely (not in version control)
- [ ] TLS configured on both app-to-pooler and pooler-to-database
- [ ] Certificate expiry is monitored with alerts
- [ ] TLS version and cipher logged for security auditing
- [ ] `SHOW STATUS LIKE 'Ssl_cipher'` confirms encryption active
- [ ] Staging has TLS enforcement enabled and tested

## Common Failures

- SSL mode = prefer — silent downgrade to plaintext if TLS fails
- Expired CA bundle — verify_ca connections fail after CA rotation
- Client cert committed to git — credential exposure
- No TLS between app and pooler — unencrypted traffic on pooler hop
- TLS timeout on slow connections — need longer PDO timeout

## Decision Points

- SSL mode: prefer vs required vs verify_ca vs verify_identity
- Self-signed certs vs CA-signed certs
- Single-hop TLS (app-to-DB) vs double-hop (app-to-pooler-to-DB)
- mTLS for PostgreSQL cert auth vs password auth over TLS

## Performance Considerations

- TLS handshake: 10–50ms per connection
- With connection pooling, handshake is one-time cost amortized
- Per-query overhead: <5% for CPU-bound, negligible for I/O-bound
- AES-NI instructions make encryption nearly free on modern CPUs

## Security Considerations

- `prefer` mode silently downgrades to plaintext — never use in production
- `verify_identity` ensures both encryption and server identity
- Client certificates = credentials — protect, rotate, audit
- Certificate revocation: revoke immediately if compromised

## Related Rules

- 10-13-1: Use verify_identity Mode
- 10-13-2: Store Certificates Securely

## Related Skills

- Manage Connection Strings
- Configure Connection Health Checks
- Manage Connection Lifecycle

## Success Criteria

- All production connections use verify_identity TLS
- Certificates stored securely, not in version control
- Certificate expiry monitored with pre-expiration alerts
- End-to-end encryption: app-to-pooler and pooler-to-database
- TLS enforcement tested in staging before production
