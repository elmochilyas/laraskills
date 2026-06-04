# Decomposition: New Relic Ingestion Pricing

## Topic Overview
New Relic's per-GB pricing model ($0.30/GB ingested across all telemetry types) is more predictable than Datadog's per-host model. The free tier offers 100GB/month free (never expires). For mid-scale deployments, New Relic costs ~$2,500-4,000/month vs Datadog's $6,500+.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k31-new-relic-ingestion-pricing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### New Relic Ingestion Pricing
- **Purpose:** New Relic's per-GB pricing model ($0.30/GB ingested across all telemetry types) is more predictable than Datadog's per-host model.
- **Difficulty:** Intermediate
- **Dependencies:** K29: CloudWatch Cost Analysis, K30: Datadog Enterprise Pricing, K33: Monitoring Cost Comparison, K32: Scout APM Laravel

## Dependency Graph
**Depends on:**
- K29: CloudWatch Cost Analysis
- K30: Datadog Enterprise Pricing
- K33: Monitoring Cost Comparison
- K32: Scout APM Laravel

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Data Plus
- Free tier
- User pricing
- Predictability
- vs Datadog
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K29: CloudWatch Cost Analysis, K30: Datadog Enterprise Pricing, K33: Monitoring Cost Comparison, K32: Scout APM Laravel

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