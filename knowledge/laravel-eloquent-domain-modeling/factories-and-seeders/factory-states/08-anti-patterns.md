# Factory States — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory States |
| Focus | Anti-patterns in factory state definitions, naming, and composition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Implementation-Named States | Maintainability | Medium |
| 2 | State Methods Without `$this` Return Value | Framework Usage | Critical |
| 3 | Undocumented State Composition Conflicts | Maintainability | Medium |
| 4 | Duplicated Overrides Instead of Named States | Maintainability | Medium |
| 5 | Destructive Operations in State Methods | Architecture | Critical |
| 6 | Manual `deleted_at` Instead of Built-In `trashed()` | Framework Usage | Low |

## Repository-Wide Cross-Cutting Patterns

- The most impactful anti-pattern is naming states after implementation details (column names) rather than domain conditions, which couples test code to schema
- Missing `return $this` in state methods is a hard runtime error that breaks fluent chaining
- Undocumented state conflicts cause unpredictable attribute values depending on chaining order

---

## 1. Implementation-Named States

### Category
Maintainability

### Description
Naming factory state methods after the attribute they set (e.g., `isAdmin(true)`, `role('admin')`) instead of the domain condition they represent (e.g., `admin()`, `premium()`).

### Why It Happens
Developers think in terms of database columns and attribute values rather than domain concepts. Implementation names seem more "precise" because they describe exactly what the method does.

### Warning Signs
- State methods named `isAdmin(bool)`, `setRole(string)`, `isVerified(bool)`
- State methods that accept a value parameter for what should be a named variation
- Test code reads as implementation details: `->isAdmin(true)->isVerified(true)`
- Renaming a database column requires renaming state methods throughout the codebase

### Why Harmful
- Couples test code to database schema — renaming a column breaks all states
- Test scenarios are not self-documenting — `->admin()` conveys intent, `->isAdmin(true)` conveys mechanics
- Non-technical stakeholders cannot read test scenarios
- Refactoring the schema requires touching test code

### Preferred Alternative
```php
public function admin(): static
{
    return $this->state(['is_admin' => true, 'role' => 'superuser']);
}
```

### Detection Checklist
- [ ] Review all state method names — do they describe domain conditions or column values?
- [ ] Check if state methods accept attribute values as parameters when they should be named variations
- [ ] Verify that test scenarios read as business language

### Related
| Rule | `05-rules.md` — Name States After Domain Conditions, Not Implementation |
| Decision Tree | `07-decision-trees.md` — State Naming |

---

## 2. State Methods Without `$this` Return Value

### Category
Framework Usage

### Description
Factory state methods that do not return `$this`, breaking fluent chaining and causing `Call to a member function on null` errors.

### Why It Happens
Developers forget the `return $this` or use a `void` return type. The method works in isolation (`User::factory()->admin()->create()`) but fails when chained (`User::factory()->admin()->verified()->create()`).

### Warning Signs
- State method has `void` return type instead of `: static`
- `$this->state(...)` called without returning the result
- Fluent chaining of state methods produces runtime errors
- "Call to a member function on null" when chaining two states

### Preferred Alternative
```php
public function admin(): static
{
    return $this->state(['is_admin' => true]);
}
```

### Detection Checklist
- [ ] Every state method returns `$this` with `: static` return type
- [ ] Chain two state methods — does it work correctly?
- [ ] Check for `void` return type on state methods

### Related
| Rule | `05-rules.md` — Always Return $this from State Methods for Chaining |
| Skill | `06-skills.md` — Create Named Factory State Methods |

---

## 3. Undocumented State Composition Conflicts

### Category
Maintainability

### Description
Defining factory states that set overlapping attributes without documenting which state wins when composed, or in which order they should be chained.

### Why It Happens
Developers define states independently, not considering how they compose. The conflict only surfaces when a caller chains both states and gets unexpected attribute values based on chaining order.

### Warning Signs
- Two states set the same attribute (e.g., `admin()` sets `email_verified_at`, `unverified()` sets it to null)
- No PHPDoc or comment explaining composition order
- Tests that chain states and get unexpected results
- Callers unsure whether to chain `->admin()->unverified()` or `->unverified()->admin()`

