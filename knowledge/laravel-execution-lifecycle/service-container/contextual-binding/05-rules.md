# Contextual Binding — Rules

## Use Contextual Binding Instead of Factory Methods for Interface Variation
---
## Category
Architecture
---
## Rule
Prefer `when()->needs()->give()` over factory closures or `if` statements when different consumers need different implementations of the same interface.
---
## Reason
Contextual binding eliminates conditional wiring logic from service providers and consumers. The `when()->needs()->give()` pattern makes per-consumer variation explicit, adheres to the Open/Closed Principle, and keeps consumer constructors clean — they type-hint a single interface while receiving context-appropriate implementations.
---
## Bad Example
```php
// Consumer decides which implementation to use
class ReportController {
    public function __construct(protected Container $container) {}

    public function show(): Response {
        $formatter = $this->container->make(PdfReportFormatter::class);
    }
}

class AnalyticsController {
    public function __construct(protected Container $container) {}

    public function show(): Response {
        $formatter = $this->container->make(CsvReportFormatter::class);
    }
}
```
---
## Good Example
```php
// Contextual binding defines per-consumer variation
$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(PdfReportFormatter::class);

$this->app->when(AnalyticsController::class)
    ->needs(ReportFormatter::class)
    ->give(CsvReportFormatter::class);

// Both controllers type-hint ReportFormatter — no factory logic
```
---
## Exceptions
When all consumers need the same implementation — use standard `bind()`.
---
## Consequences Of Violation
Maintainability: duplicated factory logic across consumers. Architecture: consumers know about concrete implementations, violating the Dependency Inversion Principle.

---

## Do Not Use Contextual Binding for Runtime Request Data
---
## Category
Architecture
---
## Rule
Do not use contextual binding when the binding decision depends on runtime request data — use middleware + scoped binding instead.
---
## Reason
Contextual binding is resolved at construction time based on the consumer class identity. It cannot inspect request data, headers, or authentication state. For runtime-dependent decisions, a middleware that sets a scoped binding after inspecting the request provides the correct implementation per-request.
---
## Bad Example
```php
// Cannot work — contextual binding is consumer-based, not request-based
$this->app->when(ReportController::class)
    ->needs(ExportFormat::class)
    ->give(function () {
        return request()->query('format') === 'pdf'
            ? new PdfExportFormat()
            : new CsvExportFormat();
    });
// Closure is resolved once per consumer, not once per request
```
---
## Good Example
```php
// Middleware reads request and sets scoped binding
class ExportFormatMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $format = $request->query('format') === 'pdf'
            ? new PdfExportFormat()
            : new CsvExportFormat();

        app()->scoped(ExportFormat::class, fn() => $format);

        return $next($request);
    }
}

// Controller type-hints ExportFormat — gets request-appropriate implementation
```
---
## Exceptions
No common exceptions — contextual binding is consumer-based, not request-based.
---
## Consequences Of Violation
Reliability: wrong implementation injected when conditional logic depends on request-time context.

---

## Understand That Cached Singletons Bypass Contextual Binding
---
## Category
Framework Usage
---
## Rule
Design singleton services to be truly context-independent — cached singletons bypass contextual binding checks.
---
## Reason
Contextual binding is checked in `resolve()` before the instances cache for contextual builds. If the same abstract has already been cached as a singleton from a different context, the cached instance is returned regardless of the current consumer's contextual rule. This is by design — singletons are process-global.
---
## Bad Example
```php
$this->app->singleton(ReportFormatter::class, PdfReportFormatter::class);

$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(CsvReportFormatter::class);
// ReportController resolves first: gets CsvReportFormatter (cached as singleton)
// Later make(ReportFormatter::class) returns CsvReportFormatter — unexpected
```
---
## Good Example
```php
// Use bind() if different contexts need different instances:
$this->app->bind(ReportFormatter::class, PdfReportFormatter::class);

$this->app->when(ReportController::class)
    ->needs(ReportFormatter::class)
    ->give(CsvReportFormatter::class);
// Each context gets its own instance; no cache conflict
```
---
## Exceptions
When the singleton is accessed through the canonical abstract in only one context and all consumers use contextual rules.
---
## Consequences Of Violation
Reliability: unexpected instance sharing where contextual binding appears to not work because of singleton caching.

