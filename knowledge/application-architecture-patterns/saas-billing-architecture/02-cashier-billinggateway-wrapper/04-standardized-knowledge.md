# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Cashier + BillingGateway Wrapper Pattern
Difficulty Level: Advanced
Last Updated: 2026-06-22
Status: Standardized

---

# Overview

The BillingGateway wrapper isolates Laravel Cashier (and Stripe SDK) behind an application-owned interface. This pattern provides a single integration point for all billing operations, a clear mock boundary for testing, an escape hatch for Cashier-unhandled flows, and protects the application from Cashier API changes. Every billing operation in the application goes through the BillingGateway — never through Cashier or Stripe SDK directly.

---

# Core Concepts

This knowledge unit addresses the design and implementation of a billing gateway abstraction layer for Laravel SaaS applications using Laravel Cashier.

## Architecture Layers

```
Controller / Action / Job
    ↓ depends on (constructor injection)
BillingGatewayInterface (application contract)
    ↓ implemented by
StripeCashierGateway (uses Cashier + stripe-php directly)
    ↓ talks to
Stripe API
```

## The Interface

```php
// App\Billing\Contracts\BillingGateway.php
namespace App\Billing\Contracts;

use App\Billing\Data\SubscriptionResult;
use App\Billing\Data\SubscriptionData;
use App\Billing\Data\InvoiceData;
use App\Models\Team;
use App\Models\Plan;

interface BillingGateway
{
    public function createCustomer(Team $team): string;                           // Returns Stripe customer ID
    public function createSubscription(Team $team, Plan $plan, ?string $paymentMethod = null): SubscriptionResult;
    public function cancelSubscription(Team $team): void;
    public function resumeSubscription(Team $team): void;
    public function swapPlan(Team $team, Plan $newPlan): void;
    public function getSubscription(Team $team): SubscriptionData;
    public function getInvoices(Team $team, int $limit = 10): array;             // Returns InvoiceData[]
    public function getUpcomingInvoice(Team $team): InvoiceData;
    public function getSetupIntent(Team $team): string;                           // Returns client secret
    public function updatePaymentMethod(Team $team, string $paymentMethodId): void;
    public function getDefaultPaymentMethod(Team $team): ?array;
    public function createCheckoutSession(Team $team, Plan $plan, string $successUrl, string $cancelUrl): string;  // Returns checkout URL
    public function createBillingPortalSession(Team $team, string $returnUrl): string;
    public function refund(string $paymentIntentId, ?int $amount = null): void;
}
```

## Data Transfer Objects

```php
// App\Billing\Data\SubscriptionResult.php
readonly class SubscriptionResult
{
    public function __construct(
        public string $stripeSubscriptionId,
        public string $status,
        public ?string $clientSecret,       // For payment confirmation (SCA)
        public ?string $latestInvoiceId,
    ) {}

    public function requiresAction(): bool
    {
        return $this->status === 'incomplete' && $this->clientSecret !== null;
    }
}

// App\Billing\Data\SubscriptionData.php
readonly class SubscriptionData
{
    public function __construct(
        public string $stripeId,
        public string $stripeStatus,
        public string $stripePriceId,
        public ?\DateTimeInterface $trialEndsAt,
        public ?\DateTimeInterface $currentPeriodStart,
        public ?\DateTimeInterface $currentPeriodEnd,
        public ?\DateTimeInterface $canceledAt,
        public ?\DateTimeInterface $endedAt,
        public bool $cancelAtPeriodEnd,
        public array $rawData = [],
    ) {}

    public static function fromStripeSubscription(\Laravel\Cashier\Subscription $subscription): self
    {
        return new self(
            stripeId: $subscription->stripe_id,
            stripeStatus: $subscription->stripe_status,
            stripePriceId: $subscription->stripe_price,
            trialEndsAt: $subscription->trial_ends_at,
            currentPeriodStart: $subscription->stripe_period_start,
            currentPeriodEnd: $subscription->stripe_period_end,
            canceledAt: $subscription->canceled_at,
            endedAt: $subscription->ended_at,
            cancelAtPeriodEnd: $subscription->cancel_at_period_end,
        );
    }
}

// App\Billing\Data\InvoiceData.php
readonly class InvoiceData
{
    public function __construct(
        public string $id,
        public int $amountDue,
        public int $amountPaid,
        public string $currency,
        public string $status,
        public ?string $invoicePdf,
        public ?string $hostedInvoiceUrl,
        public ?\DateTimeInterface $createdAt,
        public ?\DateTimeInterface $periodStart,
        public ?\DateTimeInterface $periodEnd,
    ) {}
}
```

