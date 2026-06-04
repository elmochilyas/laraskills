# Trait Init Convention — Decomposition

## Implementation Tasks

### 1. Create traits with init methods
- Implement trait classes using the init convention for per-instance setup:
  ```php
  trait HasMeta
  {
      protected function initializeHasMeta(): void
      {
          $this->meta = $this->meta ?? [];
          $this->meta_version = $this->meta_version ?? 1;
      }
  }
  ```

### 2. Verify init method execution timing
- Write a test that confirms `initializeTraits()` runs after the parent constructor
- Test that init methods have access to `$this` (instance properties)
- Test that init methods run BEFORE `fill()` (factory/request attributes override init defaults)
- Test that init methods run on EVERY instantiation (new, factory, hydration)

### 3. Document init method conventions
- Create a reference document listing every trait with an `initialize{TraitName}` method
- Document the default values each init method sets
- Document which init methods interact with the model's `$attributes` array

### 4. Implement init method ordering awareness
- Document the init method ordering rules (trait composition order, left-to-right)
- For traits that interact, document which inits first sets values that others may depend on

### 5. Write init method performance tests
- Benchmark 1000 model instantiations with traits using init methods
- Ensure init methods are lightweight (< 1ms per trait per instance)
- Identify traits with expensive init methods and optimize or defer

### 6. Add CI check for init method correctness
- Ensure init method naming matches trait name
- Ensure init methods are `protected` (not public or private)
- Ensure no duplicate init method names across composed traits

## Validation Criteria
- [ ] All traits with init methods documented
- [ ] Tests confirm init execution timing (after constructor, before fill)
- [ ] Tests confirm init runs per-instance (not class-level caching)
- [ ] Init method ordering documented for composed traits
- [ ] Init method performance benchmarks pass
- [ ] CI validates init method naming convention
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization