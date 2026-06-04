# Decomposition: Vertical Scaling

## Topic Overview
Vertical scaling increases the size of individual server instances (more CPU, memory, network) instead of adding more instances. For Laravel applications, vertical scaling is appropriate for stateful workloads (databases, cache nodes) and applications that can't easily be horizontally scaled. While simpler to implement (no architecture changes), vertical scaling has limits (instance max size) and provides no fault tolerance. The key cost consideration: a large instance costs less than multiple smaller ones for the same total capacity, but the lack of granularity often leads to over-provisioning.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-vertical-scaling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Vertical Scaling
- **Purpose:** Vertical scaling increases the size of individual server instances (more CPU, memory, network) instead of adding more instances. For Laravel applications, vertical scaling is appropriate for stateful workloads (databases, cache nodes) and applications that can't easily be horizontally scaled. While simpler to implement (no architecture changes), vertical scaling has limits (instance max size) and provides no fault tolerance. The key cost consideration: a large instance costs less than multiple smaller ones for the same total capacity, but the lack of granularity often leads to over-provisioning.
- **Difficulty:** Foundation
- **Dependencies:** - Horizontal Scaling (ku-01), - Predictive Autoscaling (ku-03), - VM Sizing, - Octane Resource Usage

## Dependency Graph
**Depends on:**
- Horizontal Scaling (ku-01)
- Predictive Autoscaling (ku-03)
- VM Sizing
- Octane Resource Usage

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Database tier: RDS/Aurora instances; vertical scaling is the primary scaling method (read replicas help read scaling)
- Cache tier: ElastiCache Redis; memory is primary constraint; vertical scaling adds memory
- Stateful applications: Apps that can't easily be horizontally scaled
- Small deployments: 1-2 instances; vertical scaling is simpler than setting up ASG
- Octane workers: Vertical scaling adds CPU cores = more Octane workers per instance
- Legacy applications: Monolithic apps that aren't designed for horizontal scaling
**Out of scope:**
- Web tier with variable traffic: Horizontal scaling provides better cost efficiency (match capacity to load)
- Fault-tolerant requirements: Vertical scaling is single point of failure; use multi-instance horizontal
- Near-instance limits: If you're at 4xlarge or larger, consider horizontal scaling (instance limit approaching)
- Cost-sensitive scaling: Vertical scaling often leads to over-provisioning (coarse granularity)
- Rapid scaling needs: Vertical scaling takes 5-30 minutes of downtime; horizontal scaling is instant (add another instance)
- Stateless workloads: Horizontal scaling is always better for stateless apps
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