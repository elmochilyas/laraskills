# 7-12 Multi-Region Replication - Rules

## Metadata

| Field | Value |
|---|---|
| Domain | Data & Storage Systems |
| Subdomain | replication |
| Knowledge Unit ID | 7-12 |
| Knowledge Unit | 7-12 Multi-Region Replication |
| Total Rules | 3 |
| Generated | 2026-06-04 |

---

> **Note**: Rules are behavioral constraints. Use direct language: Prefer, Avoid, Never, Always.

---

## 1. Always Monitor Cross-Region Replication Lag
---
## Category
Reliability
---
## Rule
Always monitor cross-region replication lag with region-specific alert thresholds.
---
## Reason
Cross-region replication is subject to network latency, bandwidth limits, and regional outages that can cause significant lag.
---
## Bad Example
Only monitoring overall replication lag without region-specific metrics.
---
## Good Example
Per-region lag monitoring with separate alerts for each region based on SLAs.
---
## Exceptions
Single-region deployments.
---
## Consequences Of Violation
Undetected cross-region lag causes stale reads without awareness.

---

## 2. Never Replicate Data To Geographically Restricted Regions
---
## Category
Compliance
---
## Rule
Never replicate data to geographic regions where data residency regulations are violated.
---
## Reason
Data residency laws (GDPR, CCPA, sovereign data laws) impose fines for unauthorized cross-border data transfer.
---
## Bad Example
Replicating EU user data to a US region without proper safeguards.
---
## Good Example
Map data residency requirements before designing replication topology. Use region tagging.
---
## Exceptions
Proper legal safeguards (SCCs, BCRs) are in place for cross-border transfers.
---
## Consequences Of Violation
Regulatory fines, legal liability, forced data deletion.

---

## 3. Always Use Async Replication For Cross-Region
---
## Architecture
---
## Rule
Always use asynchronous replication for cross-region connections to avoid unacceptable write latency.
---
## Reason
Cross-region RTT (10-200ms) added to every write makes synchronous replication impractical.
---
## Bad Example
Configuring semi-sync replication between US-East and EU-West regions.
---
## Good Example
Use async replication cross-region. Use semi-sync within same region for zero data loss.
---
## Exceptions
Applications that can tolerate 100-200ms write latency and require zero data loss.
---
## Consequences Of Violation
Write latency degrades to cross-region RTT, causing application timeouts.

---
