# Tagged Bindings

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Tagged bindings allow grouping multiple service implementations under a tag name, then resolving all of them together using `$app->tagged()`. This is useful for collecting strategies, handlers, pipelines, and other plugin-style architectures where multiple implementations of an interface need to be gathered dynamically. Tags enable variadic constructor injection and the strategy pattern with zero configuration at consumption time.

## Core Concepts

### tag()
Registers multiple abstracts under a tag: `$app->tag([CsvReport::class, PdfReport::class], 'reports')`.

### tagged()
Resolves all bindings for a tag: `$app->tagged('reports')` returns an array of instances.

### Registration Order
The order in which bindings are tagged determines the order in `tagged()` — consistent with array iteration order.

### Variadic Construction
A variadic constructor parameter (`ReportGenerator ...$formats`) can be resolved via tagged bindings.

### Tag in Service Providers
Tags should be registered in provider `register()` methods alongside the individual bindings.

### Singleton Interaction
Tagged bindings respect singleton binding — if a tagged service is a singleton, the same instance is returned each time.

## Mental Models

### The Concert Lineup
A music festival has multiple bands (implementations) all tagged as "headliners." When the festival organizer asks for all headliners, they get a list of bands in the order they were added to the lineup (tagging order). Each band arrives with their full crew (dependencies resolved).

### The Toolbox
A mechanic has multiple wrenches (implementations) tagged as "metrics." When told "bring all metric wrenches," the toolbox collects every wrench with that tag. The wrenches are returned in the order they were placed in the toolbox.

### The Conference Session
A conference has multiple speakers (implementations) tagged as "keynote." The organizer says "list all keynotes" — the system gathers each speaker in registration order, fully prepares them (with their slides and handouts = dependencies), and presents the list.

## Internal Mechanics

### Tag Storage
```php
// Container::$tags
$this->tags = [
    'reports' => [
        'reports.csv', // Abstract name
        'reports.pdf',
    ],
    'payment.gateways' => [
        'gateway.stripe',
        'gateway.paypal',
    ],
];
```

### tag() Implementation
```php
public function tag($abstracts, $tags)
{
    $tags = is_array($tags) ? $tags : func_get_args();
    
    foreach ($tags as $tag) {
        if (! isset($this->tags[$tag])) {
            $this->tags[$tag] = [];
        }
        
        foreach ((array) $abstracts as $abstract) {
            $this->tags[$tag][] = $abstract;
        }
    }
}
```

### tagged() Resolution
```php
public function tagged($tag)
{
    $results = [];
    
    if (isset($this->tags[$tag])) {
        foreach ($this->tags[$tag] as $abstract) {
            $results[] = $this->make($abstract); // Full resolution
        }
    }
    
    return $results;
}
```

### Variadic Resolution with Tags
```php
class ReportGenerator
{
    public function __construct(
        protected array $formats, // Tagged bindings populate this
    ) {}
}

// When building ReportGenerator, the container resolves:
// 1. No binding for $formats parameter
// 2. Checks if parameter is variadic → no
// 3. Checks for tagged bindings matching variadic type-hint
// 4. Populates array with all tagged implementations
```

## Patterns

### Strategy Collection Pattern
Tag multiple strategy implementations under a descriptive tag. The consumer receives all strategies and iterates them.

### Plugin Architecture Pattern
Package developers tag their implementations under a shared tag. The application collects all tagged services without knowing individual implementations.

### Lazy Collection Pattern
Tags resolve lazily — `tagged()` calls `make()` for each abstract. No resolution cost until the tag is accessed.

## Architectural Decisions

### Why tags instead of a registry class?
Tags are a container-native solution — no need for a custom registry class or service locator. The container already manages binding resolution, lifecycle, and dependencies.

### Why variadic constructor parameters with tags?
Variadic parameters naturally express "give me all of these" — they're the language-level feature for collecting multiple items. Combining with tags makes the intent clear: "give me all report format implementations."

### Why not merge tags with global bindings?
Tags are explicitly for collecting multiple implementations. Global bindings are for individual resolution. Merging them would complicate the simple `make()` API.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Collect all implementations dynamically | Registration order determines execution order | Order-dependent behavior if not documented |
| Variadic injection is clean | tagged() is O(n) on tag count | 50+ implementations = 50+ make() calls |
| Lazy resolution (no cost until accessed) | No ordering control beyond registration order | Priority mechanism needed for ordering |
| Plugin-friendly (packages add to tags) | No type enforcement — any abstract can be tagged | Type-hint the variadic parameter |

## Performance Considerations

- **tagged() resolution:** O(n) on tag count — calls `make()` for each tagged abstract.
- **Lazy resolution:** Tagged services not resolved until `tagged()` is called.
- **Singleton benefit:** Singleton-tagged services resolve once, subsequent `tagged()` calls return cached instances.
- **Variadic injection cost:** Resolves all tagged implementations at class construction time.

## Production Considerations

- **Tag in the same provider as the binding:** Keep tagging close to the binding registration for maintainability.
- **Use descriptive tag names:** Tag names should describe the role, not the implementation.
- **Combine with variadic injection:** `__construct(ReportGenerator ...$generators)` is the cleanest consumption pattern.
- **Document tag contracts:** What interface should tagged implementations implement?
- **Avoid over-tagging:** Only tag when multiple implementations exist — not "just in case."

## Common Mistakes

- **Tag with non-existent abstract:** Typo or class renamed — `BindingResolutionException` on `tagged()`.
- **Tag order assumptions:** Expecting specific order from `tagged()` without documenting.
- **Singleton tags with mutable state:** Singleton tagged service mutated between calls — inconsistent behavior.
- **Missing contract for tagged items:** Tagged implementations don't implement expected interface — type errors at consumption.
- **Over-tagging:** Everything tagged for flexibility — complex, hard-to-debug resolution.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Tagged service not found | Missing from tagged() results | Abstract not registered or tag not set | Verify abstract exists and is tagged |
| Wrong order in tagged() | Implementations in unexpected sequence | Registration order not controlled | Document order or use priority |
| Singleton state leak | Data from one iteration affects next | Singleton tagged service has mutable state | Ensure tagged singletons are stateless |
| Type error at consumption | Method called on wrong implementation | Tagged implementations don't share interface | Type-hint the variadic parameter |

## Ecosystem Usage

- **Laravel Framework:** Uses tagged bindings internally for collecting middleware, commands, and event subscribers.
- **Laravel Horizon:** Tags queue-related services for discovery by different queue workers.
- **Laravel Nova:** Tags tools and resources for dynamic discovery and registration.
- **Spatie packages:** Tag their service implementations for collection by application code (e.g., media conversions).

## Related Knowledge Units

### Prerequisites
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md) — how the container stores and resolves tags.

### Related Topics
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md) — tagged bindings are built on top of interface bindings.
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md) — comparison: one impl per consumer vs all impls for tag.
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md) — how variadic tagged parameters are resolved.

## Research Notes
- Tags are stored in `Container::$tags` — a simple array: `$tags['reports'] = ['reports.csv', 'reports.pdf']`.
- `tagged($tag)` iterates the tag array and calls `make()` on each abstract.
- Variadic constructor parameters with type-hints are resolved via tagged bindings if no explicit variadic binding exists.
- The `tag()` method accepts a single abstract or an array.
