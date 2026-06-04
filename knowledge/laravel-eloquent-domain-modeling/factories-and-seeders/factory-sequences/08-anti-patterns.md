# Factory Sequences — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory Sequences |
| Focus | Anti-patterns in sequence() usage for factory data generation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using Faker When Sequence Is Needed for Determinism | Testing | High |
| 2 | External Counters Instead of Sequence Index | Maintainability | Medium |
| 3 | Sequence Count Mismatched with Batch Size | Testing | Medium |
| 4 | Using Sequences for Random or Realistic Data | Framework Usage | Medium |
| 5 | Extracting One-Off Sequences into Reusable Methods | Code Organization | Low |
| 6 | Manual Combination Enumeration Instead of CrossJoinSequence | Testing | Medium |

## Repository-Wide Cross-Cutting Patterns

- The core tension is between deterministic sequences (for test assertions) and random Faker data (for realistic seeding). Using the wrong tool for each context creates flaky tests or unrealistic data
- Sequence count misalignment with batch size is a common subtle bug that produces unexpected data distributions
- Failing to use `CrossJoinSequence` for combinatorial coverage leads to missed edge cases

---

## 1. Using Faker When Sequence Is Needed for Determinism

### Category
Testing

### Description
Using Faker's `randomElement()` or other random methods inside a factory's `definition()` or state when the test assertion depends on a specific distribution of attribute values across a batch of models.

### Why It Happens
Faker is the default tool for varied data. Developers use it uniformly without distinguishing between "data that should be random" and "data that must be deterministic for assertions." The test may pass 9/10 times and fail unpredictably.

### Warning Signs
- Test assertions check for specific role counts, statuses, or categories that are set via `fake()->randomElement()`
- Flaky tests that fail intermittently with "expected 3 admins but got 2"
- `randomElement()` used in `definition()` for attributes that tests assert on
- Seeders use random data when deterministic reference data is needed

### Why Harmful
- Tests produce non-deterministic results — passing or failing based on luck
- Debugging failures requires reproducing a specific random seed
- CI pipelines fail unpredictably, reducing trust in the test suite

### Preferred Alternative
```php
User::factory()
    ->count(6)
    ->sequence(
        ['role' => 'admin'],
        ['role' => 'admin'],
        ['role' => 'editor'],
        ['role' => 'editor'],
        ['role' => 'viewer'],
        ['role' => 'viewer'],
    )
    ->create();
```

### Detection Checklist
- [ ] Search for `randomElement` in factory definitions used by test assertions
- [ ] Run tests 10 times — do any fail intermittently on data-dependent assertions?
- [ ] Review attributes that tests assert on — are they deterministic?

### Related
| Rule | `05-rules.md` — Use Sequences for Deterministic Test Data |
| Decision Tree | `07-decision-trees.md` — Sequence vs Faker for Attribute Values |

---

## 2. External Counters Instead of Sequence Index

### Category
Maintainability

### Description
Maintaining an external counter variable outside the factory chain to track position-dependent values, instead of using the `$sequence->index` parameter provided by the sequence.

### Why It Happens
Developers are familiar with manual counter patterns from general programming. The `$sequence->index` parameter is a lesser-known feature that requires knowledge of the `Sequence` class internals.

### Warning Signs
- External `$i = 0` variable incremented inside `->each()` or manual loops
- Position-dependent logic that uses a counter defined outside the factory chain
- Manual tracking of how many models have been created to assign sequential values

### Preferred Alternative
```php
User::factory()
    ->count(5)
    ->sequence(fn ($sequence) => ['priority' => $sequence->index])
    ->create();
```

### Detection Checklist
- [ ] Search for counter patterns (`$i++`, `++$i`) near factory creation
- [ ] Review `->each()` calls that manually track position
- [ ] Check if `$sequence->index` could replace the external counter

### Related
| Rule | `05-rules.md` — Use the Sequence Index for Position-Dependent Logic |
| Skill | `06-skills.md` — Set Up Deterministic Test Data with sequence() |

---

## 3. Sequence Count Mismatched with Batch Size

### Category
Testing

### Description
Using a sequence with a number of items that does not evenly divide the total batch count, causing unexpected wrap-around distribution.

### Why It Happens
Developers define the sequence based on the variations they need without considering the total batch size. They don't realize the sequence wraps around when exhausted, creating an uneven distribution.

