# Immutability Patterns — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Immutability Patterns |
| Focus | Anti-patterns in immutable value object design and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Mutable Properties on Value Objects | Design | High |
| 2 | In-Place Mutation Operations | Reliability | High |
| 3 | Public Setters on Value Objects | Design | High |
| 4 | Mixed Immutability Contract in Model | Reliability | Medium |
| 5 | Immutable Entity (Over-Immutability) | Design | Medium |
| 6 | Ambiguous Modification Method Names | Maintainability | Low |

## Repository-Wide Cross-Cutting Patterns

- Value objects in Laravel applications frequently start as simple DTOs with public mutable properties and degrade into sources of shared-reference mutation bugs as the application grows
- The tension between immutability and convenience leads to inconsistent patterns — some value objects are immutable, others are mutable, and developers can't distinguish them without reading the class
- `CarbonImmutable` consistency is the most common integration gap: models use immutable value objects but mutable date casts, creating a half-immutable object graph

---

## 1. Mutable Properties on Value Objects

### Category
Design

### Description
Declaring value object properties without the `readonly` modifier (PHP 8.1+), allowing them to be reassigned after construction. The value object's state can change after creation, breaking value semantics and enabling shared-reference mutation bugs.

### Why It Happens
Old habits from PHP < 8.1 where `readonly` was unavailable. Developers may not use constructor property promotion or may be unaware of `readonly`. Legacy value objects haven't been updated since the feature was introduced.

### Warning Signs
- Value object properties declared as `public int $cents` or `private int $cents` without `readonly`
- Value object instances that change state after being constructed
- `$money->cents = 5000;` syntax working (properties are writable)
- Code that assigns to value object properties instead of creating new instances
- Property types that don't include `readonly` in the constructor promotion

### Why Harmful
- Any code with a reference to the value object can silently modify its state
- Shared references cause bugs: passing a Money object to a function that modifies its `cents` property affects the caller's instance
- The value object loses identity-by-value semantics — two instances may be equal at creation but different moments later
- Refactoring to make properties `readonly` later requires extensive code changes

### Consequences
- Shared-reference mutation bugs that are difficult to reproduce and debug
- Value object state changing unpredictably across function calls
- Loss of value semantics: the object behaves like a mutable holder, not a value
- Code that defensively copies value objects adds unnecessary complexity
- Thread-safety issues in concurrent contexts

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
1. Identify all value objects with mutable (non-readonly) properties
2. Add `readonly` modifier to each property
3. Update any code that assigns to properties directly (use `with*()` methods instead)
4. Remove any setter methods that become unused
5. Run tests to verify no property assignments remain

### Detection Checklist
- [ ] Search for `class \w+` that represents a value object — check property declarations for `readonly`
- [ ] Search for `->property = value` assignments on value object instances
- [ ] Check value object constructors for `readonly` modifiers
- [ ] Review value object subclasses for mutable parent properties
- [ ] Test: create a value object and attempt to modify its properties

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Mark All Value Object Properties as readonly |
| Skill | `06-skills.md` — Step 1: Declare all properties as readonly |
| Decision Tree | `07-decision-trees.md` — Decision 2: Readonly vs Private Setters |

---

## 2. In-Place Mutation Operations

### Category
Reliability

### Description
Value object methods that modify `$this->property` internally instead of returning a new instance. Calling `$money->add($other)` mutates `$money` and doesn't return a new object, causing the original reference to change.

### Why It Happens
Developers naturally write methods that modify `$this`. The difference between entity behavior (mutate in place) and value object behavior (return new instance) is a learned pattern. The `void` return type is the default instinct.

### Warning Signs
- Value object methods with `void` return type that modify `$this->property`
- Operations like `$money->add($other)` that change `$money` without returning a new instance
- Callers that never assign the return value: `$money->add($other);` (no reassignment)
- Code that uses the original value object after calling an operation, expecting it to be unchanged
- Tests that verify the original object is modified after an operation

