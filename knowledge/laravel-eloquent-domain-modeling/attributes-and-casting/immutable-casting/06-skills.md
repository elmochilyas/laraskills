# Immutable Casting — Skills

---

## Skill 1: Implement an Immutable Custom Cast

### Purpose
Create a custom cast that returns an immutable value (never mutated in-place) by creating a new instance on each attribute read or returning a value object with defensive copies.

### When To Use
- The cast returns arrays, collections, or value objects that should not be mutated
- You want to prevent accidental in-place modification of model attributes
- The attribute is read multiple times and each consumer needs an independent copy

### When NOT To Use
- Performance is critical and creating copies on each read is too expensive
- The consumer explicitly expects to mutate the attribute (legacy code)
- You're casting to simple scalar types (int, bool, string) — already immutable

### Prerequisites
- Custom cast class implementing `CastsAttributes`

### Inputs
- The attribute to protect from mutation
- The type to return (collection, value object, array)

### Workflow

1. **In the `get()` method**, return a new instance or a clone on every read:
   ```php
   public function get(Model $model, string $key, mixed $value, array $attributes): array
   {
       $decoded = json_decode($value ?: '[]', true);
       return $decoded; // PHP arrays copy-on-write — effectively immutable
   }
   ```

2. **For value objects**, ensure the object is immutable (all `readonly` properties):
   ```php
   public function get(Mode $model, string $key, mixed $value, array $attributes): ContactInfo
   {
       $data = json_decode($value ?: '{}', true);
       return new ContactInfo(
           email: $data['email'] ?? '',
           phone: $data['phone'] ?? '',
       );
   }
   ```

3. **For mutable objects**, return a defensive copy: `clone $this->original`

4. **Document the immutability contract** in the cast class docblock

5. **Test that mutation doesn't persist** — modify the returned value and assert it doesn't affect the model

### Validation Checklist

- [ ] `get()` returns a new instance on each call (not a cached mutable reference)
- [ ] Value objects used are truly immutable or have `readonly` properties
- [ ] Arrays are returned fresh (not a reference to a mutable property)
- [ ] Immutability behavior is documented in the cast class
- [ ] Test confirms mutation of returned value doesn't affect model state

### Related Rules

| Rule | Reference |
|---|---|
| Return new instances from get() for mutable types | `05-rules.md` Rule 1 |
| Use readonly value objects where possible | `05-rules.md` Rule 2 |
| Clone mutable objects before returning | `05-rules.md` Rule 3 |
| Document the immutability contract | `05-rules.md` Rule 4 |
| Test that mutations don't persist | `05-rules.md` Rule 5 |

### Success Criteria
- Each call to the cast attribute returns an independent instance
- Mutating the returned value does not change the model's internal state
- Immutability behavior is documented in the cast class
- Performance impact of repeated allocation is acceptable (profile if needed)
