# Has-Many Factories — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Has-Many Factories |
| Focus | Anti-patterns in has() factory relationship usage for one-to-many |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Manual Foreign Key Assignment Instead of `has()` | Framework Usage | High |
| 2 | `afterCreating` Instead of `has()` for Children | Maintainability | Medium |
| 3 | Using `has()` for BelongsTo Relationships | Framework Usage | Critical |
| 4 | Separate Step Creation Instead of Nested `has()` | Maintainability | Medium |
| 5 | Uniform Child Overrides via Repeated `state()` | Code Organization | Low |
| 6 | Excessive Nesting Without Intermediate Variables | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is using `has()` for BelongsTo relationships, which reverses the foreign key direction and produces incorrect SQL
- Manually assigning foreign keys instead of using `has()` duplicates framework logic and breaks on column renames
- Hiding child creation inside `afterCreating()` callbacks denies callers the ability to control or skip children

---

## 1. Manual Foreign Key Assignment Instead of `has()`

### Category
Framework Usage

### Description
Creating a parent model, then manually creating child models with the parent's foreign key, instead of using the declarative `has()` method.

### Why It Happens
The two-step approach (create parent, then create children with FK) is more intuitive for developers who haven't learned `has()`. It mirrors how the database works at a low level.

### Warning Signs
- `$user = User::factory()->create()` followed by `Post::factory()->create(['user_id' => $user->id])`
- Manual `$model->id` extraction and assignment in test setup
- No use of `has()` in factory relationship code
- Multiple lines of setup where a single `has()` call would suffice

### Why Harmful
- Duplicates the FK resolution that `has()` handles automatically
- Renaming the FK column requires updating every manual assignment
- More verbose — 3+ lines instead of 1
- Relationship intention is scattered across multiple statements

### Preferred Alternative
```php
User::factory()->has(Post::factory()->count(3))->create();
```

### Detection Checklist
- [ ] Search for `factory()->create(['*_id' =>
- [ ] Review multi-step parent+child creation patterns
- [ ] Check if `has()` could replace manual FK assignments

### Related
| Rule | `05-rules.md` — Use has() for All HasMany Factory Relationships |
| Skill | `06-skills.md` — Set Up HasMany Factory Relationship with has() |

---

## 2. `afterCreating` Instead of `has()` for Children

### Category
Maintainability

### Description
Using `afterCreating()` callbacks inside the factory to create child models, instead of letting the call site use `has()` for flexible child creation.

### Why It Happens
Developers default to callbacks for post-creation setup. They don't realize that `has()` makes child creation opt-in and configurable at the call site rather than mandatory in the factory.

### Warning Signs
- `afterCreating()` callbacks that create child models with `factory()->create(['fk' => $model->id])`
- Callers cannot create the parent without also creating its children
- Tests that work around child creation by using `make()` instead of `create()`
- Factory comments like "always creates 3 comments regardless of caller needs"

### Preferred Alternative
```php
// At call site — caller decides whether and how many children
Post::factory()->has(Comment::factory()->count(3))->create();
```

### Detection Checklist
- [ ] Review `afterCreating()` callbacks that create child relationships
- [ ] Check if callers can opt out of child creation
- [ ] Replace callback-based children with call-site `has()` when possible

### Related
| Rule | `05-rules.md` — Use has() Instead of afterCreating for Child Relationships |
| Decision Tree | `07-decision-trees.md` — has() vs afterCreating for Child Creation |

---

## 3. Using `has()` for BelongsTo Relationships

### Category
Framework Usage

### Description
Calling `has()` on a parent factory for a child that BelongsTo the parent, reversing the foreign key direction and producing incorrect SQL.

### Why It Happens
Developers confuse `has()` (foreign key on child table) with `for()` (foreign key on caller's table). The relationship type is not immediately obvious from the model method signature.

### Warning Signs
- `User::factory()->has(Profile::factory())` — Profile belongs to User, not HasMany
- `Post::factory()->has(User::factory())` — Post belongs to User
- Runtime SQL errors about missing columns or incorrect joins
- `InvalidArgumentException` about missing relationship methods

### Preferred Alternative
```php
// Post belongsTo User — use for()
Post::factory()->for(User::factory())->create();
```

### Detection Checklist
- [ ] Verify each `has()` call matches a HasMany relationship on the model
- [ ] Check BelongsTo relationships — are they using `for()` instead of `has()`?
- [ ] Review factory chains for direction mismatches

### Related
| Rule | `05-rules.md` — Do Not Use has() for BelongsTo or BelongsToMany Relationships |
| Skill | `06-skills.md` — Set Up HasMany Factory Relationship with has() |

---

## 4. Separate Step Creation Instead of Nested `has()`

### Category
Maintainability

### Description
Creating parent, child, and grandchild models in separate steps with manual FK assignment, instead of using nested `has()` calls to build the complete graph in a single fluent expression.

### Why It Happens
Multi-step creation mirrors procedural thinking. Developers create one model at a time, not recognizing that nested `has()` can express the entire graph in one call.

### Warning Signs
- 5+ lines of sequential factory creation for a 3-level graph
- Intermediate variables (`$user`, `$post`, `$comment`) used only for FK chaining
- Risk of data inconsistency if a step fails mid-way
- Comments like "create user, then post, then comment"

### Preferred Alternative
```php
User::factory()
    ->has(Post::factory()
        ->has(Comment::factory()->count(3)))
    ->create();
