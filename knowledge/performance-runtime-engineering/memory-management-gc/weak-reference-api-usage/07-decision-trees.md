# Decision Trees: Weak Reference API Usage in Laravel

## 1. WeakMap vs WeakReference Selection

Is the use case a mapping (key → value) or a single object reference?
├── Mapping (object → cached data) → Use WeakMap
│   ├── Cache computed permissions by User object
│   ├── Register listeners by subscriber object
│   └── Track middleware state by request object
├── Single reference (hold pointer to one object) → Use WeakReference
│   ├── Lazy proxy to original object
│   ├── Decorator pattern where original may be GC'd
│   └── Optional dependency that should not prevent GC
└── Neither (scalar key needed) → Use regular array or SplObjectStorage with manual cleanup

## 2. WeakMap Cache Appropriateness

Should a WeakMap be used for this cache?
├── Process-lifetime cache → Use WeakMap
│   ├── Cached data tied to object identity
│   ├── Object lifetime determines cache lifetime
│   └── Automatic eviction desired
├── Request-scoped cache → Use request array or static variable
│   ├── Data freed at end of request anyway
│   ├── WeakMap adds unnecessary complexity
│   └── Simpler: `$this->cache = []`
├── Cross-request cache → Use Laravel Cache facade
│   ├── Data must persist between requests
│   ├── WeakMap is process-memory only
│   └── Use Redis or file cache with TTL
└── Session-persistent cache → Use session storage
    ├── Must survive process restart
    └── WeakMap cannot be serialized

## 3. Memory Leak Risk Assessment

Is the application at risk of memory leaks from object accumulation?
├── Long-running process (Octane, Swoole, queue worker) → Consider weak references
│   ├── Implement WeakMap for registries and caches
│   ├── Profile memory before and after
│   └── Monitor memory usage in production
├── Short-lived process (PHP-FPM) → Weak references not needed
│   ├── Objects freed at request end
│   ├── WeakMap adds complexity without benefit
│   └── Standard request lifecycle handles cleanup
└── Mixed (some long, some short) → Isolate weak references to long-lived code paths
    ├── Only use in singleton services
    ├── Profile specific memory-hot paths
    └── Document intent clearly

## 4. WeakMap Value Retention Strategy

What is the memory footprint of WeakMap values?
├── Small values (scalars, arrays under 1KB) → Safe for WeakMap
│   ├── Negligible memory impact
│   └── Auto-eviction works well
├── Medium values (objects, arrays 1KB-100KB) → Monitor memory usage
│   ├── Values persist until key is GC'd
│   ├── Ensure key objects have bounded lifetime
│   └── Set up Octane memory monitoring
└── Large values (100KB+) → Consider alternative caching
    ├── WeakMap values strongly referenced
    ├── Large values × many objects = memory pressure
    └── Use external cache with explicit invalidation
