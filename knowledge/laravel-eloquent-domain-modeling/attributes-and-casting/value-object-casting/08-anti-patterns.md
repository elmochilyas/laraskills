# Value Object Casting — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Value Object Casting |
| Focus | Anti-patterns in value object cast implementation |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Null Handling in Value Object Casts | Reliability | Critical |
| 2 | Raw Scalar Rejection in set() | Design | High |
| 3 | Validation Logic in Cast Instead of Value Object | Design | Medium |
| 4 | get() Returning Plain Arrays Instead of Value Objects | Design | High |
| 5 | Castable Not Used for Multi-Model Value Objects | Code Organization | Medium |

## Repository-Wide Cross-Cutting Patterns

- Null handling is the most common omission in value object casts — nullable columns cause runtime crashes
- `set()` methods that only accept value objects force every call site to construct the object first
- Cast classes often duplicate validation logic that belongs in the value object's constructor

---

## 1. No Null Handling in Value Object Casts

### Category
Reliability

### Description
The `get()` and `set()` methods in a value object cast assume non-null values, crashing when nullable columns contain `NULL`. The value object constructor is typically called directly without checking for null, causing type errors.

### Why It Happens
Developers write the cast for the non-null path first and forget the null edge case. The column may not be nullable initially but becomes nullable later (schema migration). Null handling seems like boilerplate that can be skipped "for now."

### Warning Signs
- `new Email($value)` called directly in `get()` with no null check
- `return new Email($value)` with `$value` possibly null
- No `?` return type hint on `get()` (e.g., `: array` instead of `: ?array` or `: ?ValueObject`)
- Nullable columns in migration (`->nullable()`) but no null handling in the cast
- Runtime `TypeError: Argument #1 ($value) must be of type string, null given` from value object cast
- Factories or seeders that fail when inserting null values

### Why Harmful
- `TypeError` when nullable columns contain null — crashes the entire request
- Data import processes fail when encountering null values in otherwise-valid records
- API responses return 500 errors instead of null for nullable attributes
- Database migrations that add nullability break existing cast code
- Impossible to distinguish between "no value" and a valid empty value

### Consequences
- Runtime exceptions on any model with null in the cast column
- Data imports and migrations that touch null records fail
- Controllers must catch exceptions for nullable cast attributes
- Emergency hotfixes needed when null values are introduced by DB changes
- Factory and seeder failures during development

### Preferred Alternative
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Email
{
    return $value === null ? null : new Email($value);
}

