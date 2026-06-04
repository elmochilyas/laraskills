---
## Rule Name

Use Typed Readonly DTOs Instead of Associative Arrays

## Category

Performance

## Rule

Use typed readonly DTOs (PHP 8.1+) for structured data transfer instead of associative arrays.

## Reason

DTOs store properties as direct zval slots (~16 bytes each) — ~50% less memory than equivalent arrays, which need HashTable buckets (~40+ bytes each plus string key storage). Property access is direct offset (~5ns) instead of hash lookup (~50–100ns).

## Bad Example

```php
$user = ['id' => 1, 'name' => 'Alice', 'email' => 'alice@example.com'];
// ~400+ bytes for 3 properties
```

## Good Example

```php
readonly class UserDTO {
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
    ) {}
}
$user = new UserDTO(1, 'Alice', 'alice@example.com');
// ~200 bytes for 3 properties + type safety
```

## Exceptions

Data with truly dynamic keys not known at design time.

## Consequences Of Violation

2× memory overhead, slower property access, no type safety, no readonly guarantees.

---

## Rule Name

Avoid Dynamic Properties on Classes

## Category

Performance

## Rule

Always declare all properties explicitly on classes. Never use dynamic property assignment (`$obj->newProp = value`).

## Reason

Dynamic properties are stored in a separate HashTable attached to the object — ~60+ bytes per property (string key + bucket + zval) versus 16 bytes for a declared typed property. Access is also 3–5× slower via hash lookup instead of direct offset.

## Bad Example

```php
class User {
    public int $id;
}
$user = new User();
$user->name = 'Alice';  // Dynamic property — HashTable storage
```

## Good Example

```php
class User {
    public int $id;
    public string $name;  // Declared property — direct zval slot
}
$user = new User();
$user->name = 'Alice';
```

## Exceptions

No common exceptions. Dynamic properties are deprecated in PHP 8.2.

## Consequences Of Violation

Deprecation warnings in PHP 8.2+, 3–5× slower property access, 3×+ memory overhead.

---

## Rule Name

Flatten Deep Inheritance for Value Objects

## Category

Architecture

## Rule

Use composition over inheritance for value objects and DTOs. Avoid inheritance chains deeper than 2 levels.

## Reason

Each level of inheritance adds a property table and dispatch overhead. A class with 3 levels of inheritance stores 3 property tables, each requiring offset computation. Flattening reduces memory and access time.

## Bad Example

```php
class Model {}               // Level 1
class User extends Model {}   // Level 2
class Admin extends User {}   // Level 3 — 3 property tables
```

## Good Example

```php
class UserDTO {              // Single level — one property table
    public function __construct(
        public int $id,
        public string $name,
        public bool $isAdmin,
    ) {}
}
```

## Exceptions

Framework-mandated inheritance (Eloquent models extending base Model class).

## Consequences Of Violation

Unnecessary property table overhead, slower method dispatch, more complex object layout.

---

## Rule Name

Avoid Anonymous Classes in Loops

## Category

Performance

## Rule

Never create anonymous classes inside loops. Define named classes instead.

## Reason

Each anonymous class creates a unique `zend_class_entry`. Creating 1000 anonymous class instances inside a loop creates 1000 class entries that persist in memory. Named classes have one entry shared across all instances.

## Bad Example

```php
$handlers = [];
for ($i = 0; $i < 1000; $i++) {
    $handlers[] = new class {  // Creates 1000 class entries
        public function handle(): void { /* ... */ }
    };
}
```

## Good Example

```php
class MyHandler {
    public function handle(): void { /* ... */ }
}
$handlers = [];
for ($i = 0; $i < 1000; $i++) {
    $handlers[] = new MyHandler();  // One class entry
}
```

## Exceptions

Truly one-off anonymous classes used once outside loops.

## Consequences Of Violation

Thousands of class entries consuming memory, slower autoloading and class resolution.

---

## Rule Name

Use Closure Reuse Instead of Inline Closures in Hot Paths

## Category

Performance

## Rule

Extract closures used inside hot loops to private methods or static closures defined once outside the loop.

## Reason

Each inline closure creates a new `Closure` object (~80 bytes + captured variables). In a loop with 100K iterations, this creates 100K Closure objects that must be allocated and GC'd. Extracting the closure to a reusable variable eliminates this allocation.

## Bad Example

```php
for ($i = 0; $i < 100000; $i++) {
    $result = array_map(function ($item) {  // 100K closure objects
        return $item * 2;
    }, $data);
}
```

## Good Example

```php
$doubler = fn ($item) => $item * 2;  // One closure
for ($i = 0; $i < 100000; $i++) {
    $result = array_map($doubler, $data);  // Reuse
}
```

## Exceptions

Loops with fewer than 1000 iterations where the overhead is negligible.

## Consequences Of Violation

Thousands of unnecessary closure object allocations, GC pressure, higher memory usage.
