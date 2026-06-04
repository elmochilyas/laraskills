# Phase 5: Rules — Error Type Taxonomy

## Rule: Classify All Custom Exceptions into Exactly One of Three Categories
---
## Category
Architecture | Code Organization
---
## Rule
Always extend exactly one of the three abstract base classes — `OperationalException`, `ProgrammerException`, or `InfrastructureException` — for every custom exception; never extend `ApiException` directly.
---
## Reason
The category base class determines the error's automated handling strategy (alert routing, retry policy, response shape). Bypassing the category forces the handler to inspect the exception, defeating the purpose of the taxonomy.
---
## Bad Example
```php
// Direct extension — no category classification
class UserNotFoundException extends ApiException {}
// Handler cannot determine category without inspecting internals
```
---
## Good Example
```php
// Extends the correct category — self-classifying
class UserNotFoundException extends OperationalException {}
class DatabaseConnectionException extends InfrastructureException {}
class NullPointerException extends ProgrammerException {}
```
---
## Exceptions
Library or package exceptions that must extend a vendor base class; map them to a category in the handler's `classify()` method.
---
## Consequences Of Violation
Handler must use fallback classification; alert routing defaults to wrong severity; retry policies misapplied.

---

## Rule: Use instanceof for Classification, Never Reflection or String Matching
---
## Category
Performance | Reliability
---
## Rule
Always use `instanceof` checks for error category classification; never use reflection, string matching on class names, or convention-based classification.
---
## Reason
`instanceof` is O(1), compiler-verified, and survives refactoring. String matching breaks when classes are renamed; reflection is slow and fragile.
---
## Bad Example
```php
// String matching — breaks on rename
$category = match (true) {
    str_contains($e::class, 'Operational') => ErrorCategory::Operational,
    default => ErrorCategory::Programmer,
};
```
---
## Good Example
```php
// instanceof — stable, fast, compiler-checked
public function classify(Throwable $e): ErrorCategory
{
    return match (true) {
        $e instanceof OperationalException => ErrorCategory::Operational,
        $e instanceof ProgrammerException => ErrorCategory::Programmer,
        $e instanceof InfrastructureException => ErrorCategory::Infrastructure,
        default => ErrorCategory::Programmer, // safe fallback
    };
}
```
---
## Exceptions
Third-party exceptions that don't extend your base hierarchy; map them explicitly in a match expression with FQCN keys.
---
## Consequences Of Violation
Classification breaks on class rename; classification logic is invisible to static analysis; runtime errors from misclassified exceptions.

---

## Rule: Never Classify Programmer Errors as Operational
---
## Category
Reliability | Maintainability
---
## Rule
Always classify bugs — null pointers, type errors, logic mistakes — as `ProgrammerException`; never mark them as `OperationalException` to reduce alert noise.
---
## Reason
Programmer errors require code changes to fix. Classifying them as operational silences the alert, making bugs invisible. They never get fixed and accumulate into degraded reliability.
---
## Bad Example
```php
// Bug classified as operational to avoid pager duty alert
class NullPointerException extends OperationalException {}
// No alert — bug lives forever in production
```
---
## Good Example
```php
class NullPointerException extends ProgrammerException {}
// Correct classification triggers on-call alert → fix deployed
```
---
## Exceptions
Known third-party package bugs that are already tracked upstream and have a scheduled fix; document and revisit quarterly.
---
## Consequences Of Violation
Bugs silently accumulate in production; reliability degrades without detection; customers experience unexplained failures without investigation.

---

## Rule: Tag Every Error Log Line with the Error Category
---
## Category
Maintainability | Reliability
---
## Rule
Always include the `error_category` tag in every error log entry; never log errors without category context.
---
## Reason
Category tags enable dashboard filtering, alert routing, and trend analysis. Without category context, operators cannot filter logs by error type or detect category-specific trends.
---
## Bad Example
```php
Log::error('Database connection failed', [
    'trace_id' => $traceId,
    // Missing error_category — cannot filter by type
]);
```
---
## Good Example
```php
Log::error('Database connection failed', [
    'trace_id' => $traceId,
    'error_category' => ErrorCategory::Infrastructure->value,
    'error_code' => ErrorCodes::SYSTEM_DATABASE_ERROR,
]);
```
---
## Exceptions
No common exceptions — all error logs must carry category context.
---
## Consequences Of Violation
Log dashboards cannot filter by error type; trend analysis impossible; operators cannot set category-specific alerts.

