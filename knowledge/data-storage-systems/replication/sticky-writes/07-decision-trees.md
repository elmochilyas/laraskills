# 7-4 Sticky Writes - Decision Trees

## Per-Request vs Session-Level Stickiness

---

## Decision Context

Choosing between Laravel's per-request sticky writes (`$recordsModified`) and session-level stickiness that persists across multiple requests.

---

## Decision Criteria

* performance: per-request is automatic; session-level adds session storage overhead
* architectural: per-request covers same-request reads; session-level covers cross-request redirects
* maintainability: per-request is built-in; session-level requires custom implementation

---

## Decision Tree

User writes data and redirects to a different page?

YES → Per-request stickiness is insufficient

    ↓
    Request 1: User creates post → write to primary
    Redirect to post list → NEW request
    Per-request sticky resets → reads go to replica
    
    ↓
    Solution: Session-level sticky writes
    
    $_SESSION['last_write'] = now();
    If now() - last_write < 5s → force read from primary
    
    ↓
    Implement in middleware:
    - After write: store timestamp in session
    - On read: check if last write was < 5s ago
    - If yes: use write connection for reads

NO → User sees result on same page (AJAX, modal, inline)?

    YES → Per-request sticky writes (Laravel default)
        
        ↓
        'sticky' => true in config/database.php
        
        ↓
        After write, same request reads use primary
        Works automatically — no custom code
        
    NO → No immediate consistency requirement?
    
        → Sticky writes not needed
        User doesn't need to see their write immediately
        Accept eventual consistency

---

## Recommended Default

**Default:** Per-request sticky writes enabled; add session-level stickiness for redirect-after-write patterns
**Reason:** Per-request handles AJAX/inline. Session-level covers redirects. Combined they prevent stale reads in all common scenarios.

---

## Sticky Writes Impact on Read Scaling

---

## Decision Context

Evaluating the performance tradeoff of sticky writes — they route some reads to primary, reducing the read scaling benefit of replicas.

---

## Decision Criteria

* performance: sticky writes increase primary read load by routing reads-after-writes to primary
* architectural: only affects requests that modify data (typically < 20% of requests)
* maintainability: no code changes needed

---

## Decision Tree

What percentage of requests perform writes?

↓

High (> 50% of requests are writes)?

YES → Sticky writes significantly impact read scaling

    ↓
    Most requests route some reads to primary
    Replicas underutilized
    Primary handles more read load
    
    ↓
    Consider:
    - Sync replication (zero lag) → disable stickiness
    - Use session-level with short timeout (1-2s)
    - Accept occasional stale reads

NO → Moderate (10-50% writes)?

    YES → Sticky writes acceptable
        
        ↓
        Moderate impact on primary read load
        Most reads still go to replicas
        Default sticky behavior works well
        
    NO → Low (< 10% writes)?
    
        → Sticky writes have negligible impact
        Almost all reads go to replicas
        Enable without concern

---

## Recommended Default

**Default:** Enable sticky writes for user-facing applications regardless of write ratio
**Reason:** The consistency benefit outweighs the minor primary read load increase for most applications. Only disable for analytics/reporting.

---

## Related Rules

* Rule 7-4-1: Always Enable Sticky Writes For User-Facing Requests
* Rule 7-4-2: Never Assume Sticky Writes Prevent Cross-Request Staleness

---

## Related Skills

* Implement Sticky Writes
* Implement Lag-Aware Read Splitting
