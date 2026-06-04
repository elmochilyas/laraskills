# Value Object Fundamentals — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Value Object Fundamentals |
| Focus | Anti-patterns in value object design and integration |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Mutable Value Object With Non-Readonly Properties | Design | Critical |
| 2 | Value Object Without Constructor Validation | Reliability | High |
| 3 | No Equality Comparison on Value Object | Design | Medium |
| 4 | Manual Serialization Instead of Custom Cast | Code Organization | High |
| 5 | Setters on Value Objects (Violating Immutability) | Design | High |

## Repository-Wide Cross-Cutting Patterns

- Value objects without constructor validation are the most common source of invalid domain state — the value object becomes a passive data container
- Missing `readonly` properties create mutable objects that lose value semantics and cause shared-reference bugs
- Manual serialization/deserialization of value objects in controllers is a recurring pattern that scatters conversion logic

---

## 1. Mutable Value Object With Non-Readonly Properties

### Category
Design

### Description
A value object class with mutable properties (no `readonly` keyword) that can be changed after construction. This breaks the immutability contract of value objects, allowing accidental mutation through shared references.

### Why It Happens
Legacy PHP code written before PHP 8.1's `readonly` keyword. Developers may not be familiar with value object immutability principles. The class was originally a simple data container and evolved into a value object without refactoring.

### Warning Signs
- Value object properties declared as `public` without `readonly`
- Setter methods on the value object class
- `$valueObject->property = newValue;` assignments in application code
- Value object used as a mutable state holder in services
- Two references to the same value object producing different values after one is mutated
- No `__clone` or defensive copy patterns

### Why Harmful
- Value objects lose their guarantee of representing the same value — mutation changes their identity
- Shared references cause subtle bugs: modifying a value object in one place affects all references
- The value object cannot be safely reused across multiple contexts
- Defensive copying is required everywhere to prevent accidental mutation
- The immutability principle that makes value objects reliable is destroyed

### Consequences
- Shared-reference bugs where changing a value object in one place affects unrelated code
- Business logic that depends on value object state becomes unreliable
- Increased defensive copying overhead to prevent accidental mutation
- Difficulty reasoning about code behavior: value objects may change unexpectedly
- Loss of value semantics: two instances with the same initial properties may differ later

### Preferred Alternative
```php
class Money
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}
}
```

### Refactoring Strategy
1. Identify value object classes with mutable properties
2. Add `readonly` to all properties (PHP 8.1+)
3. Find all places where properties are modified after construction (will cause compile errors)
4. Replace mutations with `with*()` methods that return new instances
5. Update callers to use the new instances instead of mutating in place

### Detection Checklist
- [ ] Search for value object classes with `public` properties lacking `readonly`
- [ ] Check for `$obj->property =` assignments targeting value object instances
- [ ] Verify constructor assigns all properties (not set via setters)
- [ ] Check for `__set` magic methods that allow mutation
- [ ] Test shared reference scenarios: assign VO to two variables, modify one, check the other

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Make Value Objects Immutable With readonly Properties |
| Skill | `06-skills.md` — Create an Immutable Value Object |
| Knowledge | `04-standardized-knowledge.md` — Immutability |

---

## 2. Value Object Without Constructor Validation

### Category
Reliability

### Description
A value object that accepts any value in its constructor without validation. Invalid state can be created and flow through the application until it reaches the persistence layer, where a database constraint may (or may not) catch it.

### Why It Happens
The value object may have started as a simple typed wrapper. Developers may not recognize the validation opportunity or may be deferring it. The class is treated as a data transfer object rather than a domain primitive with invariants.

### Warning Signs
- Empty constructor body: `public function __construct(public readonly string $value) {}`
- No `if`, `assert`, or `throw` in the constructor
- Invalid values accepted and propagated until a database error occurs
- Validation scattered across controllers and services instead of in the value object
- The value object class contains only getters and no domain logic
- Try/catch blocks around value object construction that should be unnecessary

### Why Harmful
- Invalid data can enter the system and travel through multiple layers before detection
- The value object is a passive container, not a domain guard
- Every consumer of the value object must validate it themselves
- Database constraints become the only validation boundary, which may not cover all cases
- The value object's contract is unenforced — callers can pass any value

### Consequences
- Database constraint violations from invalid value objects
- Invalid state propagated to views, APIs, and external systems
- Validation logic duplicated across every point where the value object is created
- Late failure: errors discovered at persistence time instead of creation time
- Harder to reason about the value object's valid states

