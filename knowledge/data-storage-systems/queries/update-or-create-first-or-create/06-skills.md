# Skill: Use FirstOrCreate and UpdateOrCreate Semantics

## Purpose

Use `firstOrCreate` (find or create and persist), `firstOrNew` (find or create unsaved instance), and `updateOrCreate` (find or update or create) for convenient find-or-create semantics — understanding they perform two operations (SELECT + INSERT) and are not atomic without a transaction.

## When To Use

- Reference/lookup data (countries, categories, statuses)
- Creating records with associated data
- Simple find-or-create flows in non-concurrent contexts

## When NOT To Use

- Concurrent/high-traffic creation paths (use upsert or transactions)
- Batch operations (use upsert instead of loops)
- Write-heavy operations needing atomicity

## Prerequisites

- Understanding that these methods are not atomic
- Knowledge of race condition risk in concurrent environments

## Inputs

- Attributes to search by
- Additional attributes for creation/update
- Transaction scope (if atomicity is needed)

## Workflow

1. Use `Model::firstOrCreate(['email' => $email], ['name' => $name])` for find-or-create
2. Use `Model::firstOrNew(['email' => $email], ['name' => $name])` for unsaved instance
3. Use `Model::updateOrCreate(['email' => $email], ['name' => $newName])` for conditional update
4. Wrap in a database transaction for concurrent safety

## Validation Checklist

- [ ] Race condition risk is assessed for concurrent access
- [ ] Transaction wrapping used when atomicity is critical
- [ ] Batch operations use upsert instead of firstOrCreate in loops
- [ ] firstOrNew instance is explicitly saved when ready

## Common Failures

### Race condition with firstOrCreate
Two requests simultaneously execute `firstOrCreate`. Both SELECT returns null. Both INSERT. Second INSERT violates unique constraint. Wrap in transaction or use upsert.

### Using firstOrCreate in a loop
`foreach ($items as $item) { Model::firstOrCreate(...) }` — N+1 pattern at the database level. Use upsert for batch operations.

## Decision Points

### firstOrCreate vs updateOrCreate?
firstOrCreate only creates if not found. updateOrCreate updates if found, creates if not. Choose based on whether existing records should be updated.

### firstOrCreate vs upsert?
firstOrCreate for single-row, non-concurrent operations. Upsert for batch, concurrent, or atomic operations.

## Performance Considerations

Each firstOrCreate call is two queries (SELECT + INSERT). In loops, this becomes N*2 queries. Use upsert for batch operations.

## Security Considerations

Attributes passed to firstOrCreate are mass-assigned. Ensure $fillable is configured. The method respects mass-assignment protection.

## Related Rules

- Wrap firstOrCreate in transactions for concurrent safety
- Use upsert for batch operations, not firstOrCreate loops
- Mass-assignment protection applies to these methods

## Related Skills

- Perform Atomic Upsert Operations
- Use Insert Or Ignore for Conditional Inserts
- Clone and Mass-Assign Models Safely

## Success Criteria

- firstOrCreate used appropriately for non-concurrent single-row operations
- Batch operations use upsert instead of loops
- Race condition risk is mitigated with transactions
- Mass-assignment protection is properly configured
