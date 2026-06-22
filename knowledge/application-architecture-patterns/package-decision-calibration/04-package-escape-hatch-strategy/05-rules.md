# Rules for Package Escape Hatch Strategy

## Design the Escape Hatch Before the First Integration
---
## Category
Architecture | Risk Management
---
## Rule
Design the escape hatch for a package before writing the first line of integration code. The escape hatch architecture — the interface, the adapter's escape methods, the container binding — should exist from day one, even if the escape methods are empty stubs.
---
## Reason
Escape hatches retrofitted under pressure (e.g., "Stripe Connect is going live tomorrow, Cashier doesn't support it") create dual code paths where business logic branches on "use package" vs. "escape." Escape hatches designed first are clean architectural seams inside the adapter, invisible to business logic. The design cost upfront is 20-30 minutes; the retrofit cost under time pressure is days of risky surgery.
---
## Bad Example
```php
// No escape hatch designed. Cashier used directly everywhere.
$user->newSubscription('default', 'price_monthly')->create($pmId);

// Pressure hits: need Stripe Connect. Retrofit escape:
class OrderController
{
    public function charge(Request $request) {
        if ($request->isConnectTransfer) {
            $stripe = new StripeClient(config('services.stripe.secret'));
            return $stripe->transfers->create(/* ... */);
        }
        // Normal Cashier path
        return $user->charge($request->amount, $request->paymentMethod);
    }
}
// Two code paths in controller — inconsistent, hard to maintain
```
---
## Good Example
```php
// Day 1: Escape hatch designed in adapter
class StripeCashierAdapter implements BillingGateway
{
    public function __construct(
        private StripeClient $stripe, // Escape hatch dependency
    ) {}

    public function charge(Money $amount, PaymentMethod $method): ChargeResult
    {
        if ($this->isConnectTransfer($method)) {
            // Escape hatch: Cashier doesn't support Connect
            Log::info('billing.escape_hatch.activated', [
                'method' => 'charge',
                'reason' => 'stripe_connect_transfer',
            ]);
            return $this->chargeViaStripeDirect($amount, $method);
        }
        return $this->chargeViaCashier($amount, $method);
    }

    private function chargeViaStripeDirect(Money $amount, PaymentMethod $method): ChargeResult
    {
        // Implemented when needs arise
    }
}

// Business logic unchanged — doesn't know about escape
class OrderService
{
    public function __construct(private BillingGateway $gateway) {}
    public function placeOrder(PlaceOrderDto $dto): Order
    {
        $result = $this->gateway->charge($dto->amount, $dto->paymentMethod);
        // Single code path regardless of whether Cashier or escape is used
    }
}
```
---
## Exceptions
When the package is adopted on a trial basis with the explicit understanding that it may be fully replaced within weeks, designing a permanent escape hatch may be premature. In this case, isolating the package behind an interface is sufficient — the interface itself is the escape mechanism.
---
## Consequences Of Violation
Escape hatches built under pressure bifurcate the codebase. Business logic contains `if (use_escape)` branches. Every new feature touching the package must be implemented twice. The codebase accrues parallel code paths that diverge in behavior over time.

## Use the Same Interface for Both the Package Path and the Escape Hatch Path
---
## Category
Architecture | Maintainability
---
## Rule
Both the normal package path and the escape hatch path must implement the same application-owned interface. If both paths implement `BillingGateway`, switching between them is transparent to business logic. The adapter absorbs the difference.
---
## Reason
When the escape hatch uses a different interface or is called directly from business logic, consumers must know which path is active. This creates conditional code everywhere: controllers, services, event listeners. A single interface behind both paths eliminates this branching — business logic calls `$gateway->charge()`, and the adapter decides internally whether to use Cashier or direct Stripe.
---
## Bad Example
```php
// Escape hatch bypasses the interface
class OrderService
{
    public function __construct(
        private BillingGateway $gateway,
        private StripeClient $stripe, // Escape hatch dependency in business logic
    ) {}

    public function placeOrder(PlaceOrderDto $dto): void
    {
        if ($dto->isMarketplacePayout) {
            $this->stripe->transfers->create(/* ... */); // Escape outside interface
        } else {
            $this->gateway->charge(/* ... */); // Interface path
        }
    }
}
```
---
## Good Example
```php
// Both paths behind the same interface
class OrderService
{
    public function __construct(
        private BillingGateway $gateway, // Only dependency
    ) {}

    public function placeOrder(PlaceOrderDto $dto): void
    {
        // Business logic knows nothing about which path is active
        $result = $this->gateway->charge($dto->amount, $dto->paymentMethod);
    }
}

// Adapter handles the branching internally
class StripeCashierAdapter implements BillingGateway
{
    public function charge(Money $amount, PaymentMethod $method): ChargeResult
    {
        if ($this->isConnectTransfer($method)) {
            return $this->chargeViaStripeDirect($amount, $method); // Escape
        }
        return $this->chargeViaCashier($amount, $method); // Normal
    }
}
```
---
## Exceptions
When the escape hatch involves an entirely different protocol or paradigm (e.g., switching from synchronous HTTP to async messaging), a single interface may not cleanly cover both paths. In these cases, a strategy pattern or separate interface may be more appropriate — but this is a conscious architectural choice, not an accidental leakage.
---
## Consequences Of Violation
The escape hatch creates a parallel code path visible to all consumers. Every feature has two implementations. Bugs fixed in one path are not fixed in the other. The codebase accumulates technical debt that accelerates over time.

