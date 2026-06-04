# Runtime Casting — Skills

---

## Skill 1: Override a Cast at Runtime With withCasts

### Purpose
Use `withCasts()` on a query builder or `mergeCasts()` on a model instance to temporarily apply different cast behavior for a specific operation without modifying the model's class definition.

### When To Use
- You need a different cast for a specific query (e.g., different date format for a report)
- You're working with legacy data that needs different casting than new data
- You want to temporarily disable or modify a cast for a bulk operation

### When NOT To Use
- The cast change should apply globally (modify the model's `$casts`)
- You need runtime casting in multiple places (it's an ad-hoc tool, not a design pattern)

### Prerequisites
- Model with existing casts defined
- Understanding of the cast you're overriding

### Inputs
- Attribute name
- Override cast type
- Model instance or query builder

### Workflow

1. **Use `withCasts()` for query-level** changes on a builder:
   ```php
   User::withCasts(['email_verified_at' => 'datetime:Y-m-d'])
       ->where('is_active', true)
       ->get();
   ```

2. **Use `mergeCasts()` for instance-level** changes on a loaded model:
   ```php
   $user = User::find(1);
   $user->mergeCasts(['metadata' => 'array']);
   ```

3. **Document why the runtime cast is needed** — it's invisible in the model definition

4. **Keep the override scoped** to the specific operation — don't apply broadly

5. **If the same override is needed repeatedly**, update the model's global casts instead

### Validation Checklist
- [ ] Runtime cast usage is documented in code
- [ ] `withCasts()` is used for query-level cast changes
- [ ] `mergeCasts()` is used for instance-level cast changes
- [ ] Global model definition remains unchanged

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Cast override forgotten | `mergeCasts()` not called before access | Apply immediately before use |
| Global model polluted | Same override repeated in many places | Update model's `casts()` method |
| Unexpected behavior | Broad runtime cast affecting unrelated code | Scope to specific operation |

### Decision Points
- **Query-level change?** → Use `withCasts()` on the query builder
- **Instance-level change?** → Use `mergeCasts()` on the model
- **Recurring pattern?** → Update model's global cast definition

### Performance Considerations
- Runtime casting adds no measurable overhead
- Instance-level casts affect only one object instance

### Related Rules
| Rule | Reference |
|---|---|
| Use `withCasts` for query-level cast changes | `05-rules.md` |
| Use `mergeCasts` for instance-level cast changes | `05-rules.md` |
| Document runtime cast usage clearly | `05-rules.md` |
| Do not use runtime casting as global configuration substitute | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Configure Primitive Casts for Type Safety | Cast types you can override |
| Configure Immutable Date/Time Casting | Common runtime override target |
| Define a Cached Accessor | Alternative per-instance customization |

### Success Criteria
- Runtime cast applies only to the specified query or instance
- Global model cast definition remains unchanged
- Runtime cast usage is documented explaining why it's needed
- No duplicated runtime cast patterns (extracted to model when recurring)
