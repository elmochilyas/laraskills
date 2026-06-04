# Decomposition: Cross-Region Data Transfer Costs

## Topic Overview
Cross-region data transfer costs $0.02/GB ($0.01-0.09 depending on region pair) and is the most overlooked cost in multi-region architectures. For globally distributed Laravel apps, cross-region data transfer can dominate the infrastructure bill Ã¢â‚¬â€ often exceeding compute costs. Common sources: S3 CRR, RDS read replicas across regions, DynamoDB Global Tables, and application-level API calls between regional deployments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k51-cross-region-data-transfer/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cross-Region Data Transfer Costs
- **Purpose:** Cross-region data transfer costs $0.02/GB ($0.01-0.09 depending on region pair) and is the most overlooked cost in multi-region architectures.
- **Difficulty:** Intermediate
- **Dependencies:** K52: Aurora Global Database Cost, K53: Active-Passive Multi-Region, K36: Cross-AZ and NAT Gateway Cost

## Dependency Graph
**Depends on:**
- K52: Aurora Global Database Cost
- K53: Active-Passive Multi-Region
- K36: Cross-AZ and NAT Gateway Cost

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Standard rate
- Range
- Free inbound
- Common sources
- Cost driver
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K52: Aurora Global Database Cost, K53: Active-Passive Multi-Region, K36: Cross-AZ and NAT Gateway Cost

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