---

## Use $ Prefix for Primitive Parameter Contextual Binding
---
## Category
Framework Usage
---
## Rule
Prefix the constructor parameter name with `$` when using contextual binding for primitive values: `needs('$parameterName')`.
---
## Reason
The `needs()` method matches the exact constructor parameter name for primitives. Parameter names in PHP reflection do not include the `$` prefix, but Laravel's contextual binding API requires it as a convention to distinguish primitive parameters from class type-hints.
---
## Bad Example
```php
class ReportController {
    public function __construct(protected int $resultsPerPage) {}
}

$this->app->when(ReportController::class)
    ->needs('resultsPerPage') // Missing $ prefix — binding never matches
    ->give(50);
// $resultsPerPage receives default value, not 50
```
---
## Good Example
```php
$this->app->when(ReportController::class)
    ->needs('$resultsPerPage') // $ prefix required for primitives
    ->give(50);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: contextual binding silently ignored, primitive receives its default value instead of the intended override.

---

## Test Contextual Bindings Explicitly
---
## Category
Testing
---
## Rule
Write a test that resolves each consumer with contextual bindings and asserts the correct concrete implementation is injected.
---
## Reason
Contextual bindings have no compile-time validation — a typo in the consumer class name or abstract name silently registers a rule that never matches. A resolution test per consumer confirms the binding is correctly wired.
---
## Bad Example
```php
$this->app->when(ReportController::class) // Typo: "ReportContrller"
    ->needs(ReportFormatter::class)
    ->give(PdfReportFormatter::class);
// No test — the typo goes unnoticed until runtime
```
---
## Good Example
```php
class ContextualBindingTest extends TestCase {
    public function test_report_controller_gets_pdf_formatter(): void {
        $controller = $this->app->make(ReportController::class);

        $reflection = new ReflectionClass($controller);
        $formatter = $reflection->getProperty('formatter');
        $formatter->setAccessible(true);

        $this->assertInstanceOf(
            PdfReportFormatter::class,
            $formatter->getValue($controller)
        );
    }

    public function test_analytics_controller_gets_csv_formatter(): void {
        $controller = $this->app->make(AnalyticsController::class);

        $reflection = new ReflectionClass($controller);
        $formatter = $reflection->getProperty('formatter');
        $formatter->setAccessible(true);

        $this->assertInstanceOf(
            CsvReportFormatter::class,
            $formatter->getValue($controller)
        );
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: misconfigured contextual bindings reach production. Debugging: silent failures where the default implementation is used instead of the intended context-specific one.

---

## Avoid Overusing Contextual Binding — Consider Separate Interfaces
---
## Category
Architecture
---
## Rule
If more than 3 consumers need different implementations of the same interface, consider defining separate interfaces instead of using contextual binding.
---
## Reason
Contextual binding scales by consumer identity, not by capability. When many consumers each need unique implementations, the contextual binding registry becomes a maintenance burden — every new consumer requires a new rule. Separate interfaces (`PdfExport`, `CsvExport`) make dependencies explicit and eliminate the need for per-consumer wiring.
---
## Bad Example
```php
// 5+ contextual rules for the same interface — fragile registry
$this->app->when(AController::class)->needs(Export::class)->give(PdfExport::class);
$this->app->when(BController::class)->needs(Export::class)->give(CsvExport::class);
$this->app->when(CController::class)->needs(Export::class)->give(JsonExport::class);
// Every new consumer adds a rule — easy to miss
```
---
## Good Example
```php
// Separate interfaces — consumers declare their own dependency
interface PdfExport {}
interface CsvExport {}
interface JsonExport {}

$this->app->bind(PdfExport::class, PdfExportService::class);
$this->app->bind(CsvExport::class, CsvExportService::class);
$this->app->bind(JsonExport::class, JsonExportService::class);

// Consumers type-hint what they need — no contextual rules
```
---
## Exceptions
When the interface is from a third-party package and cannot be split into separate interfaces.
---
## Consequences Of Violation
Maintainability: growing contextual binding registry that must be updated for every new consumer. Reliability: missing contextual rules silently fall back to the default implementation.
