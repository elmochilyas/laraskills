# Recycle Pattern — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Recycle Pattern |
| Focus | Anti-patterns in recycle() usage for factory data sharing |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `for()` with Factory Instead of `recycle()` for Batch Shared Parents | Performance | High |
| 2 | Single Instance Recycle When Distribution Is Needed | Testing | Medium |
| 3 | `recycle()` Placed After Relationship Methods | Reliability | Medium |
| 4 | Using `recycle()` for HasOne Relationships | Data Integrity | Critical |
| 5 | `recycle()` as Default Instead of Intentional Choice | Code Organization | Medium |
| 6 | Default Recycled Models Without Meaningful Variation | Testing | Low |

## Repository-Wide Cross-Cutting Patterns

- The primary performance anti-pattern is using `for()` with a factory for batch children, causing N redundant parent creations instead of one shared parent
- Applying `recycle()` to HasOne relationships violates the one-to-one constraint by creating multiple children for a single parent
- Placement of `recycle()` in the factory chain determines whether nested factories receive the recycled model

---

## 1. `for()` with Factory Instead of `recycle()` for Batch Shared Parents

### Category
Performance

### Description
Using `Post::factory()->count(1000)->for(User::factory())->create()` to create batch children, causing a new parent to be created for every single child instead of sharing parents via `recycle()`.

### Why It Happens
`for()` is the standard way to set a BelongsTo parent. Developers apply it uniformly without considering that batch operations magnify the cost of per-child parent creation.

### Warning Signs
- `->for(X::factory())` used with `->count(N)` where N > 10
- Factory creation that takes much longer than expected for the record count
- Database write count far exceeds the intended record count
- Comments like "creates 100 users for 100 posts — takes forever"

### Why Harmful
- 1,000 posts with `->for(User::factory())` creates 1,000 users — almost always unnecessary
- Seeding time grows linearly with batch size
- Database is filled with redundant parent records
- Test setup slows proportionally to data volume

### Preferred Alternative
```php
$user = User::factory()->create();
Post::factory()->count(1000)->recycle($user)->create();
```

### Detection Checklist
- [ ] Search for `->for(.+::factory())` combined with `->count(`
- [ ] Measure parent-to-child ratio in batch creation
- [ ] Check if children should share a parent set via `recycle()`

### Related
| Rule | `05-rules.md` — Use recycle() When Many Children Share the Same Parent |
| Decision Tree | `07-decision-trees.md` — recycle() vs for() for Parent Assignment |

---

## 2. Single Instance Recycle When Distribution Is Needed

### Category
Testing

### Description
Passing a single parent model to `recycle()` when children should be distributed across multiple parents for realistic data distribution.

### Why It Happens
A single instance is the simplest `recycle()` use case. Developers don't consider that all children sharing one parent is often unrealistic and limits test assertions.

### Warning Signs
- `recycle($user)` (single instance) for batch child creation with no comment about intent
- All children reference the same parent, which is unrealistic for the domain
- Tests cannot assert on parent-distribution behavior (e.g., "all 10 users have posts")
- Single parent creates a "God object" that becomes a bottleneck in test assertions

### Preferred Alternative
```php
$users = User::factory()->count(10)->create();
Post::factory()->count(100)->recycle($users)->create();
```

### Detection Checklist
- [ ] Review `recycle()` calls — are they single instance or collection?
- [ ] Does the test scenario require distribution across parents?
- [ ] Check if passing a collection would produce more realistic data

### Related
| Rule | `05-rules.md` — Pass a Collection for Round-Robin Distribution |
| Decision Tree | `07-decision-trees.md` — Singleton vs Collection Recycling |

---

## 3. `recycle()` Placed After Relationship Methods

### Category
Reliability

### Description
Placing `recycle()` after `has()`, `for()`, or `hasAttached()` in the factory chain, preventing the recycled model from propagating to nested factories.

### Why It Happens
Developers add `recycle()` as an afterthought at the end of the chain, not realizing that order matters for factory method propagation.

### Warning Signs
- `recycle()` appears after `has()` or `for()` in the chain
- Nested factories create new parents despite a `recycle()` call
- FK constraint violations in nested factories because the recycled model wasn't available

### Preferred Alternative
```php
Post::factory()
    ->recycle($users) // First — applies to Post and all nested factories
    ->has(Comment::factory()->count(3))
    ->create();
```