## Limit Escape Hatch Surface to 2-3 Methods
---
## Category
Architecture | Risk Management
---
## Rule
An escape hatch should cover only the 2-3 methods that the package genuinely cannot handle. If 10+ methods need the escape hatch, the package doesn't fit — the escape hatch pattern should not be used to paper over fundamental package misfit.
---
## Reason
An escape hatch is a safety valve, not a second implementation. When escape hatch methods grow to cover a significant percentage of the interface, you are effectively maintaining two implementations of the same capability. The package's value becomes negative — it adds complexity without covering the majority of use cases.
---
## Bad Example
```php
// 12 methods, 8 need escape hatch — package doesn't fit
class PaymentAdapter implements BillingGateway
{
    public function subscribe() { /* escape */ }
    public function cancel() { /* package */ }
    public function charge() { /* escape */ }
    public function refund() { /* escape */ }
    public function invoice() { /* escape */ }
    public function portal() { /* package */ }
    public function prorate() { /* escape */ }
    public function trial() { /* escape */ }
    public function metered() { /* escape */ }
    public function tax() { /* escape */ }
    // 8/10 methods use escape hatch — the package is wrong
}
```
---
## Good Example
```php
// 5 methods, 1 needs escape hatch — package fits
class SearchAdapter implements SearchGateway
{
    public function search(string $query, array $filters): SearchResult
    {
        if ($this->needsComplexFilters($filters)) {
            return $this->searchViaEloquent($query, $filters); // Escape
        }
        return $this->searchViaScout($query); // Package
    }

    public function index(SearchableModel $model): void { /* package */ }
    public function delete(string $id): void { /* package */ }
    public function flush(): void { /* package */ }
    // 1/4 methods uses escape hatch — acceptable
}
```
---
## Exceptions
During an active migration from one package to another, the "escape hatch" may temporarily cover many methods while functionality moves incrementally. In this case, rename it from "escape hatch" to "migration adapter" to signal that it's a transitional state, not a permanent design.
---
## Consequences Of Violation
Silent package misfit. The team believes they're using the package but actually maintains a custom implementation for most flows. When the package is upgraded, the custom escape methods may break silently because nobody tests the escape path against new package versions.

## Log Every Escape Hatch Activation
---
## Category
Observability | Risk Management
---
## Rule
Every time the escape hatch is activated, log the event with at minimum: package name, method name, reason for escape, and relevant contextual data. Escape hatch usage is a signal that the package's fit is degrading.
---
## Reason
If escape hatches activate silently, the team has no visibility into how much of the system bypasses the package. When escape hatch usage crosses the 20% threshold, it should trigger a package re-evaluation. Without logging, escape hatch usage grows unnoticed until the package is providing negligible value and the escape hatch has become the de facto implementation.
---
## Bad Example
```php
public function charge(Money $amount, PaymentMethod $method): ChargeResult
{
    if ($this->needsEscape($method)) {
        return $this->chargeDirect($amount, $method); // No logging
    }
    return $this->chargeViaCashier($amount, $method);
}
```
---
## Good Example
```php
public function charge(Money $amount, PaymentMethod $method): ChargeResult
{
    if ($this->needsEscape($method)) {
        Log::info('billing.escape_hatch.activated', [
            'package' => 'cashier',
            'method' => 'charge',
            'reason' => 'stripe_connect_transfer',
            'amount' => $amount->toFloat(),
        ]);
        return $this->chargeDirect($amount, $method);
    }
    return $this->chargeViaCashier($amount, $method);
}
```
---
## Exceptions
Extremely high-throughput escape hatch paths may sample logs rather than logging every activation. Log 1/N activations or aggregate counts periodically rather than logging every call.
---
## Consequences Of Violation
Escape hatch usage grows silently. When the package is eventually replaced or upgraded, nobody knows which flows were escaping. The replacement may miss critical functionality that only existed in the escape path.

## Test Both Paths — Package Path and Escape Hatch Path
---
## Category
Testing | Reliability
---
## Rule
The escape hatch path must be tested to the same standard as the normal package path. If the escape hatch is untested, it will fail when you need it most. Write at least one integration test per escape hatch method from day one.
---
## Reason
Escape hatches often involve lower-level SDK calls that lack the package's built-in safety features (e.g., Cashier's idempotency key handling, webhook synchronization). Untested escape hatch code is more dangerous than untested package code because it lacks the package's community-vetted safeguards.
---
## Bad Example
```php
// Escape hatch method exists but is never tested
private function chargeViaStripeDirect(Money $amount, PaymentMethod $method): ChargeResult
{
    // Un tested, unverified path — will fail under production load
    return $this->stripe->charges->create([/* ... */]);
}
```
---
## Good Example
```php
// test('escape hatch handles Stripe Connect transfers', function () {
//     Http::fake(['api.stripe.com/*' => Http::response(['id' => 'tr_123', 'status' => 'succeeded'])]);
//     $adapter = new StripeCashierAdapter(new StripeClient('sk_test'));
//     $result = $adapter->charge(
//         Money::fromFloat(50.00),
//         PaymentMethod::connect('acct_123')
//     );
//     expect($result->status)->toBe('succeeded');
// });
```
---
## Exceptions
If the escape hatch path is identical to the package path except for a minor configuration difference (e.g., different API endpoint, same SDK), a single parameterized test covering both paths may be sufficient.
---
## Consequences Of Violation
The escape hatch activates for the first time under production load and fails. The safety net becomes a trap. The team loses confidence in the escape hatch and avoids using it, prolonging reliance on an ill-fitting package.
