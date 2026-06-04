# Decomposition: GrowthBook

## Topic Overview
GrowthBook is an open-source feature flag and experimentation platform that is warehouse-native (queries data from existing data warehouses), self-hostable, supports the OpenFeature standard, provides RBAC, approval workflows, stale flag detection, and experimentation with statistical rigor. Its warehouse-native architecture means experiment results are computed where the data lives, reducing data movement and enabling complex analysis on existing datasets.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
growthbook/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### GrowthBook
- **Purpose:** GrowthBook is an open-source feature flag and experimentation platform that is warehouse-native (queries data from existing data warehouses), self-hostable, supports the OpenFeature standard, provides RBAC, approval workflows, stale flag detection, and experimentation with statistical rigor.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-FFG-001 (laravel-pennant) — Simple flagging, no experimentation, GCE-FFG-002 (launchdarkly) — Enterprise SaaS, similar governance, GCE-FFG-004 (unleash) — Open-source alternative with FeatureOps

## Dependency Graph
**Depends on:**
- GCE-FFG-001 (laravel-pennant) — Simple flagging, no experimentation
- GCE-FFG-002 (launchdarkly) — Enterprise SaaS, similar governance
- GCE-FFG-004 (unleash) — Open-source alternative with FeatureOps

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Warehouse-native experimentation
- OpenFeature standard
- Stale flag detection
- Approval workflows
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-FFG-001 (laravel-pennant) — Simple flagging, no experimentation, GCE-FFG-002 (launchdarkly) — Enterprise SaaS, similar governance, GCE-FFG-004 (unleash) — Open-source alternative with FeatureOps

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