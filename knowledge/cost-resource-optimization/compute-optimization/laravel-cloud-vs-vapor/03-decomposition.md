# Decomposition: Laravel Cloud vs Vapor Cost Comparison

## Topic Overview
Laravel Cloud (Fargate-based) emerges as the default recommendation over Vapor (Lambda-based) for most production workloads in 2026. Real-world migrations show 30-50% cost reduction moving from Vapor to Cloud (PyleSoft: $11K→$5.5K; Trybe: ~40% at 500M requests/month; Superscript: 30%). Cloud's auto-hibernation and scale-to-zero make it competitive even for low-traffic apps at $5/month Starter plan.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k27-laravel-cloud-vs-vapor/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Cloud vs Vapor Cost Comparison
- **Purpose:** Laravel Cloud (Fargate-based) emerges as the default recommendation over Vapor (Lambda-based) for most production workloads in 2026.
- **Difficulty:** Advanced
- **Dependencies:** K28: Vapor Lambda Invocation Multiplier, K39: Filament Forge to Cloud, K40: PyleSoft Cost Reduction, K41: Trybe Cost Reduction, K42: Superscript Heroku Migration

## Dependency Graph
**Depends on:**
- K28: Vapor Lambda Invocation Multiplier
- K39: Filament Forge to Cloud
- K40: PyleSoft Cost Reduction
- K41: Trybe Cost Reduction
- K42: Superscript Heroku Migration

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Laravel Cloud
- Laravel Vapor
- Vapor hidden cost
- Cloud advantage
- Migration ROI
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K28: Vapor Lambda Invocation Multiplier, K39: Filament Forge to Cloud, K40: PyleSoft Cost Reduction, K41: Trybe Cost Reduction, K42: Superscript Heroku Migration

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