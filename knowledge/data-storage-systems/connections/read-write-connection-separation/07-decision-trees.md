# 10.9 Read/Write Connection Separation - Decision Trees

## Asymmetric Pool Sizing for Read vs Write Connections

---

## Decision Context

Configuring separate pool sizes for read replicas and write primaries to match their fundamentally different workload characteristics.

---

## Decision Criteria

* performance: read traffic typically 5-10× write traffic
* architectural: read pool larger; write pool smaller
* maintainability: separate pool array under read/write keys in database.php
* security: read replicas may have different access controls

---

## Decision Tree

How to size read vs write pools?

↓

Read replicas deployed?

YES → Read traffic > 5× write traffic?

    YES → Read pool: min=4, max=16; Write pool: min=2, max=4
    
        ↓
        Reads dominate workload — larger pool prevents queuing
        Writes are fewer but critical — smaller pool prevents contention
        
    NO → Read traffic 2-5× write?
    
        YES → Read pool: min=3, max=8; Write pool: min=2, max=4
        NO → Use single shared pool (read/write ratio near 1:1)

NO → Single database (no replicas)?

    → Single pool for all traffic
    No read/write separation needed
    Pool sizing based on total traffic only

---

## Recommended Default

**Default:** Read pool `min=4, max=16`; Write pool `min=2, max=4` with `'sticky' => true`
**Reason:** Asymmetric sizing matches workload patterns. Sticky writes prevent stale-read-after-write bugs.

---

## Sticky Writes: Enable or Disable

---

## Decision Context

Choosing whether to enable Laravel's `sticky` option, which routes reads to the write connection after a write occurred in the same request, preventing stale reads due to replication lag.

---

## Decision Criteria

* performance: sticky routes reads to primary, increasing write pool load
* architectural: prevents stale-read bugs
* maintainability: set once in config — no code changes needed
* security: ensures read-after-write consistency

---

## Decision Tree

Enable sticky writes?

↓

Write operation in the current request could be immediately followed by a read?

YES → Is replication lag typically > 100ms?

    YES → Enable sticky writes (REQUIRED)
    
        ↓
        Without sticky: write to primary, read from replica (stale)
        With sticky: write to primary, read from primary
        Slight performance cost but prevents data inconsistency
        
        ↓
        Set: `'sticky' => true` in database.php connection config
        
    NO → Replication lag < 100ms (e.g., synchronous replication)?
    
        → Sticky optional — reads usually see latest data
        Enable for safety — negligible overhead

NO → Read-only endpoints never write?

    → Sticky not needed
    No writes in the request, so no stale-read risk
    All reads go to replica pool

---

## Recommended Default

**Default:** Always enable sticky writes (`'sticky' => true`)
**Reason:** The performance cost is negligible for most applications. The alternative — intermittent stale-read bugs — is much harder to debug.

---

## Related Rules

* Rule 7-4-1: Enable Sticky Writes
* Rule 10-2-4: Consider Architecture Guidelines

---

## Related Skills

* Configure Read/Write Connection Separation
* Configure Pool Architecture
