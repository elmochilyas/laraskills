# Decomposition: Data Archival

## Topic Overview
Data archival moves infrequently accessed data from expensive database storage to cheaper long-term storage (S3, Glacier, or separate archival database). For Laravel applications, old orders, historical logs, archived user data, and stale soft-deleted records accumulate over time, increasing table sizes, slowing queries, and requiring larger database instances. Systematic archival reduces active database size by 60-80%, enabling smaller instances and faster queries.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-data-archival/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Data Archival
- **Purpose:** Data archival moves infrequently accessed data from expensive database storage to cheaper long-term storage (S3, Glacier, or separate archival database). For Laravel applications, old orders, historical logs, archived user data, and stale soft-deleted records accumulate over time, increasing table sizes, slowing queries, and requiring larger database instances. Systematic archival reduces active database size by 60-80%, enabling smaller instances and faster queries.
- **Difficulty:** Foundation
- **Dependencies:** - Storage Tier Selection (ku-07 in cdn-storage), - Query Optimization Cost (ku-01), - Serverless Database (ku-07)

## Dependency Graph
**Depends on:**
- Storage Tier Selection (ku-07 in cdn-storage)
- Query Optimization Cost (ku-01)
- Serverless Database (ku-07)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Database > 100GB: Active data is small percentage; archival reclaims space and improves performance
- Query performance degradation: Old data slows down queries that should only touch recent records
- Compliance retention: Legal requirement to keep data for 7 years but active access is only 30 days
- Cost reduction: Database resize from r7g.2xlarge to r7g.large after archival (50-75% cost reduction)
- Soft-deleted accumulation: Millions of soft-deleted records still in active tables
**Out of scope:**
- Small databases (< 50GB): Archival overhead may not justify savings
- Active data only: If all data is accessed equally (no clear hot/cold separation)
- No retention requirement: If there's no compliance or business need to keep old data
- E-commerce with repeat purchases: Customers may need access to 3+ year old orders (keep accessible but archive)
- Real-time analytics: Archived data in S3 is not available for real-time queries
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