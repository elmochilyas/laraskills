# Decomposition: Data Retention Tiering

## Topic Overview
Observability data retention tiering moves data through storage classes based on age and access frequency. Hot data (last 7 days) needs fast, indexed access for debugging. Warm data (7-30 days) needs queryable access but can use slower, cheaper storage. Cold data (30+ days) can be archived to S3 Glacier for compliance. Without tiering, all data is stored in expensive hot storage forever, making monitoring costs dominate the infrastructure budget.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-data-retention-tiering/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Data Retention Tiering
- **Purpose:** Observability data retention tiering moves data through storage classes based on age and access frequency. Hot data (last 7 days) needs fast, indexed access for debugging. Warm data (7-30 days) needs queryable access but can use slower, cheaper storage. Cold data (30+ days) can be archived to S3 Glacier for compliance. Without tiering, all data is stored in expensive hot storage forever, making monitoring costs dominate the infrastructure budget.
- **Difficulty:** Foundation
- **Dependencies:** - Log Cost Optimization (ku-01), - Sampling Strategies (ku-04), - Storage Tier Selection, - Cost-Aware Observability Architecture

## Dependency Graph
**Depends on:**
- Log Cost Optimization (ku-01)
- Sampling Strategies (ku-04)
- Storage Tier Selection
- Cost-Aware Observability Architecture

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Retention tiering: Any app generating >10GB/month of observability data
- Compliance: Financial, healthcare, or regulated apps needing multi-year retention
- CloudWatch export: Export logs to S3 before retention expiration for long-term archive
- S3 + Athena: Query archived data without paying for hot log storage
- Rollup: Aggregate detailed metrics into hourly/daily summaries for trend analysis
- Old data deletion: After compliance period, delete archived data to stop storage costs
**Out of scope:**
- Tiny apps (<1GB/month): Retention tiering complexity not justified; just keep 30 days and delete
- Only hot-tier needed: If compliance allows 7-day retention, don't tier; just delete older data
- Manual tiering: If you can't automate the tiering process, it won't be maintained
- Every data type tiered: Health check logs don't need warm tier; just delete after 7 days
- Real-time querying of cold data: Archived data in Glacier can't be queried instantly
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