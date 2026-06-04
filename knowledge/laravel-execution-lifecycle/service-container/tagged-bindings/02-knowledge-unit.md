# Tagged Bindings

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Tagged Bindings
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Tagged bindings allow grouping multiple service container bindings under a common string tag, enabling collective resolution of all services in the group through a single `tagged()` call. Implemented through `Container::tag()` and `Container::tagged()`, this feature provides a lightweight alternative to manual collection wiring — rather than registering each service individually and collecting them in a parent service's constructor, developers tag related services and inject the collection.

The critical engineering decision in tagged bindings is that they are resolved lazily — `tagged('reports')` returns an array of freshly resolved instances, not pre-existing references. This means each call to `tagged()` triggers individual `make()` calls for every binding in the tag group. The consequence is that tagged bindings do not participate in the singleton cache: `tagged()` always resolves fresh instances even if the individual bindings are registered as singletons. This default-lazy behavior surprises teams that expect tagged collections to share state with the rest of the application.

For production applications, tagged bindings excel at collecting pluggable services — report generators, payment gateways, notification channels, middleware pipelines, and console commands. The pattern is most useful in framework code where a processor needs to iterate over an open set of handlers. However, teams should avoid tagged bindings for performance-sensitive hot paths, as resolving N tagged services incurs N full resolution cycles.

---

## Core Concepts

### Tag Registration
Bindings are tagged at registration time. The tag does not affect resolution — it only adds the abstract name to the tag's group list:

```php
$this->app->tag([
    CsvReport::class,
    PdfReport::class,
    JsonReport::class,
], 'reports');
```

### Tagged Resolution
Calling `tagged()` resolves each binding in the group and returns them as an array:

```php
$reports = $this->app->tagged('reports');
// Returns: [CsvReport instance, PdfReport instance, JsonReport instance]
```

### Tagged Injection (Laravel 12+)
Tagged bindings can be injected via contextual binding shorthand:

```php
$this->app->when(ReportProcessor::class)
    ->needs(ReportInterface::class)
    ->giveTagged('reports');
```

### Variadic Parameter Injection
Tagged bindings integrate with variadic constructor parameters:

```php
class ReportProcessor {
    public function __construct(
        protected array $reports // Automatically populated from tagged('reports')
    ) {}
}
```

---

## Mental Models

### The Tool Belt
Tagged bindings are like tool belts with labeled pouches. Each pouch (tag) holds a collection of tools (services). When you need all wrenches, you reach into the "wrenches" pouch and pull them all out at once. Each tool is a fresh tool — you don't share tools between belt pouches.

### The Playlist
A music playlist tagged "road-trip" that collects songs from different albums. When you play the playlist (call `tagged()`), each song is loaded fresh from its album (resolved individually). The playlist doesn't own the songs — it just references them by their original location.

### The Conference Attendee List
A conference with attendees grouped by track (tag). Each attendee (binding) can belong to multiple tracks. When you need everyone in the "AI" track, you get a list of all AI attendees — but each attendee is checked in fresh at the registration desk (lazy resolution), not pre-registered as a single group.

---

## Internal Mechanics

### Storage Structure
Tags are stored in a `$tags` array mapping tag names to arrays of abstract names:

```php
$this->tags = [
    'reports' => [
        'App\Reports\CsvReport',
        'App\Reports\PdfReport',
        'App\Reports\JsonReport',
    ],
    'commands' => [
        'App\Commands\ImportCommand',
        'App\Commands\ExportCommand',
    ],
];
```

### tag() Method
```php
public function tag($abstracts, $tags)
{
    $tags = is_array($tags) ? $tags : [$tags];
    
    foreach ($abstracts as $abstract) {
        foreach ($tags as $tag) {
            $this->tags[$tag][] = $abstract;
        }
    }
}
```

### tagged() Method
Resolution iterates the tag's abstract list and calls `make()` for each:

```php
public function tagged($tag)
{
    if (! isset($this->tags[$tag])) {
        return [];
    }

    return array_map(
        fn ($abstract) => $this->make($abstract),
        $this->tags[$tag]
    );
}
```

### Interaction with singletons
Each individual binding in a tag group maintains its own lifecycle. A singleton-tagged service returns the same instance when resolved through `make()` directly, but `tagged()` calls `make()` internally, so it returns the cached singleton if already resolved:

```php
$this->app->singleton(DatabaseReport::class);
$this->app->tag([DatabaseReport::class], 'reports');

// First resolution — create singleton
$report1 = $this->app->make(DatabaseReport::class);
// tagged() returns the same singleton instance
$reports = $this->app->tagged('reports');
// $reports[0] === $report1
```

---

## Patterns

### Strategy Collection via Tags
```php
$this->app->tag([
    StripeGateway::class,
    PaypalGateway::class,
    SquareGateway::class,
], 'payment_gateways');

class PaymentManager {
    public function __construct(
        protected array $gateways
    ) {
        // $gateways is populated by tagged('payment_gateways')
    }
}
```

### Plugin/Hook System
```php
// Plugin service providers tag their hooks
$this->app->tag([SeoHook::class, AnalyticsHook::class], 'hooks');

// Core processor collects all hooks
class HookProcessor {
    public function __construct(protected array $hooks) {}
    
    public function process(): void {
        foreach ($this->hooks as $hook) {
            $hook->handle();
        }
    }
}
```

### Conditional Tagging
Services can be conditionally tagged based on environment:

```php
$reports = [CsvReport::class, PdfReport::class];
if (config('reports.enable_json')) {
    $reports[] = JsonReport::class;
}
$this->app->tag($reports, 'reports');
```

---

## Architectural Decisions

### Why tagged() resolves lazily instead of returning pre-resolved references
Lazy resolution ensures that tagged services are always fresh — each call to `tagged()` returns the current state of the container. If tags stored resolved instances, the collection would become stale when new services are bound or existing ones are replaced. The lazy approach also allows tag groups to contain services with different lifecycle types (bind + singleton in the same tag) without conflict.

### Why tags are stored separately from bindings
Tags are cross-cutting metadata, not binding configuration. Storing them in a separate `$tags` array avoids coupling the binding definition format to tagging concerns. This separation allows services to be tagged without modifying their binding registration, enabling tags to be added in different service providers from where bindings are registered.

### Why tagged() returns an array instead of a typed collection
Returning a plain array maintains minimal dependency on collection types. The caller can wrap the array in a Laravel Collection, an SplObjectStorage, or any other structure. Returning a typed collection would force all consumers to use that type, increasing coupling between the container and application code.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Groups services without modifying their constructors | Tag registration is separate from binding declaration | Tags can be forgotten when new bindings are added |
| Lazy resolution keeps collections current | Each tagged() call resolves all members independently | N tagged services = N full make() resolution cycles |
| Services can belong to multiple tags | Abstract names duplicated across tags | Large tag groups duplicate abstract names, increasing memory |
| Integrates with variadic constructor injection | Only works with array type-hints, not typed variadics | Cannot type-hint `ReportInterface ...$reports` — must use `array $reports` |

---

## Performance Considerations

`tagged('group')` with N services triggers N separate `make()` calls. If the tag group contains singletons that have already been resolved, subsequent `tagged()` calls are O(N) array lookups. If the services use `bind()`, each `tagged()` call triggers N full construction cycles.

For Octane, tagged services that are singletons are resolved once and cached — `tagged()` on subsequent requests returns the cached instances. However, `tagged()` still iterates the tag array and calls `make()` for each member, adding ~0.5μs per member for the array lookup and method call overhead.

For large tag groups (50+ services), the cumulative resolution cost is significant. Consider using a dedicated collection service that pre-resolves tagged services in `boot()` if the collection is used on every request.

---

## Production Considerations

