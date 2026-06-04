# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-6 Expand Contract Detailed
**Generated:** 2026-06-03

---

# Decision Inventory

* Expand-Contract vs Shadow Table for Table Migration
* Phase Cadence: How Long Between Phases
* Dual-Write Strategy: Application-Level vs Trigger-Based

---

# Architecture-Level Decision Trees

---

## Expand-Contract vs Shadow Table for Table Migration

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer needs to perform a table-level migration (new table structure or schema change) and must choose between the multi-phase expand-contract pattern and a single-cutover shadow table approach using a tool.

---

## Decision Criteria

* performance considerations: dual-write overhead, deployment count
* architectural considerations: rollback capability, complexity of change
* security considerations: data integrity across phases
* maintainability considerations: number of deploys, monitoring effort

---

## Decision Tree

Does the change require application-level data transformation?
↓
YES → Use expand-contract (application code handles dual-write and transformation)
NO → Is rollback safety the highest priority?
    YES → Use expand-contract (each phase is independently rollback-safe)
    NO → Use shadow table approach (faster, single cutover)

---

## Rationale

Expand-contract is the safest pattern because each phase is independently deployable and reversible. If something goes wrong after the expand phase, you revert the deploy without data loss. This makes it ideal for complex transformations. Shadow table tools (gh-ost, pt-osc) are faster — they complete in a single operation — but offer less granular rollback capability.

---

## Recommended Default

**Default:** Expand-contract for complex or risky changes
**Reason:** The multi-deploy overhead is worth it for changes where data integrity is critical or where rollback from a failed shadow table migration would be complex.

---

## Risks Of Wrong Choice

Shadow table migration on a complex schema with data transformation requirements may need rollback that is difficult or impossible to automate. Expand-contract for a simple column addition adds days of unnecessary deployment cycles.

---

## Related Rules

Never skip the dual-write phase. Separate schema changes from data changes.

---

## Related Skills

Execute Multi-Phase Expand-Contract for Complex Schema Changes

---

## Phase Cadence: How Long Between Phases

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer managing an expand-contract migration must decide the timing between each phase, balancing risk against speed of completion.

---

## Decision Criteria

* performance considerations: dual-write duration, storage costs
* architectural considerations: deploy pipeline cadence, rollback windows
* security considerations: exposure window for dual-write
* maintainability considerations: monitoring requirements

---

## Decision Tree

Is this a high-risk migration (column rename, table restructure)?
↓
YES → Wait 48-72 hours between phases (monitor for issues)
NO → Is this a standard column addition?
    YES → Wait 24 hours between phases (standard deploy cycle)
    NO → Wait 24-48 hours between phases

---

## Rationale

The waiting period between phases is the observation window. For high-risk migrations, a longer window (48-72h) allows detection of subtle issues: data inconsistencies, performance regressions, or errors in edge-case code paths. Standard migrations need one full deploy cycle (typically 24h) to confirm the previous phase is stable. The minimum time between the expand and switch phases must account for the backfill job completing.

---

## Recommended Default

**Default:** 24-48 hours between phases
**Reason:** One to two full deploy cycles between each phase allows sufficient observation without being overly conservative. Extend for high-risk migrations, shorten only for urgent changes where risk is understood.

---

## Risks Of Wrong Choice

Too short a cadence risks deploying on top of undetected issues from the previous phase. Too long a cadence extends the dual-write period, increasing operational complexity and storage costs.

---

## Related Rules

Maintain 24-48h between switch and contract. Verify backfill completeness before switching reads.

---

## Related Skills

Execute Multi-Phase Expand-Contract for Complex Schema Changes

---

## Dual-Write Strategy: Application-Level vs Trigger-Based

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer implementing expand-contract must decide how to maintain data consistency between old and new structures during the dual-write phase.

---

## Decision Criteria

* performance considerations: trigger overhead vs application latency
* architectural considerations: application code complexity, database portability
* security considerations: trigger permissions, code path coverage
* maintainability considerations: debugging, monitoring

---

## Decision Tree

Can the application code be updated to write to both structures?
↓
YES → Use application-level dual-write (explicit, auditable, debuggable)
NO → Use trigger-based dual-write (database-enforced, no app changes)

---

## Rationale

Application-level dual-write is explicit: the code clearly shows what is written to both structures. It is auditable, testable, and debuggable. Trigger-based dual-write is invisible to the application (no code changes needed) but introduces trigger overhead, deadlock risk, and debugging difficulty. Application-level is preferred whenever you can deploy code changes.

---

## Recommended Default

**Default:** Application-level dual-write
**Reason:** Application-level is more transparent, debuggable, and avoids trigger overhead. Reserve triggers for cases where you cannot deploy application changes or need to ensure no code path misses the dual-write.

---

## Risks Of Wrong Choice

Application-level misses code paths that aren't covered (queue jobs, raw SQL, admin scripts). Trigger-based dual-write adds invisible overhead that can cause production incidents during debugging.

---

## Related Rules

Never skip the dual-write phase. Verify backfill completeness before switching reads.

---

## Related Skills

Execute Multi-Phase Expand-Contract for Complex Schema Changes
