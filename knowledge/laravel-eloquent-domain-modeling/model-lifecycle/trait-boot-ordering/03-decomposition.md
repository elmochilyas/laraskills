# Trait Boot Ordering — Decomposition

## Implementation Tasks

### 1. Analyze current trait composition for ordering issues
- For each model using multiple traits with boot methods, document the `use` statement order
- Identify any ordering-dependent behavior (listener A must register before listener B)
- Flag models where boot order matters but is not documented

### 2. Write tests for boot ordering
- Create two traits (`TraitA`, `TraitB`) that each register a `creating` listener setting a model attribute
- Compose them as `use TraitA, TraitB` and verify TraitA's listener sets the value first
- Compose as `use TraitB, TraitA` and verify TraitB's listener sets the value first
- Test parent-child trait boot order

### 3. Implement order-independent trait design
- Refactor traits to NOT depend on boot order:
  - Use event guard flags instead of assuming execution order
  - Avoid conflicting listener registration (same event, same model state)
  - Use separate events or conditional checks in listeners

### 4. Document required boot ordering
- For traits that MUST boot in a specific order, add explicit documentation at the `use` statement:
  ```php
  /**
   * Boot order:
   * 1. Sluggable (must generate slug first)
   * 2. Translatable (uses slug for URL generation)
   */
  use Sluggable, Translatable;
  ```

### 5. Add static analysis for boot ordering conflicts
- Create a PHPStan rule that warns when two traits register listeners on the same event with overlapping concerns
- Flag models with >3 traits that all define boot methods (design smell)

### 6. Implement explicit boot coordinator pattern (if needed)
- For models with complex trait interactions, override `boot()` to explicitly call trait boot methods in the required order:
  ```php
  protected static function boot(): void
  {
      static::bootSluggable();
      static::bootTranslatable();
      // parent::boot() not called — manual boot control
  }
  ```

## Validation Criteria
- [ ] All models with multiple boot traits are analyzed for ordering dependencies
- [ ] Tests confirm left-to-right boot ordering from `use` statement
- [ ] Tests confirm parent-traits-before-child-traits ordering
- [ ] Ordering documentation is present on all multi-trait models
- [ ] Order-independent trait design is the default approach
- [ ] CI warns if boot ordering dependencies are detected but not documented
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization