# Rules: Weak Reference API Usage

## Rule 1 — Use WeakMap for Object-Keyed Caches in Long-Running Processes

**Rule Name:** weakmap-for-object-caches
**Category:** Always
**Rule:** When caching data keyed by object identity in Octane, Swoole, or queue workers, use `WeakMap`.
**Reason:** WeakMap auto-evicts entries when the key object is garbage collected, preventing memory leaks.
**Bad Example:**
```php
class PermissionCache
{
    private array $cache = []; // Strong references prevent GC
}
```
**Good Example:**
```php
class PermissionCache
{
    private WeakMap $cache;

    public function __construct()
    {
        $this->cache = new WeakMap();
    }
}
```
**Exceptions:** Short-lived request lifecycle (PHP-FPM) where objects are freed at request end.

## Rule 2 — Do Not Use WeakReference to Prevent GC

**Rule Name:** weak-ref-goes-null
**Category:** Always
**Rule:** Ensure the referenced object is held by a strong reference elsewhere. WeakReference alone does not prevent GC.
**Reason:** WeakReference is read-only — it returns null if the object is collected.
**Bad Example:**
```php
$weak = WeakReference::create($obj);
unset($obj); // $weak->get() returns null
// Expected obj to survive because of weak reference
```
**Good Example:**
```php
$strong = $obj; // Hold strong reference
$weak = WeakReference::create($obj);
// $weak->get() returns the object
```
**Exceptions:** None — this is a fundamental property of weak references.

## Rule 3 — Force GC in Tests for Weak Reference Verification

**Rule Name:** force-gc-in-tests
**Category:** Always
**Rule:** Call `gc_collect_cycles()` in tests that verify weak reference behavior.
**Reason:** Without forced GC, objects may not be collected immediately when variables go out of scope.
**Bad Example:**
```php
public function test_cache_eviction(): void
{
    $user = User::factory()->create();
    $this->cache->getPermissions($user);
    unset($user);
    // $this->cache still has the entry without forced GC
}
```
**Good Example:**
```php
public function test_cache_eviction(): void
{
    $user = User::factory()->create();
    $this->cache->getPermissions($user);
    unset($user);
    gc_collect_cycles();
    $this->assertCount(0, $this->cache);
}
```
**Exceptions:** None — weak reference tests require explicit GC for reliable assertions.

## Rule 4 — Never Serialize WeakReference or WeakMap

**Rule Name:** no-weakref-serialization
**Category:** Always
**Rule:** Do not store `WeakReference` or `WeakMap` instances in sessions, caches, or queue payloads.
**Reason:** Neither `WeakReference` nor `WeakMap` supports serialization.
**Bad Example:**
```php
Cache::put('permissions', $this->cache, 3600); // Fails or corrupts
```
**Good Example:**
```php
// Use Laravel Cache with traditional key-value for cross-request storage
Cache::put('permissions_'.$userId, $permissions, 3600);
```
**Exceptions:** None — these constructs are strictly process-memory-only.

## Rule 5 — Profile Before Applying Weak References

**Rule Name:** profile-before-weakref
**Category:** Prefer
**Rule:** Profile memory usage before implementing weak references. Verify they solve an actual memory problem.
**Reason:** Weak references add complexity. Only justified when profiling shows a measurable memory issue.
**Bad Example:**
```php
// Adding WeakMap everywhere without profiling
class EverythingCache
{
    private WeakMap $map; // Unnecessary extra complexity
}
```
**Good Example:**
```php
// Profile first: memory_get_usage() reveals model cache accumulation
// Then apply WeakMap specifically to the accumulating cache
```
**Exceptions:** Known memory-constrained environments (low-memory containers, high-throughput Octane).

## Rule 6 — Use WeakMap Keys Only, Not Values

**Rule Name:** weakmap-keys-only
**Category:** Always
**Rule:** Only keys in a WeakMap are weakly referenced. Values are strongly referenced and persist until the key is GC'd.
**Reason:** Confusing key/value behavior leads to unexpected memory retention.
**Bad Example:**
```php
$map = new WeakMap();
$map[$largeObject] = $anotherLargeObject;
// $anotherLargeObject persists even after both are out of scope
// until $largeObject refcount hits zero during GC
```
**Good Example:**
```php
$map = new WeakMap();
$map[$keyObject] = $computedValue; // Value is small, intentional
// Auto-eviction removes key+value when keyObject is GC'd
```
**Exceptions:** None — this is by design. WeakMap keys are weak; values are strong.

## Rule 7 — Guard Null Returns from WeakReference::get()

**Rule Name:** guard-null-weakref-get
**Category:** Always
**Rule:** Always check `$weakRef->get()` for `null` before dereferencing.
**Reason:** The referenced object may be garbage collected at any time.
**Bad Example:**
```php
$target = $this->weakRef->get();
$target->doSomething(); // Fatal error if null
```
**Good Example:**
```php
$target = $this->weakRef->get();
if ($target === null) {
    throw new RuntimeException('Referenced object no longer available');
}
$target->doSomething();
```
**Exceptions:** None — null checks are mandatory for safe weak reference usage.
