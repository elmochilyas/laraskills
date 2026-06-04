# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-4 Spirit Tool
**Generated:** 2026-06-03

---

# Decision Inventory

* Spirit vs gh-ost vs pt-osc for MySQL Schema Changes
* Physical Replication vs Row-by-Row Copy
* Spirit for RDS/Aurora vs Self-Managed MySQL

---

# Architecture-Level Decision Trees

---

## Spirit vs gh-ost vs pt-osc for MySQL Schema Changes

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a MySQL schema change must choose between Spirit (physical replication), gh-ost (binlog-based), and pt-osc (trigger-based) tools.

---

## Decision Criteria

* performance considerations: row copy speed, trigger overhead, binlog requirements
* architectural considerations: MySQL version, RDS/Aurora compatibility
* security considerations: privilege requirements
* maintainability considerations: tool maturity, ecosystem

---

## Decision Tree

Is this MySQL 8.0+ with performance_schema enabled?
↓
YES → Do you need fastest possible row copy for large tables (> 100GB)?
    YES → Use Spirit (physical copy is 2x faster than row-by-row)
    NO → Use gh-ost (most mature, triggerless)
NO → Do you need pause/resume and broad MySQL version support?
    YES → Use gh-ost (supports MySQL 5.7+)
    NO → Use pt-osc (supports older MySQL versions, FK-heavy schemas)

---

## Rationale

Spirit's physical replication approach is up to 2x faster than row-by-row copy for very large tables, but requires MySQL 8.0+ and performance_schema. gh-ost is the most mature option with broad version support and pause/resume. pt-osc remains the fallback for older MySQL versions or complex FK schemas. The choice depends primarily on MySQL version and table size.

---

## Recommended Default

**Default:** gh-ost for general MySQL use, Spirit for MySQL 8.0+ large tables
**Reason:** gh-ost is the most battle-tested and broadly compatible. Spirit's speed advantage only matters for very large tables on MySQL 8.0+.

---

## Risks Of Wrong Choice

Spirit on MySQL < 8.0 is unsupported. pt-osc triggers on high-traffic tables cause deadlocks. gh-ost binlog requirements fail on MySQL without row-based replication.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute Spirit Tool Migrations on MySQL 8.0+ Tables

---

## Physical Replication vs Row-by-Row Copy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer must decide whether Spirit's physical replication (file-level copy) or row-by-row copy (gh-ost/pt-osc) is more appropriate for their table size and environment.

---

## Decision Criteria

* performance considerations: copy speed (physical is 2x faster for large tables)
* architectural considerations: disk space requirements (1.5x table size for physical)
* security considerations: no direct impact
* maintainability considerations: tool dependencies, monitoring

---

## Decision Tree

Is the table larger than 100GB?
↓
YES → Use Spirit (physical copy faster, less write amplification)
NO → Is at least 1.5x table size free disk available?
    YES → Use Spirit if speed is critical, otherwise gh-ost
    NO → Use gh-ost or pt-osc (row-by-row has lower peak disk usage)

---

## Rationale

Physical replication copies the entire table file, which is faster than row-by-row for multi-hundred-GB tables. However, it requires up to 1.5x the table size in free disk space. Row-by-row copy (gh-ost/pt-osc) streams changes incrementally and has lower peak disk usage. For tables under 100GB, the speed difference is usually not significant enough to justify physical copy's disk requirements.

---

## Recommended Default

**Default:** Row-by-row copy (gh-ost) for most tables
**Reason:** gh-ost's row-by-row approach has lower disk requirements, supports pause/resume, and is more broadly compatible. Reserve Spirit's physical copy for tables > 100GB where the speed gain is material.

---

## Risks Of Wrong Choice

Physical copy on a disk-constrained server causes out-of-space errors. Row-by-row copy on a 500GB table takes hours longer than physical copy.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute Spirit Tool Migrations on MySQL 8.0+ Tables

---

## Spirit for RDS/Aurora vs Self-Managed MySQL

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer deploying on AWS RDS/Aurora must decide between Spirit (designed for managed MySQL) and traditional tools (gh-ost/pt-osc).

---

## Decision Criteria

* performance considerations: physical copy efficiency on network storage
* architectural considerations: RDS binlog retention limits, read replica usage
* security considerations: IAM permissions, network security groups
* maintainability considerations: managed service constraints

---

## Decision Tree

Are you using RDS or Aurora MySQL?
↓
YES → Use Spirit (designed for managed MySQL with physical replication)
NO → Use gh-ost (binlog-based, works better on self-managed MySQL)

---

## Rationale

Spirit was designed specifically for RDS/Aurora environments where physical replication through read replicas is more efficient than binlog streaming. RDS binlog retention limits (typically 24h maximum) can cause gh-ost failures on long-running migrations. Spirit avoids this by using physical copy instead of binlog streaming.

---

## Recommended Default

**Default:** Spirit for RDS/Aurora, gh-ost for self-managed MySQL
**Reason:** Spirit's physical replication approach aligns with RDS/Aurora's architecture. gh-ost's binlog-based approach is simpler on self-managed MySQL where you control binlog retention.

---

## Risks Of Wrong Choice

gh-ost on RDS with short binlog retention fails mid-migration. Spirit on self-managed MySQL adds unnecessary complexity when gh-ost works perfectly.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Execute Spirit Tool Migrations on MySQL 8.0+ Tables
