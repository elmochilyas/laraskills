# Decomposition: 2.8 Subquery selects (addSelect with subquery)

## Topic Overview
Subquery selects allow adding computed values from related tables as attributes on the parent model without eager loading the relationship. Using `addSelect` with a raw subquery or Eloquent's relationship-based subquery syntax, you can include data like "last login date" or "most recent order total" as a column on each parent row.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-8-subquery-selects/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.8 Subquery selects (addSelect with subquery)
- **Purpose:** Subquery selects allow adding computed values from related tables as attributes on the parent model without eager loading the relationship. Using `addSelect` with a raw subquery or Eloquent's relationship-based subquery syntax, you can include data like "last login date" or "most recent order total" as a column on each parent row.
- **Difficulty:** Advanced
- **Dependencies:** 2.9 Subquery ordering, 2.7 Relationship counting, 4.25 Subquery optimization

## Dependency Graph
**Depends on:** "2.9 Subquery ordering", "2.7 Relationship counting", "4.25 Subquery optimization"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **addSelect with closure**: `User::addSelect(['last_login_at' => LoginLog::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1)])`.; - **Relationship subquery**: `User::withLastLoginAt()` using a dedicated relationship method.; - **Subquery ordering**: `Order::orderByDesc(OrderItem::selectRaw('SUM(quantity)')->whereColumn('order_id', 'orders.id'))`..
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