# BelongsToMany Factories — Decomposition

## Implementation Tasks

### 1. Create pivot migration
- Generate migration for `role_user` table with `user_id`, `role_id` columns
- Add unique composite index on `(user_id, role_id)`
- Add any extra pivot columns (`assigned_at`, `is_primary`, etc.)

### 2. Define `BelongsToMany` relationship on both models
- Add `roles(): BelongsToMany` on User returning `$this->belongsToMany(Role::class)`
- Add `users(): BelongsToMany` on Role returning `$this->belongsToMany(User::class)`
- Specify custom pivot table name and columns if non-conventional

### 3. Use `hasAttached()` with factory for new models
- Chain `User::factory()->hasAttached(Role::factory()->count(3))->create()`
- Assert pivot table has 3 rows with correct user_id and role_id

### 4. Attach existing models via `hasAttached()`
- Create roles beforehand
- `User::factory()->hasAttached($role1)->hasAttached($role2)->create()`
- Assert only pivot rows inserted, no new roles

### 5. Add uniform pivot attributes
- `hasAttached(Role::factory()->count(2), ['is_primary' => false])`
- Assert all pivot rows have `is_primary = false`

### 6. Add per-attachment pivot via closure
- `hasAttached(Role::factory()->count(3), fn ($user, $role) => ['assigned_at' => now()])`
- Assert each pivot row has a different `assigned_at`

### 7. Use magic `has{Relation}` method
- `User::factory()->hasRoles(3)->create()`
- Test with pivot data if supported

### 8. Test duplicate prevention
- Attach same role twice and verify only one pivot row exists (depending on attach vs sync)
- Use `syncWithoutDetaching()` strategy for idempotent seeding

## Validation Criteria
- [ ] `User::factory()->hasAttached(Role::factory()->count(3))->create()` creates 1 user, 3 roles, 3 pivot rows
- [ ] Pivot rows have correct `user_id` and `role_id` values
- [ ] Uniform pivot attributes apply to all rows
- [ ] Per-attachment closure produces varied pivot data
- [ ] Existing models passed to `hasAttached()` are not re-created
- [ ] Pivot table unique constraint prevents duplicate attachments
- [ ] Magic `hasRoles()` resolves to `hasAttached()` correctly
- [ ] No orphan pivot rows exist (no role_id referencing non-existent role)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization