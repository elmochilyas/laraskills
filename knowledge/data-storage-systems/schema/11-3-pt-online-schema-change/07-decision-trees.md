# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-3 Pt Online Schema Change
**Generated:** 2026-06-03

---

# Decision Inventory

* pt-osc vs gh-ost for Trigger-Heavy Environments
* Chunk Size Selection for Row Copy
* Foreign Key Handling Strategy

---

# Architecture-Level Decision Trees

---

## pt-osc vs gh-ost for Trigger-Heavy Environments

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer on an older MySQL version or FK-heavy schema must decide whether pt-osc's trigger-based approach or gh-ost's triggerless approach is more appropriate.

---

## Decision Criteria

* performance considerations: trigger overhead (5-10%), deadlock risk
* architectural considerations: MySQL version compatibility, binlog settings
* security considerations: trigger persistence if process is killed
* maintainability considerations: trigger cleanup, FK rebuild

---

## Decision Tree

Is MySQL 5.6 or older (no online DDL support)?
↓
YES → Use pt-osc (only option for pre-5.6 versions)
NO → Does the table have complex foreign key dependencies?
    YES → Use pt-osc (more mature FK handling with --alter-foreign-keys-method)
    NO → Use gh-ost (triggerless, lower write impact)

---

## Rationale

pt-osc is the only viable option for MySQL versions before 5.6 that lack native online DDL and row-based binlog. Its trigger-based approach works on all MySQL versions. For FK-heavy schemas, pt-osc offers `--alter-foreign-keys-method=auto` which automatically rebuilds FK relationships — more mature than gh-ost's FK support. The tradeoff is trigger overhead and deadlock risk under high concurrency.

---

## Recommended Default

**Default:** gh-ost for MySQL 5.7+, pt-osc for older MySQL or complex FK schemas
**Reason:** gh-ost is generally preferable for its triggerless design. pt-osc remains the best choice when MySQL version or FK complexity prevents gh-ost usage.

---

## Risks Of Wrong Choice

Using gh-ost on pre-5.6 MySQL fails due to missing binlog support. pt-osc on high-traffic tables triggers deadlocks and adds write latency.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute pt-osc Migrations on Production MySQL Tables

---

## Chunk Size Selection for Row Copy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer must configure the chunk size for pt-osc's row-by-row data copy, balancing migration speed against production impact.

---

## Decision Criteria

* performance considerations: copy speed, lock duration per chunk
* architectural considerations: workload patterns, replication lag
* security considerations: no direct impact
* maintainability considerations: tuning effort

---

## Decision Tree

Is the table write-heavy (> 500 writes/sec)?
↓
YES → Use smaller chunk size (500 rows, longer migration but lower impact)
NO → Is the table an archive or read-only table?
    YES → Use larger chunk size (5000 rows, faster migration)
    NO → Start with default (1000 rows), monitor replication lag

---

## Rationale

Smaller chunks reduce the per-chunk lock duration and replication lag impact but increase total migration time. For write-heavy tables, smaller chunks (500) minimize contention. For archive tables with no concurrent writes, larger chunks (5000) maximize throughput. The default of 1000 is a reasonable starting point for general-purpose tables.

---

## Recommended Default

**Default:** 1000 rows per chunk
**Reason:** 1000 is the pt-osc default and works well for most workloads. Adjust down for write-heavy tables, up for archive tables. Monitor replication lag and adjust if needed.

---

## Risks Of Wrong Choice

Too-large chunks on write-heavy tables cause replication lag spikes and lock contention. Too-small chunks on archive tables unnecessarily extend migration duration.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute pt-osc Migrations on Production MySQL Tables

---

## Foreign Key Handling Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer migrating a table with foreign key constraints must choose a strategy for handling FK references during the shadow table swap.

---

## Decision Criteria

* performance considerations: FK rebuild lock time, referencing table size
* architectural considerations: FK relationship complexity, dependency depth
* security considerations: referential integrity during migration
* maintainability considerations: automation, manual intervention

---

## Decision Tree

Does the table have foreign key constraints?
↓
YES → Use --alter-foreign-keys-method=auto (pt-osc handles FK rebuild)
NO → No special FK handling needed

---

## Rationale

pt-osc's `--alter-foreign-keys-method=auto` automatically detects FK relationships and chooses the optimal rebuild strategy. It can rebuild FKs on the new table or drop and recreate them. For large referencing tables, this operation can be slow and may require significant lock time — test on staging first.

---

## Recommended Default

**Default:** --alter-foreign-keys-method=auto
**Reason:** This option lets pt-osc choose the optimal FK handling method based on the schema. It's the safest and most automated approach for FK-heavy migrations.

---

## Risks Of Wrong Choice

Not specifying FK handling on FK-referenced tables causes the migration to fail at cutover. Manual FK management risks breaking referential integrity or causing extended downtime.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute pt-osc Migrations on Production MySQL Tables
