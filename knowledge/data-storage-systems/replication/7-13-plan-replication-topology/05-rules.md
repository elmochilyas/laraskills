# 7-13 Plan Replication Topology - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-13 |
| Knowledge Unit | 7-13 Plan Replication Topology |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Place Replicas in Different AZs
---
## Category
Architecture
---
## Rule
Always place production replicas in different availability zones from the primary.
---
## Reason
Same-AZ placement creates a single point of failure — an AZ outage takes down the entire database.
---
## Bad Example
All replicas in the same AZ as the primary for cost savings.
---
## Good Example
Primary in AZ-a, replica in AZ-b, second replica in AZ-c.
---
## Exceptions
Development and staging environments where cost is prioritized over availability.
---
## Consequences Of Violation
Complete database unavailability during AZ outages.

---

## 2. Never Design Topology Without RPO/RTO Targets
---
## Category
Design
---
## Rule
Always define Recovery Point Objective and Recovery Time Objective before designing replication topology.
---
## Reason
RPO/RTO determine replica count, placement, and replication mode. Without them, topology is guesswork.
---
## Bad Example
Choosing 2 replicas without defining whether 5-minute or 5-second RTO is required.
---
## Good Example
RPO=0, RTO<60s → semi-sync replication, 2 replicas in different AZs, automated failover.
---
## Exceptions
Non-production environments without availability requirements.
---
## Consequences Of Violation
Topology fails to meet actual business continuity requirements.

---

## 3. Always Document Topology With Node Roles
---
## Category
Operations
---
## Rule
Always document replication topology with node IPs, roles, replication modes, and failover priority.
---
## Reason
Undocumented topology causes confusion during incidents and personnel changes.
---
## Bad Example
Relying on tribal knowledge about which replica is the failover target.
---
## Good Example
Maintain a topology diagram showing primary, replicas, replication modes, and failover order.
---
## Exceptions
Cloud-managed databases with auto-generated topology documentation.
---
## Consequences Of Violation
Wrong replica promoted during failover, extended downtime.

---
