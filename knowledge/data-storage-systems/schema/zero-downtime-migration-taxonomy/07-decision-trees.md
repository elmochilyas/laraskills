# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-1 Zero Downtime Migration Taxonomy
**Generated:** 2026-06-03

---

# Decision Inventory

* Expand-Contract vs Online DDL vs Shadow Table
* Native Online DDL vs Tool-Based Migration
* Tool Selection: gh-ost vs pt-osc vs pgroll

---

# Architecture-Level Decision Trees

---

## Expand-Contract vs Online DDL vs Shadow Table

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a production schema change must choose between the three zero-downtime migration approaches: expand-contract (multi-deploy), online DDL (database-native), or shadow table (tool-based).

---

## Decision Criteria

* performance considerations: write amplification, lock duration, IO/CPU impact
* architectural considerations: migration complexity, database engine support
* security considerations: access controls, tool privileges
* maintainability considerations: rollback complexity, deployment coordination

---

## Decision Tree

Is the change complex (rename, type change, multi-table)?
↓
YES → Use expand-contract pattern (multi-deploy, rollback-safe)
NO → Does the database natively support non-blocking DDL for this operation?
    YES → Use online DDL (simplest, no extra tools)
    NO → Is the table large (> 50GB) or high-traffic?
        YES → Use shadow table tool (gh-ost, pt-osc, pgroll)
        NO → Use standard DDL during maintenance window

---

## Rationale

Expand-contract is the safest for complex changes because each phase is independently deployable and rollback-safe. Online DDL is the simplest option for additive changes supported by the database engine. Shadow table tools fill the gap for operations requiring full table rebuilds that the database cannot do online. The table size threshold (50GB) is a guideline — use shadow tools when the expected lock time is unacceptable.

---

## Recommended Default

**Default:** Online DDL for supported operations, expand-contract for complex ones
**Reason:** Online DDL is built-in and requires no extra tooling. Expand-contract works for any change type. Shadow tools add operational complexity — use them only when the other options aren't viable.

---

## Risks Of Wrong Choice

Standard DDL on a large table causes hours of downtime. Expand-contract for a simple add-column adds unnecessary deployment complexity. Shadow tool for a 1MB table is over-engineering.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying. Separate schema changes from data changes.

---

## Related Skills

Select Zero-Downtime Migration Approach by Taxonomy

---

## Native Online DDL vs Tool-Based Migration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

After choosing the shadow table approach, the engineer must decide between using the database's native online DDL or a specialized tool (gh-ost, pt-osc, pgroll).

---

## Decision Criteria

* performance considerations: row copy efficiency, write amplification
* architectural considerations: database version support, FK handling
* security considerations: tool privileges, SUPER access
* maintainability considerations: tool maturity, team familiarity

---

## Decision Tree

Does the database engine support online DDL for this exact operation?
↓
YES → Use native online DDL (simpler, no extra dependency)
NO → Does the operation require a full table rebuild?
    YES → Use tool-based migration (gh-ost/pt-osc for MySQL, pgroll for PG)
    NO → Use native online DDL

---

## Rationale

Native online DDL (MySQL INSTANT/INPLACE, PostgreSQL ADD COLUMN with no default) is built-in, tested, and requires no additional tools. Tool-based migration is needed when native DDL would lock the table for the duration of a row copy. Tools also provide throttling, pause/resume, and dry-run capabilities that native DDL lacks for complex operations.

---

## Recommended Default

**Default:** Native online DDL when supported
**Reason:** Native DDL is simpler, doesn't require additional infrastructure, and is maintained by the database vendor. Use tools only when native DDL cannot perform the operation without locking.

---

## Risks Of Wrong Choice

Using native DDL for an operation it doesn't support online causes unintended table locks. Using a tool when native DDL suffices adds unnecessary complexity and operational risk.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Select Zero-Downtime Migration Approach by Taxonomy

---

## Tool Selection: gh-ost vs pt-osc vs pgroll

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

When a tool-based migration is needed, the engineer must choose the right tool for the database engine and operational context.

---

## Decision Criteria

* performance considerations: trigger overhead, binlog streaming overhead
* architectural considerations: database engine, MySQL version, FK support
* security considerations: privilege requirements
* maintainability considerations: tool maturity, pause/resume support

---

## Decision Tree

Which database engine are you using?
↓
MySQL → Is the table write-heavy (> 1000 writes/sec)?
    YES → Use gh-ost (triggerless, binlog-based)
    NO → Does MySQL version support binlog_row_image?
        YES → Use gh-ost (preferred for MySQL 8.0+)
        NO → Use pt-osc (works on all MySQL versions)
PostgreSQL → Use pgroll (view-based, no exclusive locks)

---

## Rationale

gh-ost uses binlog stream capture without triggers, making it the safest choice for high-concurrency MySQL environments. pt-osc uses triggers that add ~5-10% write latency, making it suitable for lower-traffic tables and older MySQL versions. pgroll is the PostgreSQL-specific alternative that uses views rather than triggers or shadow tables. Each tool is database-specific — never use a MySQL tool on PostgreSQL or vice versa.

---

## Recommended Default

**Default:** gh-ost for MySQL, pgroll for PostgreSQL
**Reason:** gh-ost is triggerless and battle-tested at GitHub scale. pgroll is the standard for PostgreSQL online schema changes. Reserve pt-osc for older MySQL environments without row-based binlog.

---

## Risks Of Wrong Choice

pt-osc on a write-heavy table causes trigger deadlocks and performance degradation. gh-ost on MySQL < 5.7 without row-based binlog is unsupported. Using a MySQL tool on PostgreSQL simply will not work.

---

## Related Rules

Never use Eloquent models inside migrations. Separate schema changes from data changes.

---

## Related Skills

Execute gh-ost Migrations on Production MySQL Tables. Execute pt-osc Migrations on Production MySQL Tables.
