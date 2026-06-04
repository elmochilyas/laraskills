# Skill: Set Up Deterministic Test Data with sequence()

## Purpose

Use `sequence()` on a factory builder to produce a known, predictable distribution of attribute values across a batch of models, eliminating non-deterministic Faker output in tests.

## When To Use

- Test assertions depend on a specific distribution of attribute values
- Test must produce identical results on every run regardless of Faker seed
- Creating models with known, ordered attribute values (e.g., 3 admins, 2 editors)

## When NOT To Use

- The data should be realistic and varied (use Faker in `definition()`)
- The sequence is single-use with a static array (pass attributes directly)

## Prerequisites

- Factory class with `definition()` exists
- The attribute being sequenced is not already hard-coded in `definition()`

## Inputs

- Attribute value arrays in the order they should cycle
- Batch count for the factory call
- Optional: sequence index callable for position-dependent logic

## Workflow

1. Determine the exact distribution of values needed for the test scenario:
   - 2 admins, 2 editors, 2 viewers = 6 models
2. Chain `sequence()` on the factory builder with attribute arrays:
   ```
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
       ->create()
   ```
3. Ensure the batch count aligns with the sequence to avoid unexpected wrap-around
4. For position-dependent values, use the `$sequence->index` parameter:
   ```
   ->sequence(fn ($sequence) => ['priority' => $sequence->index])
   ```
5. For exhaustive combination testing, use `CrossJoinSequence`:
   ```
   ->sequence(new CrossJoinSequence(
       ['status' => 'active', 'status' => 'inactive'],
       ['plan' => 'free', 'plan' => 'premium'],
   ))
   ```

## Validation Checklist

- [ ] Sequence values produce the expected deterministic distribution
- [ ] Batch count is a multiple of the sequence length or wrap-around is intentional
- [ ] `CrossJoinSequence` covers all required combinations
- [ ] Sequence index used for position-dependent logic instead of external counters
- [ ] Sequence definitions kept inline for one-off distributions

## Common Failures

- **Mismatched count**: 4 models with a 3-item sequence wraps around to the first item, producing an unexpected extra admin. Align count to sequence length.
- **Overuse**: Using sequences for all attributes when only one attribute needs deterministic values. Sequence only the specific attributes, letting Faker handle the rest.
- **External counters**: Maintaining a manual counter variable instead of using `$sequence->index` for position-dependent logic.

## Decision Points

- **Sequence vs Faker**: Use sequence for deterministic test data where assertions depend on values. Use Faker for realistic data in development seeding.
- **Inline vs extracted**: Keep sequences inline for one-off test distributions. Extract to a static factory method when the same sequence is reused across 3+ tests.

## Performance Considerations

- Sequences add negligible overhead — simple value lookups
- `CrossJoinSequence` can generate large result sets; limit inputs to avoid excessive records

## Security Considerations

- No direct security impact; affects test data generation only

## Related Rules

- Rule 1: Use Sequences for Deterministic Test Data
- Rule 2: Use CrossJoinSequence for Exhaustive Combinatorial Coverage
- Rule 3: Use the Sequence Index for Position-Dependent Logic
- Rule 6: Ensure Sequence Value Count Aligns with Batch Size

## Related Skills

- Factory States for Named State Variations
- Factory Definition for Attribute Arrays
- Seeding Strategies for Bulk Data

## Success Criteria

- Batch of models has exactly the expected distribution of sequenced attributes
- Test produces identical results on every run
- No external state management needed for position-dependent values
