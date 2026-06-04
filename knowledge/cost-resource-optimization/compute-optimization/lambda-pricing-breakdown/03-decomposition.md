# Decomposition: Lambda Pricing Breakdown

## Topic Overview
Lambda pricing consists of request charges ($0.20/1M requests) and duration charges ($0.0000166667/GB-second) with a generous free tier. ARM/Graviton2 functions deliver ~34% cost reduction vs x86. Understanding the per-millisecond billing model is critical for determining when Lambda is cost-effective vs EC2 or Fargate.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k22-lambda-pricing-breakdown/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Lambda Pricing Breakdown
- **Purpose:** Lambda pricing consists of request charges ($0.20/1M requests) and duration charges ($0.0000166667/GB-second) with a generous free tier.
- **Difficulty:** Foundation
- **Dependencies:** K23: Lambda vs EC2 Breakeven Analysis, K24: Fargate Pricing Analysis, K26: Graviton Price-Performance, K28: Vapor Lambda Invocation Multiplier

## Dependency Graph
**Depends on:**
- K23: Lambda vs EC2 Breakeven Analysis
- K24: Fargate Pricing Analysis
- K26: Graviton Price-Performance
- K28: Vapor Lambda Invocation Multiplier

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Request pricing
- Duration pricing
- ARM pricing
- Provisioned Concurrency
- Free tier
- Memory range
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K23: Lambda vs EC2 Breakeven Analysis, K24: Fargate Pricing Analysis, K26: Graviton Price-Performance, K28: Vapor Lambda Invocation Multiplier

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