### Preferred Alternative
```php
class Email
{
    public function __construct(public readonly string $address)
    {
        if (! filter_var($address, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: {$address}");
        }
    }
}
```

### Refactoring Strategy
1. Identify value objects without constructor validation
2. Add validation in the constructor for all invariants (format, range, length)
3. Throw `\InvalidArgumentException` or a domain-specific exception for invalid values
4. Remove validation logic from callers (controllers, services) that duplicate the constructor check
5. Add tests that verify invalid values throw at construction

### Detection Checklist
- [ ] Check value object constructors for validation logic
- [ ] Search for validation patterns around value object creation in controllers/services
- [ ] Try creating the value object with obviously invalid values — does it throw?
- [ ] Check for domain invariants documented elsewhere that aren't enforced in the constructor
- [ ] Review database constraints — are they catching invalid values that the VO should catch?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Self-Validate in the Constructor |
| Skill | `06-skills.md` — Create an Immutable Value Object |
| Knowledge | `04-standardized-knowledge.md` — Self-validation |

---

## 3. No Equality Comparison on Value Object

### Category
Design

### Description
A value object class without an `equals()` method. Callers must compare individual properties using `===`, leading to verbose comparisons that miss properties when they're added.

### Why It Happens
The value object seems simple enough that property-by-property comparison suffices. Developers may not plan for the value object to be compared in business logic. The `equals()` method is seen as optional "nice-to-have" rather than a core requirement.

### Warning Signs
- Code that compares value objects with `$vo1->prop === $vo2->prop` repeated
- No `equals()` or `isEqual()` method on the value object class
- `===` used directly on value objects (reference comparison, which always fails for different instances)
- Test assertions that compare individual properties instead of using `assertTrue($vo1->equals($vo2))`
- Comparison logic duplicated wherever value objects are compared
- New properties added to the value object but manually added comparisons are missed

### Why Harmful
- Reference equality (`===`) always returns `false` for two separately-constructed instances with the same values
- Callers must know and compare every property, coupling them to implementation details
- Adding a new property requires updating every comparison site
- Business logic that depends on equality (deduplication, caching, set operations) is unreliable
- Test assertions that compare individual properties are fragile

### Consequences
- Duplicated comparison logic across the codebase
- Equality bugs when new properties are added but comparison sites aren't updated
- Caching and deduplication logic that doesn't work correctly
- Business rules based on value comparison that fail silently
- Tests that miss equality edge cases

### Preferred Alternative
```php
class Email
{
    public function equals(self $other): bool
    {
        return $this->address === $other->address;
    }
}
```

### Refactoring Strategy
1. Identify value objects without `equals()` methods
2. Add an `equals()` method that compares all properties
3. Find all comparison sites that use `===` or property-by-property comparison
4. Replace with `$vo1->equals($vo2)` or a centralized comparison helper
5. Add tests for equality: same values → equal; different values → not equal

### Detection Checklist
- [ ] Search for `function equals` in value object classes
- [ ] Check for `===` used between value object instances in business logic
- [ ] Review caching and deduplication code that handles value objects
- [ ] Test `new Email('a@b.com') === new Email('a@b.com')` — should ideally be compared by value
- [ ] Look for property-by-property comparison patterns in controllers/services

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Implement Equality Comparison |
| Skill | `06-skills.md` — Create an Immutable Value Object |
| Knowledge | `04-standardized-knowledge.md` — Equality |

---

## 4. Manual Serialization Instead of Custom Cast

### Category
Code Organization

### Description
Manually serializing and deserializing value objects in controllers, actions, or services instead of using a custom Eloquent cast. The cast is not defined, so every persistence operation must manually convert between value objects and database format.

### Why It Happens
The value object may predate the custom cast pattern in the project. Developers may not know about Eloquent's custom cast system. The manual approach works and seems simpler than creating a new cast class. The value object is only used in a few places, so the duplication seems tolerable.

### Warning Signs
- `$user->email = serialize(new Email($request->input('email')));` in controllers
- `unserialize($user->email)->address` when reading attribute values
- The same serialize/deserialize pattern repeated in multiple controllers
- No `$casts` entry for the attribute, but the value object class exists
- Helper functions or traits for manual serialization of value objects
- Inconsistent serialization: some places use `serialize()`, others use `json_encode()`

