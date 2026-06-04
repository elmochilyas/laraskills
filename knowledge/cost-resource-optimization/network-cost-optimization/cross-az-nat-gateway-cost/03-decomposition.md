# Decomposition: Cross-AZ and NAT Gateway Cost

## Topic Overview
Cross-AZ data transfer costs $0.01/GB each direction ($0.02/GB round-trip) Ã¢â‚¬â€ this adds up significantly for chatty microservice communication. NAT Gateway costs ~$32/month + $0.045/GB processed. For a multi-AZ Laravel deployment with 10TB cross-AZ traffic/month, networking costs can reach $200-300/month.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k36-cross-az-nat-gateway-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cross-AZ and NAT Gateway Cost
- **Purpose:** Cross-AZ data transfer costs $0.01/GB each direction ($0.02/GB round-trip) Ã¢â‚¬â€ this adds up significantly for chatty microservice communication.
- **Difficulty:** Intermediate
- **Dependencies:** K34: RDS Proxy Pricing, K51: Cross-Region Data Transfer

## Dependency Graph
**Depends on:**
- K34: RDS Proxy Pricing
- K51: Cross-Region Data Transfer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Cross-AZ transfer
- NAT Gateway
- VPC endpoints
- Same-AZ traffic
- Cross-region
- S3/DynamoDB endpoints
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K34: RDS Proxy Pricing, K51: Cross-Region Data Transfer

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