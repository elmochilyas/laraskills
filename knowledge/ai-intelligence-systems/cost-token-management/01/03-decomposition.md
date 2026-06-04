# Decomposition: Cost Tracking & Allocation

## Topic Overview

Cost tracking and allocation for AI systems involves measuring, attributing, and reporting the monetary cost of every LLM API call. Because LLM costs vary by provider, model, token count, and caching strategy, accurate cost tracking requires a server-side pricing table applied per-request. Costs must be attributed to the appropriate dimension (user, tenant, feature, application) for billing, budget management, and optimization. In the Laravel AI ecosystem, cost tracking is implemented at the gateway middleware layer and aggregated in the observability pipeline.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-01/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Cost Tracking & Allocation
- **Purpose:** Cost tracking and allocation for AI systems involves measuring, attributing, and reporting the monetary cost of every LLM API call. Because LLM costs vary by provider, model, token count, and caching strategy, accurate cost tracking requires a server-side pricing table applied per-request. Costs must be attributed to the appropriate dimension (user, tenant, feature, application) for billing, budget management, and optimization. In the Laravel AI ecosystem, cost tracking is implemented at the gateway middleware layer and aggregated in the observability pipeline.
- **Difficulty:** Intermediate
- **Dependencies:** ku-02, ku-03, ku-04, ku-05, ku-05

## Dependency Graph
**Depends on:**
- ku-02
- ku-03
- ku-04
- ku-05
- ku-05

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Per-Request Cost:** Cost of a single LLM API call = (prompt tokens Ã— prompt price) + (completion tokens Ã— completion price).
- **Pricing Table:** A configuration that maps provider + model to per-token prices (prompt and completion). Must be updated when providers change pricing.
- **Cost Attribution:** Assigning each request's cost to a dimension (user_id, tenant_id, feature_name, application_id) for aggregation.
- **Budget:** A spending limit per dimension over a time window (daily, monthly). Hard limits block requests; soft limits alert.
- **Cost Aggregation:** Summing costs by dimension over time for reporting and dashboards.
- **Cost Allocation:** Distributing shared costs (fixed provider fees, embedding cache infrastructure) across dimensions proportionally.
- **Chargeback/Showback:** Presenting cost data to internal teams (showback) or billing them directly (chargeback).

**Out of scope:**
- ku-02 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

