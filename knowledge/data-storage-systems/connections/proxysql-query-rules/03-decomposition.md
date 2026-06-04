# Decomposition: 10.15 ProxySQL query rules and connection handling

## Topic Overview
ProxySQL provides advanced connection handling: query rules (route queries by regex to specific hostgroups), connection multiplexing (client-side multiplexing reduces backend connections), query caching (TTL-based cache for identical queries), and query rewriting. Connection handling: health checks, idle timeout, max connections per host.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-15-proxysql-query-rules/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.15 ProxySQL query rules and connection handling
- **Purpose:** ProxySQL provides advanced connection handling: query rules (route queries by regex to specific hostgroups), connection multiplexing (client-side multiplexing reduces backend connections), query caching (TTL-based cache for identical queries), and query rewriting. Connection handling: health checks, idle timeout, max connections per host.
- **Difficulty:** Advanced
- **Dependencies:** 7.17 ProxySQL routing, 10.2 Pool architecture

## Dependency Graph
**Depends on:** "7.17 ProxySQL routing", "10.2 Pool architecture"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Connection multiplexing**: When `multiplexing = 1` (default), ProxySQL can send queries from different clients through the same backend connection. Only safe if no session-state is used.; - **Query rules**: Rule `SELECT ^SELECT.*→ hostgroup 1`. `^SELECT ... FOR UPDATE → hostgroup 0`. Rules can match by user, schema, digest, or regex.; - **Connection pooling settings**: `mysql-max_connections` (max backend connections), `mysql-default_query_timeout`, `mysql-poll_timeout`..
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