---

# When To Use

- Any SaaS with Laravel Cashier that needs testable billing code
- When you need billing operations beyond what Cashier provides (e.g., complex proration, custom invoice line items)
- When you might switch payment providers (Stripe → Paddle, Braintree) — though rare, the interface makes it possible
- When you need a consistent mock point for all billing-related tests
- When multiple parts of the application trigger billing operations (controllers, admin panel, CLI commands, queued jobs)

---

# When NOT To Use

- Prototype/MVP where Cashier's API is sufficient and testing isn't prioritized yet
- When you are certain you'll never need to swap payment providers or extend billing logic
- When the team is very small and the abstraction overhead outweighs the benefits

---

# Best Practices

1. **The interface is application-owned, not Stripe-owned.** Design method signatures for your domain, not for Stripe's API shape. If Stripe changes their API, you update the gateway — callers don't change.

2. **Return DTOs, not Stripe objects.** Never leak Stripe SDK types (Stripe\Subscription, Stripe\Invoice) through the interface. Return your own DTOs. This prevents callers from coupling to the Stripe SDK.

3. **Keep the interface focused on billing operations.** Don't add reporting, analytics, or entitlement logic to the gateway. It does exactly one thing: talks to the payment provider.

4. **The escape hatch is intentional.** Some Stripe operations have no Cashier equivalent. The gateway implementation can use `stripe/stripe-php` directly for those cases. This is not a violation — it's the pattern working as designed.

5. **Cashier model synchronization stays in the gateway.** When creating a subscription, the gateway is responsible for syncing the Cashier Subscription model into the local database. Callers don't need to know about Cashier's internal models.

---

# Architecture Guidelines

## StripeCashierGateway Implementation

