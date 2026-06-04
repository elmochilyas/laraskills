# Decomposition: Graviton Price-Performance

## Topic Overview
AWS Graviton (ARM) processors deliver 20-40% better price-performance than equivalent x86 instances for Laravel workloads. The savings apply across EC2 (20% cheaper), Fargate (20% cheaper), and Lambda (34% cheaper). PHP and Laravel have excellent ARM support as of PHP 8.0+, making Graviton the default recommendation for new deployments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k26-graviton-price-performance/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Graviton Price-Performance
- **Purpose:** AWS Graviton (ARM) processors deliver 20-40% better price-performance than equivalent x86 instances for Laravel workloads.
- **Difficulty:** Foundation
- **Dependencies:** K22: Lambda Pricing Breakdown, K24: Fargate Pricing Analysis, K16: ElastiCache Graviton Savings

## Dependency Graph
**Depends on:**
- K22: Lambda Pricing Breakdown
- K24: Fargate Pricing Analysis
- K16: ElastiCache Graviton Savings

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- EC2 savings
- Fargate savings
- Lambda savings
- RDS savings
- ElastiCache savings
- PHP compatibility
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K22: Lambda Pricing Breakdown, K24: Fargate Pricing Analysis, K16: ElastiCache Graviton Savings

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