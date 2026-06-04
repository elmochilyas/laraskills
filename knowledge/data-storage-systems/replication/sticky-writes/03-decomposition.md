# Decomposition: 7.4 Sticky writes (reading-after-write consistency issue)

## Topic Overview
After a write, a subsequent read may go to a replica that hasn't replicated the write yet. The user sees stale data. Sticky writes ensure that after a write, subsequent reads use the write connection for the same request/session.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-4-sticky-writes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.4 Sticky writes (reading-after-write consistency issue)
- **Purpose:** After a write, a subsequent read may go to a replica that hasn't replicated the write yet. The user sees stale data.
- **Difficulty:** Intermediate
- **Dependencies:** 7.3 Query routing, 7.7 Lag-aware read splitting

## Dependency Graph
**Depends on:** "7.3 Query routing", "7.7 Lag-aware read splitting"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Read-after-write inconsistency**: User creates a post (write to primary), redirects to post list (read from replica). Replica lag → post not visible.; - **Laravel's $recordsModified**: After any write on a connection, `$recordsModified = true`. All subsequent reads on that connection use the write PDO.; - **Scope**: Applies only within the same request. Next request from the same user may still hit a lagged replica..
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