### Why Harmful
- Serialization logic scattered across controllers, actions, and commands
- Every persistence path must remember to serialize; every read path must deserialize
- The value object's constructor validation is bypassed if deserialization is forgotten
- Changing the storage format requires updating every serialization/deserialization site
- The encapsulation that value objects provide is broken at the system boundary

### Consequences
- Duplicated serialization code across the codebase
- Some code paths may forget to serialize, storing raw value objects in the database
- Inconsistent deserialization: some paths may return value objects, others return raw data
- Higher maintenance cost for storage format changes
- The model's attribute behavior is not transparent — callers must know about serialization

### Preferred Alternative
```php
// Custom cast handles all serialization
class EmailCast implements CastsAttributes
{
    public function get(...): ?Email
    {
        return $value === null ? null : new Email($value);
    }

    public function set(...): array
    {
        return [$key => (string) $value];
    }
}

// Model usage
protected $casts = [
    'email' => EmailCast::class,
];
```

### Refactoring Strategy
1. Identify manual serialize/deserialize patterns in controllers and services
2. Create a custom cast class implementing `CastsAttributes`
3. Register the cast in the model's `$casts` array
4. Remove manual serialization from controllers and services
5. Simplify attribute access: `$user->email` now returns the value object directly

### Detection Checklist
- [ ] Search for `serialize(`, `unserialize(`, `json_encode(`, `json_decode(` near model attribute access
- [ ] Check if value object attributes have a corresponding `$casts` entry
- [ ] Look for helper methods that serialize/deserialize value objects for persistence
- [ ] Test `$model->attribute` return type — is it a value object or raw data?
- [ ] Review model access patterns in controllers: do they call serialization methods?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Integrate With Eloquent via Custom Casts |
| Skill | `06-skills.md` — Create an Immutable Value Object |
| Knowledge | `04-standardized-knowledge.md` — Cast integration |

---

## 5. Setters on Value Objects (Violating Immutability)

### Category
Design

### Description
Defining setter methods on a value object class that modify its state after construction. This contradicts the immutability principle, allowing in-place modification that bypasses constructor validation and breaks value semantics.

### Why It Happens
Developers accustomed to mutable DTOs or ORM entities may naturally add setters. The class may have been originally designed as a mutable data container and later rebranded as a value object. Convenience: a setter seems easier than creating a new instance for each modification.

### Warning Signs
- `set*()` methods defined on the value object class
- `public function setName(string $name): void` — setter with void return
- Value object properties that are both `readonly` and have setters (inconsistent API)
- Application code that calls `$address->setCity('New York')` on a value object
- The value object class has both `readonly` properties and `public` setter methods
- Mutations that require `$valueObject = $valueObject->withX()` workaround but setters also exist

### Why Harmful
- Setters contradict the immutability principle — the value object is no longer immutable
- In-place modification bypasses constructor validation (setter may not validate as strictly)
- Shared references become dangerous: modifying one copy affects all references
- The API is inconsistent: some modifications are immutable (`with*()`), others are mutable (setters)
- Callers cannot rely on the value object representing the same value throughout its lifetime

### Consequences
- Shared-reference bugs from in-place mutation
- Bypassed validation in setter methods that don't validate as strictly as the constructor
- Inconsistent API: `with*()` returns new instance, but `set*()` mutates in place
- Harder to reason about value object state at any point in the request lifecycle
- Defensive copying required when passing value objects to other methods

### Preferred Alternative
```php
// No setters — use with*() methods for modified copies
class Address
{
    public function __construct(
        public readonly string $street,
        public readonly string $city,
    ) {}

    public function withCity(string $city): self
    {
        return new self($this->street, $city);
    }
}
```

### Refactoring Strategy
1. Identify setter methods on value object classes
2. Replace each setter with a `with*()` method that returns a new instance
3. Update callers from `$vo->setX($val)` to `$vo = $vo->withX($val)`
4. Ensure `with*()` methods validate input (or pass through constructor validation)
5. Remove the setter methods

### Detection Checklist
- [ ] Search for `function set\w+` in value object classes
- [ ] Check for property assignment patterns: `$vo->prop = $val`
- [ ] Look for `$this->prop = $value` outside the constructor in value object classes
- [ ] Verify `with*()` methods return new instances, not `$this`
- [ ] Review callers for mutation patterns that should be immutable

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Expose Setters on Value Objects |
| Skill | `06-skills.md` — Create an Immutable Value Object |
| Knowledge | `04-standardized-knowledge.md` — Immutability |