```php
// App\Billing\Gateways\StripeCashierGateway.php
namespace App\Billing\Gateways;

use App\Billing\Contracts\BillingGateway;
use App\Billing\Data\SubscriptionResult;
use App\Billing\Data\SubscriptionData;
use App\Billing\Data\InvoiceData;
use App\Models\Team;
use App\Models\Plan;
use Laravel\Cashier\Subscription as CashierSubscription;
use Stripe\StripeClient;

class StripeCashierGateway implements BillingGateway
{
    private StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('cashier.secret'));
    }

    public function createCustomer(Team $team): string
    {
        if ($team->stripe_id) {
            return $team->stripe_id;
        }

        $team->createAsStripeCustomer([
            'name' => $team->name,
            'metadata' => ['team_id' => $team->id],
        ]);

        return $team->stripe_id;
    }

    public function createSubscription(Team $team, Plan $plan, ?string $paymentMethod = null): SubscriptionResult
    {
        $this->createCustomer($team);

        $subscription = $team->newSubscription('default', $plan->stripe_price_id);

        if ($plan->trial_days > 0 && !$team->subscription?->exists) {
            $subscription->trialDays($plan->trial_days);
        }

        if ($paymentMethod) {
            $subscription->create($paymentMethod);
        } else {
            // For checkout-based flows, create as incomplete and return client secret
            $subscription->create();
        }

        // Get the Cashier subscription model
        $cashierSub = $team->subscription()->latest()->first();

        return new SubscriptionResult(
            stripeSubscriptionId: $cashierSub->stripe_id,
            status: $cashierSub->stripe_status,
            clientSecret: $cashierSub->latestPayment()?->clientSecret(),
            latestInvoiceId: $cashierSub->latestInvoice()?->id,
        );
    }

    public function cancelSubscription(Team $team): void
    {
        $team->subscription('default')?->cancel();
    }

    public function resumeSubscription(Team $team): void
    {
        $team->subscription('default')?->resume();
    }

    public function swapPlan(Team $team, Plan $newPlan): void
    {
        $subscription = $team->subscription('default');

        if (!$subscription) {
            throw new \RuntimeException('No active subscription to swap.');
        }

        $subscription->swap($newPlan->stripe_price_id);
    }

    public function getSubscription(Team $team): SubscriptionData
    {
        $subscription = $team->subscription('default');

        if (!$subscription) {
            throw new \RuntimeException("Team {$team->id} has no subscription.");
        }

        return SubscriptionData::fromStripeSubscription($subscription);
    }

    public function getInvoices(Team $team, int $limit = 10): array
    {
        return $team->invoices()->take($limit)->map(function ($invoice) {
            return new InvoiceData(
                id: $invoice->id,
                amountDue: $invoice->amount_due,
                amountPaid: $invoice->amount_paid ?? 0,
                currency: $invoice->currency,
                status: $invoice->status,
                invoicePdf: $invoice->invoice_pdf,
                hostedInvoiceUrl: $invoice->hosted_invoice_url,
                createdAt: $invoice->created,
                periodStart: $invoice->period_start,
                periodEnd: $invoice->period_end,
            );
        })->toArray();
    }

    public function getUpcomingInvoice(Team $team): InvoiceData
    {
        $invoice = $team->upcomingInvoice();

        return new InvoiceData(
            id: 'upcoming',
            amountDue: $invoice->amountDue(),
            amountPaid: 0,
            currency: $invoice->currency(),
            status: 'upcoming',
            invoicePdf: null,
            hostedInvoiceUrl: null,
            createdAt: null,
            periodStart: $invoice->periodStart(),
            periodEnd: $invoice->periodEnd(),
        );
    }

    public function getSetupIntent(Team $team): string
    {
        $this->createCustomer($team);
        return $team->createSetupIntent()->client_secret;
    }

    public function updatePaymentMethod(Team $team, string $paymentMethodId): void
    {
        $team->updateDefaultPaymentMethod($paymentMethodId);
    }

    public function getDefaultPaymentMethod(Team $team): ?array
    {
        $pm = $team->defaultPaymentMethod();

        if (!$pm) return null;

        return [
            'id' => $pm->id,
            'brand' => $pm->card?->brand ?? 'unknown',
            'last4' => $pm->card?->last4 ?? '****',
            'exp_month' => $pm->card?->exp_month ?? null,
            'exp_year' => $pm->card?->exp_year ?? null,
        ];
    }

    public function createCheckoutSession(Team $team, Plan $plan, string $successUrl, string $cancelUrl): string
    {
        $this->createCustomer($team);

        // Escape hatch: Cashier doesn't support Checkout Sessions directly,
        // so use Stripe SDK directly for this flow.
        $session = $this->stripe->checkout->sessions->create([
            'customer' => $team->stripe_id,
            'mode' => 'subscription',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'line_items' => [[
                'price' => $plan->stripe_price_id,
                'quantity' => 1,
            ]],
            'subscription_data' => [
                'trial_period_days' => $plan->trial_days > 0 ? $plan->trial_days : null,
                'metadata' => ['team_id' => $team->id],
            ],
            'metadata' => ['team_id' => $team->id],
        ]);

        return $session->url;
    }

    public function createBillingPortalSession(Team $team, string $returnUrl): string
    {
        return $team->billingPortalUrl($returnUrl);
    }

    public function refund(string $paymentIntentId, ?int $amount = null): void
    {
        $params = ['payment_intent' => $paymentIntentId];
        if ($amount) {
            $params['amount'] = $amount;
        }

        $this->stripe->refunds->create($params);
    }
}
```

## FakeBillingGateway for Testing

