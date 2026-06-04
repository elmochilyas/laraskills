# Decomposition: dbt Project Structure for Medallion Architecture with Tests

## Topic Overview
A well-structured dbt project organizes models, tests, documentation, and configurations into a maintainable hierarchy that mirrors the medallion architecture. The standard pattern — staging → intermediate → marts — maps directly to Bronze → Silver → Gold with each layer having specific conventions for naming, testing, and materialization. Beyond directory structure, a dbt project includes YAML property files that define sources, models, tests, and documentation in one place.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k028-dbt-project-structure/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### dbt Project Structure for Medallion Architecture with Tests
- **Purpose:** A well-structured dbt project organizes models, tests, documentation, and configurations into a maintainable hierarchy that mirrors the medallion architecture.
- **Difficulty:** Advanced
- **Dependencies:** K014 (Medallion Architecture): The structural pattern dbt models implement, K015 (dbt Incremental Models): Implementation details for incremental strategies, K043 (dbt Semantic Layer): Building metrics on top of dbt marts

## Dependency Graph
**Depends on:**
- K014 (Medallion Architecture): The structural pattern dbt models implement
- K015 (dbt Incremental Models): Implementation details for incremental strategies
- K043 (dbt Semantic Layer): Building metrics on top of dbt marts

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Staging models:
- Intermediate models:
- Mart models:
- Sources YAML:
- Schema YAML:
- Generic tests:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K014 (Medallion Architecture): The structural pattern dbt models implement, K015 (dbt Incremental Models): Implementation details for incremental strategies, K043 (dbt Semantic Layer): Building metrics on top of dbt marts

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization