# Decomposition: Server Provisioning

## Topic Overview
Server provisioning configures the compute, storage, and network resources for Laravel applications. Efficient provisioning matches resources to workload requirements, eliminates waste from over-sized volumes and idle capacity, and uses automation to prevent configuration drift. Key decisions include EBS volume type (gp3 vs io2), swap configuration, and AMI lifecycle management.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-server-provisioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Server Provisioning
- **Purpose:** Server provisioning configures the compute, storage, and network resources for Laravel applications. Efficient provisioning matches resources to workload requirements, eliminates waste from over-sized volumes and idle capacity, and uses automation to prevent configuration drift. Key decisions include EBS volume type (gp3 vs io2), swap configuration, and AMI lifecycle management.
- **Difficulty:** Foundation
- **Dependencies:** - VM Sizing (ku-01), - PHP-FPM Tuning (ku-03), - Octane Resource Usage (ku-05)

## Dependency Graph
**Depends on:**
- VM Sizing (ku-01)
- PHP-FPM Tuning (ku-03)
- Octane Resource Usage (ku-05)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- gp3: Default for all EBS volumes; sufficient for Laravel apps (database, app data, logs)
- io2: Only for high-performance databases (>16000 IOPS); not needed for typical Laravel
- Instance store: Cache layers, temp data; not for persistent storage
- gp3 with 3000 IOPS: 95%+ of Laravel workloads (PHP-FPM, artifacts, logs)
- Root volume: gp3 20-30GB for OS + PHP + application code
**Out of scope:**
- io2 for web servers: Web servers do not need provisioned IOPS; gp3 is sufficient and cheaper
- gp2 volumes: gp2 is same price as gp3 but lower baseline performance; always use gp3
- Provisioning >100GB without monitoring: Most Laravel apps need 30-50GB; over-provisioning costs $4-8/month per server unnecessarily
- Magnetic volumes (standard): Never use; 50x slower than gp3
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