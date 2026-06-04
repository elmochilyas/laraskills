# 2-1 Model Definition Conventions - Decision Trees

## Auto-Increment Integer vs UUID/ULID Primary Key

---

## Decision Context

Choosing between auto-incrementing integer and UUID/ULID as the primary key for an Eloquent model.

---

## Decision Criteria

* performance: integer PKs are faster for joins and indexes; UUIDs prevent sequential enumeration
* architectural: UUIDs required for distributed systems; integers for simple apps
* security: UUIDs don't expose record count
* maintainability: UUIDs complicate debugging

---

## Decision Tree

Choosing a primary key type?

↓

Is the model public-facing (exposed in URLs/API)?

YES → Consider UUID or ULID

    ↓
    Protect against ID enumeration: `/api/users/1`, `/api/users/2`...
    
    Set in model:
    ```php
    use HasUlid;  // or HasUuids
    protected $keyType = 'string';
    public $incrementing = false;
    ```
    
    ↓
    ULID vs UUID?
    ULID: sortable by creation time, 26 chars
    UUID: 36 chars, random order
    
    → ULID for InnoDB (clustered PK — sequential ULIDs avoid page splits)
    → UUID fine for PostgreSQL (heap storage)

NO → Internal-only, no public exposure?

    YES → Auto-increment integer (default)
        
        ↓
        Best performance:
        - Smaller index (4 bytes vs 16-36 bytes)
        - Sequential inserts (InnoDB)
        - Faster JOINs
        - Simpler debugging

---

## Rationale

Auto-increment integers are optimal for performance but expose sequential IDs. UUIDs prevent enumeration at the cost of storage and index performance (especially on InnoDB). ULID balances both concerns for InnoDB with sortable IDs.

---

## Recommended Default

**Default:** Auto-increment integer for internal models; ULID for public-facing models (InnoDB) or UUID (PostgreSQL)
**Reason:** Best performance for internal use; appropriate security for exposed models.

---

## Risks Of Wrong Choice

Integer PK on public API: ID enumeration vulnerability. UUID PK on InnoDB with random inserts: page splits, fragmentation, 3-4x index size. Not setting $incrementing = false on UUID: tries to insert id=0.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Define Models with Proper Conventions and Overrides

---

## Timestamps On/Off Decision

---

## Decision Context

Deciding whether to enable or disable Eloquent's automatic `created_at`/`updated_at` timestamp management for a given model.

---

## Decision Criteria

* performance: unnecessary timestamps add columns and write overhead
* architectural: entity models need tracking; pivot/aggregate models don't
* maintainability: missing timestamps mean no change tracking

---

## Decision Tree

Should this model use timestamps?

↓

Is this an entity model (User, Post, Order)?

YES → Keep timestamps enabled (default)

    ↓
    Automatic created_at on create
    Automatic updated_at on update
    
    ↓
    Exception: if the table has many updates/sec and timestamps aren't used by the application, consider disabling for write performance

NO → Is this a pivot table, log, or aggregate model?

    YES → Disable timestamps
        
        ↓
        `public $timestamps = false;`
        
        ↓
        Pivot tables: unless you need tracking
        Log tables: already have event timestamp
        Aggregate tables: pre-computed data, no need for timestamps
        
    NO → Consider based on usage:
    
        If you never query by created_at or updated_at, disable for cleaner schema

---

## Rationale

Timestamps add two columns and write overhead to every INSERT and UPDATE. For high-volume non-entity tables, this overhead is unnecessary. Entity tables benefit from automatic time tracking for debugging and auditing.

---

## Recommended Default

**Default:** Enable for entity models; disable for pivot/log/aggregate models
**Reason:** Entity models need time tracking. Non-entity tables don't benefit from the overhead.

---

## Risks Of Wrong Choice

Missing timestamps on entity models: lose automatic creation/update tracking. Timestamps on high-volume non-entity tables: unnecessary writes, larger tables.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Define Models with Proper Conventions and Overrides