```php
// Tests\Fakes\FakeBillingGateway.php
namespace Tests\Fakes;

use App\Billing\Contracts\BillingGateway;
use App\Billing\Data\SubscriptionResult;
use App\Billing\Data\SubscriptionData;
use App\Billing\Data\InvoiceData;
use App\Models\Team;
use App\Models\Plan;

class FakeBillingGateway implements BillingGateway
{
    private array $customers = [];
    private array $subscriptions = [];
    private array $invoices = [];
    private array $processedCharges = [];

    public bool $shouldFail = false;

    public function createCustomer(Team $team): string
    {
        return $this->customers[$team->id] ??= 'cus_fake_' . $team->id;
    }

    public function createSubscription(Team $team, Plan $plan, ?string $paymentMethod = null): SubscriptionResult
    {
        if ($this->shouldFail) {
            return new SubscriptionResult(
                stripeSubscriptionId: '',
                status: 'incomplete',
                clientSecret: null,
                latestInvoiceId: null,
            );
        }

        $subId = 'sub_fake_' . $team->id;
        $this->subscriptions[$team->id] = [
            'stripe_id' => $subId,
            'plan_id' => $plan->id,
            'status' => 'active',
            'trial_ends_at' => $plan->trial_days > 0 ? now()->addDays($plan->trial_days) : null,
        ];

        return new SubscriptionResult(
            stripeSubscriptionId: $subId,
            status: 'active',
            clientSecret: null,
            latestInvoiceId: null,
        );
    }

    public function cancelSubscription(Team $team): void
    {
        if (isset($this->subscriptions[$team->id])) {
            $this->subscriptions[$team->id]['status'] = 'canceled';
            $this->subscriptions[$team->id]['canceled_at'] = now();
        }
    }

    public function resumeSubscription(Team $team): void
    {
        if (isset($this->subscriptions[$team->id])) {
            $this->subscriptions[$team->id]['status'] = 'active';
            unset($this->subscriptions[$team->id]['canceled_at']);
        }
    }

    public function swapPlan(Team $team, Plan $newPlan): void
    {
        if (isset($this->subscriptions[$team->id])) {
            $this->subscriptions[$team->id]['plan_id'] = $newPlan->id;
        }
    }

    public function getSubscription(Team $team): SubscriptionData
    {
        $sub = $this->subscriptions[$team->id] ?? null;

        if (!$sub) {
            throw new \RuntimeException("No subscription for team {$team->id}");
        }

        return new SubscriptionData(
            stripeId: $sub['stripe_id'],
            stripeStatus: $sub['status'],
            stripePriceId: 'price_fake',
            trialEndsAt: $sub['trial_ends_at'] ?? null,
            currentPeriodStart: now()->startOfMonth(),
            currentPeriodEnd: now()->addMonth()->endOfMonth(),
            canceledAt: $sub['canceled_at'] ?? null,
            endedAt: null,
            cancelAtPeriodEnd: false,
        );
    }

    public function getInvoices(Team $team, int $limit = 10): array
    {
        return $this->invoices[$team->id] ?? [];
    }

    public function getUpcomingInvoice(Team $team): InvoiceData
    {
        return new InvoiceData(
            id: 'upcoming_fake',
            amountDue: 2900,
            amountPaid: 0,
            currency: 'usd',
            status: 'upcoming',
            invoicePdf: null,
            hostedInvoiceUrl: null,
            createdAt: null,
            periodStart: now(),
            periodEnd: now()->addMonth(),
        );
    }

    public function getSetupIntent(Team $team): string
    {
        return 'seti_fake_' . $team->id . '_secret_' . uniqid();
    }

    public function updatePaymentMethod(Team $team, string $paymentMethodId): void
    {
        // No-op in fake
    }

    public function getDefaultPaymentMethod(Team $team): ?array
    {
        return [
            'id' => 'pm_fake',
            'brand' => 'visa',
            'last4' => '4242',
            'exp_month' => 12,
            'exp_year' => 2030,
        ];
    }

    public function createCheckoutSession(Team $team, Plan $plan, string $successUrl, string $cancelUrl): string
    {
        return "https://checkout.fake.test/session_fake_{$team->id}";
    }

    public function createBillingPortalSession(Team $team, string $returnUrl): string
    {
        return "https://billing.fake.test/portal_fake_{$team->id}";
    }

    public function refund(string $paymentIntentId, ?int $amount = null): void
    {
        $this->processedCharges[] = [
            'type' => 'refund',
            'payment_intent' => $paymentIntentId,
            'amount' => $amount,
        ];
    }
}
```

## Container Binding

```php
// App\Providers\BillingServiceProvider.php
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            BillingGateway::class,
            StripeCashierGateway::class,
        );
    }
}

// In test environment (.env.testing):
// App\Providers\BillingServiceProvider::class
// Or in test setUp():
// $this->app->instance(BillingGateway::class, new FakeBillingGateway());
```

## Test Example

