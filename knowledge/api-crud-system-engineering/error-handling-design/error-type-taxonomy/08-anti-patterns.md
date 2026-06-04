# Anti-Patterns — Error Type Taxonomy

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Error Type Taxonomy |
| Difficulty | Intermediate |
| Category | Conceptual / Foundational |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Single Catch-All Category | Critical | High | Code review: all exceptions handled identically |
| Classification by HTTP Status Code | High | Medium | Code review: 500 classified as operational vs programmer based on status |
| No Default Classification | High | Medium | Code review: unmapped exceptions fall to a black hole |
| Classifying Programmer Errors as Operational | Critical | Medium | Code review: bugs marked as expected |
| Dynamic Classification via Reflection | Medium | Low | Code review: error category resolved at runtime by class name |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Classification for Third-Party Exceptions | Library exceptions unmapped | Silent failures with no recovery action |
| Mixing Infrastructure with Operational | DB failures treated as normal operational errors | Wrong alert routing and escalation paths |
| Over-Classification | Creating 10+ subcategories | Taxonomy becomes unmaintainable |

---

## Anti-Pattern Details

### AP-ETT-01: Single Catch-All Category

**Description**: All exceptions — validation errors, database failures, null pointer bugs, auth failures — are treated identically with no categorization. The error handler has one path for all exceptions. There is no differentiated logging, alerting, or response strategy based on error type.

**Root Cause**: The developer never establishes an error taxonomy. All exceptions go through the same handler with the same treatment. "An error is an error."

**Impact**:
- Operational errors (expected) trigger the same alerting as programmer errors (bugs)
- Infrastructure errors (transient) get the same retry treatment as programmer errors (permanent)
- No differentiated monitoring: you can't filter by error category
- Incident response cannot prioritize by error type

**Detection**:
- Code review: no `instanceof` checks or category matching in the handler
- Code review: all exceptions go through the same `render()` logic
- Monitoring: cannot filter alerts by "operational vs programmer" because no category exists

**Solution**:
- Establish a three-category taxonomy: Operational, Programmer, Infrastructure
- Create abstract base classes for each category
- The handler checks the category for differentiated logging, alerting, and rendering
- Every custom exception must extend one of the three base classes

**Example**:
```php
// BEFORE: Single catch-all
class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e): JsonResponse
    {
        return response()->json([
            'error' => ['message' => $e->getMessage()], // ❌ same for all
        ], 500);
    }
}

// AFTER: Category-based handling
abstract class ApiException extends \RuntimeException
{
    abstract public function getCategory(): ErrorCategory;
}
class OperationalException extends ApiException { /* ... */ }
class ProgrammerException extends ApiException { /* ... */ }
class InfrastructureException extends ApiException { /* ... */ }

class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e): JsonResponse
    {
        $category = $this->classify($e);
        if ($category === ErrorCategory::Programmer) {
            Log::critical('Programmer error detected', ['exception' => $e]);
            // alert on-call
        }
        // ...differentiated handling per category
    }
}
```

---

### AP-ETT-02: Classifying Programmer Errors as Operational

**Description**: A bug (null pointer, unhandled edge case, type error) is classified as an operational error because the developer doesn't want to trigger on-call alerts. The error is marked as "expected," silenced, and never fixed. Bugs become invisible — the system degrades silently.

**Root Cause**: Alert fatigue avoidance. The developer classifies errors to reduce noise, but misclassifying bugs as operational means they never get fixed.

**Impact**:
- Bugs accumulate silently — no one knows the system has logic errors
- User-facing errors from bugs are hidden behind generic "something went wrong" messages
- Error tracking groups bugs with expected operational errors, making them invisible
- System reliability degrades because root causes are never addressed

**Detection**:
- Code review: `ProgrammerException` or similar never extended — all errors are operational
- Code review: `catch (\Throwable)` blocks that log and continue (swallowing bugs)
- Error tracking: 0% programmer errors — suspicious, every system has bugs

**Solution**:
- Classify errors accurately: operational = expected, programmer = bug, infrastructure = environment
- Set lower alert severity for programmer errors if on-call fatigue is a concern (P2 instead of P1)
- Never silence programmer errors — every bug must be visible and trackable
- Review classification quarterly to ensure accuracy

**Example**:
```php
// BEFORE: Classifying programmer errors as operational
class OrderService
{
    public function calculateTotal(array $items): float
    {
        try {
            // may throw TypeError if items is malformed
            return array_sum(array_column($items, 'price'));
        } catch (Throwable $e) {
            throw new OperationalException('Calculation failed', previous: $e); // ❌ bug classified as operational
        }
    }
}

// AFTER: Accurate classification
class OrderService
{
    public function calculateTotal(array $items): float
    {
        try {
            return array_sum(array_column($items, 'price'));
        } catch (Throwable $e) {
            throw new ProgrammerException('Invalid items structure', previous: $e); // ✅ accurately classified
        }
    }
}
```

---

### AP-ETT-03: No Classification for Third-Party Exceptions

**Description**: Exceptions thrown by third-party packages (Guzzle exceptions, Redis exceptions, Stripe API errors) are not mapped to any error category. They fall through the handler without classification. The error may be logged and returned as a generic 500 with no category information.

**Root Cause**: The developer only classifies their own custom exceptions. Package exceptions are assumed to be "someone else's problem."

**Impact**:
- Third-party errors are invisible in category-based monitoring
- Package exceptions cannot trigger differentiated responses (retry for transient, alert for permanent)
- Handler falls through to default behavior, which may be inappropriate (non-JSON response)
- Error tracking shows "unclassified" errors that are ignored

**Detection**:
- Code review: no mapping for `GuzzleException`, `RedisException`, `StripeException`
- Error tracking: `ErrorCategory: unknown` or similar for a significant portion of errors
- Monitoring: cannot filter by "infrastructure" because third-party errors aren't classified

**Solution**:
- Map every third-party exception explicitly in the handler
- Classify each based on its semantics (Guzzle timeout = infrastructure, Stripe card declined = operational)
- Create a central mapping for all third-party exceptions
- Review mappings when adding new packages

**Example**:
```php
// BEFORE: Third-party exceptions not classified
class Handler extends ExceptionHandler
{
    public function classify(Throwable $e): ErrorCategory
    {
        return match (true) {
            $e instanceof OperationalException => ErrorCategory::Operational,
            $e instanceof ProgrammerException => ErrorCategory::Programmer,
            $e instanceof InfrastructureException => ErrorCategory::Infrastructure,
            default => ErrorCategory::Programmer, // ❌ guess — likely wrong for third-party
        };
    }
}

// AFTER: Explicit third-party mappings
class Handler extends ExceptionHandler
{
    public function classify(Throwable $e): ErrorCategory
    {
        return match (true) {
            $e instanceof OperationalException => ErrorCategory::Operational,
            $e instanceof ProgrammerException => ErrorCategory::Programmer,
            $e instanceof InfrastructureException => ErrorCategory::Infrastructure,
            $e instanceof GuzzleException => ErrorCategory::Infrastructure,     // ✅ third-party mapped
            $e instanceof RedisException => ErrorCategory::Infrastructure,       // ✅ third-party mapped
            $e instanceof Stripe\Exception\CardException => ErrorCategory::Operational, // ✅
            default => ErrorCategory::Programmer,
        };
    }
}
```
