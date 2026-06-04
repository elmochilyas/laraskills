# Factory Sequences — Decomposition

## Implementation Tasks

### 1. Identify sequential data requirements
- List attributes that need varied values across generated models (roles, statuses, types)
- Determine if the variation is cyclic (round-robin) or combinatorial

### 2. Implement basic sequence
- Chain `->sequence(...)` on factory for cyclic attribute cycling
- Pass arrays of attribute overrides or closures
- Test round-robin wrap-around behavior

### 3. Implement index-based sequence
- Use `fn ($sequence) => [...]` closure for index-dependent values
- Match index to sort order, display order, or priority fields
- Test that index increments correctly across batch

### 4. Implement CrossJoinSequence for combinatorial data
- Create `new CrossJoinSequence([...], [...])` with two small arrays
- Verify all combinations are produced
- Test count of generated models equals product of array sizes

### 5. Integrate sequences with factory definition
- Optionally place `$this->sequence(...)` inside `definition()` for implicit cycling
- Document sequence behavior in factory class docblock

### 6. Test sequence + state interaction
- Verify sequence values override state values correctly
- Test state values applied after sequences (if that is the intended order)
- Document merge precedence

### 7. Test sequence lifecycle isolation
- Verify each batch creates a fresh sequence or resets pointer
- Test that reusing a factory instance without re-chaining continues the sequence

### 8. Test edge cases
- Single-value sequence (constant across all models)
- Empty sequence array (should throw or produce no models)
- Sequence with nullable values

## Validation Criteria
- [ ] `factory()->count(3)->sequence(['a'=>1], ['a'=>2])` cycles: [1, 2, 1]
- [ ] `$sequence->index` starts at 0 and increments per model
- [ ] `CrossJoinSequence` produces all combinations of input arrays
- [ ] Sequence values override base definition values
- [ ] Sequence closures receive the correct index
- [ ] Sequence pointer resets for each inline chain call
- [ ] Memory usage remains stable for CrossJoin with small arrays
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization