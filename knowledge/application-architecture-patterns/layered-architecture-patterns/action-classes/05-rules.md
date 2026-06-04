# Rules: Action Classes

## Rule 1 — Action Has Single Public Method

**Rule Name:** action-has-single-public-method
**Category:** Always
**Rule:** Action classes must have exactly one public method: `__invoke()`.
**Reason:** Multiple public methods indicate multiple responsibilities. Actions represent a single operation.
**Bad Example:**
```php
class CouponAction
{
    public function validate(string $code): bool { /* ... */ }
    public function apply(string $code, int $orderId): void { /* ... */ }
}
```
**Good Example:**
```php
class ValidateCouponAction
{
    public function __invoke(string $code): bool { /* ... */ }
}
```
**Exceptions:** Methods required by a framework interface (e.g., `middleware()`, `boot()`) are acceptable.

## Rule 2 — Action Is Stateless

**Rule Name:** action-is-stateless
**Category:** Always
**Rule:** Action classes must have no mutable properties. All state must be local to `__invoke()`.
**Reason:** Stateless design ensures Octane safety, test determinism, and no cross-request contamination.
**Bad Example:**
```php
class ProcessPaymentAction
{
    private float $total; // Mutable state
    public function __invoke(array $items): void
    {
        $this->total = array_sum($items); // Side effect on property
    }
}
```
**Good Example:**
```php
class ProcessPaymentAction
{
    public function __invoke(array $items): void
    {
        $total = array_sum($items); // Local variable
    }
}
```
**Exceptions:** None — this is a hard design constraint.

## Rule 3 — Route Directly to Action

**Rule Name:** route-directly-to-action
**Category:** Prefer
**Rule:** Prefer routing directly to Action classes: `Route::post('/path', MyAction::class)`.
**Reason:** Direct routing eliminates controller overhead and makes the route-action relationship explicit.
**Bad Example:**
```php
// Controller as intermediary
Route::post('/validate', [CouponController::class, 'validate']);
```
**Good Example:**
```php
// Direct route to Action
Route::post('/validate', ValidateCouponAction::class);
```
**Exceptions:** When the endpoint needs multiple operations handled by a single controller, use a controller.

## Rule 4 — Keep Action Constructor Lean

**Rule Name:** keep-action-constructor-lean
**Category:** Prefer
**Rule:** Action classes should have 1-3 constructor dependencies. Extract to Use Case when exceeding 4.
**Reason:** Many dependencies indicate the Action has grown beyond its intended scope.
**Bad Example:**
```php
class ProcessOrderAction
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $gateway,
        private InventoryService $inventory,
        private NotificationService $notifications,
        private AuditLogger $logger,
        private MetricsCollector $metrics,
    ) {}
}
```
**Good Example:**
```php
// Extract to Use Case or Service
class ProcessOrderUseCase
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $gateway,
        private InventoryService $inventory,
        private NotificationService $notifications,
        private AuditLogger $logger,
        private MetricsCollector $metrics,
    ) {}
}
```
**Exceptions:** When the Action genuinely needs multiple infrastructure dependencies and extracting would create artificial grouping.

## Rule 5 — Extract to Use Case When Complex

**Rule Name:** extract-to-use-case-when-complex
**Category:** Always
**Rule:** Extract an Action to a Use Case when it accumulates private helper methods or exceeds 30 lines.
**Reason:** Private methods in Actions indicate unexpressed structure. Use Cases provide proper DTO and transaction support.
**Bad Example:**
```php
class GenerateReportAction
{
    public function __invoke(Input $input): Result
    {
        $data = $this->fetchData($input);
        $transformed = $this->transform($data);
        $aggregated = $this->aggregate($transformed);
        return $this->format($aggregated);
    }
    private function fetchData(Input $input): array { /* ... */ }
    private function transform(array $data): array { /* ... */ }
    private function aggregate(array $data): array { /* ... */ }
    private function format(array $data): Result { /* ... */ }
}
```
**Good Example:**
```php
// Use Case with explicit orchestration
class GenerateReportUseCase
{
    public function __construct(
        private DataFetcher $fetcher,
        private DataTransformer $transformer,
        private AggregationService $aggregator,
        private ReportFormatter $formatter,
    ) {}
    public function execute(GenerateReportInput $input): ReportResult { /* ... */ }
}
```
**Exceptions:** Private methods that are simple formatting or mapping (2-3 lines) are acceptable.

## Rule 6 — Action Is Final

**Rule Name:** action-is-final
**Category:** Always
**Rule:** Action classes must be declared `final`.
**Reason:** Actions are designed for single-purpose execution, not extension. Inheritance would indicate shared behavior that belongs in a dependency.
**Bad Example:**
```php
class ValidateCouponAction { /* ... */ }
class ExtendedValidateCouponAction extends ValidateCouponAction { /* ... */ }
```
**Good Example:**
```php
final class ValidateCouponAction { /* ... */ }
```
**Exceptions:** When the Action implements a framework interface that requires proxy generation (rare).

## Rule 7 — Action Returns Meaningful Result

**Rule Name:** action-returns-meaningful-result
**Category:** Always
**Rule:** Actions must return a meaningful result — a DTO, value, or boolean. Void-returning Actions are an anti-pattern.
**Reason:** Void return hides success/failure, complicates testing, and masks error states.
**Bad Example:**
```php
final class SendWelcomeEmailAction
{
    public function __invoke(User $user): void
    {
        Mail::to($user)->send(new WelcomeMail($user));
    }
}
```
**Good Example:**
```php
final class SendWelcomeEmailAction
{
    public function __invoke(User $user): EmailResult
    {
        Mail::to($user)->send(new WelcomeMail($user));
        return new EmailResult(sent: true, recipient: $user->email);
    }
}
```
**Exceptions:** Actions that dispatch events and have no synchronous result to return (eventual consistency).

## Rule 8 — Test Action Without HTTP Bootstrap

**Rule Name:** test-action-without-http
**Category:** Always
**Rule:** Action classes must be testable without bootstrapping Laravel's HTTP kernel.
**Reason:** HTTP-independent testing enables fast unit tests and confirms framework independence.
**Bad Example:**
```php
public function test_validate_coupon(): void
{
    $response = $this->post('/coupon/validate', ['code' => 'SAVE10']);
    $response->assertJson(['valid' => true]);
}
```
**Good Example:**
```php
public function test_validate_coupon(): void
{
    $action = new ValidateCouponAction(
        $this->createMock(CouponRepository::class),
    );
    $result = $action('SAVE10', 42);
    expect($result->isValid)->toBeTrue();
}
```
**Exceptions:** Integration tests that verify the full stack may use HTTP tests in addition to unit tests.
