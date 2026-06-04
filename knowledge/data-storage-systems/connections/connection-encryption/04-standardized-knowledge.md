# 10.13 Connection Encryption (TLS/SSL)

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.13 |
| Knowledge Unit Title | Connection encryption (TLS/SSL between app and database) |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 10.1 Connection lifecycle, 10.11 Connection string management |
| Last Updated | 2026-06-02 |

## Overview

Database connections should be encrypted in transit, especially for cross-region or external connections. MySQL and PostgreSQL support TLS connections. Laravel config: `'ssl' => ['mode' => 'required', 'ca' => storage_path('...'), ...]`. TLS adds 10–50ms to connection handshake time but negligible per-query overhead. Enforcing TLS prevents man-in-the-middle attacks, credential interception, and data exposure on untrusted networks.

## Core Concepts

- **SSL modes**: `prefer` (try SSL, fall back to plain), `required` (reject plain connections — minimum for production), `verify_ca` (verify server certificate against CA), `verify_identity` (verify certificate hostname matches connection hostname — most secure).
- **Certificate files**: `ssl_ca` (CA certificate to verify server), `ssl_cert` (client certificate for mutual TLS), `ssl_key` (client private key). Stored in `storage_path('ssl/...')` or mounted as secrets.
- **Performance impact**: TLS handshake adds 10–50ms to connection time. After handshake, symmetric encryption adds <5% per-query overhead. For pooled connections (persistent connections), the handshake cost is paid once and amortized.
- **Mutual TLS (mTLS)**: Client presents a certificate; the database verifies it. Used for PostgreSQL `cert` authentication. Both sides are authenticated by certificates.
- **Certificate rotation**: Server certificates expire. Rotate before expiration to avoid connection failures. Monitor certificate expiry dates.

## When To Use

- All production database connections — TLS should be the default, not the exception
- Cross-region connections (app in one region, database in another)
- Connections traversing public networks (RDS public endpoint, non-VPC connections)
- Compliance requirements (PCI-DSS, HIPAA, SOC 2) mandate encryption in transit
- Connections from CI/CD pipelines to databases

## When NOT To Use

- Local development (localhost connections in a container) — TLS adds unnecessary complexity
- Same-VPC private connections in a trusted network (defense-in-depth may still recommend TLS)
- Legacy database versions that don't support TLS (upgrade first)

## Best Practices

- **Use `verify_identity` mode**: The most secure SSL mode verifies both the CA certificate and the hostname. **Why**: `prefer` silently falls back to plaintext if the server doesn't support TLS (MITM attack). `required` ensures TLS but doesn't verify the server's identity (MITM with a proxy). `verify_identity` ensures both encryption and server identity.
- **Store certificates securely**: Keep CA certs, client certs, and keys in a secure location (`storage_path('ssl')` or mounted secrets). **Why**: Client certificates authenticate the application to the database. A leaked client cert allows unauthorized database access. Use file permissions (600) on private keys.
- **Monitor certificate expiration**: Add certificate expiry monitoring to your observability platform. **Why**: Expired certificates cause connection failures — the database rejects connections with expired certificates. Proactive monitoring prevents unexpected downtime during certificate rotation.
- **Use RDS CA bundles correctly**: AWS RDS provides CA certificate bundles that change over time. Update the CA bundle before the old CA expires. **Why**: RDS rotates CA certificates periodically. Using the old CA bundle causes `verify_ca` or `verify_identity` to fail, making the database unreachable.
- **Test TLS enforcement in staging**: Enable `require_secure_transport = ON` (MySQL) or `ssl = on` (PostgreSQL) in staging first. **Why**: TLS enforcement in the database rejects non-TLS connections. If the application isn't configured correctly for TLS, it loses connectivity. Test before enabling in production.

## Architecture Guidelines

- TLS between app and pooler: Configure in Laravel's database config (`ssl` array). Pooler must present a valid certificate.
- TLS between pooler and database: Configure in the pooler (PgBouncer `server_tls_sslmode`, ProxySQL `mysql-have_ssl`).
- TLS between app and database (without pooler): Configure in Laravel's database config. Requires certificates on the application server.
- RDS Proxy + TLS: RDS Proxy manages TLS termination. The application connects to RDS Proxy over TLS. RDS Proxy connects to the database with TLS internally.
- Mutual TLS for PostgreSQL: Set `sslmode=require` and configure `sslcert` and `sslkey` in the Laravel connection config. PostgreSQL must be configured with `ssl=on` and `ssl_cert_file`.

## Performance Considerations

- TLS handshake: 10–50ms per connection. With connection pooling (persistent connections), this is a one-time cost amortized over many requests.
- Per-query overhead: <5% for CPU-bound workloads. Negligible for I/O-bound workloads.
- TLS adds ~1KB per query in packet overhead (headers, authentication tags). Significant for very small queries but negligible for typical web queries.
- Hardware acceleration: Modern CPUs have AES-NI instructions that make AES encryption nearly free. The handshake (asymmetric crypto) is the expensive part.
- For high-throughput applications, use a connection pooler to minimize handshake frequency.

## Security Considerations

- `prefer` mode silently downgrades to plaintext — never use in production.
- `required` mode rejects plain connections but doesn't verify the server's identity. Acceptable in private networks with trusted DNS, but `verify_identity` is better.
- Client certificates for mTLS must be protected with file permissions (chmod 600) and never committed to version control.
- Log TLS version and cipher suite used for each connection. Downgrade attacks (forcing old TLS versions) should be detectable.
- Certificate revocation: If a certificate is compromised, revoke it immediately and rotate.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | SSL mode = prefer | Copy-paste from example config | Silent downgrade to plaintext if TLS fails | Use `required` or `verify_identity` in production |
| 2 | Expired CA bundle | Old rds-ca-2019-root.pem after CA rotation | verify_ca connections fail | Monitor CA expiry; use latest CA bundle from AWS |
| 3 | Client cert committed to git | Private key in config directory | Credential exposure in repository | Store certs outside repo; use secrets manager |
| 4 | No TLS between app and pooler | PgBouncer without client_tls_sslmode | Unencrypted traffic between app server and pooler | Configure TLS on both sides of the pooler |
| 5 | TLS timeout on slow connections | SSL handshake timeout (default 10s) | Connection failures on high-latency links | Increase PDO::ATTR_TIMEOUT for TLS connections |

## Anti-Patterns

- **TLS but no hostname verification**: Using `required` but not `verify_identity`. A proxy between app and database can intercept the connection.
- **Self-signed certificates without proper CA management**: Using `sslmode=required` with self-signed certs and `ssl_ca` pointing to the self-signed cert. This works but doesn't provide proper CA chain verification.
- **TLS termination at the application server only**: Encrypting the app-to-pooler connection but leaving the pooler-to-database connection unencrypted. Defense-in-depth requires encryption on all hops.
- **Ignoring TLS in connection string rotation**: Rotating connection strings without also rotating or verifying TLS certificates can cause connection failures.

## Examples

```php
// config/database.php — TLS with verify_identity
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'ssl' => [
        'mode' => env('DB_SSL_MODE', 'verify_identity'),
        'ca' => env('DB_SSL_CA', storage_path('ssl/rds-ca-2019-root.pem')),
        'cert' => env('DB_SSL_CERT'),          // Client cert for mTLS
        'key' => env('DB_SSL_KEY'),             // Client key for mTLS
        'verify_peer' => true,
        'verify_peer_name' => true,
    ],
],

// PgBouncer config — TLS on both sides
[pgbouncer]
client_tls_sslmode = require
client_tls_ca_file = /etc/ssl/certs/ca-certificates.crt
client_tls_key_file = /etc/ssl/pgbouncer/server.key
client_tls_cert_file = /etc/ssl/pgbouncer/server.crt

server_tls_sslmode = require
server_tls_ca_file = /etc/ssl/certs/ca-certificates.crt

// Verify connection is TLS-encrypted
// PostgreSQL: SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();
// MySQL: SHOW STATUS LIKE 'Ssl_cipher';
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, TLS/SSL fundamentals
- **Closely Related**: 10.11 Connection string management, 10.14 Connection health checks
- **Advanced**: mTLS for PostgreSQL cert auth, certificate rotation automation
- **Cross-Domain**: Network security, AWS RDS CA management, compliance (PCI-DSS, HIPAA)

## AI Agent Notes

- TLS mode `prefer` is the default but is insecure — always recommend `required` or `verify_identity`
- Connection pooling makes TLS handshake cost negligible (one-time per connection)
- Client certificates are credentials — treat them like passwords (protected, rotated, audited)
- RDS CA bundles change every few years — monitoring expiry is critical
- TLS between app and pooler is often forgotten when deploying PgBouncer

## Verification

- [ ] SSL mode is `required` or `verify_identity` (not `prefer`) in production
- [ ] CA certificate bundle is valid and not expired
- [ ] Client certificates are stored securely (not in version control)
- [ ] TLS is configured on both app-to-pooler and pooler-to-database hops
- [ ] Certificate expiry is monitored and alerts are configured
- [ ] TLS version and cipher are logged for security auditing
- [ ] `SHOW STATUS LIKE 'Ssl_cipher'` confirms encryption is active
- [ ] Staging environment has TLS enforcement enabled and tested
