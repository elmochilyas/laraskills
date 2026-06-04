# Tagged Bindings — Rules

## Tag Interfaces, Not Concrete Classes
---
## Category
Architecture
---
## Rule
Tag interfaces or abstract contracts when using `$app->tag()` — never tag concrete class implementations directly.
---
## Reason
Tagging interfaces enables polymorphic collection resolution: consumers iterate the tag and receive different concrete implementations, each resolved through the container. Tagging concrete classes hard-codes the implementation list, defeating the purpose of tag-based service discovery.
---
## Bad Example
```php
$this->app->tag([
    PdfReportGenerator::class, // Concrete class — should be interface
    CsvReportGenerator::class, // Concrete class — should be interface
], 'reports.generators');

// Consumer must know concrete classes:
foreach ($this->app->tagged('reports.generators') as $generator) {
    // $generator is the concrete class, not polymorphic
}
```
---
## Good Example
```php
$this->app->bind(ReportGenerator::class, PdfReportGenerator::class);
$this->app->bind(ReportGenerator::class, CsvReportGenerator::class);

$this->app->tag([ReportGenerator::class], 'reports.generators');

// Consumer depends on the interface:
foreach ($this->app->tagged('reports.generators') as $generator) {
    $generator->generate(); // Polymorphic — all implement ReportGenerator
}
```
---
## Exceptions
When concrete classes share no common interface but represent a logical group for sequential processing (rare).
---
## Consequences Of Violation
Maintainability: concrete class names leaked into tag registrations. Architecture: polymorphic iteration impossible without a shared interface.

---

## Leverage Lazy Resolution — Do Not Eagerly Resolve Tagged Services
---
## Category
Performance
---
## Rule
Iterate `tagged()` results lazily — do not call methods that trigger eager resolution on the collection (e.g., `toArray()`, `each()` without lazy iteration needs).
---
## Reason
`tagged()` returns a `Collection` with deferred resolution: each service is resolved via `make()` only when accessed. Calling `toArray()`, `all()`, or iterating without conditional break resolves every tagged service, defeating the lazy resolution benefit and potentially resolving services that are never used.
---
## Bad Example
```php
// Eager resolution — all 50 tagged services resolved
$handlers = $this->app->tagged('event.handlers')->toArray();
foreach ($handlers as $handler) {
    if ($handler->canHandle($event)) {
        $handler->handle($event);
        break; // But all 50 were already resolved by toArray()
    }
}
```
---
## Good Example
```php
// Lazy resolution — services resolved only when accessed
$handlers = $this->app->tagged('event.handlers');
foreach ($handlers as $handler) {
    if ($handler->canHandle($event)) {
        $handler->handle($event);
        break; // Only resolved handlers up to the matching one
    }
}
// Services after the break are never resolved
```
---
## Exceptions
When all tagged services must be resolved for a batch operation (e.g., generating all report types) where lazy vs eager has no benefit.
---
## Consequences Of Violation
Performance: unnecessary service construction for unused tagged services, increasing memory and resolution time.

---

## Register Bindings Before Tagging Them
---
## Category
Framework Usage
---
## Rule
Always register bindings before associating them with a tag via `$app->tag()`.
---
## Reason
`tag()` records abstract names in the `$tags` array but does not validate that the abstracts are registered as bindings. Tagging an unregistered abstract results in an empty resolution (for unbound concretes) or an exception at iteration time. Binding-first ensures the abstract exists when the tag is resolved.
---
## Bad Example
```php
// Tag before binding — tag references non-existent abstract
$this->app->tag([ReportGenerator::class], 'reports');
// Later:
$this->app->bind(ReportGenerator::class, PdfReportGenerator::class);
// tag('reports') may not include ReportGenerator if tag stored by reference
```
---
## Good Example
```php
$this->app->bind(ReportGenerator::class, PdfReportGenerator::class);
$this->app->bind(ReportGenerator::class, CsvReportGenerator::class);

$this->app->tag([ReportGenerator::class], 'reports');
// Binding exists before tagging — guaranteed resolution
```
---
## Exceptions
When tagging auto-resolved concrete classes that need no explicit binding (but prefer explicit registration for clarity).
---
## Consequences Of Violation
Reliability: empty `tagged()` collections or resolution failures at iteration time.

