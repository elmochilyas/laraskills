## Through Relationship Strategy (HasManyThrough vs Nested Loading)

Choosing between HasManyThrough and nested eager loading for two-level hierarchies.

---

## Decision Context

When a parent needs to access target records through an intermediate HasMany relationship, you must decide whether to flatten the hierarchy with HasManyThrough or keep it nested.

---

## Decision Criteria

* whether intermediate models are needed in the result
* whether writes are needed on targets
* performance of single join vs nested queries
* cardinality of intermediate-to-target relationship

---

## Decision Tree

Need to access target records through an intermediate?

↓

Are the intermediate models needed in the result?

YES → Use nested `load('intermediate.targets')` or `with('intermediate.targets')`

NO → Is the intermediate purely structural?

    Do you need to write/create target records?

    YES → Use nested loading + create through intermediate directly (HasManyThrough is read-only)

    NO → Use `HasManyThrough`

↓

Check: Is intermediate-to-target relationship `HasMany` (not `HasOne`)?

YES → Proceed with HasManyThrough

NO → Use `HasOneThrough` instead

---

## Rationale

HasManyThrough flattens the hierarchy into a single collection, making it efficient for read-only aggregation (e.g., all posts across all users in a country). When intermediate models carry domain data (e.g., user names), nested loading preserves the structure. HasManyThrough is read-only — writes must go through the specific intermediate instance.

---

## Recommended Default

**Default:** Use `HasManyThrough` when only the final targets are needed
**Reason:** Single join query, flat collection, hides unnecessary implementation detail

---

## Risks Of Wrong Choice

Lost intermediate data when they're meaningful, runtime exceptions on write attempts, unnecessary complexity when a direct HasMany would suffice.

---

## Related Rules

- Through-Not-When-Intermediate-Is-Meaningful (has-many-through/05-rules.md)
- Through-Create-Via-Intermediate (has-many-through/05-rules.md)
- Through-Document-ReadOnly (has-many-through/05-rules.md)

---

## Related Skills

- Configure a HasManyThrough relationship with proper indexing (has-many-through/06-skills.md)

---

## Through Relationship Cardinality Check

Verifying that intermediate-to-target uses HasMany (not HasOne) for HasManyThrough.

---

## Decision Context

HasManyThrough requires the intermediate-to-target relationship to be HasMany. Using it with HasOne produces incorrect queries.

---

## Decision Criteria

* cardinality of the intermediate-to-target relationship
* whether the target is a collection or single model
* error detection (silent failure vs obvious error)

---

## Decision Tree

Defining a HasManyThrough relationship?

↓

Check the intermediate-to-target relationship:

Is it `HasMany` (intermediate has many targets)?

YES → HasManyThrough is correct — proceed

NO → Is it `HasOne` (intermediate has one target)?

    YES → Use `HasOneThrough` instead (target first, intermediate second)

    NO → Is it `BelongsTo`?

        YES → Wrong direction — model with FK should define BelongsTo to intermediate

---

## Rationale

HasManyThrough expects the intermediate to define HasMany to the target. Using HasOne produces incorrect join SQL because the framework assumes multiple results per intermediate. This is a common setup error that leads to silent data loss or incomplete results.

---

## Recommended Default

**Default:** Verify intermediate-to-target cardinality before defining HasManyThrough
**Reason:** Framework doesn't validate cardinality — wrong assumptions cause silent failures

---

## Risks Of Wrong Choice

Incorrect join SQL, missing records in results, silent data corruption that's hard to diagnose.

---

## Related Rules

- Through-HasMany-Not-BelongsTo-Intermediate (has-many-through/05-rules.md)

---

## Related Skills

- Configure a HasManyThrough relationship with proper indexing (has-many-through/06-skills.md)

---

## Write Path Selection for Through Chain Targets

Choosing the correct approach for creating target records in a HasManyThrough relationship.

---

## Decision Context

HasManyThrough is read-only, so creating target records requires creating through a specific intermediate instance.

---

## Decision Criteria

* which intermediate instance owns the target
* need to select the correct intermediate
* bulk creation requirements
* null intermediate handling

---

## Decision Tree

Need to create a target record in a through chain?

↓

Attempting `$parent->targets()->create()`?

YES → Stop — throws `BadMethodCallException`. Use intermediate instead.

    ↓

Select the specific intermediate instance: `$intermediate = $parent->intermediates->first()`

    (or find the specific one that should own the target)

↓

Is the intermediate null?

YES → Handle missing intermediate (create intermediate first, or error)

NO → Create through intermediate's HasMany: `$intermediate->targets()->create($data)`

---

## Rationale

HasManyThrough flattens the hierarchy and cannot know which intermediate should own the new target. You must explicitly select the intermediate instance. This also serves as an authorization check — you confirm the intermediate exists and is the correct one before creating dependent records.

---

## Recommended Default

**Default:** Create through the specific intermediate instance's HasMany relationship
**Reason:** Only supported write path, explicit about ownership, prevents orphaned targets

---

## Risks Of Wrong Choice

Runtime exceptions, targets created without a valid intermediate reference, authorization bypass if wrong intermediate is selected.

---

## Related Rules

- Through-Create-Via-Intermediate (has-many-through/05-rules.md)

---

## Related Skills

- Create target records through intermediate models (has-many-through/06-skills.md)
