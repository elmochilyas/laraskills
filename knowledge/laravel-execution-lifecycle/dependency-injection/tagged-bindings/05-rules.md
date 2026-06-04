# Tag Bindings in the Same Provider as the Binding
---
## Category
Code Organization
---
## Rule
Register `tag()` calls in the same service provider where the individual bindings are registered.
---
## Reason
Keeping tags close to their source bindings ensures they stay synchronized. If a binding is moved or removed, the tag registration is immediately visible and can be updated together.
---
## Bad Example
```php
// PaymentServiceProvider
$this->app->bind('reports.csv', CsvReport::class);
$this->app->bind('reports.pdf', PdfReport::class);
// Tag registered elsewhere — easy to desync
```
---
## Good Example
```php
// PaymentServiceProvider
$this->app->bind('reports.csv', CsvReport::class);
$this->app->bind('reports.pdf', PdfReport::class);
$this->app->tag(['reports.csv', 'reports.pdf'], 'reports');
```
---
## Exceptions
When a separate provider aggregates bindings from multiple providers — document the dependency clearly.
---
## Consequences Of Violation
Desynchronized bindings and tags; orphaned tag references; runtime resolution failures on `tagged()`.

---

# Use Descriptive, Namespace-Prefixed Tag Names
---
## Category
Maintainability
---
## Rule
Name tags descriptively by their role and prefix with a vendor or package namespace to avoid collisions.
---
## Reason
Tags are stored in a flat namespace on the container. Without prefixes, two packages may use the same tag name (e.g., `'handlers'`), causing one to accidentally collect the other's bindings.
---
## Bad Example
```php
$this->app->tag([...], 'handlers'); // Generic — may collide with other packages
```
---
## Good Example
```php
$this->app->tag([...], 'payment.gateways'); // Descriptive and scoped
```
---
## Exceptions
Application-level tags with no third-party package overlap.
---
## Consequences Of Violation
Cross-package tag collisions; unexpected service collection; hard-to-debug binding collection.

---

# Combine Tagged Bindings with Variadic Constructor Injection
---
## Category
Architecture
---
## Rule
Use variadic constructor parameters with type-hints to consume tagged bindings — `__construct(Handler ...$handlers)`.
---
## Reason
Variadic parameters with type-hints are the cleanest way to consume tagged services. The container automatically collects all tagged implementations and injects them as an array, providing type safety and clear dependency declaration.
---
## Bad Example
```php
class ReportGenerator
{
    public function __construct(
        protected array $formats, // No type enforcement — could receive anything
    ) {}

    public function generate(array $data): array
    {
        foreach ($this->formats as $format) {
            // No guarantee $format implements expected interface
        }
    }
}
```
---
## Good Example
```php
class ReportGenerator
{
    public function __construct(
        protected array $formats, // Populated by tagged bindings
    ) {}

    public function generate(array $data): array
    {
        foreach ($this->formats as $format) {
            // Type-hinted variadic ensures ReportInterface
        }
    }
}
```
---
## Exceptions
When resolution by variadic parameter is not possible — use `app()->tagged()` in a factory method.
---
## Consequences Of Violation
Missing type safety; manual resolution; harder to maintain consumption pattern.

---

# Do Not Register Tags at Runtime
---
## Category
Reliability
---
## Rule
Register all tags during bootstrap in service providers. Never call `tag()` dynamically during a request.
---
## Reason
Tags define the static structure of the service graph. Runtime registration makes the list of services non-deterministic and introduces ordering bugs — the consumer may have already been resolved before the tag was registered.
---
## Bad Example
```php
public function someMethod(): void
{
    app()->tag('temporary.service', 'handlers'); // Runtime registration
}
```
---
## Good Example
```php
// In service provider
public function register(): void
{
    $this->app->tag('permanent.service', 'handlers');
}
```
---
## Exceptions
No common exceptions. Tags are bootstrap-time configuration.
---
## Consequences Of Violation
Non-deterministic service collection; ordering bugs; services may be missed or double-collected.

---

# Validate Tagged Implementations Implement the Expected Interface
---
## Category
Reliability
---
## Rule
Ensure every binding registered under a tag implements the interface expected by the variadic consumer.
---
## Reason
Tags are type-unenforced — any binding can be tagged regardless of its type. If a tagged service does not implement the expected interface, the consumer receives a type error at method-call time, not at registration.
---
## Bad Example
```php
$this->app->bind('reports.csv', CsvReport::class);
$this->app->bind('reports.pdf', PdfReport::class);
$this->app->tag(['reports.csv', 'reports.pdf'], 'reports');

// CsvReport does not implement ReportGeneratorInterface — runtime type error
```
---
## Good Example
```php
$this->app->bind('reports.csv', CsvReport::class); // implements ReportGeneratorInterface
$this->app->bind('reports.pdf', PdfReport::class); // implements ReportGeneratorInterface
$this->app->tag(['reports.csv', 'reports.pdf'], 'reports');
```
---
## Exceptions
When tagged services are consumed via duck-typing or method-based dispatch (no interface contract).
---
## Consequences Of Violation
Runtime type errors; method calls on non-implementing objects; hard-to-debug failures.

---

# Avoid Over-Tagging — Only Tag When Multiple Implementations Exist
---
## Category
Maintainability
---
## Rule
Only use tagged bindings when there are multiple implementations of an interface that should be collected together. Do not tag single implementations "for future flexibility."
---
## Reason
Tags add indirection and complexity. A single implementation should be injected directly via constructor injection. Premature tagging creates maintenance overhead without benefit.
---
## Bad Example
```php
$this->app->bind('report.csv', CsvReport::class);
$this->app->tag('report.csv', 'reports');
// Only one implementation — no need for a tag
```
---
## Good Example
```php
// Direct injection for single implementation
class ReportController
{
    public function __construct(
        private CsvReport $report, // No tag needed
    ) {}
}
```
---
## Exceptions
When a package or plugin system is expected to register additional implementations under the tag in the future.
---
## Consequences Of Violation
Unnecessary indirection; harder to follow dependency graph; premature abstraction.
