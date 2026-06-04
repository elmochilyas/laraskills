# Decomposition: Datadog Enterprise Pricing

## Topic Overview
Datadog at enterprise scale (200 hosts, 100 services) runs $18-45K/month, often exceeding compute infrastructure costs. Pricing components: $18-23/host for infrastructure, $31-40/host for APM, $0.10/GB for logs, plus additional charges for custom metrics, synthetics, and RUM. The per-host pricing model penalizes large fleets of small hosts (common with containerized Laravel on Fargate).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k30-datadog-enterprise-pricing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Datadog Enterprise Pricing
- **Purpose:** Datadog at enterprise scale (200 hosts, 100 services) runs $18-45K/month, often exceeding compute infrastructure costs.
- **Difficulty:** Intermediate
- **Dependencies:** K29: CloudWatch Cost Analysis, K31: New Relic Ingestion Pricing, K33: Monitoring Cost Comparison, K32: Scout APM Laravel

## Dependency Graph
**Depends on:**
- K29: CloudWatch Cost Analysis
- K31: New Relic Ingestion Pricing
- K33: Monitoring Cost Comparison
- K32: Scout APM Laravel

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Infra monitoring
- APM
- Logs
- Custom metrics
- Enterprise ($18-45K/month)
- Key gotcha
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K29: CloudWatch Cost Analysis, K31: New Relic Ingestion Pricing, K33: Monitoring Cost Comparison, K32: Scout APM Laravel

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