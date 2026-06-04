# Decomposition: 9.21 Implicit transactions in Laravel (automatic wrapping in some operations)

## Topic Overview
Some Laravel operations implicitly start transactions: model events dispatchers (saved, created, updated), the `DB::listen` query logger, and some package operations (Laravel Horizon, Telescope writes). Understanding implicit transactions prevents unexpected lock holding and transaction nesting.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-21-implicit-transactions-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.21 Implicit transactions in Laravel (automatic wrapping in some operations)
- **Purpose:** Some Laravel operations implicitly start transactions: model events dispatchers (saved, created, updated), the `DB::listen` query logger, and some package operations (Laravel Horizon, Telescope writes). Understanding implicit transactions prevents unexpected lock holding and transaction nesting.
- **Difficulty:** Intermediate
- **Dependencies:** 9.11 Transaction scoping, 9.13 Transaction length

## Dependency Graph
**Depends on:** "9.11 Transaction scoping", "9.13 Transaction length"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Model events inside transaction**: `Model::saved` event fires inside the same transaction as the save. If the event listener throws, the entire save rolls back.; - **DB::listen**: The query logger does not start a transaction. It just logs queries.; - **Package writes**: Horizon (monitoring data) and Telescope (incoming request dumps) write to their own tables. These may or may not be transactional depending on configuration..
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