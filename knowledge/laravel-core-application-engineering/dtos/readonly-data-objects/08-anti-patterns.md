# ECC Anti-Patterns — Readonly Data Objects

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | Readonly Data Objects |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Non-Readonly DTO (Setters, Public Non-Readonly Properties)
2. Manual Assignment DTO (Property Declarations + Constructor Body)
3. Clone-and-Mutate Pattern (Modifying Clones of Readonly Objects)
4. Lazy Initialization in Readonly DTOs
5. Dynamic Construction via Spread or Reflection

---

## Repository-Wide Anti-Patterns

- DTO Without Constructor Promotion (Properties + Constructor Body)
- Using `__set` or `__get` Magic Methods in Readonly Classes
- `unserialize()` Bypass Without Controls
- Readonly Class Used for Non-DTO Domain Objects (Mixing Concerns)

---

## Anti-Pattern 1: The Non-Readonly DTO

### Category
Design | Reliability

### Description
A "DTO" with setters or public non-readonly properties that can be modified after construction. This is a mutable parameter bag, not a DTO.

### Why It Happens
Teams adopt DTOs but forget the `readonly` keyword. Months later, a bug is traced to unexpected mutation in an intermediate layer.

### Warning Signs
- Class lacks `readonly class` or `readonly` keyword on properties
- Setter methods like `setName()`, `setEmail()` exist
- A service or middleware modifies a DTO after receiving it
- Bug investigation reveals "the DTO changed between controller and service"

### Preferred Alternative
Apply `readonly class` (PHP 8.2+) or `public readonly` on every property from the first commit. Make immutability a language-enforced constraint, not a convention.

### Related Rules
- Rule: Enforce Readonly on All DTOs

---

## Anti-Pattern 2: Manual Assignment DTO

### Category
Code Organization | Maintainability

### Description
Declaring properties as class fields, then manually assigning constructor parameters to those fields in the constructor body, bypassing constructor promotion.

### Why It Happens
Developers are accustomed to PHP 7-style class definitions and do not use PHP 8's promoted constructor properties.

### Warning Signs
- Property declarations at the top of the class: `private string $name;`
- Constructor body has 5+ lines of `$this->name = $name;` assignments
- Adding a new property requires changes in three places: declaration, constructor parameter, constructor body

### Preferred Alternative
Use constructor promotion exclusively. Each constructor parameter with `public readonly` is automatically a declared property.

### Related Rules
- Rule: Use Constructor Promotion for All DTO Properties

---

## Anti-Pattern 3: Clone-and-Mutate Pattern

### Category
Design | Reliability

### Description
Cloning a readonly DTO and then attempting to modify the clone's properties, expecting them to be mutable.

### Why It Happens
Developers assume cloning creates a mutable copy. They call `$clone->name = 'new'` which throws a runtime `\Error`.

### Warning Signs
- `$cloned = clone $dto;` followed by `$cloned->property = 'value';`
- Code that expects clone to produce a writable copy
- Runtime `\Error` about readonly property assignment
- Workarounds using `ReflectionClass` or `array_combine` to bypass readonly

### Preferred Alternative
Use the "with" pattern — dedicated `with*()` methods that return a new instance with one property changed. For bulk modifications, construct a new DTO.

### Related Rules
- Rule: Use `with*()` Methods for Modified Copies

---

## Anti-Pattern 4: Lazy Initialization in Readonly DTOs

### Category
Design | Reliability

### Description
Attempting to use lazy initialization (compute-on-first-access) with readonly properties, which is incompatible with readonly semantics.

### Why It Happens
Developers want to defer expensive computation until the property is accessed, but readonly requires all properties to be set at construction.

### Warning Signs
- Constructor does not assign all readonly properties (leaves some uninitialized)
- Accessing a readonly property throws `\Error` about uninitialized typed property
- Factory methods attempt to skip assigning promoted readonly properties
- Nullable default values are used to simulate deferred initialization

### Preferred Alternative
Compute all values eagerly in the constructor or factory method. For expensive computations, compute in the service layer before DTO construction and pass the result as a parameter.

### Related Rules
- Rule: Eagerly Initialize All Readonly Properties in the Constructor

---

## Anti-Pattern 5: Dynamic Construction via Spread or Reflection

### Category
Reliability | Security

### Description
Using `new Dto(...$data)` with array spread or `ReflectionClass::newInstanceArgs()` to bypass explicit constructor calls, risking type mismatches and uninitialized properties.

### Why It Happens
Developers want a generic "hydrate from array" mechanism without writing explicit factory methods. Spread syntax seems like the simplest solution.

### Warning Signs
- `new Dto(...$data)` used outside named factory methods
- Array keys must exactly match parameter names or runtime errors occur
- Extra keys in the array cause unknown named parameter errors
- Missing keys cause uninitialized property errors
- No explicit mapping exists — the spread is the sole construction mechanism

### Preferred Alternative
Use named factory methods with explicit mapping. Spread can be used inside `fromArray()` when the data is validated and keys are guaranteed to match, but the factory itself must control the mapping.

### Related Rules
- Rule: Use Explicit Mapping in Factory Methods
