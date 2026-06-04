# Decomposition: Horizontal Scaling

## Topic Overview
Horizontal scaling adds more server instances to handle increased load, as opposed to vertical scaling (bigger instances). For Laravel applications, horizontal scaling is the preferred approach: it provides better fault tolerance (survive instance failure), granular cost control (add/remove instances in small increments), and supports Auto Scaling. The key cost tradeoff: many small instances vs. fewer large instances. Many small instances are generally more cost-effective for web workloads due to better resource utilization and Spot diversification.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-horizontal-scaling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Horizontal Scaling
- **Purpose:** Horizontal scaling adds more server instances to handle increased load, as opposed to vertical scaling (bigger instances). For Laravel applications, horizontal scaling is the preferred approach: it provides better fault tolerance (survive instance failure), granular cost control (add/remove instances in small increments), and supports Auto Scaling. The key cost tradeoff: many small instances vs. fewer large instances. Many small instances are generally more cost-effective for web workloads due to better resource utilization and Spot diversification.
- **Difficulty:** Foundation
- **Dependencies:** - Vertical Scaling (ku-02), - Predictive Autoscaling (ku-03), - VM Sizing, - Auto Scaling Policies

## Dependency Graph
**Depends on:**
- Vertical Scaling (ku-02)
- Predictive Autoscaling (ku-03)
- VM Sizing
- Auto Scaling Policies

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Horizontal scaling: Stateless Laravel apps (most production apps); preferred over vertical scaling
- Auto Scaling: Variable traffic; scale out/in based on load metrics
- Multi-AZ: Distribute instances across AZs for high availability
- Spot instances: Mix Spot + On-Demand in the same group
- Stateless web tier: Laravel + Redis sessions + S3 files = fully horizontally scalable
- Queue workers: Always horizontal (by definition; each worker is a process)
**Out of scope:**
- Stateful workloads: Apps with local session storage, local file storage, or in-memory caches that don't survive scale-in
- Very small scale: 1-2 instances; vertical scaling may be simpler and similarly cost-effective
- Database tier: Databases are harder to scale horizontally (read replicas help, writes are bottleneck)
- Non-stateless Laravel apps: Running without Redis/S3 for sessions/files; horizontal scaling would lose data
- Minimum capacity 1 ASG: If you only need 1 instance, scaling may not be necessary (use vertical first)
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