# afterCommit — Decomposition

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Async Patterns
- **Knowledge Unit:** afterCommit
- **Last Updated:** 2026-06-04

---

## Topic Overview
The `afterCommit` transactional job dispatch pattern covering race condition mechanics, global configuration, per-dispatch overrides, and integration with transaction lifecycle.

---

## Decomposition Strategy
The topic splits by (1) race condition fundamentals — why dispatches inside transactions fail; (2) afterCommit mechanics — transaction-aware dispatch, rollback protection, no-op behavior; (3) configuration — global default vs per-dispatch overrides; (4) operational concerns — monitoring rollbacks, testing strategies, documentation conventions. This avoids overlapping with general queue dispatch topics by focusing specifically on the transaction-aware dispatch mechanism and its interaction with database transactions.

---

## Proposed Folder Structure
```
08-async-patterns/after-commit/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── 05-rules.md
├── 06-skills.md
├── 07-decision-trees.md
├── 08-anti-patterns.md
└── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|--------------|
| afterCommit | Transactional job dispatch safety | Intermediate | Queue Driver Architecture, Database Transactions |
| Transaction Race Conditions | Cause and detection of in-transaction dispatch failures | Intermediate | afterCommit |
| Global Configuration | Setting after_commit at connection level | Intermediate | Transaction Race Conditions |
| Exception Strategy | beforeCommit and per-dispatch override patterns | Intermediate | Global Configuration |

---

## Dependency Graph
```
Queue Driver Architecture → Database Transactions → afterCommit
                                                    ├── Transaction Race Conditions
                                                    ├── Global Configuration
                                                    └── Exception Strategy → beforeCommit
```

---

## Boundary Analysis
**In scope**: afterCommit mechanism and transaction-aware dispatch, database transaction race conditions, global after_commit configuration in config/queue.php, per-dispatch afterCommit() and beforeCommit() overrides, rollback protection and silent discard behavior, no-op behavior outside transactions, memory implications during transaction, testing strategies for transactional dispatch.

**Out of scope**: Database transaction internals (isolation levels, locking), outbox pattern implementation, other dispatch timing mechanisms (defer, dispatchAfterResponse), job serialization details, queue connection configuration beyond after_commit.

---

## Future Expansion Opportunities
- Outbox pattern comparison for high-reliability transactional messaging
- Distributed transaction patterns across multiple databases
- Transaction isolation level interaction with dispatch timing
