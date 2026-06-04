# Decomposition: 10.6 Connection purging and reconnection (DB::purge, DB::reconnect)

## Topic Overview
`DB::purge('connection')` removes a connection from Laravel's connection resolver. `DB::reconnect('connection')` purges and immediately creates a new connection. Essential after runtime config changes (tenant switching, failover, credential rotation).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-6-connection-purging-reconnection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.6 Connection purging and reconnection (DB::purge, DB::reconnect)
- **Purpose:** `DB::purge('connection')` removes a connection from Laravel's connection resolver. `DB::reconnect('connection')` purges and immediately creates a new connection.
- **Difficulty:** Advanced
- **Dependencies:** 10.5 Dynamic connection config, 16.11 Connection failover

## Dependency Graph
**Depends on:** "10.5 Dynamic connection config", "16.11 Connection failover"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DB::purge(name)**: Removes the PDO object from the `ConnectionFactory` resolver. Sets connection as "unresolved". Next access recreates it.; - **DB::reconnect(name)**: Purges + resolves immediately. Returns the new connection instance.; - **Side effects**: All existing Eloquent model instances that hold a reference to the old connection will still use the old PDO. Subsequent queries from those models may fail..
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