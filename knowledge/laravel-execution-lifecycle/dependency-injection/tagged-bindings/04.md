# ku-06: Tagged Bindings

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **KU:** ku-06-tagged-bindings
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Tagged bindings allow grouping multiple service implementations under a tag name, then resolving all of them together using `$app->tagged()`. This is useful for collecting strategies, handlers, pipelines, and other plugin-style architectures where multiple implementations of an interface need to be gathered dynamically.

## Core Concepts
- **tag()**: Registers multiple abstracts under a tag: `$app->tag([CsvReport::class, PdfReport::class], 'reports')`.
- **tagged()**: Resolves all bindings for a tag: `$app->tagged('reports')` returns an array of instances.
- **Registration order**: The order in which bindings are tagged determines the order in `tagged()` — consistent with array iteration order.
- **Variadic construction**: A variadic constructor parameter (`ReportGenerator ...$formats`) can be resolved via tagged bindings.
- **Tag in service providers**: Tags should be registered in provider `register()` methods alongside the individual bindings.
- **Singleton interaction**: Tagged bindings respect singleton binding — if a tagged service is a singleton, the same instance is returned each time.

## When To Use
- When multiple implementations of an interface should be collected and executed in sequence (pipeline, middleware chain).
- For strategy pattern implementations — gather all available strategies for a given operation.
- When a class needs a variable number of implementations that should be injected as an array.
- For plugin architectures where packages register their implementations under a shared tag.

## When NOT To Use
- When you always know the exact number of implementations — use explicit constructor injection instead.
- When implementations have a strict execution order that must be configurable — use priority or pipeline pattern explicitly.
- When the tagged collection is used in only one place — consider a dedicated aggregator class instead.

## Best Practices (WHY)
- **Tag in the same provider as the binding**: Keep tagging close to the binding registration for maintainability.
- **Use descriptive tag names**: Tag names should describe the role, not the implementation — `'report.generators'` not `'pdf.report'`.
- **Combine with variadic injection**: `__construct(ReportGenerator ...$generators)` with tagged bindings is the cleanest consumption pattern.
- **Document tag contracts**: What interface should tagged implementations implement? Document this for package consumers.

## Architecture Guidelines
- Tags are stored in `Container::$tags[$tag] = [$abstract1, $abstract2, ...]`.
- `tagged($tag)` calls `make()` on each abstract in the tag array — each may trigger full resolution with all its own dependencies.
- Tagged bindings resolve lazily — only when `tagged()` is called.
- Tags have no namespace — use descriptive names to avoid collisions across packages.

## Performance
- `tagged()` calls `make()` for each tagged binding — if 5 services are tagged, `tagged()` makes 5 resolution calls.
- Lazy resolution — tagged services are not resolved until `tagged()` is called.
- Variadic injection with tagged bindings resolves all tagged implementations at class construction time.
- Singleton tags amortize resolution cost — subsequent `tagged()` calls return cached instances.

## Security
- Tagged bindings resolve all registered implementations — ensure untrusted code cannot register under application tags.
- Package tags may conflict — use vendor-prefixed tag names (e.g., `'spatie.media.conversions'`).

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Tag with non-existent abstract | Tag references a class that has no binding | Typo or class renamed | BindingResolutionException on tagged() | Verify abstract exists and is resolvable |
| Tag order assumptions | Expecting a specific order in tagged() | Not understanding registration order | Implementations in unpredictable order | Document order or use priority mechanism |
| Singleton tags with mutable state | Singleton tagged service mutated between calls | State leaks through singletons | Inconsistent behavior across tagged() calls | Ensure tagged singletons are stateless |
| Missing contract for tagged items | Tagged implementations don't implement expected interface | No type enforcement | Type errors at consumption point | Type-hint the variadic parameter |
| Over-tagging | Everything tagged for flexibility | Anticipating future needs | Complex, hard-to-debug resolution | Only tag when multiple implementations exist |

## Anti-Patterns
- **Tag as a replacement for interfaces**: Tags should supplement interface bindings, not replace them.
- **Runtime tag registration**: Registering tags dynamically during a request — tags should be static, registered at bootstrap.
- **Tagged service locator**: Using `tagged()` deep in business logic — tag resolution belongs in the composition root.

## Examples
```php
// In service provider
public function register()
{
    $this->app->bind('reports.csv', CsvReport::class);
    $this->app->bind('reports.pdf', PdfReport::class);
    $this->app->tag(['reports.csv', 'reports.pdf'], 'reports');
}

// Consumption via variadic injection
class ReportGenerator
{
    public function __construct(
        protected array $formats, // populated by tagged bindings
    ) {}

    public function generate(array $data): array
    {
        $results = [];
        foreach ($this->formats as $format) {
            $results[] = $format->generate($data);
        }
        return $results;
    }
}
```

## Related Topics
- DI Container Basics (ku-01) — how the container stores and resolves tags
- Automatic Injection (ku-04) — how variadic tagged parameters are resolved
- Interface Binding (ku-08) — tagged bindings are built on top of interface bindings
- Contextual Binding (ku-05) — comparison: one impl per consumer vs all impls for tag

## AI Agent Notes
- Tags are stored in `Container::$tags` — a simple array: `$tags['reports'] = ['reports.csv', 'reports.pdf']`.
- `tagged($tag)` iterates the tag array and calls `make()` on each abstract.
- Variadic constructor parameters with type-hints are resolved via tagged bindings if no explicit variadic binding exists.
- The `tag()` method accepts a single abstract or an array.

## Verification
- [ ] Tags are registered in provider `register()` methods
- [ ] Tagged implementations implement a common interface (type-hinted in consumer)
- [ ] Tag names are descriptive and documented
- [ ] No runtime tag registration (tags are static bootstrap-time)
- [ ] Singleton tagged services are stateless
- [ ] `tagged()` resolves all expected implementations
