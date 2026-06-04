# Decomposition: Max Accelerated Files Calculation

## Topic Overview
`opcache.max_accelerated_files` sets the maximum number of PHP files OpCache can cache. PHP internally rounds this value **up to the nearest prime number** for hash table efficiency. Setting this below the actual file count means some files are never cached, forcing recompilation on every request. Count your project's PHP files and set this 20-30% higher.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/max-accelerated-files-calculation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Max Accelerated Files Calculation
- **Purpose:** `opcache.max_accelerated_files` sets the maximum number of PHP files OpCache can cache. PHP internally rounds this value **up to the nearest prime number** for hash table efficiency. Setting this below the actual file count means some files are never cached, forcing recompilation on every request. Count your project's PHP files and set this 20-30% higher.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Not counting vendor files
  - Library model
  - Tiered cache warming

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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