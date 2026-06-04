# Metadata

**Domain:** data-storage-systems
**Subdomain:** connections
**Knowledge Unit:** 10.13 Connection encryption (TLS/SSL between app and database)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use `verify_identity` mode applied
- [ ] Store certificates securely applied
- [ ] Monitor certificate expiration applied
- [ ] Use RDS CA bundles correctly applied
- [ ] Test TLS enforcement in staging applied
- [ ] SSL mode is `required` or `verify_identity` (not `prefer`) in production
- [ ] CA certificate bundle is valid and not expired
- [ ] Client certificates are stored securely (not in version control)
- [ ] TLS is configured on both app-to-pooler and pooler-to-database hops
- [ ] Certificate expiry is monitored and alerts are configured
- [ ] SSL mode = prefer prevented
- [ ] Expired CA bundle prevented
- [ ] Client cert committed to git prevented
- [ ] No TLS between app and pooler prevented
- [ ] TLS timeout on slow connections prevented
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] All production connections use verify_identity TLS
- [ ] Certificates stored securely, not in version control
- [ ] Certificate expiry monitored with pre-expiration alerts

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use `verify_identity` mode applied
- [ ] Store certificates securely applied
- [ ] Monitor certificate expiration applied
- [ ] Use RDS CA bundles correctly applied
- [ ] Test TLS enforcement in staging applied
- [ ] Deploy Server-Side Pooler For PHP-FPM followed
- [ ] Configure Octane Connection Pool followed
- [ ] Configure TLS mode in `config/database.php`: completed
- [ ] Configure TLS between app and pooler (if using PgBouncer): completed
- [ ] Configure TLS between pooler and database: completed
- [ ] Store certificates securely: completed
- [ ] Monitor certificate expiration: completed

---

# Performance Checklist

- [ ] Performance: TLS handshake: 10–50ms per connection. With connection pooling (persistent connections), this is a one-time cost amortized over many requests.
- [ ] Performance: Per-query overhead: <5% for CPU-bound workloads. Negligible for I/O-bound workloads.
- [ ] Performance: TLS adds ~1KB per query in packet overhead (headers, authentication tags). Significant for very small queries but negligible for typical web queries.
- [ ] Performance: Hardware acceleration: Modern CPUs have AES-NI instructions that make AES encryption nearly free. The handshake (asymmetric crypto) is the expensiv...
- [ ] Performance: For high-throughput applications, use a connection pooler to minimize handshake frequency.

---

# Security Checklist

- [ ] Security: `prefer` mode silently downgrades to plaintext — never use in production.
- [ ] Security: `required` mode rejects plain connections but doesn't verify the server's identity. Acceptable in private networks with trusted DNS, but `verify_id...
- [ ] Security: Client certificates for mTLS must be protected with file permissions (chmod 600) and never committed to version control.
- [ ] Security: Log TLS version and cipher suite used for each connection. Downgrade attacks (forcing old TLS versions) should be detectable.
- [ ] Security: Certificate revocation: If a certificate is compromised, revoke it immediately and rotate.

---

# Reliability Checklist

- [ ] SSL mode = prefer prevented
- [ ] Expired CA bundle prevented
- [ ] Client cert committed to git prevented
- [ ] No TLS between app and pooler prevented
- [ ] TLS timeout on slow connections prevented

---

# Testing Checklist

- [ ] SSL mode is `required` or `verify_identity` (not `prefer`) in production
- [ ] CA certificate bundle is valid and not expired
- [ ] Client certificates are stored securely (not in version control)
- [ ] TLS is configured on both app-to-pooler and pooler-to-database hops
- [ ] Certificate expiry is monitored and alerts are configured
- [ ] SSL mode is `required` or `verify_identity` (not `prefer`) in production
- [ ] CA certificate bundle is valid and not expired
- [ ] Client certificates stored securely (not in version control)
- [ ] TLS configured on both app-to-pooler and pooler-to-database
- [ ] Certificate expiry is monitored with alerts
- [ ] All production connections use verify_identity TLS
- [ ] Certificates stored securely, not in version control
- [ ] Certificate expiry monitored with pre-expiration alerts
- [ ] End-to-end encryption: app-to-pooler and pooler-to-database
- [ ] TLS enforcement tested in staging before production

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Deploy Server-Side Pooler For PHP-FPM prevented
- [ ] TLS but no hostname verification prevented
- [ ] SSL mode = prefer â€” silent downgrade to plaintext if TLS fails prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Self-signed certificates without proper CA management prevented
- [ ] SSL mode = prefer prevented
- [ ] Expired CA bundle prevented
- [ ] Client cert committed to git prevented
- [ ] No TLS between app and pooler prevented
- [ ] TLS timeout on slow connections prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
