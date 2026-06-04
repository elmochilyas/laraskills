# HasOneOfMany Skills

## Skill: Configure HasOneOfMany with composite indexing

### Purpose
Define a `HasOneOfMany` relationship that retrieves the "best" (latest, highest, oldest) record from a one-to-many set, with proper composite indexing for subquery performance.

### When To Use
- Latest login per user, most recent order per customer, highest score per player
- Any scenario where you need the "best" record from a has-many collection
- Eager-loadable alternative to `$user->logins()->latest()->first()` (N+1 generator)

### When NOT To Use
- When the relationship is truly one-to-one with a unique constraint (use `HasOne`)
- When you need to write/create through the relationship (it's read-only)
- On `BelongsToMany` or polymorphic relationships (not supported)
- When you need all child records (use `HasMany`)

### Prerequisites
- Parent model with `HasMany` relationship to child
- Child table with foreign key and ordering column

### Inputs
- Base `HasMany` relationship (for writes)
- `HasOneOfMany` variant: `latestOfMany()`, `oldestOfMany()`, or `ofMany('column', 'max|min')`
- Composite index definition for `(foreign_key, ordering_column)`

### Workflow
1. Keep a separate base `HasMany` relationship for writes: `public function logins(): HasMany { return $this->hasMany(Login::class); }`
2. Define the `HasOneOfMany` with a descriptive name: `public function latestLogin(): HasOne`
3. Use `return $this->hasOne(Login::class)->latestOfMany();`
4. For custom column aggregation: `->ofMany('score', 'max')` or `->ofMany('score', 'min')`
5. For composite ordering with tiebreakers: `->ofMany(['score' => 'max', 'created_at' => 'max'])`
6. Add a composite index on `(foreign_key, ordering_column)` in the child migration
7. Document the read-only constraint in the method DocBlock

### Validation Checklist
- [ ] Base `HasMany` relationship is defined separately for writes
- [ ] `HasOneOfMany` relationship has a descriptive name (latestLogin, bestScore)
- [ ] Composite index exists on `(foreign_key, ordering_column)`
- [ ] Tiebreaker columns are specified when ordering values can be duplicated
- [ ] Read-only constraint is documented
- [ ] `Parent::with('latestLogin')->get()` executes 1 query with subquery join
- [ ] `$parent->latestLogin` returns a single model or null

### Common Failures
- Using `HasOneOfMany` without a base `HasMany` — can't create children
- Missing composite index — correlated subquery performs full scan per parent row
- Non-deterministic results without tiebreaker columns
- Applying `HasOneOfMany` to `BelongsToMany` — throws exception
- Using for truly one-to-one relationships — unnecessary subquery overhead

### Decision Points
- **latestOfMany vs ofMany?** — Use `latestOfMany()` for `created_at DESC`; use `ofMany()` for custom columns and aggregation direction
- **Single column or composite?** — Use composite `ofMany()` with tiebreaker columns when the primary ordering column can have duplicate values

### Performance Considerations
- Uses a correlated subquery join — more expensive than simple `HasOne` but correct for eager loading
- Composite index on `(foreign_key, ordering_column)` is essential
- Eager loading executes a single query with subquery join, not one per parent
- `has('latestLogin')` works but uses the same subquery join — adds overhead over simple exists check

### Security Considerations
- Read-only constraint means no write-security concerns through this relationship
- Null result when no children exist — guard downstream usage with nullsafe operators

### Related Rules
- [Keep-Base-HasMany-For-Writes](../has-one-of-many/05-rules.md)
- [Composite-Index-For-OfMany](../has-one-of-many/05-rules.md)
- [Tiebreaker-For-Determinism](../has-one-of-many/05-rules.md)
- [Document-ReadOnly-OfMany](../has-one-of-many/05-rules.md)
- [Name-OfMany-Descriptively](../has-one-of-many/05-rules.md)
- [Not-For-True-HasOne](../has-one-of-many/05-rules.md)

### Related Skills
- Name and document HasOneOfMany relationships descriptively

### Success Criteria
- `$parent->latestLogin` returns the single most recent child record
- `Parent::with('latestLogin')->get()` executes 1 query with subquery join
- Composite index is used in the subquery (verify via EXPLAIN)
- Results are deterministic with tiebreaker columns
- Children can be created through the base `HasMany` relationship
- Read-only constraint is documented and respected

---

## Skill: Name and document HasOneOfMany relationships descriptively

### Purpose
Choose descriptive names for `HasOneOfMany` relationships that clearly communicate cardinality, behavior, and read-only constraints.

### When To Use
- Defining `HasOneOfMany` relationships
- Reviewing existing relationship names for clarity
- Onboarding new developers to the codebase

### When NOT To Use
- Standard `HasMany` or `BelongsTo` relationships with conventional naming

### Prerequisites
- `HasOneOfMany` relationship defined with proper syntax and indexing

### Inputs
- Relationship name string
- Base `HasMany` relationship name
- Domain concept for the "best" record

### Workflow
1. Name the `HasOneOfMany` to reflect what it selects: `latestLogin`, `bestScore`, `highestBid`, `oldestSubscription`
2. Use adjectives or qualifiers that distinguish it from the base `HasMany`: `latestLogin` vs `logins`
3. Avoid generic names like `login` or `score` that could be confused with a true `HasOne`
4. Add a DocBlock documenting:
   - What the relationship returns (latest, highest, etc.)
   - Read-only constraint
   - Which base `HasMany` to use for writes
5. Add PHPDoc `@return` type hint with the correct return type (usually `HasOne` from the builder perspective)

### Validation Checklist
- [ ] Name clearly communicates cardinality (singular) and selection criterion (latest, best)
- [ ] Name is distinct from the base `HasMany` relationship
- [ ] DocBlock documents read-only constraint
- [ ] DocBlock mentions the base `HasMany` for writes
- [ ] `@return` type hint is accurate

### Common Failures
- Generic names that obscure the selection criterion (e.g., `login` vs `latestLogin`)
- Names that imply writability
- Missing DocBlock — developers discover read-only at runtime
- Names that collide with or shadow the base `HasMany`

### Decision Points
- **Descriptive name length?** — 2-3 word phrases (`latestLogin`, `bestScore`, `mostRecentOrder`) are ideal

### Performance Considerations
- None — naming doesn't affect performance

### Security Considerations
- Clear naming reduces the chance of developers accidentally misusing the relationship in security-sensitive contexts

### Related Rules
- [Name-OfMany-Descriptively](../has-one-of-many/05-rules.md)
- [Document-ReadOnly-OfMany](../has-one-of-many/05-rules.md)

### Related Skills
- Configure HasOneOfMany with composite indexing

### Success Criteria
- Relationship names clearly communicate cardinality and selection criterion
- Read-only constraint is documented and visible in DocBlocks
- Developers don't accidentally attempt writes on read-only relationships
