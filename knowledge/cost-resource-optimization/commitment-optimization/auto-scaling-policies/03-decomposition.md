# Decomposition: Auto Scaling Policies

## Topic Overview
Auto Scaling policies determine how compute capacity expands/contracts in response to load. For Laravel applications, the choice between dynamic (target tracking, step scaling) and predictive scaling significantly impacts both cost and performance. Predictive scaling is especially powerful for applications with predictable daily/weekly traffic patterns. Correctly configured scaling policies eliminate over-provisioning waste while preventing under-provisioning performance issues.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-auto-scaling-policies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Auto Scaling Policies
- **Purpose:** Auto Scaling policies determine how compute capacity expands/contracts in response to load. For Laravel applications, the choice between dynamic (target tracking, step scaling) and predictive scaling significantly impacts both cost and performance. Predictive scaling is especially powerful for applications with predictable daily/weekly traffic patterns. Correctly configured scaling policies eliminate over-provisioning waste while preventing under-provisioning performance issues.
- **Difficulty:** Foundation
- **Dependencies:** - Scheduled Scaling (ku-04), - Spot Instances (ku-02), - Horizontal Scaling, - Predictive Auto Scaling (ku-03 in server-sizing-autoscaling)

## Dependency Graph
**Depends on:**
- Scheduled Scaling (ku-04)
- Spot Instances (ku-02)
- Horizontal Scaling
- Predictive Auto Scaling (ku-03 in server-sizing-autoscaling)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Target tracking: General web server auto-scaling; simplest and most effective for most workloads
- Step scaling: When you need different response magnitudes (e.g., add 2 instances at 70%, add 6 at 90%)
- Predictive scaling: Consistent daily/weekly traffic patterns (SaaS apps, business-hour apps)
- Scheduled scaling: Known events (product launches, marketing campaigns, end-of-month processing)
- Combined predictive + dynamic: Best approach; predictively scale ahead of known patterns, dynamically adjust for variance
**Out of scope:**
- Predictive scaling: Not for workloads with random, unpredictable traffic spikes (gaming, flash sales)
- Simple scaling: Never use (deprecated); target tracking or step scaling provides better control
- Target tracking with wrong metric: Using CPU for a memory-bound application (scale based on memory or request count instead)
- Aggressive scaling: Adding/removing instances too quickly (creates thrashing, increases cost)
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