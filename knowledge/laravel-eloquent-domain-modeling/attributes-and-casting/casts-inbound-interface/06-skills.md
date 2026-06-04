# CastsInboundAttributes Interface — Skills

---

## Skill 1: Implement a Write-Only Cast

### Purpose
Create a write-only cast using `CastsInboundAttributes` that transforms values only on assignment, leaving the stored value as-is on read.

### When To Use
- You need to transform or normalize data only on write (hashing, encoding, encrypting)
- The stored format is already the correct PHP representation on read
- Read-time formatting is handled by accessors or API resources

### When NOT To Use
- You need bidirectional transformation (use `CastsAttributes`)
- You only need read-only transformation (use an accessor)
- The stored value needs transformation on read as well

### Prerequisites
- Understanding of `CastsInboundAttributes` interface
- Clear distinction between write-only and bidirectional needs

### Inputs
- Attribute to transform on write
- Normalization logic (hashing, trimming, encoding)

### Workflow

1. **Create the cast class** implementing `CastsInboundAttributes` in `App\Casts\`

2. **Implement only `set()`** — no `get()` method:
   ```php
   class HashedCast implements CastsInboundAttributes
   {
       public function set(Model $model, string $key, mixed $value, array $attributes): array
       {
           return [$key => bcrypt($value)];
       }
   }
   ```

3. **Return an associative array** with `[$key => $value]`

4. **Document the one-directional nature** — add a docblock explaining no read transformation occurs

5. **Pair with an accessor** if the raw stored value needs display formatting on read

6. **Register** the same way as `CastsAttributes`: `$casts = ['attribute' => HashedCast::class]`

### Validation Checklist

- [ ] Only `set()` method is implemented (no `get()`)
- [ ] `set()` returns an associative array with column keys
- [ ] One-directional nature is documented in the class docblock
- [ ] Accessor exists for read-side formatting (if needed)
- [ ] Raw database value is the correct PHP representation on read

### Related Rules

| Rule | Reference |
|---|---|
| Use for write-only normalization only | `05-rules.md` Rule 1 |
| Return array of key-value pairs from set | `05-rules.md` Rule 2 |
| Combine with accessors for read formatting | `05-rules.md` Rule 3 |
| Document the one-directional nature | `05-rules.md` Rule 4 |
| Do not implement `get()` with this interface | `05-rules.md` Rule 5 |

### Success Criteria
- Write-only cast hashes/encodes/normalizes on assignment
- Read returns the stored raw value without transformation
- Docblock explains no read-side transformation occurs
- Accessor (if paired) handles display formatting on read