### Why Harmful
- The original value object reference is silently mutated — every consumer with the same reference sees the change
- Callers may not realize the object is mutated (they expect value semantics)
- Subtle bugs: passing a value object to a function that mutates it, then using the original later with changed values
- Breaks referential transparency — the same expression evaluated twice may give different results

### Consequences
- Shared-reference corruption from in-place mutation
- Calling code that must defensively clone value objects before passing them
- Intermittent bugs depending on access order and reference sharing
- Inconsistent with value object semantics — behaves like an entity
- Debugging time wasted tracing unexpected value changes

### Preferred Alternative
```php
public function add(Money $other): self
{
    if ($this->currency !== $other->currency) {
        throw new \InvalidArgumentException('Currency mismatch');
    }
    return new self($this->cents + $other->cents, $this->currency);
}
```

### Refactoring Strategy
1. Identify value object methods that mutate `$this` instead of returning new instances
2. Change return type from `void` to `self` or `static`
3. Replace `$this->cents += ...` with `return new self(...)`
4. Update all callers to capture the return value: `$money = $money->add($other)`
5. Add tests that verify the original instance is unchanged after operations

### Detection Checklist
- [ ] Search for `$this->` assignments in value object methods
- [ ] Check return types of value object methods — are they `void` or returning new instances?
- [ ] Look for methods like `add`, `subtract`, `multiply`, `apply` that modify internal state
- [ ] Test: verify original instance is unchanged after calling an operation
- [ ] Search for method calls whose return value is not captured

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return New Instances From Modification Operations |
| Decision Tree | `07-decision-trees.md` — Decision 3: New Instance vs In-Place Mutation |
| Skill | `06-skills.md` — Step 2: Define operations that return new instances |

---

## 3. Public Setters on Value Objects

### Category
Design

### Description
Exposing `set*()` methods on value objects that allow external code to modify the object's state after construction. Setters provide a mutation API that violates the immutability contract and enables ad-hoc state changes.

### Why It Happens
Lombok-style generation habits from other languages. ORM integration: some developers add setters because Eloquent models commonly have them. Framework familiarity: setter injection patterns from service containers.

### Warning Signs
- `public function setCents(int $cents): void` or `public function setCurrency(string $currency): void`
- `set*()` methods that modify `$this->property`
- Fluent setters returning `$this` (`public function setX($v): self { $this->x = $v; return $this; }`)
- Value object classes with `__set()` magic method
- Eloquent models treating value objects as mutable DTOs

### Why Harmful
- The immutability contract is immediately bypassable — `readonly` properties are the only real enforcement
- External code can modify the value object's state at any time, not just during construction
- The setter API encourages mutation patterns over functional modification (`with*()`)
- Value objects with setters are indistinguishable from mutable DTOs, confusing their purpose

### Consequences
- Accidental state changes through exposed setter API
- Developers using setters instead of functional modification (`with*()`)
- No distinction between value objects and mutable DTOs in the codebase
- Refactoring to remove setters later requires migrating all setter call sites
- Immutability guarantee is only by convention, not enforcement

### Preferred Alternative
```php
public function withAmount(int $cents): self
{
    return new self($cents, $this->currency);
}
```

### Refactoring Strategy
1. Identify all `set*()` methods on value object classes
2. Replace each setter with a `with*()` named constructor that returns a new instance
3. Update all callers to use the named constructor with reassignment
4. Remove the setter method
5. Add `readonly` to properties if not already done

### Detection Checklist
- [ ] Search for `function set\w+` in value object classes
- [ ] Search for `->set` calls on value object instances
- [ ] Check for `__set()` magic methods on value objects
- [ ] Review value object constructor for `readonly` modifier
- [ ] Count value objects that still have setters

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Expose Setters on Value Objects |
| Skill | `06-skills.md` — Step 4: Do not expose setters |
| Knowledge | `04-standardized-knowledge.md` — No setters |

