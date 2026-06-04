# Decomposition: Aurora Serverless v2 Pricing

## Topic Overview
Aurora Serverless v2 costs $0.12/ACU-hour (Standard) or $0.156/ACU-hour (I/O-Optimized) with minimum capacity of 0.5 ACU (~$43/month minimum). Each ACU provides approximately 2GB memory with proportional CPU. While promising for variable workloads, the pricing model has pitfalls: minimum ACU settings, no RI equivalents, and the trap of setting min ACU too low causing buffer pool thrashing.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k06-aurora-serverless-v2/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Aurora Serverless v2 Pricing
- **Purpose:** Aurora Serverless v2 costs $0.12/ACU-hour (Standard) or $0.156/ACU-hour (I/O-Optimized) with minimum capacity of 0.5 ACU (~$43/month minimum).
- **Difficulty:** Intermediate
- **Dependencies:** K07: Aurora Serverless v2 Breakeven, K09: Aurora Platform v4, K34: RDS Proxy Pricing, K05: RDS Reserved Instances

## Dependency Graph
**Depends on:**
- K07: Aurora Serverless v2 Breakeven
- K09: Aurora Platform v4
- K34: RDS Proxy Pricing
- K05: RDS Reserved Instances

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- ACU-hour
- 1 ACU
- Min capacity
- Auto-pause
- No RI available
- Scale speed
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K07: Aurora Serverless v2 Breakeven, K09: Aurora Platform v4, K34: RDS Proxy Pricing, K05: RDS Reserved Instances

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