# Value Object Fundamentals — Skills

---

## Skill 1: Create an Immutable Value Object

### Purpose
Define a value object class with `readonly` properties, constructor validation, and value equality, representing a domain concept as a typed, immutable value.

### When To Use
- A domain concept has specific constraints and behavior (Email, Money, PhoneNumber)
- The same concept appears in multiple places (models, controllers, form requests)
- You want to eliminate primitive obsession (string $email, int $cents)

### When NOT To Use
- The value is a simple scalar with no domain rules or behavior
- The concept appears only once and is not shared
- Persistence requirements are simpler than a value object warrants

### Prerequisites
- Understanding of the concept's invariants (valid states, formats)

### Inputs
- Value name (Email, Money, SSN)
- Validation rules (length, format, range)
- Possible scalar representation (string, int, float)

### Workflow

1. **Define the class with `readonly` properties**:
   ```php
   class Email
   {
       public function __construct(
           public readonly string $value,
       ) {
           if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
               throw new InvalidArgumentException("Invalid email: $value");
           }
       }
   ```

2. **Validate in the constructor** — fail fast on invalid values

3. **Implement value equality** via `equals()` or `__equals()`:
   ```php
   public function equals(Email $other): bool
   {
       return $this->value === $other->value;
   }
   ```

4. **Add domain methods** rather than getter-only:
   ```php
   public function domain(): string
   {
       return substr($this->value, strpos($this->value, '@') + 1);
   }
   ```

5. **Do not extend Eloquent** value objects are plain PHP classes

6. **Do not include persistence concerns** in the value object

7. **Return new instances from methods** that modify internal state

### Validation Checklist

- [ ] Class has `readonly` properties (or is otherwise immutable)
- [ ] Constructor validates invariants and throws on invalid input
- [ ] Value equality is implemented (`equals()` method)
- [ ] No `__set`, `__get`, or mutable internal methods
- [ ] No Eloquent inheritance or persistence concerns
- [ ] Domain methods are present (not just getters)
- [ ] Used with a custom cast for model integration

### Related Rules

| Rule | Reference |
|---|---|
| Make value objects immutable (readonly) | `05-rules.md` Rule 1 |
| Validate in the constructor | `05-rules.md` Rule 2 |
| Implement value equality | `05-rules.md` Rule 3 |
| Add domain methods, not just getters | `05-rules.md` Rule 4 |
| Do not extend Eloquent | `05-rules.md` Rule 5 |

### Success Criteria
- Value object is immutable (no mutable properties)
- Invalid values throw at construction (not at persistence)
- Equality comparison works by value, not by reference
- Domain methods enable behavior on the value
- Value object integrates with Eloquent via a custom cast
