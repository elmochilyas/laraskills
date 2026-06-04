# Decomposition: Engine Version Performance Deltas

## Topic Overview
PHP 8.x delivers cumulative throughput gains of 48.6% over PHP 7.4 in real-world benchmarks. However, incremental gains between 8.2?8.3?8.4?8.5 are marginal (~1-3% per version) for typical web applications. PHP 8.0 (JIT introduction) and 8.1 (fibers, readonly properties, Enums) were the most impactful releases. PHP 8.5 added property hooks and JIT refinements but no major engine-level throughput boost.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/engine-version-performance-deltas/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Engine Version Performance Deltas
- **Purpose:** PHP 8.x delivers cumulative throughput gains of 48.6% over PHP 7.4 in real-world benchmarks. However, incremental gains between 8.2?8.3?8.4?8.5 are marginal (~1-3% per version) for typical web applications. PHP 8.0 (JIT introduction) and 8.1 (fibers, readonly properties, Enums) were the most impactful releases. PHP 8.5 added property hooks and JIT refinements but no major engine-level throughput boost.
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
  - Jump multiple versions
  - Pipeline model
  - Bottleneck-first approach

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