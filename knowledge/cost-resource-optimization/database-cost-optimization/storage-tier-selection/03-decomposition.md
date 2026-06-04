# Decomposition: Storage Tier Selection

## Topic Overview
Database storage tier selection (EBS gp3, io2, or Aurora storage) directly impacts both cost and performance. For Laravel applications, RDS/Aurora storage costs $0.10-0.25/GB/month plus I/O charges. Choosing the right storage type and size prevents overpaying for unused IOPS or undersizing for peak demand. Aurora's self-healing storage auto-scales but has hidden I/O costs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-storage-tier-selection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Storage Tier Selection
- **Purpose:** Database storage tier selection (EBS gp3, io2, or Aurora storage) directly impacts both cost and performance. For Laravel applications, RDS/Aurora storage costs $0.10-0.25/GB/month plus I/O charges. Choosing the right storage type and size prevents overpaying for unused IOPS or undersizing for peak demand. Aurora's self-healing storage auto-scales but has hidden I/O costs.
- **Difficulty:** Foundation
- **Dependencies:** - Data Archival (ku-03), - Read Replicas Cost (ku-05), - Serverless Database (ku-07)

## Dependency Graph
**Depends on:**
- Data Archival (ku-03)
- Read Replicas Cost (ku-05)
- Serverless Database (ku-07)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- gp3: Default for all RDS MySQL/MariaDB/PostgreSQL instances; sufficient for most Laravel apps
- io2: High-transaction databases (>16000 IOPS sustained); financial systems, real-time analytics
- Aurora: When you need auto-scaling storage, 6-replica reads, or Aurora Serverless
- Provisioned IOPS: When gp3's 3000 IOPS is insufficient (monitor ReadIOPS/WriteIOPS)
- Storage auto-scaling: When you don't want to monitor disk usage manually (but set max limit)
**Out of scope:**
- io2 for typical Laravel: E-commerce, CMS, or SaaS apps rarely exceed 3000 IOPS; gp3 is sufficient
- gp2 instead of gp3: gp3 has same price as gp2 with 30x baseline IOPS; always choose gp3
- Aurora for single-AZ: Aurora's strength is replication; if not using replicas, RDS MySQL is cheaper
- Over-provisioning storage: Allocating 500GB when 50GB is used; costs $45/month waste
- Aurora I/O-heavy workloads: High I/O apps (logging, metrics) can have $1000+/month Aurora I/O charges
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