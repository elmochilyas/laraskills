# Rules: Cashier + BillingGateway Wrapper Pattern

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Cashier + BillingGateway Wrapper Pattern

---

## Rule 1: All Billing Operations Must Go Through the BillingGateway Interface

**Category:** Architecture

**Rule:** Every billing operation — creating subscriptions, canceling, swapping plans, fetching invoices, creating checkout sessions — must go through the `BillingGateway` interface. Never call Laravel Cashier methods or Stripe SDK classes directly from controllers, actions, or jobs.

**Reason:** The interface isolates the application from the payment provider. If Stripe changes its API or Cashier changes its method signatures, only the gateway implementation changes. All callers are protected. The interface also provides a single mock point for testing.

**Bad Example:**
```php
// DANGER: Cashier called directly in controller — coupled, untestable without Stripe
class SubscriptionController
{
    public function store(Request $request)
    {
        $team = $request->team();
        $team->newSubscription('default', 'price_pro_monthly')->create($request->payment_method_id);
    }
}
```

**Good Example:**
```php
// Correct: all billing through the contract
class SubscriptionController
{
    public function __construct(private BillingGateway $gateway) {}

    public function store(StartSubscriptionRequest $request): JsonResponse
    {
        $result = $this->gateway->createSubscription(
            team: $request->team(),
            plan: Plan::where('slug', 'pro')->firstOrFail(),
            paymentMethod: $request->validated('payment_method_id'),
        );
        return response()->json(new SubscriptionResultResource($result), 201);
    }
}
```

**Exceptions:** The gateway implementation itself (`StripeCashierGateway`) is the single allowed place for Cashier and Stripe SDK calls. The escape hatch for Cashier-unhandled operations (e.g., Checkout Sessions) uses stripe-php directly — still inside the gateway.

**Consequences Of Violation:** Stripe API changes or Cashier updates require code changes across the entire codebase. Billing tests require complex Stripe mocking instead of a simple fake. New payment provider integration becomes a rewrite instead of a new gateway implementation.

---

## Rule 2: Return Application-Owned DTOs, Never Stripe/Cashier Objects

**Category:** Architecture

**Rule:** Every BillingGateway method must return application-owned DTOs (readonly classes) — never Stripe SDK objects (`Stripe\Subscription`, `Stripe\Invoice`) or Cashier models (`Laravel\Cashier\Subscription`).

**Reason:** Leaking vendor types through the interface couples every caller to the Stripe SDK. Replacing Stripe with another provider requires updating every method that receives the return value, not just the gateway.

**Bad Example:**
```php
// DANGER: leaks Stripe type — every caller imports Stripe SDK
interface BillingGateway
{
    public function getSubscription(Team $team): \Stripe\Subscription;
    public function getInvoices(Team $team): \Stripe\Collection;
}
```

**Good Example:**
```php
// Correct: application-owned DTOs isolate callers from Stripe
interface BillingGateway
{
    public function getSubscription(Team $team): SubscriptionData;
    public function getInvoices(Team $team, int $limit = 10): array; // InvoiceData[]
}

readonly class SubscriptionData
{
    public function __construct(
        public string $stripeId,
        public string $stripeStatus,
        public string $stripePriceId,
        public ?DateTimeInterface $trialEndsAt,
        public ?DateTimeInterface $currentPeriodEnd,
        public bool $cancelAtPeriodEnd,
    ) {}
}
```

**Exceptions:** Internal gateway helper methods that aren't part of the public interface. These can use Stripe/Cashier types since callers are still within the gateway boundary.

**Consequences Of Violation:** Every controller, action, and job that uses the gateway must import Stripe SDK classes. Switching payment providers (or even upgrading the Stripe SDK major version) becomes a cross-codebase refactor.

---

## Rule 3: Implement a FakeBillingGateway for Testing

**Category:** Testing

**Rule:** Create a `FakeBillingGateway` that implements the full `BillingGateway` interface with deterministic, in-memory behavior. Use it in all feature tests that exercise billing flows. Never mock the gateway with Mockery for feature tests.

**Reason:** A fake with real state (arrays tracking customers, subscriptions, invoices) lets you test billing flows end-to-end: create a subscription, check its status, cancel it, verify status changed. Mockery mocks require re-specifying behavior per test and don't enforce state consistency.

**Bad Example:**
```php
// DANGER: Mockery mock — fragile, no state consistency across test steps
$mock = Mockery::mock(BillingGateway::class);
$mock->shouldReceive('createSubscription')->once()->andReturn(new SubscriptionResult(...));
$mock->shouldReceive('getSubscription')->once()->andReturn(new SubscriptionData(...));
// What if getSubscription is called before createSubscription? No state enforcement.
```

