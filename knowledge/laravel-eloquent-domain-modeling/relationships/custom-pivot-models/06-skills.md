# Custom Pivot Models Skills

## Skill: Create and configure a custom pivot model with behavior

### Purpose
Create a custom pivot model that extends `Pivot` to add accessors, mutators, casts, events, and domain logic to many-to-many intermediary rows.

### When To Use
- Pivot table has extra columns that need type casting
- Pivot data needs computed attributes via accessors
- The relationship itself has domain logic (isActive(), markAsExpired(), renew())
- Pivot requires its own event listeners or observers
- Need `$appends` on pivot data in API serialization

### When NOT To Use
- Pivot table has only two foreign keys (no extra columns needed)
- Polymorphic many-to-many without extending `MorphPivot`
- Only one side of the relationship registers `->using()`

### Prerequisites
- Existing `belongsToMany` relationship
- Pivot table with extra columns beyond foreign keys

### Inputs
- Custom pivot class name (e.g., `Membership`)
- Pivot table extra column definitions
- Casts and accessor definitions
- Domain methods for the relationship

### Workflow
1. Create a new class that extends `Illuminate\Database\Eloquent\Relations\Pivot`
2. Define `$casts` for pivot columns: `protected $casts = ['expires_at' => 'datetime', 'is_admin' => 'boolean']`
3. Add accessors for computed attributes: `getIsActiveAttribute()`
4. Add domain methods: `public function isActive(): bool`, `public function renew(int $days): void`
5. Configure `$incrementing` — set to `true` if pivot has auto-increment PK, `false` for composite PK
6. Set `$appends` carefully — each appended accessor runs during serialization
7. If overriding `boot()` always call `parent::boot()` inside
8. Register with `->using(CustomPivot::class)` on BOTH sides of the relationship
9. Add PHPDoc `@property-read` annotations on the main model for IDE support

### Validation Checklist
- [ ] Custom pivot extends `Pivot` (or `MorphPivot` for polymorphic)
- [ ] `->using()` is registered on both sides of the relationship
- [ ] `$casts` configured for pivot columns needing type conversion
- [ ] `$incrementing` correctly matches the pivot's PK strategy
- [ ] `parent::boot()` called if boot() is overridden
- [ ] PHPDoc annotations added on main model for pivot type
- [ ] `$appends` is minimal — expensive accessors are not auto-appended

### Common Failures
- Registering `->using()` on only one side — inconsistent pivot hydration
- Extending `Pivot` instead of `MorphPivot` for polymorphic pivots
- Expecting pivot model events to fire during `attach()`/`detach()` — they don't
- Not configuring `$incrementing` — save operations fail
- Not calling `parent::boot()` — traits don't initialize

### Decision Points
- **Simple pivot or custom pivot?** — Use custom pivot only when the pivot has behavior beyond raw data access
- **Pivot or MorphPivot?** — Use `Pivot` for standard many-to-many; use `MorphPivot` for polymorphic many-to-many

### Performance Considerations
- Custom pivot models add no query overhead — SQL is identical
- Expensive accessors on `$appends` multiply serialization cost per pivot row
- Large collections with many pivots generate many pivot model instances

### Security Considerations
- Pivot model attributes are serialized in JSON — configure `$hidden` appropriately
- `$casts` apply to API output — be mindful of data exposure
- Pivot model events don't fire on `attach()`/`detach()` — important for audit listeners

### Related Rules
- [CustomPivot-Using-Both-Sides](../custom-pivot-models/05-rules.md)
- [CustomPivot-Extend-MorphPivot-For-Polymorphic](../custom-pivot-models/05-rules.md)
- [CustomPivot-Not-For-FK-Only](../custom-pivot-models/05-rules.md)
- [CustomPivot-Config-Incrementing](../custom-pivot-models/05-rules.md)
- [CustomPivot-Boot-Parent](../custom-pivot-models/05-rules.md)
- [CustomPivot-Appends-Performance](../custom-pivot-models/05-rules.md)
- [CustomPivot-PHPDoc-Annotations](../custom-pivot-models/05-rules.md)

### Related Skills
- Configure a BelongsToMany relationship with pivot table migration

### Success Criteria
- Custom pivot model methods work via `$model->relation->pivot->methodName()`
- Casts correctly convert pivot column types
- `$appends` values appear in serialization without performance issues
- Both sides of the relationship use the same custom pivot class
- IDE provides autocompletion for pivot attributes

---

## Skill: Handle pivot model event lifecycle correctly

### Purpose
Understand and correctly implement event-driven logic for pivot records, accounting for the fact that pivot model events don't fire on `attach()`/`detach()`.

### When To Use
- Auditing pivot table changes
- Triggering side effects on pivot creation or deletion
- Complex pivot data validation during save
- Syncing related systems when pivot relationships change

### When NOT To Use
- Simple pivot tracking that doesn't need events
- Scenarios where `attach()`/`detach()` behavior is sufficient

### Prerequisites
- Custom pivot model registered via `->using()`
- Understanding of the event gap between `attach()`/`detach()` and `$pivot->save()`

### Inputs
- Event handler or observer class
- Pivot model method name where `save()` is called

### Workflow
1. Recognize that custom pivot model observers do NOT fire on `attach()` or `detach()`
2. For `attach()` side effects, use the framework's `Pivot\Attached` event:
   ```php
   Event::listen(\Illuminate\Database\Events\Pivot\Attached::class, fn($event) => ...)
   ```
3. For `detach()` side effects, use `Pivot\Detached` event
4. For explicit save operations on existing pivot rows, model events DO fire:
   ```php
   $pivot = $user->teams->first()->pivot;
   $pivot->expires_at = now();
   $pivot->save(); // This fires model events
   ```
5. Do not rely on `created`/`updated` observers on custom pivot for `sync()` operations

### Validation Checklist
- [ ] No expectation that `attach()` fires custom pivot model observers
- [ ] `Pivot\Attached`/`Pivot\Detached` events are used for attach/detach side effects
- [ ] `save()` calls on pivot model correctly fire model events
- [ ] Audit trail is complete for all pivot modification paths

### Common Failures
- Assuming `MembershipObserver::saved` fires on `$user->teams()->attach($teamId)`
- Missing side effects because the event gap wasn't accounted for
- `sync()` side effects not tracked because neither `attach()` nor `detach()` events are listened for individually

### Decision Points
- **Model events or pivot events?** — Use pivot events (`Pivot\Attached`/`Pivot\Detached`) for attach/detach; use model events for explicit pivot `save()` calls

### Performance Considerations
- Event listeners on every pivot operation add overhead proportional to the number of pivot changes
- `sync()` with many IDs fires one event per operation, not per row

### Security Considerations
- Audit listeners for pivot events are essential for compliance in multi-tenant or RBAC systems
- Pivot model events not firing is a security gap if audit depends on them

### Related Rules
- [CustomPivot-Event-Awareness](../custom-pivot-models/05-rules.md)

### Related Skills
- Create and configure a custom pivot model with behavior

### Success Criteria
- Side effects correctly fire for all pivot modification paths
- No assumption that `attach()`/`detach()` trigger model observers
- Audit trail is complete and accurate