---

## 4. Mixed Immutability Contract in Model

### Category
Reliability

### Description
Using immutable value objects in domain logic alongside mutable `Carbon` date casts (`datetime` instead of `immutable_datetime`). The inconsistent immutability contract creates confusion about which model attributes can be safely modified and which cannot.

### Why It Happens
Developers apply immutability to domain value objects but forget to apply it to model date casts. The `datetime` cast is the default and changing to `immutable_datetime` is an easy-to-miss configuration step.

### Warning Signs
- Model has immutable value object casts but uses `datetime` for date attributes
- Domain code that carefully handles immutable value objects but accidentally mutates `$model->created_at` via `->addDay()`
- Inconsistent patterns: calling `->addDay()` on some dates (mutable) but calling `with*()` on others (immutable)
- No team convention for date cast immutability
- Carbon mutation bugs in a codebase that otherwise uses immutable value objects

### Why Harmful
- The immutability contract is inconsistent — developers must remember which attributes are immutable and which aren't
- Date attributes, which are read frequently and shared across many contexts, are the most likely source of accidental mutation
- Half-immutable models are confusing: some operations return new instances, others mutate in place
- A single `$model->created_at->addDay()` in Blade or controller corrupts the model's date for the entire request

### Consequences
- Accidental mutation of date attributes through Carbon's mutable API
- Confusing developer experience: some attributes are safe to modify, others are not
- Increased debugging time for date-related bugs in codebases that otherwise value immutability
- Inconsistent pattern — newcomers cannot assume either convention

### Preferred Alternative
```php
protected $casts = [
    'created_at' => 'immutable_datetime',
    'updated_at' => 'immutable_datetime',
    'status' => StatusEnum::class,
];
```

### Refactoring Strategy
1. Identify all models that use both immutable value objects and mutable date casts
2. Change all `datetime` and `date` casts to `immutable_datetime` and `immutable_date`
3. Update any code that relied on mutable Carbon behavior
4. Add a CI check or team convention for consistent immutable date casts

### Detection Checklist
- [ ] Cross-reference models with immutable value objects against their date cast types
- [ ] Search for `'datetime'` and `'date'` in model `$casts` arrays (without `immutable_` prefix)
- [ ] Check for `->add`, `->sub`, `->modify` calls on date attributes in the codebase
- [ ] Verify `CarbonImmutable` usage is consistent across the model
- [ ] Assess whether the team has an immutability convention for model attributes

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Combine Immutable Value Objects With CarbonImmutable |
| Skill | `06-skills.md` — Step 5: Combine with CarbonImmutable |
| Knowledge | `04-standardized-knowledge.md` — CarbonImmutable parallel |

---

## 5. Immutable Entity (Over-Immutability)

### Category
Design

### Description
Applying immutability patterns to domain entities that have persistent identity (ID) and need to change state over time. Entities must be mutated as part of their lifecycle — making them immutable creates cumbersome with*() chains and unnecessary object churn.

### Why It Happens
After learning the benefits of immutable value objects, developers apply the same patterns to all domain objects regardless of whether they are values or entities. "Immutability is good" becomes a blanket rule.

### Warning Signs
- Entity classes (with `$id` property) that use `readonly` on all properties
- Long `with*()` chains to modify entity state: `$user = $user->withName(...)->withEmail(...)->withStatus(...)`
- Entity operations that return new instances despite having a persistent ID
- Domain logic cluttered with reassignment (`$entity = $entity->...`) for entities
- Performance concerns from excessive object allocation for entity operations

### Why Harmful
- Entities have persistent identity — they are the same object before and after state changes. Immutability here fights the domain model
- Long `with*()` chains for entities are more verbose and less readable than entity methods that mutate in place
- Object churn from creating new entity instances for every state change adds unnecessary GC pressure
- References to the entity become stale — callers must re-grab the reference after each operation
- Confuses the distinction between value objects (immutable by nature) and entities (mutable by nature)

