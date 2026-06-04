# Pivot Attributes Skills

## Skill: Read and write pivot attributes with proper whitelisting

### Purpose
Configure `BelongsToMany` relationships to read and write extra pivot columns using `withPivot()`, `withTimestamps()`, and the `attach()`/`sync()`/`updateExistingPivot()` methods.

### When To Use
- Any many-to-many pivot table with extra columns beyond the two foreign keys
- Storing metadata on the relationship: quantity, expiry date, role
- Timestamped pivots to track when relationships were created/updated

### When NOT To Use
- For columns you don't need (use selective whitelisting)
- When type safety matters (use custom pivot models)
- When you need to preserve unspecified existing attributes during sync

### Prerequisites
- Defined `BelongsToMany` relationship with extra pivot columns in migration

### Inputs
- Extra pivot column names
- Pivot attribute values

### Workflow
1. On the relationship definition, call `->withPivot('col1', 'col2')` for every extra column needed
2. Call `->withTimestamps()` if the pivot migration has timestamp columns
3. Optionally call `->as('customName')` for a meaningful pivot accessor name
4. To read: `$role->pivot->expires_at` (or `$role->customName->expires_at`)
5. To write during attach: `$user->roles()->attach($roleId, ['expires_at' => now()])`
6. To write during sync: `$user->roles()->sync([1 => ['expires_at' => now()], 2 => ['expires_at' => now()]])`
7. To update a single pivot row: `$user->roles()->updateExistingPivot($roleId, ['expires_at' => now()])`
8. For same values across multiple IDs (Laravel 10+): `$user->roles()->syncWithPivotValues([1, 2, 3], ['expires_at' => now()])`

### Validation Checklist
- [ ] All needed extra pivot columns are whitelisted via `withPivot()`
- [ ] `withTimestamps()` is called when pivot has timestamp columns
- [ ] Pivot attributes are readable via `$model->pivot->attribute`
- [ ] `attach()` with extra columns inserts them correctly
- [ ] `sync()` with attribute arrays updates correctly
- [ ] `syncWithPivotValues()` is used for same attributes across multiple IDs
- [ ] Pivot data in API responses is limited to intended columns

### Common Failures
- Accessing pivot attributes without `withPivot()` — silent null returns
- Forgetting `withTimestamps()` — timestamps never populated during attach/sync
- `sync()` losing existing pivot attributes — use `syncWithoutDetaching()` for additive-only
- Using `withPivot('*')` — selecting all columns wastes memory and may leak data

### Decision Points
- **withPivot() or withPivot('*')?** — Always whitelist only needed columns; avoid `withPivot('*')`
- **sync() vs syncWithoutDetaching()?** — Use `sync()` with full attribute arrays for replacement; use `syncWithoutDetaching()` for additive-only
- **Generic Pivot or custom pivot?** — Use generic Pivot for simple column access; use custom pivot with `$casts` for type conversion

### Performance Considerations
- Every extra pivot column adds to result set size
- Large text/JSON pivot columns increase memory pressure
- Custom pivot models add no query overhead — only extra object instantiation

### Security Considerations
- Pivot data is included in model serialization — use `withPivot()` to limit exposed columns
- Custom pivot models can use `$hidden` to prevent pivot attribute exposure
- Validate pivot attribute values before attach/sync

### Related Rules
- [PivotAttr-WithPivot-For-Extra-Columns](../pivot-attributes/05-rules.md)
- [PivotAttr-WithTimestamps-Consistency](../pivot-attributes/05-rules.md)
- [PivotAttr-Selective-Whitelisting](../pivot-attributes/05-rules.md)
- [PivotAttr-Sync-Preserves-Attributes](../pivot-attributes/05-rules.md)
- [PivotAttr-SyncWithPivotValues](../pivot-attributes/05-rules.md)
- [PivotAttr-Pivot-Serialization-Security](../pivot-attributes/05-rules.md)

### Related Skills
- Cast pivot attributes with custom pivot models

### Success Criteria
- All needed pivot columns are readable and writable
- Timestamps are populated when using `withTimestamps()`
- `sync()` correctly handles attribute arrays
- No unnecessary columns are selected
- API responses expose only intended pivot data

---

## Skill: Cast pivot attributes with custom pivot models

### Purpose
Use custom pivot models with `$casts` to provide type conversion (Carbon dates, booleans, enums) for pivot attributes.

### When To Use
- Pivot attributes need type casting (dates, booleans, enums)
- Computed pivot values via accessors
- Domain logic on pivot models
- Pivot serialization needs `$appends` or `$hidden`

### When NOT To Use
- Pivot columns are simple types that don't need casting
- Pivot table has only foreign keys with no extra columns
- Polymorphic pivots (extend `MorphPivot` instead)

### Prerequisites
- `BelongsToMany` relationship with extra pivot columns
- Custom pivot model extending `Pivot` (or `MorphPivot` for polymorphic)

### Inputs
- Custom pivot class name
- Cast definitions array

### Workflow
1. Create a class extending `Illuminate\Database\Eloquent\Relations\Pivot`
2. Define `protected $casts = ['expires_at' => 'datetime', 'is_admin' => 'boolean']`
3. Register with `->using(CustomPivot::class)` on both sides of the relationship
4. Configure `$hidden` for pivot attributes that shouldn't be serialized
5. Add `$appends` selectively — each appended accessor runs during serialization

### Validation Checklist
- [ ] Custom pivot model extends `Pivot` (or `MorphPivot`)
- [ ] `$casts` correctly converts pivot column types
- [ ] `->using()` is registered on both sides
- [ ] `$hidden` protects sensitive pivot data from exposure
- [ ] `$appends` doesn't include expensive computed values

### Common Failures
- Extending `Pivot` instead of `MorphPivot` for polymorphic pivots
- Not registering `->using()` on both sides
- Expensive `$appends` on pivot models — serialization cost per pivot row

### Decision Points
- **Generic Pivot or custom?** — Use generic when no casting needed; use custom for type safety and behavior

### Performance Considerations
- Custom pivot models add no query overhead
- `$appends` runs on every serialization — keep computed attributes cheap
- Expensive accessors should be methods, not `$appends` properties

### Security Considerations
- Configure `$hidden` to prevent exposing sensitive pivot data
- Casts apply to serialized output

### Related Rules
- [PivotAttr-CustomPivot-For-Casting](../pivot-attributes/05-rules.md)
- [PivotAttr-Pivot-Serialization-Security](../pivot-attributes/05-rules.md)

### Related Skills
- Read and write pivot attributes with proper whitelisting

### Success Criteria
- Pivot attributes return correct types (Carbon, bool, etc.)
- Custom methods work on pivot instances
- Serialization respects `$hidden` and `$casts`