### Warning Signs
- `->count(4)` with a 3-item sequence producing an unexpected extra admin
- Comments like "first item repeats" or "unexpected distribution"
- Tests that assume a specific count of each sequenced value but get wrong numbers

### Preferred Alternative
```php
// 6 models, 3-item sequence → exactly 2 of each
User::factory()
    ->count(6)
    ->sequence(['role' => 'admin'], ['role' => 'editor'], ['role' => 'viewer'])
    ->create();
```

### Detection Checklist
- [ ] Verify that batch count is a multiple of sequence length
- [ ] Check if wrap-around behavior is intentional and documented
- [ ] Run factory creation and count each sequenced value

### Related
| Rule | `05-rules.md` — Ensure Sequence Value Count Aligns with Batch Size |
| Skill | `06-skills.md` — Set Up Deterministic Test Data with sequence() |

---

## 4. Using Sequences for Random or Realistic Data

### Category
Framework Usage

### Description
Using `sequence()` to produce attribute values when the data should be realistic, variable, and driven by Faker instead.

### Why It Happens
Developers discover sequences as a way to control values and overuse them for all data, including values that should be realistic (names, emails, descriptions).

### Warning Signs
- Sequences contain names, emails, or other human-readable data that should be varied
- All models have the same few names repeated in a cycle
- UI tests never see long names, special characters, or edge-case inputs
- `sequence()` is used for attributes that have no assertion dependency

### Preferred Alternative
```php
// Use Faker in definition() for realistic data
public function definition(): array
{
    return ['name' => fake()->name(), 'email' => fake()->safeEmail()];
}
```

### Detection Checklist
- [ ] Review sequences — do they set attributes that Faker should handle?
- [ ] Check if sequenced values could be replaced with `fake()` in `definition()`
- [ ] Verify that sequences are only used where determinism matters for assertions

### Related
| Rule | `05-rules.md` — Do Not Use Sequences for Random or Realistic Data |
| Decision Tree | `07-decision-trees.md` — Sequence vs Faker for Attribute Values |

---

## 5. Extracting One-Off Sequences into Reusable Methods

### Category
Code Organization

### Description
Creating named methods or separate classes for sequences that are used only once, adding unnecessary indirection and cluttering the factory's API.

### Why It Happens
Good intentions about DRY lead developers to extract every sequence into a reusable method, even for single-use test scenarios.

### Warning Signs
- Factory has many one-off sequence methods like `adminEditorViewerDistribution()`
- Sequence methods are called from only one test or seeder
- The factory's public API is cluttered with distribution-specific helpers

### Preferred Alternative
```php
// Inline for one-off use
User::factory()
    ->count(2)
    ->sequence(['role' => 'admin'], ['role' => 'editor'])
    ->create();
```

### Detection Checklist
- [ ] Count callers for each extracted sequence method
- [ ] Methods with 1-2 callers should be inlined
- [ ] Review factory class for unnecessary sequence helper methods

### Related
| Rule | `05-rules.md` — Keep Sequence Definitions Inline for One-Off Distributions |
| Decision Tree | `07-decision-trees.md` — Inline vs Extracted Sequence |

---

## 6. Manual Combination Enumeration Instead of CrossJoinSequence

### Category
Testing

### Description
Manually listing all combinations of multiple attribute dimensions in a sequence instead of using `CrossJoinSequence` to generate the Cartesian product automatically.

### Why It Happens
Developers may not know about `CrossJoinSequence`. Manual enumeration works for small combinations but becomes error-prone and incomplete as dimensions grow.

### Warning Signs
- Manual nested `sequence()` calls to cover multiple attribute combinations
- Long sequence lists that enumerate `status × plan` or similar combinations
- Missing combinations in test coverage because manual lists are incomplete

### Preferred Alternative
```php
use Illuminate\Database\Eloquent\Factories\CrossJoinSequence;

User::factory()
    ->count(4)
    ->sequence(new CrossJoinSequence(
        ['status' => 'active', 'status' => 'inactive'],
        ['plan' => 'free', 'plan' => 'premium'],
    ))
    ->create();
```

### Detection Checklist
- [ ] Review sequences that set multiple attributes — could CrossJoin help?
- [ ] Check for missing combinations in manually enumerated lists
- [ ] Verify that `CrossJoinSequence` is imported and used for combinatorial coverage

### Related
| Rule | `05-rules.md` — Use CrossJoinSequence for Exhaustive Combinatorial Coverage |
| Decision Tree | `07-decision-trees.md` — CrossJoinSequence vs Nested Sequences |