**Good Example:**
```php
// Correct: stateful fake — behaves like the real thing
class FakeBillingGateway implements BillingGateway
{
    private array $subscriptions = [];
    public bool $shouldFail = false;

    public function createSubscription(Team $team, Plan $plan, ?string $pm = null): SubscriptionResult
    {
        if ($this->shouldFail) {
            return new SubscriptionResult(stripeSubscriptionId: '', status: 'incomplete', ...);
        }
        $subId = 'sub_fake_' . $team->id;
        $this->subscriptions[$team->id] = ['stripe_id' => $subId, 'status' => 'active', ...];
        return new SubscriptionResult(stripeSubscriptionId: $subId, status: 'active', ...);
    }

    public function getSubscription(Team $team): SubscriptionData
    {
        $sub = $this->subscriptions[$team->id] ?? throw new \RuntimeException('No subscription');
        return new SubscriptionData(stripeId: $sub['stripe_id'], stripeStatus: $sub['status'], ...);
    }
}
```

**Exceptions:** Unit tests for the gateway implementation itself (StripeCashierGateway) that test deserialization or error handling. These may use Mockery for the Stripe SDK since they test the gateway in isolation.

**Consequences Of Violation:** Feature tests are fragile — changing method call order breaks tests even if behavior is correct. Cannot test multi-step billing flows (create → check → cancel → verify) because Mockery doesn't maintain state.

---

## Rule 4: Wrap Stripe Exceptions in Application Exceptions Inside the Gateway

**Category:** Error Handling

**Rule:** Catch Stripe-specific exceptions (`Stripe\Exception\CardException`, `Stripe\Exception\ApiErrorException`) inside the gateway implementation. Wrap them in application exceptions (`PaymentFailedException`, `CardDeclinedException`, `BillingProviderException`) before letting them propagate to callers.

**Reason:** Callers should not need to import Stripe exception classes to handle billing errors. Application exceptions can include domain-relevant context (team ID, plan name, user-facing message) that Stripe exceptions don't provide.

**Bad Example:**
```php
// DANGER: Stripe exception leaks to controller
class StripeCashierGateway implements BillingGateway
{
    public function createSubscription(Team $team, Plan $plan, ?string $pm = null): SubscriptionResult
    {
        $team->newSubscription('default', $plan->stripe_price_id)->create($pm);
        // Throws \Stripe\Exception\CardException — caller must catch Stripe types
    }
}
```

**Good Example:**
```php
// Correct: domain exceptions wrap vendor errors
class StripeCashierGateway implements BillingGateway
{
    public function createSubscription(Team $team, Plan $plan, ?string $pm = null): SubscriptionResult
    {
        try {
            $subscription = $team->newSubscription('default', $plan->stripe_price_id)->create($pm);
            return new SubscriptionResult(...);
        } catch (\Stripe\Exception\CardException $e) {
            throw new CardDeclinedException(
                message: 'Your card was declined. Please try a different payment method.',
                teamId: $team->id,
                declineCode: $e->getDeclineCode(),
                previous: $e,
            );
        } catch (\Stripe\Exception\ApiErrorException $e) {
            \Log::error('Stripe API error during subscription creation', [
                'team_id' => $team->id,
                'error' => $e->getMessage(),
            ]);
            throw new BillingProviderException(
                message: 'We are experiencing issues with our payment provider. Please try again.',
                previous: $e,
            );
        }
    }
}
```

**Exceptions:** None. Leaking vendor exceptions through an application boundary is always a coupling problem.

**Consequences Of Violation:** Controllers and actions import Stripe exception classes. Changing payment providers requires changing exception handling everywhere. User-facing error messages are raw Stripe error text instead of helpful application messages.

---

## Rule 5: Gateway Mutation Methods Must Log Audit Events

**Category:** Security / Compliance

**Rule:** Every mutation method on the BillingGateway (createSubscription, cancelSubscription, swapPlan, refund) must log an audit event with: team ID, operation, relevant Stripe IDs, actor (user or system), and result status.

**Reason:** Billing mutations change financial relationships. Without an audit trail, disputes, refund requests, and compliance reviews cannot be resolved. SOC2 and PCI-DSS require audit logs for all financial state changes.

**Bad Example:**
```php
// DANGER: no audit trail on billing operation
public function cancelSubscription(Team $team): void
{
    $team->subscription('default')?->cancel();
}
```

**Good Example:**
```php
// Correct: audit log on every billing mutation
public function cancelSubscription(Team $team): void
{
    $subscription = $team->subscription('default');
    $subscription->cancel();

    \Log::channel('billing_audit')->info('Subscription canceled', [
        'team_id' => $team->id,
        'stripe_subscription_id' => $subscription->stripe_id,
        'plan' => $subscription->stripe_price,
        'actor_id' => auth()->id() ?? 'system',
        'canceled_at' => now()->toIso8601String(),
    ]);
}
```

**Exceptions:** Read operations (getSubscription, getInvoices, getDefaultPaymentMethod) don't need audit logging unless they access sensitive data.

**Consequences Of Violation:** Cannot determine who canceled a subscription or when. Financial audits fail on missing traceability. Customer disputes cannot be resolved because the state change history doesn't exist.
