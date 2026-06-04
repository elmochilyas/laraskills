# Decomposition: 10.13 Connection encryption (TLS/SSL between app and database)

## Topic Overview
Database connections should be encrypted in transit, especially for cross-region or external connections (RDS public, non-VPC). MySQL/PostgreSQL support TLS connections. Laravel config: `'ssl' => ['mode' => 'required', 'ca' => storage_path('...'), ...]`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-13-connection-encryption/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.13 Connection encryption (TLS/SSL between app and database)
- **Purpose:** Database connections should be encrypted in transit, especially for cross-region or external connections (RDS public, non-VPC). MySQL/PostgreSQL support TLS connections.
- **Difficulty:** Intermediate
- **Dependencies:** 10.1 Connection lifecycle, 10.11 Connection string management

## Dependency Graph
**Depends on:** "10.1 Connection lifecycle", "10.11 Connection string management"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **SSL modes**: `prefer` (try SSL, fall back to plain), `required` (reject plain connections), `verify_ca` (verify server certificate), `verify_identity` (verify cert matches hostname).; - **Certificate files**: `ssl_ca` (CA certificate), `ssl_cert` (client cert for mutual TLS), `ssl_key` (client key).; - **Performance impact**: SSL handshake adds 10-50ms to connection time. Per-query overhead: minimal (symmetric encryption after handshake)..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization