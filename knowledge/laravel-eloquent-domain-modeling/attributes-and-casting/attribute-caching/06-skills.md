# Attribute Caching — Skills

---

## Skill 1: Add `shouldCache` to an Accessor

### Purpose
Enable per-instance caching on an accessor to eliminate redundant computation when the attribute is read multiple times per request.

### When To Use
- Accessor does expensive computation (string formatting, JSON decoding, relationship counting)
- Accessor is accessed multiple times (Blade layout + content + metadata)
- The value is deterministic for the model instance's lifetime

### When NOT To Use
- Accessor should return different values on each read (current time, random values)
- Accessor depends on mutable model state that changes between reads
- The accessor is trivial (simple typecast, null coalesce) — caching adds overhead

### Prerequisites
- Accessor defined via `Attribute::make()` (not legacy syntax)
- Understanding of the model's attribute lifecycle

### Inputs
- The accessor method to cache
- Confirmation that the value is deterministic per instance

### Workflow

1. **Identify frequently-accessed accessors** — profile or audit Blade views, serialization, API resources

2. **Add `shouldCache: true`** to the `Attribute::make()` call:
   ```php
   protected function summary(): Attribute
   {
       return Attribute::make(
           get: fn ($value) => implode(', ', $this->relatedItems()->pluck('name')->toArray()),
           shouldCache: true
       );
   }
   ```

3. **Verify the accessor is deterministic** — same value every read for a given model state

4. **Ensure no mutable dependencies** — the accessor should not depend on relationships that may be lazy-loaded later

5. **Test** — access the attribute multiple times in a test and assert the value is consistent

### Validation Checklist

- [ ] Accessor uses `Attribute::make(get: ..., shouldCache: true)` syntax
- [ ] Accessor is deterministic (same value for same model state)
- [ ] Accessor does not depend on mutable external state
- [ ] Profiling confirms caching improves performance
- [ ] Legacy accessors are migrated to `Attribute::make()` to enable caching

### Related Rules

| Rule | Reference |
|---|---|
| Use `shouldCache` for expensive or frequently-accessed accessors | `05-rules.md` Rule 1 |
| Do not cache accessors dependent on mutable state | `05-rules.md` Rule 2 |
| Profile before adding `shouldCache` | `05-rules.md` Rule 3 |
| Migrate legacy accessors to enable caching | `05-rules.md` Rule 4 |
| Do not use `shouldCache` for non-deterministic accessors | `05-rules.md` Rule 5 |

### Success Criteria
- Expensive accessors are cached with `shouldCache: true`
- Cache invalidation works correctly (attribute change clears cache)
- No stale values returned from cached accessors
- Performance improvement confirmed by profiling (if measurable)
