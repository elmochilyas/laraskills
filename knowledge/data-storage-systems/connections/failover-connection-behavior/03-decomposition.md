# Decomposition: 10.16 Connection failover behavior (transparent reconnect, connection string rotation)

## Topic Overview
When the primary database fails, connections must be re-established to the new primary. Connection failover strategies: DNS-based (update DNS record, wait for TTL), proxy-based (ProxySQL detects failure, routes to new primary), config-based (Laravel detects failure, updates config, purges, reconnects). Transparent failover: the application retries the failed query without error.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-16-failover-connection-behavior/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.16 Connection failover behavior (transparent reconnect, connection string rotation)
- **Purpose:** When the primary database fails, connections must be re-established to the new primary. Connection failover strategies: DNS-based (update DNS record, wait for TTL), proxy-based (ProxySQL detects failure, routes to new primary), config-based (Laravel detects failure, updates config, purges, reconnects).
- **Difficulty:** Advanced
- **Dependencies:** 7.11 Failover, 10.6 Connection purging

## Dependency Graph
**Depends on:** "7.11 Failover", "10.6 Connection purging"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DNS failover**: Update DB_HOST DNS record to point to new primary. TTL determines delay. Simple but TTL-dependent.; - **Proxy failover (ProxySQL)**: ProxySQL monitors backend health. When primary fails, routes queries to promoted replica. Application doesn't see connection change.; - **Application-level failover**: Detect connection failure, read new primary host from config/API, `config()->set('database.connections.mysql.host', $newHost)`, `DB::purge('mysql')`, retry query..
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