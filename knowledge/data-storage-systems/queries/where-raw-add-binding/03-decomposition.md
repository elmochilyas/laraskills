# Decomposition: 2.12 whereRaw and addBinding for raw expressions

## Topic Overview
Raw expressions (`DB::raw`, `whereRaw`, `selectRaw`, `orderByRaw`) bypass Laravel's query builder escaping and parameter binding. `addBinding` allows safely attaching bound parameters to raw expressions, preventing SQL injection while using custom SQL syntax.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-12-where-raw-add-binding/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.12 whereRaw and addBinding for raw expressions
- **Purpose:** Raw expressions (`DB::raw`, `whereRaw`, `selectRaw`, `orderByRaw`) bypass Laravel's query builder escaping and parameter binding. `addBinding` allows safely attaching bound parameters to raw expressions, preventing SQL injection while using custom SQL syntax.
- **Difficulty:** Advanced
- **Dependencies:** 2.10 Query builder methods, 2.11 Where clause types, 4.10 Function wraps in WHERE clause

## Dependency Graph
**Depends on:** "2.10 Query builder methods", "2.11 Where clause types", "4.10 Function wraps in WHERE clause"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DB::raw('expression')**: Creates an unescaped SQL fragment. No parameter binding.; - **whereRaw('sql', [$bindings])**: Raw WHERE clause with bound parameters. Parameters use `?` placeholders.; - **addBinding($values, $type)**: Adds parameter bindings to a specific clause type (where, join, having, order).; - **SQL injection risk**: Raw expressions without bound parameters are vulnerable to SQL injection..
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