```php
test('team can subscribe to Pro plan', function () {
    $gateway = new FakeBillingGateway();
    $this->app->instance(BillingGateway::class, $gateway);

    $team = Team::factory()->create();
    $plan = Plan::factory()->pro()->create();

    $result = $gateway->createSubscription($team, $plan, 'pm_card_visa');

    expect($result->status)->toBe('active');
    expect($result->stripeSubscriptionId)->toStartWith('sub_fake_');
});

test('subscription creation failure is handled gracefully', function () {
    $gateway = new FakeBillingGateway();
    $gateway->shouldFail = true;
    $this->app->instance(BillingGateway::class, $gateway);

    $team = Team::factory()->create();
    $plan = Plan::factory()->pro()->create();

    $result = $gateway->createSubscription($team, $plan, 'pm_card_declined');

    expect($result->status)->toBe('incomplete');
});
```

---

# Performance Considerations

- The gateway itself adds negligible overhead — it's a thin abstraction over Cashier.
- Cashier already caches certain Stripe data (subscription status, trial dates) on the local database. The gateway reads from those local records, not from Stripe API directly.
- Checkout session creation and billing portal sessions make direct Stripe API calls — these are inherently slow (200-500ms). Call these from user-facing actions, not from background jobs or webhooks.
- Consider queuing invoice fetching for admin dashboards that display long invoice histories.

---

# Security Considerations

- The BillingGateway must never expose Stripe secret keys through debug output, logs, or error messages.
- Checkout session URLs should not be generated for unauthenticated users.
- The `refund()` method must be protected by authorization (admin/support role only).
- Billing portal session URLs are single-use and short-lived; don't cache them.

---

# Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Calling Cashier methods directly in controllers | Cannot test without Stripe mocks; coupled to Cashier API | Inject BillingGateway contract, call through the interface |
| Returning Stripe objects from gateway methods | Callers couple to Stripe SDK types | Return application-owned DTOs |
| Putting business logic in the gateway | Gateway becomes a god object | Gateway does billing operations only; business logic stays in Actions/Services |
| Not implementing a fake for tests | Tests hit Stripe API or require complex Cashier mocking | Implement FakeBillingGateway with predictable behavior |
| Skipping the gateway for "simple" operations | Inconsistent architecture; some billing code is testable, some isn't | Every billing interaction goes through the gateway |
| Using the gateway to query entitlements | Gateway is for billing operations, not feature access checks | Use EntitlementService / FeatureGate for access decisions |
| Leaking raw Stripe errors through the gateway | Callers must handle Stripe-specific exceptions | Wrap Stripe exceptions in application exceptions inside the gateway |

---

# Related Topics

Prerequisites: Laravel Cashier installation, Stripe account configuration, Plan/Feature/Entitlement model
Related: Plan-Feature-Entitlement model, Stripe webhook idempotency, Subscription drift reconciliation, Billing failure states

---

# AI Agent Notes

1. The BillingGateway interface is the ONLY way code talks to Stripe. If you find `$team->subscription()` or `\Stripe\...` outside of StripeCashierGateway, refactor it.
2. When adding a new billing operation, first add the method to the interface, then implement in StripeCashierGateway, then add to FakeBillingGateway. This order ensures the contract is designed before implementation.
3. The escape hatch (direct Stripe SDK usage) is for operations Cashier truly doesn't support. Don't use it just because "it's easier than figuring out the Cashier way."
4. DTOs must be immutable (readonly classes). This prevents accidental mutation of billing data as it flows through the application.
5. FakeBillingGateway should fail realistically. Add a `$shouldFail` flag and test failure paths. Don't make the fake always succeed — you'll miss error handling bugs.
6. When Stripe releases new API versions, only StripeCashierGateway needs updating. All callers are protected by the interface.
7. The gateway should log all mutation operations (create, cancel, swap, refund) for audit purposes.
8. Container binding should be in a dedicated BillingServiceProvider, not in AppServiceProvider.

---

# Verification

- [ ] All billing operations in controllers/actions/jobs go through BillingGateway interface (grep for Cashier/Stripe usage outside gateway)
- [ ] BillingGateway interface returns only application-owned DTOs (no Stripe types in return signatures)
- [ ] FakeBillingGateway exists and implements all interface methods
- [ ] Feature tests use FakeBillingGateway, not Stripe mocks
- [ ] Gateway mutation methods log audit events
- [ ] Stripe secret keys never appear in logs or error messages
- [ ] Gateway exceptions are wrapped in application exceptions before bubbling up
- [ ] BillingServiceProvider binds the interface to the concrete implementation
- [ ] Both success and failure paths tested via FakeBillingGateway