### Preferred Alternative
```php
/**
 * Admin state. Applies before unverified if combining.
 * Composing admin + unverified produces an unverified admin.
 */
public function admin(): static
{
    return $this->state(['is_admin' => true, 'email_verified_at' => now()]);
}

public function unverified(): static
{
    return $this->state(['email_verified_at' => null]);
}
```

### Detection Checklist
- [ ] Identify all states that set overlapping attributes
- [ ] Check for documentation on composition order and conflicts
- [ ] Test composing conflicting states in both orders

### Related
| Rule | `05-rules.md` — Compose States Explicitly; Document Conflicts |
| Decision Tree | `07-decision-trees.md` — State Composition and Conflict Resolution |

---

## 4. Duplicated Overrides Instead of Named States

### Category
Maintainability

### Description
Repeating the same attribute overrides across multiple test files instead of extracting them into a named factory state method.

### Why It Happens
Developers use inline overrides for convenience without recognizing when they have a repeated pattern. The duplication grows gradually as new tests are added.

### Warning Signs
- Same `['is_admin' => true, 'role' => 'superuser']` pattern in 3+ test files
- Changing the definition of "admin" requires editing every test file
- Inline overrides used for domain conditions that could be named
- Helper functions or traits created to avoid repeating inline overrides

### Preferred Alternative
```php
// In UserFactory:
public function admin(): static
{
    return $this->state(['is_admin' => true, 'role' => 'superuser']);
}

// In tests:
User::factory()->admin()->create();
```

### Detection Checklist
- [ ] Search for repeated inline override patterns across test files
- [ ] Patterns appearing 3+ times should be extracted
- [ ] Check if a state method would make the test more readable

### Related
| Rule | `05-rules.md` — Extract Repeated Overrides into Named State Methods |
| Decision Tree | `07-decision-trees.md` — State Method vs Inline Attribute Overrides |

---

## 5. Destructive Operations in State Methods

### Category
Architecture

### Description
Performing destructive database operations (truncation, bulk deletion) inside a factory state method, causing surprising side effects for the caller.

### Why It Happens
Developers see states as a convenient place to "reset" data before creating specific scenarios, not realizing that a creation-oriented API should never have destructive side effects.

### Warning Signs
- `Model::truncate()`, `Model::delete()`, or `DB::table()->delete()` inside a state method
- Tests that fail non-deterministically because a state method deleted shared data
- State methods named `freshStart()` or `reset()` that hint at destructive behavior

### Preferred Alternative
```php
// Separate concern: cleanup happens explicitly before creation
User::truncate();
User::factory()->create(['name' => 'First User']);
```

### Detection Checklist
- [ ] Search for `truncate`, `delete`, `destroy` inside state methods
- [ ] Verify that state methods only create or modify, never destroy
- [ ] Check for test cleanup logic that should be in `setUp()` or `tearDown()`

### Related
| Rule | `05-rules.md` — Do Not Truncate or Delete Data Inside Factory States |
| Skill | `06-skills.md` — Create Named Factory State Methods |

---

## 6. Manual `deleted_at` Instead of Built-In `trashed()`

### Category
Framework Usage

### Description
Manually setting `deleted_at` on soft-deletable models instead of using Laravel's built-in `trashed()` factory state.

### Why It Happens
Developers may not know about the `trashed()` state, or they manually set timestamps for "precision" without realizing the built-in method handles edge cases.

### Warning Signs
- `Post::factory()->create(['deleted_at' => now()])` instead of `->trashed()`
- Manual `deleted_at` formatting that differs from Carbon format
- Inconsistent `deleted_at` values (null vs Carbon vs string) across the codebase

### Preferred Alternative
```php
Post::factory()->trashed()->create();
```

### Detection Checklist
- [ ] Search for `'deleted_at'` in factory calls
- [ ] Replace manual `deleted_at` with `trashed()` state
- [ ] Verify built-in state is used for all soft-delete scenarios

### Related
| Rule | `05-rules.md` — Use the Built-In trashed() State for Soft-Deletable Models |
| Skill | `06-skills.md` — Create Named Factory State Methods |
