# Decomposition: Fargate Pricing Analysis

## Topic Overview
AWS Fargate bills per vCPU-hour and GB-hour for container tasks with a 1-minute minimum. A 1vCPU/2GB task costs ~$35.90/month (x86) or ~$26.15/month (ARM) running 24/7. Fargate's 20-40% premium over EC2 is the price of zero server management.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k24-fargate-pricing-analysis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Fargate Pricing Analysis
- **Purpose:** AWS Fargate bills per vCPU-hour and GB-hour for container tasks with a 1-minute minimum.
- **Difficulty:** Intermediate
- **Dependencies:** K22: Lambda Pricing Breakdown, K23: Lambda vs EC2 Breakeven, K25: Fargate Spot Workers, K26: Graviton Price-Performance, K27: Laravel Cloud vs Vapor

## Dependency Graph
**Depends on:**
- K22: Lambda Pricing Breakdown
- K23: Lambda vs EC2 Breakeven
- K25: Fargate Spot Workers
- K26: Graviton Price-Performance
- K27: Laravel Cloud vs Vapor

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- vCPU pricing
- Memory pricing
- Minimum charge
- Fargate vs EC2 premium
- No free tier
- Ephemeral storage
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K22: Lambda Pricing Breakdown, K23: Lambda vs EC2 Breakeven, K25: Fargate Spot Workers, K26: Graviton Price-Performance, K27: Laravel Cloud vs Vapor

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