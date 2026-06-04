# Factory Sequences

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Factory sequences provide a mechanism for cycling through a predefined set of attribute values across multiple factory-generated models. Instead of random or static values, sequences produce ordered, repeating values â€” useful for generating varied yet controlled datasets. `Sequence` cycles through values sequentially, while `CrossJoinSequence` produces the Cartesian product of multiple arrays.

## Core Concepts
- **Sequence:** Accepts an array of values and returns them in order across successive `make()`/`create()` calls. Wraps around to the beginning when exhausted.
- **CrossJoinSequence:** Accepts multiple arrays and generates all combinations (Cartesian product). Useful for combinatorial test scenarios.
- **Usage in definition:** Sequences can be used inside `definition()` via `$this->sequence(...)`, but are more commonly chained via `->sequence(...)`.
- **Index awareness:** Sequence callables receive the current index (`$index`) as a parameter, enabling position-dependent logic.
- **Sequence lifecycle:** Each factory instance maintains its own sequence pointer. New factory instances reset the sequence.

## Mental Models
- **Round-robin dispenser:** A sequence is like a round-robin dispenser that hands out the next value each time a model is created. When it reaches the end, it starts over.
- **Cartesian explorer:** `CrossJoinSequence` is a combinatorial generator â€” every combination of inputs produces one output. Useful for exhaustively testing all combinations of a small number of states.
- **Cycle vs. random:** Unlike Faker's random values, sequences produce deterministic, repeatable patterns. Use sequences when the test expects a known distribution (e.g., 3 admins, 2 editors, 1 viewer).

## Internal Mechanics

> **Reference:** 
- `Sequence` stores an array of values and an internal `$count` pointer incremented on each `__invoke` call.
- When `__invoke` is called, it returns the value at the current index, then advances the pointer. If the pointer exceeds the array length, it resets to 0 (circular).
- `CrossJoinSequence` extends `Sequence` and generates the Cartesian product of its input arrays in its constructor, then cycles through the resulting combinations.
- The factory stores sequences in `$sequences` array. During `make()`, each registered sequence is invoked with `$index` and merged into the attributes.

## Patterns
### Sequential Attribute Cycling
```php
User::factory()->count(5)->sequence(
    ['role' => 'admin'],
    ['role' => 'editor'],
    ['role' => 'viewer'],
)->create();
// User 1: admin, User 2: editor, User 3: viewer, User 4: admin, User 5: editor
```

### Index-Based Values
```php
User::factory()->count(10)->sequence(
    fn ($sequence) => ['sort_order' => $sequence->index],
)->create();
```

### CrossJoin for Combinatorial Sets
```php
$sequence = new CrossJoinSequence(
    ['role' => 'admin', 'role' => 'editor'],
    ['status' => 'active', 'status' => 'inactive'],
);
User::factory()->count(4)->sequence($sequence)->create();
// Produces: (admin,active), (admin,inactive), (editor,active), (editor,inactive)
```

### Sequence Inside Definition
```php
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'role' => $this->sequence('admin', 'editor', 'viewer'),
        ];
    }
}
```

### Mixing Sequences and States
```php
User::factory()->count(6)->admin()->sequence(
    ['team' => 'alpha'],
    ['team' => 'beta'],
)->create();
// All users are admin, alternating teams alpha/beta
```

## Architectural Decisions
### Decision: Sequence vs. State Method for Varied Data
- **Sequence:** Best for cycling through values across a batch. Tightly tied to iteration order.
- **State method:** Best for a single known variation applied to one or all models in a batch.
- **Tradeoff:** Sequences are positional; states are semantic. Use sequences when the variation pattern matters, states when the scenario matters.

### Decision: Sequence Inside `definition()` vs. Chained `->sequence()`
- **Inside definition:** Automatically applies to every factory call. Less explicit but ensures consistent cycling.
- **Chained:** Explicit and scoped to the specific call. Does not affect other usages of the factory.
- **Tradeoff:** In-definition sequences are implicit and may surprise callers. Chained sequences are visible at call sites.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deterministic, repeatable value cycling | Sequence state is mutable â€” sharing a factory instance leaks state | Always chain sequences inline or reset factory between tests |
| CrossJoin covers combinatorial exhaustively | Number of combos grows multiplicatively, can explode | Limit to small sets (<10 total combos) |
| Index-aware closures enable position-dependent logic | Index starts at 0 per batch, not per sequence cycle | Use modulo or grouping logic for cyclic patterns with awareness |
| Mixed with states for rich scenarios | State + sequence attribute overlap resolution is implicit | Document merge precedence (sequence values override states?) |

## Performance Considerations
- Sequences are in-memory â€” no overhead beyond index increment and array lookup. Negligible cost.
- `CrossJoinSequence` pre-computes all combinations in its constructor. For large input arrays, this can consume significant memory. Limit to arrays of length < 100.
- Sequence closure calls scale linearly with model count. Keep closures lightweight.

## Production Considerations
- Sequences are a testing/seeding concern only. Never use sequences in production code paths.
- For seeded demo data, sequences ensure a predictable distribution (e.g., 20 users with alternating roles). Use them in `DatabaseSeeder` for reproducible datasets.

## Common Mistakes
**Mistake: Reusing a factory instance across multiple test methods.**
Why it happens: Defining a factory with a sequence in a shared setup method.
Why it's harmful: The sequence pointer persists across tests, producing unexpected results.
Better approach: Always create a fresh factory instance or chain sequences inline.

**Mistake: Confusing sequence index with model primary key.**
Why it happens: The sequence index starts at 0, not the model's auto-increment value.
Why it's harmful: Off-by-one errors in test assertions.
Better approach: Use `$sequence->index + 1` if a 1-based index is needed.

**Mistake: Using CrossJoinSequence with large arrays.**
Why it happens: Multiple arrays of 10+ items each produce thousands of combinations.
Why it's harmful: Memory exhaustion or extremely slow tests.
Better approach: Limit CrossJoin to small arrays. Prefer nested loops or sequences for larger sets.

## Failure Modes
1. **Sequence pointer leakage:** A factory instance used across multiple batches retains its sequence index. Mitigation: always chain sequences inline or use `Factory::new()` for fresh instances.
2. **Memory exhaustion with CrossJoin:** Large input sets create combinatorially exploding arrays. Mitigation: validate input array sizes.
3. **Sequence and state attribute conflict:** A sequence overrides an attribute also set by a state. The merge order is: definition â†’ states â†’ sequences. Mitigation: document attribute overlap expectations.

## Ecosystem Usage
- **Laravel Debugbar:** Uses sequences in its test suite for generating varied HTTP request data.
- **Laravel Nova:** Employs sequences for generating varied resource test fixtures across multiple resource types.
- **Spatie Laravel Tags:** Test factories use sequences for generating differently colored tags.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- Factory States

### Related Topics
- Factory Callbacks
- Seeding Strategies

### Advanced Follow-up Topics
- Combinatorial Test Design
- Data Generators


## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Factories\Sequence.php` (~80 lines) â€” simple index-advancing callable. `CrossJoinSequence.php` (~40 lines) computes Cartesian product via nested loops in constructor.
- **Key Insight:** Sequences and states share the same merge pipeline â€” both are callables invoked during `make()`. The only difference is that states are semantic overrides while sequences are positional cycles.
- **Version-Specific Notes:** `Sequence` was introduced in Laravel 8.x. `CrossJoinSequence` was added in Laravel 9.x. Index-aware sequence closures (receiving `$sequence` object) were added in Laravel 10.x.
