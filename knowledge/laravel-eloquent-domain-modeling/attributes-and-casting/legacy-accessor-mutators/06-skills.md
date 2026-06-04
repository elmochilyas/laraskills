# Legacy Accessor/Mutators — Skills

---

## Skill 1: Migrate a Legacy Accessor to Attribute::make

### Purpose
Replace a legacy `getAttribute()` accessor method with `Attribute::make(get: ...)` to enable caching and modern Laravel conventions.

### When To Use
- You have an existing `get{Attribute}Attribute($value)` method in a model
- You want to enable per-instance caching via `shouldCache`
- You're modernizing the codebase to Laravel 9+ conventions

### When NOT To Use
- The accessor has side effects (refactor those out first)
- The entire model is being retired or replaced

### Prerequisites
- Laravel 9+ project
- Legacy accessor defined with `get{Name}Attribute` convention

### Inputs
- Legacy accessor method name
- Model file path

### Workflow

1. **Identify the legacy accessor** — `public function getFullNameAttribute($value): string`

2. **Replace with `Attribute::make(get: fn ($value) => ...)`**:
   - Remove the `get` prefix, `Attribute` suffix, and `$value` parameter
   - Wrap the body in an `Attribute::make()` closure

3. **Move the logic (minus `$value` param)** into the get closure:
   ```php
   // Before
   public function getFullNameAttribute($value): string
   {
       return trim("{$this->first_name} {$this->last_name}");
   }

   // After
   protected function fullName(): Attribute
   {
       return Attribute::make(
           get: fn ($value) => trim("{$this->first_name} {$this->last_name}"),
       );
   }
   ```

4. **Add `shouldCache: true`** if the accessor is expensive or called multiple times

5. **Test** — assert the accessor still returns the same value

### Validation Checklist

- [ ] Method name changed from `get{Name}Attribute` to `{name}(): Attribute`
- [ ] Method visibility changed from `public` to `protected`
- [ ] Body moved into `Attribute::make(get: fn ($value) => ...)` closure
- [ ] Accessor returns the same value for the same input
- [ ] Legacy method is removed (no duplication)
- [ ] `shouldCache` added where profiling indicates benefit

### Related Rules

| Rule | Reference |
|---|---|
| Replace legacy getXAttribute with Attribute::make | `05-rules.md` Rule 1 |
| Change visibility from public to protected | `05-rules.md` Rule 2 |
| Use camelCase method names for Attribute accessors | `05-rules.md` Rule 3 |
| Add shouldCache only after profiling | `05-rules.md` Rule 4 |
| Remove legacy methods to avoid duplication | `05-rules.md` Rule 5 |

### Success Criteria
- All legacy accessors migrated to `Attribute::make` syntax
- Accessor values are identical before and after migration
- No duplicate accessor definitions (legacy and new coexist only during migration)
- Project tests pass with the migrated accessors
