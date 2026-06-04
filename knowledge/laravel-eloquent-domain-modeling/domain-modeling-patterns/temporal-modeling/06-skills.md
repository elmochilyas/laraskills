# Temporal Modeling — Skills

---

## Skill 1: Implement Temporal Versioning on a Model

### Purpose
Track historical state changes of an Eloquent model over time by implementing event sourcing, versioned snapshots, or temporal columns, enabling point-in-time queries and audit trails.

### When To Use
- You need to query or reconstruct past states of a model
- Regulatory requirements demand an audit trail of changes
- The model's state over time is domain-relevant (contract, policy, invoice)

### When NOT To Use
- Only the current state matters (standard CRUD suffices)
- Audit logging via a separate log table is sufficient
- Temporal modeling would add unacceptable complexity

### Prerequisites
- Understanding of the versioning approach (event sourcing, snapshots, temporal columns)
- Database schema that supports the chosen approach

### Inputs
- Model to version
- Temporal columns or events schema
- Versioning strategy (event sourcing, snapshot, SCU)

### Workflow

1. **Choose a versioning approach**:
   - **SCU (Slowly Changing Dimension) Type 2** — `valid_from` / `valid_to` columns per row
   - **Event sourcing** — store events, reconstruct state
   - **Snapshot versioning** — store versioned snapshots of the model

2. **For SCU Type 2**, add temporal columns to the table and duplicate on change:
   ```php
   class Contract extends Model
   {
       public function createVersion(): void
       {
           $this->valid_to = now();
           $this->save();
   
           $next = $this->replicate(['valid_from', 'valid_to']);
           $next->valid_from = now();
           $next->valid_to = null;
           $next->save();
       }
   }
   ```

3. **For event sourcing**, dispatch events on each state change and store in an `events` table

4. **Add query scopes** to retrieve state at a point in time:
   ```php
   public function scopeAsOf(Builder $query, Carbon $pointInTime): void
   {
       $query->where('valid_from', '<=', $pointInTime)
             ->where(fn ($q) => $q->whereNull('valid_to')->orWhere('valid_to', '>', $pointInTime));
   }
   ```

5. **Test temporal queries** — assert correct state is returned for different points in time

### Validation Checklist

- [ ] Versioning approach is selected based on requirements
- [ ] Temporal columns or events table exists in the schema
- [ ] Versioning logic is invoked on state changes (model events, explicit calls)
- [ ] Point-in-time query scope returns correct state
- [ ] Tests cover current-state and historical-state queries
- [ ] Performance of temporal queries is acceptable (index temporal columns)

### Related Rules

| Rule | Reference |
|---|---|
| Choose temporal approach by requirements | `05-rules.md` Rule 1 |
| Version on meaningful state changes | `05-rules.md` Rule 2 |
| Add point-in-time query scopes | `05-rules.md` Rule 3 |
| Test temporal queries | `05-rules.md` Rule 4 |
| Index temporal columns for performance | `05-rules.md` Rule 5 |

### Success Criteria
- Temporal versioning captures state changes over time
- Point-in-time queries return correct historical state
- Versioning logic triggers on all state-modifying operations
- Performance of temporal queries is acceptable with proper indexing