### Consequences
- Verbose, hard-to-read entity modification code
- Stale references: code that holds an old entity reference has outdated data
- Unnecessary object allocation for every entity state change
- Confused domain model: entities that behave like value objects
- Higher cognitive load for developers reading entity operations

### Preferred Alternative
```php
// Entity — mutable with identity
class User
{
    public function __construct(
        public readonly UserId $id,
        private string $name,
    ) {}

    public function rename(string $name): void
    {
        $this->name = $name;
    }
}
```

### Refactoring Strategy
1. Identify domain objects with persistent identity (ID) that use immutable patterns
2. Distinguish value object properties from mutable entity properties
3. Keep value objects immutable (value types), make entity properties mutable
4. Replace `with*()` chains with entity methods that mutate in place
5. Update callers to use mutation methods without reassignment

### Detection Checklist
- [ ] Identify domain objects with ID properties — are they using immutable patterns?
- [ ] Check for `with*()` methods on objects that have a persistent ID
- [ ] Search for reassignment patterns on entity references (`$entity = $entity->with...`)
- [ ] Count entity operations that return new instances
- [ ] Review domain — do entities or value objects dominate the mutation pattern?

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Decision 1: Immutable Value Object vs Mutable Entity |
| Knowledge | `04-standardized-knowledge.md` — When NOT To Use (short-lived, never shared) |
| Rule | `05-rules.md` — Value objects only; entities excluded |

---

## 6. Ambiguous Modification Method Names

### Category
Maintainability

### Description
Value object methods that modify properties use names that don't clearly communicate whether they mutate in place or return a new instance (e.g., `applyDiscount()`, `updateAmount()`, `setNewValue()`). Callers cannot tell from the method name whether the original object is changed.

### Why It Happens
Domain terminology is used over naming conventions. "Apply", "update", "change" are natural English verbs for modifying something. The `with*()` convention is a learned pattern, not intuitive.

### Warning Signs
- Method names like `applyDiscount()`, `updateEmail()`, `changeName()` on value objects
- Method name doesn't include `with` prefix or other signal of new instance behavior
- Callers unsure whether to capture the return value or not
- Code comments clarifying whether the method mutates or returns new
- Inconsistent naming: some methods use `with*`, others use action verbs

### Why Harmful
- Callers can't determine behavior from the signature alone — must read the implementation
- Ambiguous methods lead to callers either defensive-copying (wasted performance) or missing the return value (lost modification)
- Inconsistent naming across value objects makes the codebase harder to navigate
- New developers must learn which methods mutate and which return new by memorization or reading source

### Consequences
- Developers reading every value object method to understand mutation behavior
- Missed return value captures causing silent bugs (modification lost)
- Defensive cloning adding unnecessary overhead when callers are unsure
- Inconsistent patterns across the codebase
- Higher onboarding friction for new team members

### Preferred Alternative
```php
// Named constructor clearly returns new instance
$money = $money->withAmount(5000);
$money = $money->withCurrency('EUR');
$total = $money->add($other);  // Arithmetic operations use domain verbs
```

### Refactoring Strategy
1. Review all value object methods that modify state
2. Rename methods that return new instances to use `with*()` prefix
3. For arithmetic or domain operations (`add`, `subtract`), keep domain names but ensure return type is `self`
4. Update all callers to use the new method names
5. Add CI convention checking for `with*()` prefix on modification methods

### Detection Checklist
- [ ] Search for value object method names that suggest mutation (`apply`, `update`, `change`, `modify`, `set`)
- [ ] Check if methods return `self` or `void`
- [ ] Review callers — do they capture the return value or not?
- [ ] Count value objects with `with*()` prefix vs action verbs
- [ ] Verify the team has a naming convention documented

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Named Constructors for Modified Copies |
| Skill | `06-skills.md` — Step 3: Use named constructors with with*() prefix |