---

## Rule: Map Every Third-Party Exception Explicitly to a Category
---
## Category
Reliability | Maintainability
---
## Rule
Always register an explicit mapping in the handler's `classify()` method for every third-party package exception that could reach the handler; never let them fall through to the default category.
---
## Reason
Unmapped third-party exception classes fall into the default category (usually Programmer), which may have incorrect alert routing, retry policy, and response shape for the actual error type.
---
## Bad Example
```php
public function classify(Throwable $e): ErrorCategory
{
    // Package exceptions not mapped — fall through to default
    return match (true) {
        $e instanceof OperationalException => ErrorCategory::Operational,
        default => ErrorCategory::Programmer, // GuzzleException lands here
    };
}
```
---
## Good Example
```php
public function classify(Throwable $e): ErrorCategory
{
    return match (true) {
        $e instanceof OperationalException    => ErrorCategory::Operational,
        $e instanceof ProgrammerException     => ErrorCategory::Programmer,
        $e instanceof InfrastructureException => ErrorCategory::Infrastructure,
        // Third-party mappings:
        $e instanceof GuzzleHttp\Exception\ConnectException => ErrorCategory::Infrastructure,
        $e instanceof Predis\Connection\ConnectionException => ErrorCategory::Infrastructure,
        $e instanceof Spatie\Permission\Exceptions\UnauthorizedException => ErrorCategory::Operational,
        default => ErrorCategory::Programmer,
    };
}
```
---
## Exceptions
No common exceptions — all third-party exceptions must be mapped.
---
## Consequences Of Violation
Third-party errors get wrong alert routing; retryable infrastructure errors don't trigger retry; operational auth errors trigger on-call alerts.

---

## Rule: Use Abstract Base Classes, Not Enums, for the Exception Hierarchy
---
## Category
Code Organization | Reliability
---
## Rule
Always enforce error type classification through abstract base class extension (`OperationalException`, `ProgrammerException`, `InfrastructureException`); never use an enum field on a single exception class to indicate category.
---
## Reason
Abstract base classes are compiler-enforced — you cannot accidentally omit the category; the `instanceof` check is O(1) and type-safe. Enum fields can be forgotten or set incorrectly at runtime.
---
## Bad Example
```php
// Enum field — can be omitted or set wrong
class ApiException extends \RuntimeException
{
    public function __construct(
        public readonly ErrorCategory $category = ErrorCategory::Programmer, // Default may be wrong
        // ...
    ) {}
}
// throw new ApiException(...) — no compiler error if category is wrong
```
---
## Good Example
```php
// Base classes enforce classification at the type level
abstract class OperationalException extends ApiException {}
abstract class ProgrammerException extends ApiException {}
abstract class InfrastructureException extends ApiException {}
// throw new UserNotFoundException() — automatically Operational
```
---
## Exceptions
No common exceptions — base class extension is the correct pattern for type-enforced classification.
---
## Consequences Of Violation
Runtime misclassification when enum field is omitted or incorrectly set; no static analysis can catch wrong categories; inconsistent handling.

---

## Rule: Review Taxonomy Quarterly
---
## Category
Maintainability | Reliability
---
## Rule
Always review the error type taxonomy quarterly to reclassify errors that have changed nature — transient errors that became permanent, permanent errors that became transient — and consolidate duplicate categories.
---
## Reason
Error patterns change as the system evolves. An infrastructure error (external API timeout) may become a permanent operational error (the API is removed). Stale classifications lead to incorrect alert routing and retry policies.
---
## Bad Example
```php
// 2024: VatService was an external API — Infrastructure
// 2026: VatService is now an internal microservice — still tagged Infrastructure
class VatServiceTimeoutException extends InfrastructureException {}
// Should be Operational now — different retry owner
```
---
## Good Example
```php
// Quarterly review identifies: VatService is now internal, timeouts are operational
class VatServiceTimeoutException extends OperationalException {}
// Correct retry ownership: on-call dev → internal ops team
```
---
## Exceptions
Mature systems with stable error patterns; review annually if no classification changes have occurred for 2+ years.
---
## Consequences Of Violation
Stale classifications cause wrong alert routing; retry policies target wrong teams; taxonomy drifts into unusability.
