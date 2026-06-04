# Decomposition: 7.2 Laravel read/write configuration (config/database.php read/write arrays)

## Topic Overview
Laravel's `database.php` connection config supports `read` and `write` host arrays. Writes always go to the first `write` host. Reads are randomly distributed among `read` hosts.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-2-laravel-read-write-config/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.2 Laravel read/write configuration (config/database.php read/write arrays)
- **Purpose:** Laravel's `database.php` connection config supports `read` and `write` host arrays. Writes always go to the first `write` host.
- **Difficulty:** Intermediate
- **Dependencies:** 7.3 Automatic query routing, 7.9 Load balancing replicas

## Dependency Graph
**Depends on:** "7.3 Automatic query routing", "7.9 Load balancing replicas"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Read array**: `'read' => ['host' => ['replica1', 'replica2']]` — Laravel randomly picks one for SELECT queries.; - **Write array**: `'write' => ['host' => ['primary']]` — all INSERT/UPDATE/DELETE go to write hosts.; - **Connection name**: If `read` and `write` are specified, Laravel creates two internal PDO connections (`connection_name::read`, `connection_name::write`)..
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