---

## Combine Tags with Variadic Constructor Injection
---
## Category
Code Organization
---
## Rule
Use variadic constructor parameters with type-hinted interfaces to inject tagged services into consumers.
---
## Reason
The container automatically resolves variadic parameters from tagged bindings. A constructor with `ReportGenerator ...$generators` receives all services tagged with `ReportGenerator::class`. This eliminates manual `tagged()` calls in application code and makes the dependency explicit in the constructor signature.
---
## Bad Example
```php
class ReportProcessor {
    protected array $generators;

    public function __construct(protected Container $app) {
        $this->generators = $this->app->tagged('reports.generators')->toArray();
    }
    // Service locator — hidden dependency on tag name
}
```
---
## Good Example
```php
class ReportProcessor {
    public function __construct(
        protected ReportGenerator ...$generators // Injected from tagged bindings
    ) {}

    public function processAll(): void {
        foreach ($this->generators as $generator) {
            $generator->generate();
        }
    }
}
// Tag registration:
$this->app->tag([ReportGenerator::class], 'reports.generators');
```
---
## Exceptions
When the consumer needs to resolve the tag dynamically (e.g., conditional tag selection based on runtime data).
---
## Consequences Of Violation
Maintainability: hidden dependencies on container tags. Testing: requires container bootstrapping to provide tagged services.

---

## Use Descriptive, Namespaced Tag Names
---
## Category
Maintainability
---
## Rule
Use namespace-like tag names (`module.type`) to prevent collisions between packages and providers.
---
## Reason
Tags are string keys with no built-in namespacing. Two packages using a generic tag name like `handlers` or `events` collide — their tagged services are merged into a single collection. Namespace conventions (`reports.generators`, `notifications.channels`) prevent collisions and make tag purpose clear.
---
## Bad Example
```php
// Generic tag names — collision risk
$this->app->tag([PdfHandler::class], 'handlers');
// Another package:
$this->app->tag([EmailHandler::class], 'handlers');
// tagged('handlers') returns both — probably unintentional
```
---
## Good Example
```php
$this->app->tag([PdfHandler::class], 'reports.export.handlers');
$this->app->tag([EmailHandler::class], 'notifications.handlers');
// Clear purpose, no collision
```
---
## Exceptions
Application-internal tags with no third-party packages involved (still prefer namespaced for consistency).
---
## Consequences Of Violation
Maintainability: unintentional service merging between packages when generic tag names collide.

---

## Cache the Tagged Collection if Iterated Multiple Times
---
## Category
Performance
---
## Rule
Store the result of `tagged()` in a local variable if iterating it multiple times — otherwise each iteration re-resolves all services.
---
## Reason
Each call to `tagged()` returns a new `Collection` instance. Iterating the collection resolves services lazily, but iterating it a second time resolves them again because the resolution is per-iteration, not cached on the collection.
---
## Bad Example
```php
public function process(): void {
    foreach ($this->app->tagged('reports.generators') as $gen) {
        $gen->validate();
    }
    // Second iteration — services resolved AGAIN
    foreach ($this->app->tagged('reports.generators') as $gen) {
        $gen->generate();
    }
}
```
---
## Good Example
```php
public function process(): void {
    $generators = $this->app->tagged('reports.generators');

    foreach ($generators as $gen) {
        $gen->validate();
    }
    // Reuse the same collection — services already resolved
    foreach ($generators as $gen) {
        $gen->generate();
    }
}
```
---
## Exceptions
Singleton or scoped tagged services where re-resolution returns the same cached instance (still avoid for clarity).
---
## Consequences Of Violation
Performance: double resolution overhead for tagged services on multi-pass iteration.
