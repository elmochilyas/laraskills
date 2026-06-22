# Rules for Laravel Cashier Decision Matrix

## Wrap Cashier Behind a BillingGateway Interface from Day One
---
## Category
Architecture | Maintainability
---
## Rule
When adopting Laravel Cashier, wrap it behind an application-owned `BillingGateway` interface from the first integration. Cashier's `Billable` trait deeply couples the User model to Stripe — the wrapper creates an exit path and prevents Cashier types from leaking into business logic.
---
## Reason
Cashier is a Stripe-only package with deep Eloquent integration. It adds columns to the `users` table, creates its own migrations (`subscriptions`, `subscription_items`), and modifies the User model via the `Billable` trait. Without a wrapper, every controller, service, and event listener that touches billing is coupled to Cashier. If Stripe is ever replaced, the migration cost is proportional to the number of Cashier references in the codebase.
---
## Bad Example
```php
// Cashier used directly in controller
class SubscriptionController
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->newSubscription('default', $request->price_id)
            ->trialDays(14)
            ->create($request->payment_method_id);
        return response()->json($subscription);
    }
}
```
---
## Good Example
```php
// Cashier wrapped behind BillingGateway
class SubscriptionController
{
    public function __construct(
        private BillingGateway $gateway,
    ) {}

    public function store(CreateSubscriptionRequest $request): JsonResponse
    {
        $result = $this->gateway->subscribeUserToPlan(
            $request->user()->id,
            CreateSubscriptionData::fromRequest($request),
        );
        return new SubscriptionResource($result);
    }
}
```
---
## Exceptions
Startups with a documented and accepted decision to be Stripe-only for the foreseeable future (with this tradeoff explicitly documented) may defer wrapping. This is a conscious business decision, not an architectural oversight.
---
## Consequences Of Violation
Cashier types (`Laravel\Cashier\Subscription`) appear in controllers, services, middleware, event listeners, and API resources. Switching payment providers requires finding and updating every reference. The migration cost scales linearly with codebase size.

## Use Cashier's Built-In Webhook Handler — Do Not Write Your Own
---
## Category
Reliability | Architecture
---
## Rule
Use Cashier's built-in webhook handler (`Cashier::webhook()`) for Stripe webhook processing. Do not write custom Stripe webhook handling alongside Cashier. Cashier's handler manages subscription state synchronization, which is the hardest part of Stripe integration.
---
## Reason
Subscription state synchronization (trial endings, cancellations, payment failures, plan changes) is the most error-prone part of Stripe integration. Cashier's webhook handler has been tested across millions of applications. Custom webhook handling alongside Cashier creates two sources of truth for subscription state — Cashier's internal sync and your custom handler — which leads to state divergence bugs.
---
## Bad Example
```php
// Custom webhook handler alongside Cashier
Route::post('/stripe/webhook', function (Request $request) {
    $event = Stripe\Webhook::constructEvent(/* ... */);
    if ($event->type === 'invoice.payment_succeeded') {
        // Custom logic that duplicates or conflicts with Cashier's handling
        $user = User::where('stripe_id', $event->data->object->customer)->first();
        $user->update(['subscription_status' => 'active']);
    }
    return response()->json(['status' => 'ok']);
});
```
---
## Good Example
```php
// Cashier's built-in webhook handler
Route::post('/stripe/webhook', function () {
    return Cashier::webhook();
})->name('cashier.webhook');

// Custom logic goes in event listeners, not webhook handlers
Event::listen(WebhookReceived::class, function (WebhookReceived $event) {
    if ($event->payload['type'] === 'invoice.payment_succeeded') {
        // Non-subscription-state logic here (analytics, CRM sync, etc.)
    }
});
```
---
## Exceptions
Custom webhook handling is appropriate only for Stripe events that Cashier does not handle (e.g., Connect events, Radar events, custom Stripe events). Even then, add listeners to Cashier's webhook handling, don't replace it.
---
## Consequences Of Violation
Subscription state divergence: Cashier's internal state shows one thing, the custom webhook handler updates another. Users report incorrect subscription status. Debugging requires tracing two webhook processing paths.