public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value === null) {
        return [$key => null];
    }
    return [$key => (string) $value];
}
```

### Refactoring Strategy
1. Identify all custom cast `get()` methods that create value objects without null checks
2. Add null handling: return null from `get()`, accept null in `set()`
3. Update return type hints to include nullable (`?ValueObjectType`)
4. Add tests for null round-tripping (store null, read null)
5. Check all nullable columns in migrations and verify the corresponding cast handles null

### Detection Checklist
- [ ] Search for `function get(` in custom cast classes and check for null guard
- [ ] Cross-reference casts with nullable columns in migrations
- [ ] Test `$model->castAttribute = null; $model->save(); $model->refresh();` on nullable cast columns
- [ ] Check return type hints on `get()` for nullability (`?` prefix)
- [ ] Review exception logs for TypeError in cast get/set methods

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Handle Null Explicitly in Both get and set |
| Skill | `06-skills.md` — Cast an Attribute to a Value Object |
| Knowledge | `04-standardized-knowledge.md` — Null handling |

---

## 2. Raw Scalar Rejection in set()

### Category
Design

### Description
The `set()` method in a value object cast only accepts value object instances and crashes when a raw scalar (string, int, array) is assigned. This forces every call site to construct the value object before assignment.

### Why It Happens
Developers design the cast assuming it will always receive a value object instance. The cast is used in programmatic contexts where the value object is constructed first. Form request validation may provide raw scalars that bypass the value object constructor.

### Warning Signs
- `$value->toCents()` called directly without checking if `$value` is a `Money` instance
- No `instanceof` check in `set()` before calling value object methods
- `TypeError: Call to a member function toCents() on string` when assigning form input
- Controllers must always construct value objects: `$user->email = new Email($request->input('email'))`
- Factory definitions that manually construct value objects instead of using raw values
- Mass assignment that fails when raw values are passed from request input

### Why Harmful
- Every controller, action, and factory must construct the value object before assignment
- Mass assignment from `$request->validated()` fails because form input provides raw scalars
- API consumers cannot use POST/PUT with raw values — they must construct value objects (impossible from outside)
- Increased boilerplate at every call site
- The cast doesn't fulfill its role as a transparent boundary between storage and application

### Consequences
- Controllers with duplicated value object construction logic
- Mass assignment from form requests broken for cast attributes
- Factory definitions with manual value object construction
- API endpoints that require special handling for cast attributes
- Higher barrier to using the cast: every assignment must know about the value object

### Preferred Alternative
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value === null) {
        return [$key => null];
    }
    if ($value instanceof Money) {
        return [$key => $value->toCents()];
    }
    // Assume raw scalar — construct from primitive
    return [$key => (int) ($value * 100)];
}
```

### Refactoring Strategy
1. Identify `set()` methods that only handle value object instances
2. Add type checking for value objects and raw scalars
3. Add a conversion path for raw scalars (construct the value object or convert directly)
4. Update tests to verify both value object and raw scalar assignment
5. Remove manual value object construction from controllers and factories

### Detection Checklist
- [ ] Search for `function set(` in custom cast classes and check for `instanceof`
- [ ] Review controllers that construct value objects before model assignment
- [ ] Check factory definitions for value object construction
- [ ] Test mass assignment with raw values: `User::create(['email' => 'test@example.com'])`
- [ ] Test form request validation output directly assigned to cast attributes

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Accept Both Scalar and Value Object Instances in set |
| Skill | `06-skills.md` — Cast an Attribute to a Value Object |
| Decision Tree | `07-decision-trees.md` — Value Object Casting vs Accessor/Mutator Pair |

---

## 3. Validation Logic in Cast Instead of Value Object

### Category
Design

### Description
Duplicating validation logic in the cast's `get()` or `set()` methods that should reside in the value object's constructor. The cast validates input before passing it to the value object, creating two validation boundaries that must stay in sync.

### Why It Happens
Defensive programming: the cast validates to prevent invalid data from reaching the value object. The developer may not trust the value object's validation (or the value object may not validate at all). The cast exists at the persistence boundary, which seems like a natural validation point.

### Warning Signs
- `if (!filter_var($value, FILTER_VALIDATE_EMAIL))` in cast `get()` before calling `new Email($value)`
- Validation exceptions thrown from both the cast and the value object constructor
- The value object has weak or no validation, relying on the cast for enforcement
- Duplicated validation rules between cast and value object
- Cast that validates format but doesn't delegate to the value object afterward
- Tests that cover validation in both the cast and the value object

### Why Harmful
- Validation logic is duplicated — changes must be made in two places
- The value object's constructor validation becomes redundant, encouraging bypass
- If the value object is used outside of Eloquent (in a DTO or command), cast validation is bypassed entirely
- Single responsibility principle violated: cast handles serialization AND validation
- The cast becomes more complex than necessary, with multiple concerns

### Consequences
- Validation inconsistency: cast and value object may drift out of sync
- False sense of security: validation only applies when the cast is used (Eloquent path)
- Value objects used outside Eloquent may not validate at all if validation is only in the cast
- Duplicated test coverage for the same validation rules
- Harder to change validation rules: must update both the cast and the value object

### Preferred Alternative
```php
// Cast handles serialization only — delegates validation to value object
public function get(Model $model, string $key, mixed $value, array $attributes): ?Email
{
    return $value === null ? null : new Email($value);
}

// Value object validates itself
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
1. Identify validation logic in cast methods
2. Move validation rules to the value object's constructor if not already present
3. Remove duplicate validation from the cast
4. Add tests for value object validation at the value object level
5. Verify that invalid data through the cast still throws appropriately (from value object constructor)

### Detection Checklist
- [ ] Search for validation functions (`preg_match`, `filter_var`, `in_array`, `strlen`) in cast `get()` and `set()`
- [ ] Check if the value object constructor validates independently
- [ ] Test assigning invalid data through the cast — does it throw from the cast or the value object?
- [ ] Use the value object outside Eloquent — does validation still work?
- [ ] Check for `\InvalidArgumentException` or similar exceptions in cast methods

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep the Cast Focused on Serialization, Not Validation |
| Skill | `06-skills.md` — Cast an Attribute to a Value Object |
| Knowledge | `04-standardized-knowledge.md` — Value object constructor validates input |

---

## 4. get() Returning Plain Arrays Instead of Value Objects

### Category
Design

### Description
The `get()` method of a value object cast returns a plain array or raw data instead of a value object instance. This defeats the purpose of the value object cast — callers must manually construct the value object from the returned data.

### Why It Happens
The cast may have started as a simple array cast and was partially converted. The value object class exists but the cast never fully migrated to returning it. Developers may return raw data "for flexibility" so callers can choose how to interpret the data.

### Warning Signs
- `return json_decode($value, true)` in `get()` instead of constructing a value object
- `get()` return type is `array` instead of a value object type
- Callers always wrap the return value: `$address = new Address($model->address_data)`
- Comment in the cast like "TODO: return value object"
- Value object class exists but is never instantiated in the cast
- Factory or seeder code that manually constructs value objects from raw cast output

### Why Harmful
- Callers must know the internal structure of the stored data
- The value object's validation and behavior are bypassed — invalid data is exposed directly
- Every caller must repeat the value object construction logic
- The cast doesn't fulfill its purpose: transparently providing typed domain objects
- Inconsistent: some casts return value objects, others return raw arrays
- The abstraction layer is broken — storage format leaks into application code

### Consequences
- Callers dependent on the storage format (array keys match database column names)
- Value object construction logic duplicated across controllers, services, and views
- Invalid data in the database passes through the cast silently (no constructor validation)
- Harder to change storage format (must update all callers, not just the cast)
- Missed opportunity for type safety and domain semantics

### Preferred Alternative
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Address
{
    if ($value === null) return null;
    $data = json_decode($value, true);
    return new Address(
        street: $data['street'],
        city: $data['city'],
        state: $data['state'],
        postal_code: $data['postal_code'],
    );
}
```

### Refactoring Strategy
1. Identify cast `get()` methods that return plain arrays or raw data
2. Update `get()` to construct and return the value object
3. Update return type hints from `array` to the value object type
4. Find all callers that manually construct value objects from the raw output
5. Simplify callers to use the value object directly from the cast
6. Remove manual construction logic from callers

### Detection Checklist
- [ ] Search for `function get(` return types — are they value objects or arrays?
- [ ] Check callers for patterns like `new ValueObject($model->attribute)`
- [ ] Verify the cast adds type safety vs the raw database value
- [ ] Test `$model->attribute` — does it return a value object or raw data?
- [ ] Review whether the value object class is used anywhere else in the codebase

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Value Objects From get, Not Plain Arrays |
| Skill | `06-skills.md` — Cast an Attribute to a Value Object |
| Decision Tree | `07-decision-trees.md` — Value Object Cast vs Primitive Cast |

---

## 5. Castable Not Used for Multi-Model Value Objects

### Category
Code Organization

### Description
Registering a cast class individually in every model's `$casts` array when the same value object is used across multiple models. The `Castable` interface is not implemented, leading to duplicated cast class references and higher refactoring cost.

### Why It Happens
Developers may not know about the `Castable` interface. The cast was originally used on one model and later reused on others without refactoring. Copy-paste patterns propagate the cast class reference to multiple models.

### Warning Signs
- The same cast class (e.g., `EmailCast::class`) referenced in 3+ models
- The value object is used across 2+ models but doesn't implement `Castable`
- Adding the value object to a new model requires finding and importing the cast class
- The cast class name differs from the value object name (unnecessary indirection)
- No `castUsing()` method on the value object class
- Models reference the cast class directly: `'email' => EmailCast::class` instead of `'email' => Email::class`

### Why Harmful
- Each model duplicates the cast class reference — 5 models = 5 references
- Changing the cast class requires finding and updating all model references
- New team members must discover which cast class goes with which value object
- The value object's serialization logic is disconnected from its class
- Refactoring the cast (splitting, renaming) requires changes in every model

### Consequences
- Duplicated cast registration across models
- Higher refactoring cost when cast logic changes
- Inconsistency risk: some models may reference a different cast for the same value object
- New models using the value object must know the cast class name
- Scattered knowledge about which cast handles which value object

### Preferred Alternative
```php
// Value object declares its own cast
class Email implements Castable
{
    public static function castUsing(): string
    {
        return EmailCast::class;
    }
}

// Model registers the value object directly
class User extends Model
{
    protected $casts = [
        'email' => Email::class, // No need to reference EmailCast
    ];
}
```

### Refactoring Strategy
1. Identify value objects used across multiple models (search for cast class references)
2. Implement `Castable` on the value object with `castUsing()` returning the cast class
3. Update all model `$casts` arrays to reference the value object class instead of the cast class
4. Remove any now-unnecessary imports of the cast class from model files
5. Add documentation about how to reuse the value object in new models

### Detection Checklist
- [ ] Search for cast class references in model `$casts` arrays (e.g., `EmailCast::class`)
- [ ] Count how many models reference the same cast class
- [ ] Check if the value object implements `Castable` interface
- [ ] Verify that referencing the value object class in `$casts` works after implementing `Castable`
- [ ] Review if any models reference the cast class differently (potential inconsistency)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Castable Interface for Multi-Model Value Objects |
| Decision Tree | `07-decision-trees.md` — Cast Class vs Castable Interface |
| Skill | `06-skills.md` — Cast an Attribute to a Value Object |
