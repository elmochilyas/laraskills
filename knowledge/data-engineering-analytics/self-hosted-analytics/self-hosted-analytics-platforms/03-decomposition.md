# Decomposition: Self-Hosted Analytics Platforms — Deployment & Integration

## Topic Overview
GA4's forced migration and deprecation of Universal Analytics drove massive churn toward self-hosted analytics. Laravel applications now commonly integrate with one of three major platforms: Plausible (privacy-first, simple), Matomo (GA4 replacement, enterprise), or PostHog (product analytics, SaaS). The integration pattern differs per platform — Plausible uses a lightweight JavaScript snippet and optional reverse proxy, Matomo offers a PHP SDK, and PostHog provides an HTTP API and feature flags.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k003-self-hosted-analytics-platforms/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Self-Hosted Analytics Platforms — Deployment & Integration
- **Purpose:** GA4's forced migration and deprecation of Universal Analytics drove massive churn toward self-hosted analytics.
- **Difficulty:** Foundation
- **Dependencies:** K022 (GDPR Compliance): Cookie-free analytics default across all platforms, K006 (Star Schema): ClickHouse schema design for PostHog/Plausible queries, K012 (ClickHouse MergeTree): ClickHouse engine configuration for analytics

## Dependency Graph
**Depends on:**
- K022 (GDPR Compliance): Cookie-free analytics default across all platforms
- K006 (Star Schema): ClickHouse schema design for PostHog/Plausible queries
- K012 (ClickHouse MergeTree): ClickHouse engine configuration for analytics

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Plausible:
- Matomo:
- PostHog:
- Umami:
- Reverse proxy pattern:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K022 (GDPR Compliance): Cookie-free analytics default across all platforms, K006 (Star Schema): ClickHouse schema design for PostHog/Plausible queries, K012 (ClickHouse MergeTree): ClickHouse engine configuration for analytics

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