### Detection Checklist
- [ ] Check position of `recycle()` relative to `has()`, `for()`, `hasAttached()`
- [ ] Verify nested factories receive the recycled model
- [ ] Move `recycle()` to the top of the chain if placed later

### Related
| Rule | `05-rules.md` — Apply recycle() at the Top of the Factory Chain |
| Decision Tree | `07-decision-trees.md` — recycle() Placement in Chain |

---

## 4. Using `recycle()` for HasOne Relationships

### Category
Data Integrity

### Description
Using `recycle()` with a parent model on a HasOne child factory, creating multiple children for a one-to-one relationship and violating the domain invariant.

### Why It Happens
Developers treat `recycle()` as a general performance tool without considering the relationship cardinality. HasMany and HasOne both create children, but HasOne constrains to a single child per parent.

### Warning Signs
- `Profile::factory()->count(5)->recycle($user)->create()` — Profile is HasOne but gets 5 instances for 1 user
- Duplicate foreign key values in HasOne-related tables
- Uniqueness constraint violations on the foreign key column
- Comments like "only last profile is used, others are waste"

### Preferred Alternative
```php
// Each profile needs a unique user
User::factory()
    ->count(5)
    ->has(Profile::factory())
    ->create();
```

### Detection Checklist
- [ ] Verify relationship type (HasOne vs HasMany) before using `recycle()`
- [ ] Check for `recycle()` on models with `hasOne()` relationship definition
- [ ] Ensure unique constraint on FK column is respected

### Related
| Rule | `05-rules.md` — Do Not Use recycle() When Every Child Needs a Unique Parent |
| Skill | `06-skills.md` — Set Up Shared Parent with recycle() for Batch Child Creation |

---

## 5. `recycle()` as Default Instead of Intentional Choice

### Category
Code Organization

### Description
Using `recycle()` as the default pattern for all factory calls, even when independent parents would be more realistic and appropriate for the test scenario.

### Why It Happens
Developers adopt `recycle()` as a "best practice" without thinking about when sharing is semantically correct. The performance benefit becomes a default habit.

### Warning Signs
- `setUp()` always creates a shared parent, and all tests use `recycle($this->user)`
- Every factory call in the test suite uses `recycle()` — no independent parent creation
- Tests that should validate independent relationships are using shared data
- Comments like "this is our pattern" without justification

### Preferred Alternative
```php
// Independent by default — use recycle() intentionally
public function test_post_creation(): void
{
    Post::factory()->count(3)->create(); // Independent users
}

public function test_user_post_limit(): void
{
    $user = User::factory()->create();
    Post::factory()->count(3)->recycle($user)->create();
}
```

### Detection Checklist
- [ ] Count `recycle()` usage vs independent `for()` or `has()` usage
- [ ] Review whether shared parents are semantically correct for each test
- [ ] Check for tests that should use independent parents but use `recycle()` out of habit

### Related
| Rule | `05-rules.md` — Use recycle() for Performance, Not as a Data Strategy Default |
| Decision Tree | `07-decision-trees.md` — recycle() vs for() for Parent Assignment |

---

## 6. Default Recycled Models Without Meaningful Variation

### Category
Testing

### Description
Pre-creating recycled parent models with only default factory values, producing identical parents that prevent assertions on parent-attribute-dependent behavior.

### Why It Happens
Developers focus on the child creation and treat parent pre-creation as a mechanical step. Applying states to the pre-created parents is extra work that seems unnecessary.

### Warning Signs
- `$users = User::factory()->count(10)->create()` — all 10 users are identical
- Tests cannot assert on behavior that depends on parent attributes (e.g., "admin posts are highlighted")
- Recycled parents only serve as FK targets, not as test scenario participants

### Preferred Alternative
```php
$users = collect([
    User::factory()->admin()->create(),
    User::factory()->editor()->create(),
    User::factory()->count(8)->create(),
]);
Post::factory()->count(100)->recycle($users)->create();
```

### Detection Checklist
- [ ] Review pre-created recycled models — do they have meaningful variation?
- [ ] Check if the test scenario requires parent-attribute-dependent assertions
- [ ] Apply states to recycled parents when variation matters

### Related
| Rule | `05-rules.md` — Combine recycle() with Factory States for Realistic Shared Data |
| Skill | `06-skills.md` — Set Up Shared Parent with recycle() for Batch Child Creation |
