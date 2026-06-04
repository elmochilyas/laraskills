# Decomposition: Lambda vs EC2 Breakeven Analysis

## Topic Overview
The breakeven between Lambda and EC2 occurs at approximately 30 million requests per month at 256MB memory and 500ms average duration. Below this volume, Lambda's scale-to-zero makes it cheaper; above it, EC2's flat-rate pricing wins. The crossover shifts with memory allocation, execution duration, and utilization patterns.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k23-lambda-ec2-breakeven/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Lambda vs EC2 Breakeven Analysis
- **Purpose:** The breakeven between Lambda and EC2 occurs at approximately 30 million requests per month at 256MB memory and 500ms average duration.
- **Difficulty:** Intermediate
- **Dependencies:** K22: Lambda Pricing Breakdown, K24: Fargate Pricing Analysis, K26: Graviton Price-Performance, K27: Laravel Cloud vs Vapor

## Dependency Graph
**Depends on:**
- K22: Lambda Pricing Breakdown
- K24: Fargate Pricing Analysis
- K26: Graviton Price-Performance
- K27: Laravel Cloud vs Vapor

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Breakeven formula
- Crossover point
- Key variable
- Memory sensitivity
- Duration sensitivity
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K22: Lambda Pricing Breakdown, K24: Fargate Pricing Analysis, K26: Graviton Price-Performance, K27: Laravel Cloud vs Vapor

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