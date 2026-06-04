# Decomposition: Vapor Lambda Invocation Multiplier

## Topic Overview
A single HTTP request via Laravel Vapor can count as 9+ Lambda invocations due to Vapor's architectural layers: request handling, PHP-FPM bridge, worker processes, and auxiliary functions. This multiplier effect means Vapor's effective cost per request is significantly higher than raw Lambda pricing suggests. Understanding this multiplier is critical when comparing Vapor against Cloud (Fargate) or Forge (EC2).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k28-vapor-lambda-invocation-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Vapor Lambda Invocation Multiplier
- **Purpose:** A single HTTP request via Laravel Vapor can count as 9+ Lambda invocations due to Vapor's architectural layers: request handling, PHP-FPM bridge, worker processes, and auxiliary functions.
- **Difficulty:** Advanced
- **Dependencies:** K27: Laravel Cloud vs Vapor, K22: Lambda Pricing Breakdown, K23: Lambda vs EC2 Breakeven, K41: Trybe Cost Reduction

## Dependency Graph
**Depends on:**
- K27: Laravel Cloud vs Vapor
- K22: Lambda Pricing Breakdown
- K23: Lambda vs EC2 Breakeven
- K41: Trybe Cost Reduction

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Multiplier source
- 9x estimate
- Impact
- Hidden costs
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K27: Laravel Cloud vs Vapor, K22: Lambda Pricing Breakdown, K23: Lambda vs EC2 Breakeven, K41: Trybe Cost Reduction

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