# Recycle Pattern — Decomposition

## Implementation Tasks

### 1. Create base models for recycle target
- Create a user/role/category model with factory
- Verify relationships exist on the target model class

### 2. Implement single-instance recycle
- Create one user via `User::factory()->create()`
- `Post::factory()->count(10)->recycle($user)->create()`
- Assert all 10 posts have the same `user_id`

### 3. Implement collection recycle (round-robin)
- Create 5 users via `User::factory()->count(5)->create()`
- `Post::factory()->count(20)->recycle($users)->create()`
- Assert distribution: each user has exactly 4 posts

### 4. Implement global graph recycle
- Create one admin user
- `User::factory()->recycle($admin)->has(Post::factory()->count(3))->has(Profile::factory())->create()`
- Assert the created profile and posts reference the recycled admin, not a new user

### 5. Use recycle in BelongsToMany factories
- Create roles collection
- `User::factory()->count(10)->hasAttached(Role::factory()->count(3), recycle: $roles)->create()`
- Assert roles are recycled, not re-created

### 6. Test recycle scoping
- Verify recycle does not persist across separate factory calls
- Test that each new factory chain without recycle creates fresh parents

### 7. Test query count reduction
- Assert with and without recycle: `getQueryLog()`
- Verify recycle reduces INSERT queries by the number of avoided parent creations

## Validation Criteria
- [ ] `factory()->count(10)->recycle($user)->create()` reuses same parent for all 10
- [ ] Collection recycle distributes across all members round-robin
- [ ] Global graph recycle applies to nested `has()`, `for()`, `hasAttached()`
- [ ] Recycle does not persist between separate factory calls
- [ ] Recycled model is not re-created (verified via query count)
- [ ] Query count with recycle < query count without recycle
- [ ] Round-robin distribution is balanced (or within 1)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization