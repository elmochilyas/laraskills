# Decomposition: Performance vs Cost

## Topic Overview
Performance and cost are inversely related: higher performance typically costs more. The engineering challenge is finding the optimal point where marginal cost equals marginal benefit. For Laravel applications, this involves choosing between compute options (Lambda vs EC2 vs Fargate), optimization levels (OPcache vs JIT vs Octane), and instance sizes. The "knee" of the cost-performance curve is the sweet spot where additional spending yields diminishing returns.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-12-performance-vs-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Performance vs Cost
- **Purpose:** Performance and cost are inversely related: higher performance typically costs more. The engineering challenge is finding the optimal point where marginal cost equals marginal benefit. For Laravel applications, this involves choosing between compute options (Lambda vs EC2 vs Fargate), optimization levels (OPcache vs JIT vs Octane), and instance sizes. The "knee" of the cost-performance curve is the sweet spot where additional spending yields diminishing returns.
- **Difficulty:** Foundation
- **Dependencies:** - VM Sizing (ku-01), - Octane Resource Usage (ku-05), - Server Provisioning (ku-02), - Lambda Pricing

## Dependency Graph
**Depends on:**
- VM Sizing (ku-01)
- Octane Resource Usage (ku-05)
- Server Provisioning (ku-02)
- Lambda Pricing

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Performance optimization: When response time exceeds SLOs (e.g., p95 > 500ms)
- Cost optimization: When compute spend is material (>10% of revenue or budget)
- Breakeven analysis: When choosing between compute options (Lambda vs EC2, RDS vs Aurora)
- Cost-performance tradeoff: When deciding if Octane migration is worth the engineering effort
- Optimization budget: 1 hour of engineer time = ~$100; if optimization saves $10/month, ROI is 10 months
**Out of scope:**
- Over-optimizing: Don't spend $10K engineering time to save $50/month compute cost
- Premature optimization: Don't optimize before measuring (you don't know where the bottleneck is)
- Optimizing for theoretical peak: Design for P95/P99 traffic, not hypothetical maximum
- Performance at any cost: Don't double compute budget for 10% latency improvement unless latency directly impacts revenue
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization