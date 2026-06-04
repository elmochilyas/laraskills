## HasOneOfMany vs HasOne

Choosing between HasOneOfMany (selecting from a HasMany set) and HasOne (truly singular with unique constraint).

---

## Decision Context

When you need a single related record, you must decide whether the cardinality is truly one-to-one (HasOne) or you're selecting the "best" from a one-to-many set (HasOneOfMany).

---

## Decision Criteria

* whether the child table has a UNIQUE constraint on the FK
* whether multiple children per parent are allowed in the domain
* whether you need the "latest", "oldest", or "highest" value
* whether writes through the relationship are needed

---

## Decision Tree

Need a single related record per parent?

↓

Does the domain allow multiple children per parent?

NO → Use `HasOne` + UNIQUE constraint on FK (truly singular)

YES → Use `HasOneOfMany`

    Do you need the latest/oldest record?

    YES → `->latestOfMany()` or `->oldestOfMany()`

    Do you need the max/min of a specific column?

    YES → `->ofMany('column', 'max')` or `->ofMany('column', 'min')`

    Need deterministic tiebreaking?

    YES → `->ofMany(['score' => 'max', 'created_at' => 'max'])`

---

## Rationale

HasOne assumes at most one child per parent, enforced by a UNIQUE constraint. HasOneOfMany selects one record from multiple possibilities using ordering. Using HasOne when duplicates are allowed silently returns an arbitrary first child by primary key.

---

## Recommended Default

**Default:** Use `HasOne` with UNIQUE constraint for truly singular; `HasOneOfMany` for "best of" sets
**Reason:** Each enforces the correct cardinality expectation; mixing them causes silent data errors

---

## Risks Of Wrong Choice

HasOne without UNIQUE constraint silently returns arbitrary child; HasOneOfMany used on truly singular data adds unnecessary subquery complexity.

---

## Related Rules

- HasOne-Not-For-LatestOfMany (has-one/05-rules.md)

---

## Related Skills

- Configure HasOne with unique constraint and cascade delete (has-one/06-skills.md)

---

## Read/Write Separation for HasOneOfMany

Choosing between using HasOneOfMany (read-only) and maintaining a separate HasMany for writes.

---

## Decision Context

HasOneOfMany is read-only. You must decide how to create child records while still using HasOneOfMany for efficient reading.

---

## Decision Criteria

* whether writes to the child table are needed
* whether a base HasMany relationship is defined
* documentation of the read-only constraint

---

## Decision Tree

Using HasOneOfMany for efficient reads?

↓

Do you need to create child records?

YES → Define a separate base `HasMany` relationship for writes

    `$this->hasMany(Child::class)` for `$parent->children()->create($data)`

NO → HasOneOfMany alone is sufficient (read-only access)

↓

Have you documented the read-only constraint?

YES → Other developers know to use the base HasMany for writes

NO → Add DocBlock: `/** Read-only. Create via $this->logins()->create(...). */`

---

## Rationale

HasOneOfMany cannot create records. Without a base HasMany relationship, developers attempting `$parent->latestLogin()->create()` get a runtime exception. The base HasMany and HasOneOfMany can coexist on the same model, serving different purposes.

---

## Recommended Default

**Default:** Always define both the base `HasMany` and the `HasOneOfMany`, document the read-only constraint
**Reason:** Prevents runtime exceptions from write attempts; provides a clear write path

---

## Risks Of Wrong Choice

Missing base HasMany prevents child creation; undocumented read-only constraint causes developer confusion and runtime errors.

---

## Related Rules

- HasOne-Not-For-LatestOfMany (has-one/05-rules.md)

---

## Related Skills

- Create child records through HasOne parent relationship (has-one/06-skills.md)
