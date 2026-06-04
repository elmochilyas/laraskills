# Object Memory Usage — zend_object Structure, Property Storage, Class Hierarchy, Memory-Efficient Object Patterns

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Object Memory Usage — zend_object Structure, Property Storage, Class Hierarchy, Memory-Efficient Object Patterns |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Objects in PHP are stored as `zend_object` structures — each instance has a header (containing the class entry pointer, refcount, and GC info) and a properties table. The properties table stores typed and dynamic properties as zvals. Class inheritance adds overhead via property tables at each level. Readonly classes (PHP 8.1+) and property hooks (PHP 8.4+) change the memory characteristics but do not reduce the base object overhead. Understanding object memory layout explains why DTOs are more memory-efficient than arrays for structured data, why inheritance chains increase per-object memory, and why object pooling can reduce allocation pressure.

## Core Concepts

- **zend_object header**: `ce` (class entry pointer, 8 bytes), `handle` (resource ID, 4 bytes), `gc` (GC info, 16 bytes including refcount), `properties` (HashTable pointer or inline buffer). ~40–80 bytes overhead per object depending on PHP version.
- **zend_class_entry**: Per-class structure holding the class definition — method table, property info, interfaces, constants. Stored once per class, not per instance.
- **Property storage**: Property values stored as zvals (16 bytes each) in the object's properties table. For typed properties, the zval includes the expected type for enforcement.
- **Dynamic properties**: Added via `$obj->newProp = value` at runtime. Stored in a separate HashTable attached to the object. Slower access (hash lookup) and higher memory (string key storage + bucket overhead).
- **Inheritance overhead**: Each level of inheritance adds a property table for that class's declared properties. A child class with 10 own + 10 inherited properties stores 20 zvals + inheritance chain overhead.
- **Readonly objects (PHP 8.4+)**: New `__construct()` property promotion with `readonly` on the class itself. Memory characteristics similar to readonly properties on a regular class.
- **Lazy objects (PHP 8.4+)**: Objects that are not fully initialized until accessed. Uses a ghost or proxy pattern internally. Reduces memory for objects that may never be accessed.

## When To Use

- You are creating or processing many objects in memory (100K+ instances).
- You are designing DTOs or value objects for API responses or command buses.
- You are running in memory-constrained environments (containers, Octane workers).
- You are designing class hierarchies and want to understand the memory implications.
- You are considering lazy loading vs eager loading of object graphs.

## When NOT To Use

- Your application creates few objects — the memory savings are negligible.
- You are optimizing without measuring — object overhead is rarely the primary memory concern.
- You are using PHP-FPM with short-lived requests — objects are destroyed at request end.
- You need dynamic property access — the flexibility of dynamic properties outweighs the memory cost.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use typed properties instead of dynamic properties | Typed properties use a fixed-size zval slot in the object's properties table. Dynamic properties use a HashTable — higher memory and slower access. |
| Use `readonly` properties for immutable data | Readonly properties are set once in the constructor and never modified. PHP optimizes memory for read-only zvals (no CoW tracking needed). |
| Use DTOs (plain objects with public typed properties) instead of associative arrays | DTOs store properties as direct zval slots (~16 bytes each). Arrays store them as hash table buckets (~40 bytes each plus string key allocation). |
| Avoid deep inheritance chains for value objects | Each level of inheritance adds a property table and dispatch overhead. Flatten hierarchies for high-volume objects. |
| Use lazy objects for expensive-to-initialize objects (PHP 8.4+) | Lazy objects defer initialization until first property access. Saves memory and CPU for objects that may never be fully used. |
| Reuse objects via pooling in hot code paths | Object allocation costs ~100–500ns + GC overhead. Pooling reduces allocation pressure. Use `SplObjectStorage` for pool management. |
| Use `clone` for object copies instead of manual property copying | `clone` performs a shallow copy efficiently (one zval operation per property). Manual copying is slower and error-prone. |

## Architecture Guidelines

- **Object header overhead**: Each object has a minimum ~40–80 byte header. For an object with 1 property, the overhead is ~70% of the total memory. For an object with 20 properties, the overhead is ~20%.
- **Inheritance property table**: Each class in the hierarchy stores its own property declarations. `class B extends A` with 5 properties each = 10 property zvals + 2 object headers. Flattening to a single class with 10 properties saves the extra header.
- **Dynamic properties cost**: `$obj->newProp = 'x'` adds the property to a HashTable inside the object. The key `'newProp'` is stored as a string (~40 bytes + zend_string for the key name) plus a zval (16 bytes). Total: ~60+ bytes vs 16 bytes for a typed property.
- **Anonymous classes**: Each anonymous class instance creates a unique `zend_class_entry`. 1000 anonymous class instances = 1000 class entries. Repeated anonymous class usage should be replaced with named classes.
- **Closure object cost**: Each Closure instance is an object (~80 bytes header) plus the captured `this` and `use` variables as properties. For frequently created closures (event listeners, callbacks), consider class-based strategies.

## Performance Considerations

- Object allocation: ~100–500ns for a simple object (zend_object allocation + property slot initialization).
- Object with 10 typed properties: ~200 bytes (80 header + 10 × 16 property zvals + alignment).
- Equivalent associative array: ~400+ bytes (HashTable + 10 buckets + 10 string keys + 10 zvals).
- DTO memory advantage: ~50% less memory than equivalent associative array. ~60% faster property access.
- Inheritance overhead: Each level adds ~40–80 bytes per instance plus method dispatch indirection.
- Dynamic property access: ~3–5× slower than typed property access (hash lookup vs direct offset).

## Security Considerations

- Object injection vulnerabilities: `unserialize()` can create arbitrary objects (CVE-2016-7124). Use `unserialize()` with `allowed_classes` parameter or use JSON for untrusted data.
- Dynamic property spoofing: Allowing user input to set dynamic properties can overwrite expected properties. Always validate property names.
- Lazy object proxies: If a lazy object's initializer has side effects (e.g., database query), an attacker could trigger initialization at unexpected times. Ensure initializers are safe.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Using arrays instead of DTOs for structured data | `['id' => 1, 'name' => 'Alice']` instead of `new UserDTO(1, 'Alice')`. | Array habit from earlier PHP versions. | 2× memory usage, slower access, no type safety. | Use typed DTOs with readonly properties. |
| Deep inheritance for value objects | `class SpecialAdminUser extends AdminUser extends User extends Model`. | Following ORM/framework inheritance patterns for value objects. | Each instance carries property tables for 4 classes. | Flatten hierarchies. Use composition over inheritance for business objects. |
| Using anonymous classes in loops | `$handler = new class { ... };` inside a loop. | Convenience for single-use objects. | Creates N class entries (one per iteration), wasting memory. | Define named classes. |
| Not clearing object references | Maintaining references to objects prevents GC. | Holding objects in static caches or event listeners. | Objects accumulate and are never freed. | Use WeakReference for caches. Unset references explicitly. |
| Storing metadata on entity objects | Attaching transient data (pagination, permissions) to ORM entities. | Convenience of having data "on the object." | Objects grow larger than necessary, cannot be cached easily. | Use separate DTOs for transient data. |

## Anti-Patterns

- **Massive inheritance chains for business objects**: 5+ levels of inheritance for DTOs/value objects. Each level adds overhead with no benefit. Prefer composition.
- **Object-as-array-replacement**: Creating objects with 50+ properties accessed dynamically. Either the class is doing too much, or an array would be more appropriate.
- **Closures-in-loops**: Creating closures inside loops creates N Closure objects. Extract closures to private methods or static callbacks.
- **Overusing __get/__set magic methods**: Magic methods intercept property access with hash lookups. 10–50× slower than direct property access. Use typed properties instead.

## Examples

```php
// DTO vs array memory comparison
// Array: ~400+ bytes for 3 properties
$user = ['id' => 1, 'name' => 'Alice', 'email' => 'alice@example.com'];

// DTO: ~200 bytes for 3 properties
readonly class UserDTO {
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
    ) {}
}

$user = new UserDTO(1, 'Alice', 'alice@example.com');
```

```php
// Object pooling pattern
class ObjectPool {
    private SplObjectStorage $pool;

    public function get(): PooledObject {
        foreach ($this->pool as $obj) {
            $this->pool->detach($obj);
            return $obj->reset();
        }
        return new PooledObject();
    }

    public function release(PooledObject $obj): void {
        $this->pool->attach($obj);
    }
}
```

```php
// Lazy object (PHP 8.4+)
$lazyUser = new LazyObject(fn () => User::find($id));
// User is not loaded from database until a property is accessed
echo $lazyUser->name; // Database query happens here
```

## Related Topics

- PHP Memory Model — zval and zend_object
- Efficient Data Structures — SplObjectStorage
- Array Memory Usage — HashTable overhead
- Copy-on-Write Mechanics
- Generators and Yield

## AI Agent Notes

- DTOs are the most impactful object-memory optimization. They save ~50% memory compared to associative arrays and provide type safety. Modern PHP (8.1+) makes DTOs trivial with readonly properties.
- The main source of object memory waste in framework applications is dynamic properties — properties that aren't declared but set at runtime. Always declare properties explicitly.
- For Octane workers, object accumulation is the primary memory leak pattern: event listeners, closure callbacks, and cached objects accumulate across requests. Use WeakReference and explicit cleanup.
- PHP 8.4's lazy objects are a game-changer for ORM and API response scenarios. Objects that are expensive to hydrate are only loaded when accessed.

## Verification

- [ ] Compare memory: DTO vs associative array with the same data.
- [ ] Measure object header overhead: compare objects with 1, 10, and 50 properties.
- [ ] Compare inheritance overhead: class with single level vs 3-level hierarchy.
- [ ] Test dynamic vs typed property access speed.
- [ ] Measure object allocation cost in a hot loop with vs without pooling.
- [ ] Verify lazy objects (PHP 8.4+) defer initialization until property access.
- [ ] Document object patterns used in memory-critical code paths.