## Use Stripe Test Clocks for Time-Sensitive Tests
---
## Category
Testing | Reliability
---
## Rule
For tests involving subscription trials, proration, or expiration, use Stripe test clocks to simulate time passage. Never use `sleep()` or real time delays in tests. Without test clocks, a trial expiration test takes 14 real days.
---
## Reason
Subscription billing is inherently time-dependent. Trials last N days, subscriptions expire, proration calculates mid-cycle changes. Without test clocks, time-dependent tests are either skipped (untested code paths) or take impossibly long (14-day trials). Test clocks enable time travel — a 14-day trial can be tested in milliseconds.
---
## Bad Example
```php
test('trial expires after 14 days', function () {
    $user = User::factory()->create();
    $user->newSubscription('default', 'price_monthly')->trialDays(14)->create('pm_card_visa');
    // Cannot test expiration without waiting 14 days
    // Test is skipped or mocked incompletely
})->skip('Requires 14-day wait');
```
---
## Good Example
```php
test('trial expires after 14 days', function () {
    $user = User::factory()->create();
    $testClock = Stripe\TestHelpers\TestClock::create([
        'frozen_time' => now()->timestamp,
    ]);
    $customer = Stripe\Customer::create([
        'test_clock' => $testClock->id,
    ]);
    $user->update(['stripe_id' => $customer->id]);

    $user->newSubscription('default', 'price_monthly')->trialDays(14)->create('pm_card_visa');
    expect($user->onTrial())->toBeTrue();

    // Advance test clock by 15 days
    $testClock->advance(['frozen_time' => now()->addDays(15)->timestamp]);

    // Wait for webhook processing (or trigger manually)
    Cashier::handleWebhook(/* trial_ended event */);

    expect($user->fresh()->onTrial())->toBeFalse();
});
```
---
## Exceptions
Unit tests mocking Cashier completely (using `BillingGateway` mock, not real Stripe) do not need test clocks. Integration and E2E tests that hit real Stripe in test mode must use test clocks for time-dependent scenarios.
---
## Consequences Of Violation
Time-dependent billing code paths are untested. Trial expiration, proration, and subscription renewal logic ships to production without automated verification. Bugs in these paths are discovered by customers.

## Monitor Cashier's Sync Health
---
## Category
Observability | Reliability
---
## Rule
Monitor the health of Cashier's local database-to-Stripe synchronization. Track webhook failure rate, stale subscription status (`stripe_status` values that haven't been updated recently), and divergence between local and Stripe state.
---
## Reason
Cashier keeps local database copies of Stripe subscription state. Webhooks update these copies. If webhooks fail (Stripe downtime, network issues, misconfigured webhook URLs), the local state becomes stale. Users with active subscriptions may be denied access; users with expired subscriptions may retain access. Monitoring sync health catches this before it affects users.
---
## Bad Example
No monitoring. Webhooks fail silently for 6 hours. Users report "I paid but it says I don't have a subscription."
---
## Good Example
```php
// Monitor stale subscription state
// Schedule: every 15 minutes
class CheckSubscriptionSyncHealth extends Command
{
    protected $signature = 'cashier:check-sync-health';

    public function handle(): void
    {
        $stale = DB::table('subscriptions')
            ->where('stripe_status', 'active')
            ->where('updated_at', '<', now()->subHours(2))
            ->count();

        if ($stale > 0) {
            Log::warning('Cashier sync health: stale subscriptions detected', [
                'count' => $stale,
                'threshold_hours' => 2,
            ]);
            // Alert operations team
        }
    }
}
```
---
## Exceptions
Low-traffic applications where subscriptions change infrequently may use simpler monitoring (e.g., check on admin dashboard load rather than scheduled job).
---
## Consequences Of Violation
Silent webhook failures cause incorrect subscription state. Users are incorrectly granted or denied access. Support team cannot diagnose the issue without Stripe dashboard access, creating a dependency on engineering for every billing support ticket.
