# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-8 Mysql Algorithm Options
**Generated:** 2026-06-03

---

# Decision Inventory

* ALGORITHM Selection: INSTANT vs INPLACE vs COPY
* LOCK Selection: NONE vs SHARED vs EXCLUSIVE
* MySQL Online DDL vs Shadow Table Tool

---

# Architecture-Level Decision Trees

---

## ALGORITHM Selection: INSTANT vs INPLACE vs COPY

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer running ALTER TABLE on MySQL must choose the algorithm to avoid blocking production traffic.

---

## Decision Criteria

* performance considerations: execution time, IO impact, table rebuild
* architectural considerations: MySQL version, operation type support
* security considerations: no direct impact
* maintainability considerations: error handling (fail vs fallback)

---

## Decision Tree

Does the operation support INSTANT (metadata-only)?
↓
YES → Use ALGORITHM=INSTANT (instant, no rebuild)
NO → Does the operation support INPLACE (rebuild with concurrent DML)?
    YES → Use ALGORITHM=INPLACE (rebuilds table, allows reads/writes)
    NO → Use ALGORITHM=COPY last resort, schedule during maintenance

---

## Rationale

INSTANT operations are metadata-only and complete in milliseconds regardless of table size. INPLACE rebuilds the table but allows concurrent DML (reads and writes continue). COPY blocks all DML for the duration of a full table copy. Always specify the algorithm explicitly — if MySQL doesn't support it, it will error instead of silently falling back to a slower algorithm.

---

## Recommended Default

**Default:** ALGORITHM=INSTANT for supported operations, else ALGORITHM=INPLACE
**Reason:** INSTANT has zero performance impact. INPLACE is acceptable for operations requiring table rebuild but allows concurrent access. COPY should only be used during scheduled maintenance windows with acceptable downtime.

---

## Risks Of Wrong Choice

Omitting ALGORITHM lets MySQL choose COPY on a large table, blocking production traffic. Specifying INSTANT for an unsupported operation causes an error — better than silent fallback but may block deployment.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Apply MySQL ALTER TABLE Algorithm Options for Safe DDL

---

## LOCK Selection: NONE vs SHARED vs EXCLUSIVE

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

After choosing the algorithm, the engineer must select the LOCK clause to control concurrent access during the operation.

---

## Decision Criteria

* performance considerations: concurrency level, lock duration
* architectural considerations: operation type, workload patterns
* security considerations: no direct impact
* maintainability considerations: acceptable downtime

---

## Decision Tree

Must the table accept writes during the migration?
↓
YES → Use LOCK=NONE (allows concurrent DML)
NO → Must the table accept reads during the migration?
    YES → Use LOCK=SHARED (allows reads, blocks writes)
    NO → Use LOCK=EXCLUSIVE (blocks all access)

---

## Rationale

LOCK=NONE is the zero-downtime choice, allowing both reads and writes to continue during the operation (subject to algorithm support). LOCK=SHARED allows reads but blocks writes — useful when write pauses are acceptable. LOCK=EXCLUSIVE blocks all access and should only be used during maintenance windows. Specifying LOCK explicitly ensures MySQL errors if your desired concurrency level is not supported.

---

## Recommended Default

**Default:** LOCK=NONE
**Reason:** LOCK=NONE provides zero-downtime DDL for most operations. Only use SHARED or EXCLUSIVE when the operation doesn't support NONE or when you have a specific reason to restrict concurrent access.

---

## Risks Of Wrong Choice

LOCK=NONE on an operation that doesn't support it causes an error. LOCK=EXCLUSIVE on a production table blocks all traffic. LOCK=SHARED unnecessarily allows reads when writes also need to continue.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Apply MySQL ALTER TABLE Algorithm Options for Safe DDL

---

## MySQL Online DDL vs Shadow Table Tool

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a MySQL ALTER TABLE must decide between using native online DDL (INSTANT/INPLACE) or a dedicated shadow table tool (gh-ost, pt-osc, Spirit).

---

## Decision Criteria

* performance considerations: IO impact, execution time, throttling
* architectural considerations: MySQL version, operation type
* security considerations: privilege requirements
* maintainability considerations: tool dependencies, monitoring

---

## Decision Tree

Does the operation support INSTANT or INPLACE with LOCK=NONE?
↓
YES → Use native MySQL online DDL (simpler, no extra tools)
NO → Does the operation require a full table rebuild?
    YES → Use shadow table tool (gh-ost, pt-osc, Spirit)
    NO → Use native MySQL DDL

---

## Rationale

Native online DDL is built into MySQL, requires no additional tools, and is the simplest approach for supported operations. Shadow table tools are needed when the operation would require ALGORITHM=COPY (full table copy with exclusive lock). These tools create a shadow table with the new schema, copy data incrementally, and swap atomically — avoiding the exclusive lock of COPY.

---

## Recommended Default

**Default:** Native online DDL when supported, shadow tool when not
**Reason:** Native DDL is simpler and requires no extra infrastructure. Shadow tools add operational complexity but are necessary for operations MySQL cannot perform online. Always check which operations your MySQL version supports.

---

## Risks Of Wrong Choice

Using native DDL for an operation that falls back to COPY causes production blocking. Using a shadow tool for an INSTANT-compatible operation adds unnecessary complexity.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Apply MySQL ALTER TABLE Algorithm Options for Safe DDL
