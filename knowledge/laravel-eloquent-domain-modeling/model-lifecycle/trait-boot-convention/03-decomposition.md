# Trait Boot Convention — Decomposition

## Implementation Tasks

### 1. Create traits with boot methods
- Implement trait classes that use the boot convention for auto-setup:
  ```php
  trait Sluggable
  {
      public static function bootSluggable(): void
      {
          static::creating(function ($model) {
              $model->slug = $model->generateSlug();
          });
      }
      
      public function generateSlug(): string
      {
          return Str::slug($this->title);
      }
  }
  ```

### 2. Verify boot method discovery
- Write a test that confirms `bootTraits()` discovers and calls `boot{TraitName}` methods
- Test that boot methods execute once per class per request (not per instance)
- Test that boot methods receive late static binding (correct model class)

### 3. Document all boot methods in the project
- Create a reference document listing every trait with a `boot{TraitName}` method
- For each boot method, note:
  - What listeners/scopes it registers
  - What side effects it has
  - Whether it depends on other traits booting first

### 4. Implement a boot method naming convention check
- Add a CI script or static analysis rule that validates:
  - If a trait defines `boot{TraitName}`, the method is `protected static`
  - If a trait uses the boot convention, its name matches the method
  - No duplicate boot method names across composed traits

### 5. Write tests for boot method registration
- Test that listeners registered in `boot{TraitName}` fire at the correct event
- Test that global scopes registered in boot methods are applied
- Test that boot methods are NOT called on every instantiation (class-level caching)

## Validation Criteria
- [ ] All traits with boot methods documented
- [ ] Tests confirm boot discovery and execution
- [ ] Tests confirm boot methods are class-level (not per-instance)
- [ ] CI validates boot method naming convention
- [ ] Boot method side effects are documented in trait docblocks
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization