# Decomposition: 10.1 Connection lifecycle (connect, query, disconnect, reconnect)

## Topic Overview
PHP connects to MySQL/PostgreSQL via TCP: connect (handshake, auth, SSL) → query → fetch → disconnect. Connect/disconnect overhead is 50-200ms per request. Connection pooling amortizes this cost across requests.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-1-connection-lifecycle/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.1 Connection lifecycle (connect, query, disconnect, reconnect)
- **Purpose:** PHP connects to MySQL/PostgreSQL via TCP: connect (handshake, auth, SSL) → query → fetch → disconnect. Connect/disconnect overhead is 50-200ms per request.
- **Difficulty:** Intermediate
- **Dependencies:** 10.4 Laravel Octane connections, 10.7 Connection count management

## Dependency Graph
**Depends on:** "10.4 Laravel Octane connections", "10.7 Connection count management"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **PHP-FPM**: New process per request. New TCP connection per request. Connect at request start, disconnect at request end. No connection reuse.; - **Octane**: Worker lives for many requests. Connection persists. First request connects, subsequent requests reuse.; - **Connection stages**: TCP handshake → Authentication → SSL negotiation → `SET NAMES`/`SET search_path` → Query → Fetch → Close..
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