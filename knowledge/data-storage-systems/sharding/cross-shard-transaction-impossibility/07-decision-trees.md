# 6-9 Cross Shard Transaction Impossibility - Decision Trees

## Single-Shard Transaction vs Saga vs 2PC

---

## Decision Context

Choosing between single-shard transaction design, Saga pattern (eventual consistency), and two-phase commit (2PC) for operations that span multiple shards.

---

## Decision Criteria

* performance: single-shard transactions are fast; Saga adds orchestration overhead; 2PC adds prepare/commit phases with lock holding
* architectural: single-shard is simple ACID; Saga is eventually consistent; 2PC is ACID with coordinator risk
* maintainability: single-shard requires data model alignment; Saga needs compensation logic; 2PC needs coordinator HA

---

## Decision Tree

Can all transactionally-related data be placed on the same shard?

YES → Design for single-shard transactions

    ↓
    Use same shard key for all entities in the transaction
    User and Orders sharded by user_id → single shard
    
    ↓
    Pro: Full ACID — same performance as non-sharded
    Pro: No cross-shard coordination needed
    Pro: Simplest and most reliable approach
    
    ↓
    Con: Requires upfront data model design
    Con: Some entities may naturally have different access patterns

NO → Cross-shard transaction required

    ↓
    Is immediate ACID consistency required?
    
    YES → Use two-phase commit (2PC)
        
        ↓
        Prepare phase: all shards agree to commit
        Commit phase: all shards commit
        
        ↓
        Pro: ACID guarantees across shards
        
        ↓
        Con: Coordinator is SPOF (in-doubt transactions on failure)
        Con: Locks held during prepare phase
        Con: High latency (multiple network round trips)
        Con: Failure modes are complex (heuristic commits)

NO → Eventual consistency acceptable?

    YES → Use Saga pattern
        
        ↓
        Execute local transactions on each shard sequentially
        On any failure, run compensating transactions in reverse order
        
        ↓
        Pro: No long-held locks
        Pro: No coordinator SPOF
        Pro: Works across any number of shards
        
        ↓
        Con: Eventually consistent (temporary inconsistency window)
        Con: Compensating transactions may fail
        Con: More complex application code

NO → Must avoid cross-shard operations entirely

    → Redesign data model
    Cannot have both sharding and cross-shard ACID
    Re-evaluate shard key choice or denormalization

---

## Recommended Default

**Default:** Single-shard transactions (design data model accordingly); Saga for unavoidable cross-shard operations
**Reason:** Single-shard ACID is simple and reliable. Saga avoids 2PC's coordinator risk. 2PC should only be used when immediate ACID is absolutely required across shards.

---

## Compensating Transaction Design

---

## Decision Context

Designing compensating transactions for Saga rollback — ensuring they correctly undo the effects of completed Saga steps without causing further inconsistency.

---

## Decision Criteria

* performance: compensations add latency proportional to number of steps to roll back
* architectural: compensations must be idempotent and semantically correct
* maintainability: each step needs a paired compensation; missing compensation makes Saga non-viable

---

## Decision Tree

Does each Saga step have a paired compensating transaction?

YES → All steps compensated

    ↓
    Verify compensation is idempotent (running it twice has same effect as once)
    Verify compensation is reversible (can the app retry the forward step?)
    
    ↓
    If idempotent AND reversible:
    → Proceed with Saga implementation
    Saga orchestrator runs compensations in reverse order on failure
    
    ↓
    If NOT idempotent:
    → Add idempotency key to compensation logic
    Track which compensations have been executed

NO → Some steps cannot be compensated

    ↓
    Is the operation idempotent (running it again is safe)?
    
    YES → Retry strategy instead of compensation
        Add maximum retry count
        If retries exhausted → manual intervention
        
    NO → Compensation impossible
        
        → Cannot use Saga for this operation
        Alternative: redesign to single-shard transaction
        Or: accept that partial failures may require manual cleanup

Compensation execution guarantees:

↓

Saga orchestrator crashes mid-compensation?

YES → Persist Saga state after each step

    ↓
    On restart: read persisted Saga state
    Determine which steps committed and which compensations ran
    Continue compensation from the last un-compensated step

NO → Saga completes normally?

    → Record Saga as complete
    Mark for potential cleanup (garbage collect old Saga state)

---

## Recommended Default

**Default:** Implement compensating transactions for every Saga step; persist Saga state for crash recovery
**Reason:** Uncompensated failures leave the system in an inconsistent state. Persisted state enables recovery from orchestrator crashes.

---

## Related Rules

* Rule 6-9-1: Always Keep Transactional Data On Same Shard
* Rule 6-9-2: Never Use 2PC Without Understanding Coordinator Failure Modes

---

## Related Skills

* Design for Cross-Shard Transaction Impossibility
* Implement Saga Pattern for Cross-Shard Operations
