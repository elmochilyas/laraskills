# Fluent Through Relationships — Decomposition

## Implementation Tasks

### 1. Verify Laravel version compatibility
- Check `Illuminate\Database\Eloquent\Relations\ThroughRelation` exists
- Add version constraint: `"php": ">=8.1", "laravel/framework": ">=10.0"`
- Document Laravel version requirement in codebase README

### 2. Define fluent through relationship on parent model
- Use `through(Intermediate::class)->has(Target::class)` for one-to-one
- Use `through(Intermediate::class)->hasMany(Target::class)` for one-to-many
- Use `through(A::class)->through(B::class)->hasMany(C::class)` for multi-hop
- Verify return type matches expected cardinality

### 3. Configure custom keys fluently
```php
public function avatar(): ThroughRelation
{
    return $this->through(Profile::class, 'user_id', 'id')
                ->has(Avatar::class, 'profile_id', 'id');
}
```
- Keys are scoped to each `through()` / `has()` call

### 4. Add eager loading support
- `protected $with = ['avatar'];` works the same as traditional
- Verify `User::with('avatar')->get()` produces correct join query

### 5. Document the chain with DocBlocks
- Add `@return ThroughRelation` on the method
- Add inline comments describing each hop
- Note read-only nature of through relationships

### 6. Add existence scopes
- `scopeHasChain($query)` using `has('avatar')`
- Works identically to traditional through relationships

### 7. Write feature tests
- Test fluent one-to-one: `through(A)->has(B)`
- Test fluent one-to-many: `through(A)->hasMany(B)`
- Test fluent multi-hop: `through(A)->through(B)->hasMany(C)`
- Test custom keys with fluent syntax
- Test eager loading produces correct join query
- Test `has()` existence query works
- Test exception on `has()` without `through()`
- Test return type: model vs collection
- Test error on `->create()` call

### 8. Compare SQL output with traditional syntax
- Assert fluent chain generates identical SQL to traditional
- Write test: `$user->avatar()->toSql()` matches `$user->traditionalAvatar()->toSql()`

### 9. Add fallback for older Laravel versions (optional)
- If codebase supports Laravel 9, provide alternative using traditional syntax
- Add version check: `if (method_exists(HasOne::class, 'through'))`

### 10. Implement complex chain with mixed cardinality
- Hop 1: `HasMany` from parent to intermediate
- Hop 2: `HasOne` from intermediate to second intermediate
- Hop 3: `HasMany` from second intermediate to target
- Test that the chain produces expected results

## Validation Criteria
- [ ] Fluent syntax produces identical SQL to traditional syntax
- [ ] `through(A)->has(B)` returns single model
- [ ] `through(A)->hasMany(B)` returns collection
- [ ] Multi-hop chain works with 3+ intermediates
- [ ] Custom keys positionally scoped per hop
- [ ] Eager loading produces correct joins
- [ ] Exception thrown if `has()` called without `through()`
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization