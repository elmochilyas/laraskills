# Object Reference Trees

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Object Reference Trees |
| Difficulty | Advanced |
| Last Updated | 2026-06-04 |

## Overview

Object reference trees describe how PHP objects reference each other to form parent-child, sibling, and shared-ownership graphs. Every object reference is a pointer in the zval, and every connection adds to the GC root buffer scanning cost, refcount management overhead, and memory fragmentation. Deep trees (> 10 levels) increase property access time (each `->` dereference inc refcount), GC traversal cost (proportional to total references), and the risk of unintentional circular references that prevent timely cleanup. Shallow, flattened object graphs are more memory-predictable, faster to traverse, and less prone to leaks — particularly in persistent runtimes like Octane.

## Core Concepts

- **Object reference**: Stored as a pointer in the zval (8 bytes on 64-bit). The referenced `zend_object` has its own refcount — assignment increments it, unset decrements it.
- **Reference tree depth**: The number of `->` dereferences to reach the leafmost object from the root. Each dereference traverses a pointer and touches the child's zval.
- **Shared references**: Two parent objects referencing the same child increment the child's refcount to 2. The child's memory is shared until one parent releases it.
- **Circular references**: Parent → Child → Parent cycle prevents refcount from reaching zero. The cycle collector must detect and free these — adds GC overhead.
- **Reference tree breadth**: The number of direct children at each level. Wide trees (many children per parent) increase memory locality challenges and per-level traversal cost.
- **WeakReference (PHP 7.4+)**: Holds a reference that does not increment refcount. The referenced object can be freed while the WeakReference exists — ideal for breaking cycles and cache patterns.

## When To Use

- Designing domain models with complex entity relationships (orders → items → product → category).
- Building ORM entity graphs where lazy loading creates deep proxy chains.
- Octane workers where reference trees persist across requests and must be managed.
- Memory profiling shows high GC root buffer entries from object references.
- Code review for memory leak patterns in long-running processes.

## When NOT To Use

- Simple CRUD with no complex object relationships — reference trees are shallow by nature.
- Value objects without identity — they are compared by value, not referenced by identity.
- PHP-FPM request-scoped code where the entire tree is freed at request end.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Keep object trees shallow (< 5 levels) | Each level adds pointer dereference cost and GC scanning overhead. Flattening reduces both. |
| Use WeakReference for cache-like parent references | Breaks circular references without manual lifecycle management. The cache auto-evicts when the child is freed. |
| Prefer composition over deep inheritance | Deep class hierarchies create object chains that are expensive to traverse and hard to understand. |
| Explicitly nullify references in Octane workers | Setting `$this->child = null` decrements refcount and may free the child immediately. |
| Use DTOs for data transfer between layers | DTOs hold flat data without object references — they traverse boundaries without creating reference chains. |

## Architecture Guidelines

- **Domain model boundaries**: Within a bounded context, object references are natural. Across bounded contexts, use identifiers (IDs) instead of object references. This decouples memory graphs.
- **Repository return types**: Repositories should return shallow object graphs or DTOs. Avoid returning fully-loaded entity trees with all relations.
- **Serializer performance**: Serializing deep object trees requires full graph traversal. Shallow graphs serialize faster. Use `LazyCollection` or cursor-based serialization for large trees.
- **Observers and events**: Event subscribers that hold references to dispatched objects can create unintended reference chains. Clear subscriber state after each event.
- **Persistent runtime cleanup**: Octane workers must have a cleanup mechanism (tick hook, middleware, destructor) that nullifies per-request object references. Otherwise, references from request N persist for request N+1.

## Performance Considerations

- Single object property access (`$obj->prop`): ~20-50ns (zval lookup + refcount increment).
- Deep traversal (10 levels): ~200-500ns per leaf access. For 10,000 leaf accesses: 2-5ms.
- GC root buffer entry per circular reference: ~72 bytes. 10,000 circular references = ~720KB in the root buffer.
- Full reference tree destruction at request end (FPM): O(n) where n = total objects. For 10,000 objects, ~500µs.
- WeakReference creation: ~100ns. WeakReference resolution (`->get()`): ~50ns (may return null if freed).

## Security Considerations

- Object reference grafting: An attacker who controls object deserialization can create arbitrary reference graphs that exhaust memory (deserialization DoS). Use `allowed_classes` in `unserialize()`.
- Cross-request reference leaks in Octane: If per-request state is not cleared, sensitive data from one user's session may remain accessible through stale references in the next request's scope.
- Serialization of reference trees with circular paths: `serialize()` handles cycles correctly, but `json_encode()` on circular references throws. Always break cycles before JSON serialization.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Deeply nested ORM eager loading | Loading `$order->items->product->category->parent->...` creates a 6+ level tree. | Assuming eager loading has no memory cost. | Large memory allocation for the full tree; slow serialization. | Use lazy loading or DTO projection for deep trees. |
| Sharing mutable objects across requests in Octane | Storing an object reference in a service container singleton that is mutated by each request. | Not understanding persistent runtime memory semantics. | Cross-request state contamination, hard-to-debug data corruption. | Always create fresh instances per request. |
| Not breaking circular references in long-lived objects | ORM entity with `parent()` and `children()` relations creating cycles that never resolve. | Default ORM relationship patterns. | Objects never freed until explicit `unset` or process end. | Use WeakReference on one side of the cycle. |

## Anti-Patterns

- **God object graph**: A single root object that references everything in the application. Every operation traverses or holds the entire graph in memory.
- **Retaining references for logging**: Storing objects in a log context or debug backtrace. The log entry holds the reference, preventing GC of the entire tree.
- **Singleton entity caches**: Caching full entity objects (with all relationships) in a service container singleton. The cache holds the entire reference tree for the application lifetime.
- **Circular event chains**: Event A → Listener modifies Object B → Object B dispatches Event A → refcount never drops to zero.

## Examples

```php
<?php
// Deep reference tree (problematic)
class Order {
    public function __construct(
        public Collection $items, // Each Item → Product → Category → ParentCategory
    ) {}
}

// Flattened data structure (better)
readonly class OrderDTO {
    public function __construct(
        public int $id,
        public array $items, // Flat arrays, not object references
        public float $total,
    ) {}
}
```

```php
<?php
// Breaking circular references with WeakReference
class TreeNode {
    private ?WeakReference $parent = null;

    public function setParent(self $parent): void {
        $this->parent = WeakReference::create($parent);
    }

    public function getParent(): ?self {
        return $this->parent?->get();
    }
}
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Zval Structure, Reference Counting
- **Closely Related**: WeakReference API Usage, Circular Reference Detection
- **Advanced Follow-Up**: GC Root Buffer Monitoring, Serialization Performance
- **Cross-Domain Connections**: Octane Memory Management, Eloquent Relationship Loading, DTO Design

## AI Agent Notes

- Deep reference trees are the primary cause of high GC root buffer counts in Octane applications. Flattening the tree reduces GC overhead more effectively than tuning GC settings.
- When migrating from FPM to Octane, reference tree cleanup is the most commonly missed pattern. FPM destroys everything at request end; Octane does not.
- Use readonly DTOs for all cross-layer data transfer. DTOs have no object references — just flat data. This also makes them trivially serializable and testable.
- The single most impactful change for reference tree optimization in Laravel: return DTOs from repositories instead of Eloquent models. This severs the reference chain at the data access boundary.