```

### Detection Checklist
- [ ] Review multi-step factory creation — could nested `has()` replace it?
- [ ] Count lines for graph creation — more than 3 suggests nesting opportunity
- [ ] Check if intermediate variables serve only FK propagation

### Related
| Rule | `05-rules.md` — Nest Relationships for Complete Graph Creation |
| Decision Tree | `07-decision-trees.md` — has() vs afterCreating for Child Creation |

---

## 5. Uniform Child Overrides via Repeated `state()`

### Category
Code Organization

### Description
Applying `->state()` to each child factory individually when all children should share the same attribute overrides, instead of using the second argument of `has()`.

### Why It Happens
Developers apply `state()` as a general override mechanism without learning the `has()` second-argument pattern for uniform overrides.

### Warning Signs
- `->has(Post::factory()->count(3)->state(['published' => true]))` instead of `->has(Post::factory()->count(3), ['published' => true])`
- Repeated `state()` calls for the same override on each child factory

### Preferred Alternative
```php
User::factory()->has(Post::factory()->count(3), ['published' => true])->create();
```

### Detection Checklist
- [ ] Search for `->state(['` after `->has(`
- [ ] Replace uniform `state()` with second-argument overrides
- [ ] Check if the override applies to all children identically

### Related
| Rule | `05-rules.md` — Pass Attribute Overrides as the Second Argument to has() |
| Skill | `06-skills.md` — Set Up HasMany Factory Relationship with has() |

---

## 6. Excessive Nesting Without Intermediate Variables

### Category
Maintainability

### Description
Nesting `has()` calls to 4+ levels in a single expression, creating an unreadable chain that is difficult to debug or modify.

### Why It Happens
Developers follow the "nest for complete graphs" rule too literally. While nesting is good, excessive depth trades conciseness for readability.

### Warning Signs
- A single factory chain spanning 15+ lines with 4+ levels of nesting
- Difficulty identifying which `->has()` call corresponds to which relationship
- Parentheses mismatches or formatting errors when editing the chain

### Preferred Alternative
```php
$postFactory = Post::factory()
    ->has(Comment::factory()->count(3))
    ->has(Media::factory()->count(2));

User::factory()
    ->has($postFactory)
    ->has(Profile::factory())
    ->create();
```

### Detection Checklist
- [ ] Count nesting levels — 4+ suggests breaking into variables
- [ ] Review factory chains for readability and editability
- [ ] Check if intermediate variables improve clarity without adding risk

### Related
| Rule | `05-rules.md` — Nest Relationships for Complete Graph Creation |
| Skill | `06-skills.md` — Set Up HasMany Factory Relationship with has() |
