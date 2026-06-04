# Decomposition: 7.17 ProxySQL query routing rules for read/write split

## Topic Overview
ProxySQL sits between Laravel and MySQL, routing queries based on rules. Read/write split rules: regex match SELECT queries → route to read hostgroup. All other queries → write hostgroup.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-17-proxysql-query-routing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.17 ProxySQL query routing rules for read/write split
- **Purpose:** ProxySQL sits between Laravel and MySQL, routing queries based on rules. Read/write split rules: regex match SELECT queries → route to read hostgroup.
- **Difficulty:** Advanced
- **Dependencies:** 7.2 Read/write config, 7.8 Connection pooling replicas, 6.19 Shard proxy

## Dependency Graph
**Depends on:** "7.2 Read/write config", "7.8 Connection pooling replicas", "6.19 Shard proxy"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Hostgroups**: Define `mysql_servers` with hostgroup IDs. hostgroup 0 = writers, hostgroup 1 = readers.; - **Query rules**: `SELECT ^SELECT.*→ hostgroup 1`. Rules evaluated top-down. First match wins. `^SELECT... FOR UPDATE` → hostgroup 0.; - **Connection pooling**: ProxySQL maintains persistent connections to MySQL. Laravel connects to ProxySQL via standard MySQL client..
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