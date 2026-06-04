# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-2 Gh Ost Tool
**Generated:** 2026-06-03

---

# Decision Inventory

* gh-ost vs pt-osc for MySQL Online Schema Changes
* Test-on-Replica vs Direct Primary Migration
* Throttle Configuration: Replica Lag vs CPU vs Manual

---

# Architecture-Level Decision Trees

---

## gh-ost vs pt-osc for MySQL Online Schema Changes

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer needs to run a zero-downtime ALTER TABLE on MySQL and must choose between gh-ost (triggerless, binlog-based) and pt-osc (trigger-based).

---

## Decision Criteria

* performance considerations: trigger overhead, binlog amplification
* architectural considerations: MySQL version, binlog settings, FK support
* security considerations: privilege requirements (SUPER for gh-ost)
* maintainability considerations: tool maturity, pause/resume, cleanup

---

## Decision Tree

Does the table have high write throughput (> 1000 writes/sec)?
↓
YES → Use gh-ost (no trigger overhead, no deadlock risk)
NO → Is MySQL 8.0+ with row-based binlog available?
    YES → Use gh-ost (preferred, triggerless)
    NO → Is the schema FK-heavy with complex relationships?
        YES → Use pt-osc (more mature FK handling)
        NO → Use gh-ost

---

## Rationale

gh-ost avoids triggers entirely by streaming binlog events, eliminating the 5-10% write overhead and deadlock risk that pt-osc triggers introduce. For high-traffic tables, this is critical. pt-osc works on all MySQL versions and has more mature foreign key handling with automatic rebuild. For older MySQL versions without row-based binlog, pt-osc may be the only option.

---

## Recommended Default

**Default:** gh-ost
**Reason:** gh-ost is triggerless, supports pause/resume, and is the most battle-tested online schema change tool for MySQL. Use pt-osc only for older MySQL versions or specific FK scenarios where gh-ost's FK handling is insufficient.

---

## Risks Of Wrong Choice

pt-osc on high-traffic tables causes trigger deadlocks and performance degradation. gh-ost on MySQL without proper binlog settings fails during cutover.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute gh-ost Migrations on Production MySQL Tables. Execute pt-osc Migrations on Production MySQL Tables.

---

## Test-on-Replica vs Direct Primary Migration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer running a gh-ost migration must decide whether to first test on a replica before migrating on the primary.

---

## Decision Criteria

* performance considerations: replica capacity, migration timing
* architectural considerations: replica availability, topology
* security considerations: data integrity validation
* maintainability considerations: validation confidence

---

## Decision Tree

Is this a production migration on a table > 50GB?
↓
YES → Test on replica first (validate timing, catch errors)
NO → Is a replica available for testing?
    YES → Test on replica first (always recommended)
    NO → Run on primary with --dry-run first

---

## Rationale

Testing on a replica validates row copy timing, identifies data integrity issues, and confirms the cutover will complete within the sub-second lock window — all without risk to the primary. For small tables where the migration completes in seconds, the extra step is optional but still recommended. The dry-run mode provides a safety net when no replica is available.

---

## Recommended Default

**Default:** Test on replica first
**Reason:** The test-on-replica workflow is the primary safety mechanism in gh-ost. It validates every aspect of the migration without production impact. Only skip when no replica exists and the migration is low-risk.

---

## Risks Of Wrong Choice

Running untested on primary with a large table risks extended cutover time, data inconsistency, or an unrecoverable state. Skipping replica testing means discovering issues only during production migration.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute gh-ost Migrations on Production MySQL Tables

---

## Throttle Configuration: Replica Lag vs CPU vs Manual

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer must configure throttling for a gh-ost migration to prevent production impact.

---

## Decision Criteria

* performance considerations: replication lag tolerance, CPU headroom
* architectural considerations: replica topology, monitoring integration
* security considerations: no direct impact
* maintainability considerations: tuning effort, alerting

---

## Decision Tree

Is replication lag the primary concern in your environment?
↓
YES → Use replica-lag based throttling (default, safest)
NO → Is CPU utilization the main bottleneck?
    YES → Use CPU-based throttling
    NO → Use both replica-lag and CPU throttling (default combination)

---

## Rationale

Replica lag is the most common bottleneck during schema migrations because row copying creates write load that replicas must replay. gh-ost's default throttle on replica lag is appropriate for most environments. CPU throttling adds protection when the migration host itself is under load. Manual throttling via socket command is available for emergency intervention.

---

## Recommended Default

**Default:** Replica-lag based throttling (default 1 second threshold)
**Reason:** Replica lag is the most sensitive indicator of production impact. The 1-second default is conservative enough for most environments. Add CPU throttling if monitoring shows CPU spikes during migrations.

---

## Risks Of Wrong Choice

No throttling causes replication lag spikes and potential replica downtime. Overly aggressive throttling extends migration time unnecessarily.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute gh-ost Migrations on Production MySQL Tables
