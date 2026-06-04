# Decomposition: VM Sizing

## Topic Overview
VM sizing matches instance compute capacity (CPU, memory, network) to actual workload requirements. For Laravel applications, typical bottlenecks are CPU for PHP execution, memory for PHP-FPM pools, and network for data transfer. Graviton (ARM) instances offer 20% better price-performance than x86 for Laravel. Right-sizing eliminates 30-50% waste from over-provisioned instances while maintaining performance.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-vm-sizing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### VM Sizing
- **Purpose:** VM sizing matches instance compute capacity (CPU, memory, network) to actual workload requirements. For Laravel applications, typical bottlenecks are CPU for PHP execution, memory for PHP-FPM pools, and network for data transfer. Graviton (ARM) instances offer 20% better price-performance than x86 for Laravel. Right-sizing eliminates 30-50% waste from over-provisioned instances while maintaining performance.
- **Difficulty:** Foundation
- **Dependencies:** - Server Provisioning (ku-02), - Auto Scaling Policies, - Graviton Price-Performance

## Dependency Graph
**Depends on:**
- Server Provisioning (ku-02)
- Auto Scaling Policies
- Graviton Price-Performance

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- t4g instances: Dev/staging, low-traffic production (<100 req/s), burstable workloads
- m7g instances: Standard web/app servers; balanced CPU and memory
- r7g instances: Memory-bound apps (large cache, in-memory processing)
- c7g instances: CPU-intensive (image processing, PDF generation, data analysis)
- Graviton: All new deployments (ARM is the future, 20% cheaper)
**Out of scope:**
- t4g for sustained high CPU: Burstable instances exhaust credits; sustained >20% CPU needs m7g
- x86 for new deployments: Graviton is cheaper and performs equivalently for Laravel
- r7g for I/O-bound apps: Memory optimized doesn't help I/O bottlenecks; use m7g instead
- Large instances (xlarge+) for single-process workloads: Multiple PHP workers need multiple cores; one large instance > two mediums if CPU-bound
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