## Through Relationship vs Nested Eager Loading

Choosing between defining a HasOneThrough relationship and using nested eager loading to access distant models.

---

## Decision Context

When a model needs to access data through an intermediate model, you must decide whether to define a formal HasOneThrough relationship or use nested eager loading.

---

## Decision Criteria

* whether the intermediate model is meaningful in the domain
* frequency of access to the distant model
* read-only constraint acceptance
* complexity of the chain (2 hops vs 3+)

---

## Decision Tree

Need to access a model through an intermediate?

↓

Is the intermediate model meaningful in the domain?

YES → Use nested eager loading: `$parent->load('intermediate.target')`

NO → Is the intermediate purely structural?

    YES → Use `HasOneThrough`

        Will you need to write/create through this chain?

        YES → Use nested loading + create through intermediate directly

        NO → `HasOneThrough` is appropriate

    Is this a 3+ hop chain?

    YES → Avoid HasOneThrough, use nested loading (complex join SQL)

---

## Rationale

HasOneThrough hides the intermediate model, which is ideal when the intermediate is an implementation detail (like a mapping table). When the intermediate has domain significance (like Profile with its own attributes), nested loading keeps it visible. The read-only nature of HasOneThrough is a key constraint — if writes are needed, nested loading is required.

---

## Recommended Default

**Default:** Use `HasOneThrough` when the intermediate is an implementation detail
**Reason:** Single join query, cleaner API, hides irrelevant implementation

---

## Risks Of Wrong Choice

Hidden domain concepts when intermediate is meaningful, runtime exceptions from attempting writes on read-only relationship, complex 3+ hop join SQL.

---

## Related Rules

- Through-Not-For-Meaningful-Intermediate (has-one-through/05-rules.md)
- Through-ReadOnly-Documentation (has-one-through/05-rules.md)

---

## Related Skills

- Configure HasOneThrough with unique constraints and cascade deletes (has-one-through/06-skills.md)

---

## Write Path for Through Relationships

Choosing the correct approach for creating target records in a HasOneThrough chain.

---

## Decision Context

HasOneThrough is read-only, so creating target records requires an alternative approach through the intermediate model.

---

## Decision Criteria

* read-only nature of HasOneThrough
* need to guard against null intermediate
* which intermediate instance owns the target
* mass assignment configuration

---

## Decision Tree

Need to create a target record in a through chain?

↓

Attempting `$parent->target()->create()`?

YES → Stop — throws `BadMethodCallException`

    Use the intermediate model instead:

↓

Access the specific intermediate: `$intermediate = $parent->intermediate`

↓

Is the intermediate null (doesn't exist)?

YES → Handle the missing intermediate case (error, create intermediate first)

NO → Create through the intermediate's relationship: `$intermediate->target()->create($data)`

---

## Rationale

HasOneThrough relationships intentionally do not support write operations. The write path must go through the intermediate model's own HasOne relationship to the target. This ensures the intermediate is explicitly in scope and its existence is verified before creating dependent records.

---

## Recommended Default

**Default:** Create through the intermediate model's HasOne relationship, guarding against null intermediate
**Reason:** Only supported write path, prevents null reference errors, explicit about chain ownership

---

## Risks Of Wrong Choice

Runtime exceptions from calling `create()` on HasOneThrough, orphaned target records created without verifying intermediate existence.

---

## Related Rules

- Through-ReadOnly-Documentation (has-one-through/05-rules.md)
- Through-Nullsafe-Access (has-one-through/05-rules.md)

---

## Related Skills

- Create target records through intermediate model in HasOneThrough chain (has-one-through/06-skills.md)

---

## HasOneThrough vs HasOneOfMany

Choosing between HasOneThrough and HasOneOfMany for different through-chain patterns.

---

## Decision Context

Both HasOneThrough and HasOneOfMany provide access to a single related record through some kind of indirection, but they solve different problems.

---

## Decision Criteria

* whether the indirection is through a separate model (table) or within the same table
* cardinality of the intermediate relationship
* whether the "latest" or "best" record selection is needed
* whether the intermediate is a single record or a set

---

## Decision Tree

Need a single related record through indirection?

↓

Is the indirection through a separate table?

YES → Use `HasOneThrough` (three-table chain)

Is the intermediate-to-target relationship HasMany?

YES → Use `HasOneOfMany` — you need latestOfMany/ofMany

NO (it's HasOne) → HasOneThrough is correct

NO → Is the indirection within the same table (selecting from one-to-many)?

    YES → Use `HasOneOfMany` with `latestOfMany()` or `ofMany()`

---

## Rationale

HasOneThrough resolves a three-table chain where each hop is one-to-one. HasOneOfMany selects a single "best" record from a one-to-many set within the same two-table relationship. They are not interchangeable — the choice depends on whether the indirection is cross-table or intra-table.

---

## Recommended Default

**Default:** HasOneThrough for cross-table indirection, HasOneOfMany for intra-table "latest" selection
**Reason:** Each solves a fundamentally different indirection pattern

---

## Risks Of Wrong Choice

Using HasOneThrough when you need HasOneOfMany returns arbitrary (not "latest") records. Using HasOneOfMany for cross-table chains produces incorrect SQL.

---

## Related Rules

- Through-ReadOnly-Documentation (has-one-through/05-rules.md)

---

## Related Skills

- Configure HasOneThrough with unique constraints and cascade deletes (has-one-through/06-skills.md)