- **Resolve tagged collections once during boot** if the collection is used on every request. Call `$this->app->tagged('reports')` in a service provider's `boot()` method and store the result in a dedicated collection service.
- **Document all tags in a central location.** Create a `app/Tags.php` constants file listing every tag name used in the application. This prevents tag name typos (which silently return empty arrays) and provides a discovery point for new developers.
- **Avoid tagging services that have expensive constructors.** Each resolution in `tagged()` triggers full construction. For expensive services, ensure they are registered as singletons so the cost is paid once.
- **Use `giveTagged()` in Laravel 12+ for clean injection.** The `when()->needs()->giveTagged()` shorthand eliminates the manual `tagged()` call in application code.

---

## Common Mistakes

**Why it happens:** Assuming `tagged()` returns cached instances from the first call. **Why it's harmful:** If the services use `bind()`, each `tagged()` call creates new instances — memory allocations multiply per call. **Better approach:** Register expensive tagged services as `singleton()` to share instances across `tagged()` calls.

**Why it happens:** Expecting `tagged('nonexistent')` to throw an error. **Why it's harmful:** An unknown tag silently returns an empty array. The consumer receives zero services and may not validate the collection. **Better approach:** Assert tag names are valid in your service provider tests.

**Why it happens:** Tagging services in one provider and resolving in another without ensuring provider order. **Why it's harmful:** If the tagging provider runs after the resolving provider, the tag is empty. **Better approach:** Tag services in the same provider where they are registered, or use deferred provider dependency ordering.

---

## Failure Modes

### Empty Tag Group
`tagged('reports')` returns an empty array. **Common causes:** Tag name typo, provider order issue where tagging hasn't happened yet, or services were never tagged. **Detection:** Silent — the consumer iterates over zero services. **Mitigation:** Log tag sizes in development; validate tag groups in service provider tests.

### Circular Resolution in Tagged Services
A tagged service depends (directly or transitively) on a service that triggers `tagged()` on the same tag. **Common causes:** Design issue where a service in a tag group depends on the same tag group. **Detection:** Circular dependency exception with build stack. **Mitigation:** Avoid circular tag dependencies — tagged services should not depend on their own tag group.

---

## Ecosystem Usage

**Laravel Framework Core:** The `Illuminate\Console\Application` uses tagged bindings to collect Artisan commands. Each command service provider tags its commands with `'commands'`, and the console kernel resolves them via `$this->app->tagged('commands')` for registration.

**Laravel Horizon:** Uses tag bindings to collect custom Horizon dashboard metrics. Package developers tag their metric collectors with `'horizon.metrics'`, and the Horizon dashboard injects the complete collection via `tagged()`.

**Spatie Laravel MediaLibrary:** Uses tags to collect media conversion strategies. Each custom conversion strategy is tagged with `'media.conversions'`, and the conversion processor resolves all strategies via `tagged()` when building conversion pipelines.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Types

### Related Topics
- Contextual Binding
- Binding Resolution

### Advanced Follow-up Topics
- Binding Extending
- Resolution Callbacks

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::tag()` (lines 440-460): Registers abstracts in tag groups.
- `Illuminate\Container\Container::tagged()` (lines 470-490): Resolves all tagged services via `make()`.
- `Illuminate\Container\ContextualBindingBuilder::giveTagged()` (Laravel 12+): Shorthand for `needs()->give(fn($app) => $app->tagged(...))`.

### Key Insight
The tag system is layer-agnostic — it stores abstract names, not instances. This means tags can be defined and populated across multiple service providers, at different phases of the boot sequence, as long as all tagging occurs before the first `tagged()` call. This cross-provider flexibility is the design's most powerful feature and most common failure point (empty tags due to ordering).

### Version-Specific Notes
- **Laravel 10.x:** `tagged()` always returns fresh instances. No `giveTagged()` shorthand.
- **Laravel 11.x:** No changes to tag system.
- **Laravel 12.x:** `giveTagged()` shorthand added to `ContextualBindingBuilder`. Tagged resolution respects singleton caching (fixed behavior — previously always fresh).
- **Laravel 13.x:** Tags can reference other tags for nested collections. `tag()` accepts tag names as second-level grouping.
