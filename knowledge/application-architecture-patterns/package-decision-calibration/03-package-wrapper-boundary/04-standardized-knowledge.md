# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Wrapper / Boundary Pattern |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Interface-first architecture, Service container bindings, Contracts |
| Related KUs | Package escape hatch strategy, Calibrated package recommendation, Hexagonal architecture |
| Source | domain-analysis.md |

---

# Overview

The package wrapper/boundary pattern wraps third-party Laravel packages behind application-owned interfaces. This creates a controlled dependency that can be swapped, tested, and escaped without rewriting business logic. The canonical example is `BillingGateway` wrapping Laravel Cashier: application code depends on `BillingGateway`, not on `Cashier` or `Stripe`. The wrapper is not about abstraction for abstraction's sake — it exists to protect application code from package churn, enable testing without package fakes, and provide an architectural seam for the escape hatch.

---

# Core Concepts

- **Application-owned interface**: An interface defined in `app/Contracts/` that expresses business needs in business language. `subscribeUserToPlan()`, not `createStripeSubscription()`.
- **Package adapter**: A concrete class implementing the application-owned interface that delegates to the package. This is where package-specific code lives.
- **Container binding**: The service container maps the interface to the adapter. Swapping implementations is a one-line container binding change.
- **Testing boundary**: Tests mock the interface, not the package. This means tests are fast and don't require package-specific fakes or test infrastructure.
- **Seam for escape hatch**: When the package needs to be bypassed, a new adapter class implements the same interface. The business logic never changes.

---

# When To Use

- For external API integrations (Stripe, Twilio, SendGrid, Mailgun)
- For packages that represent infrastructural choices (payment providers, search engines, file storage)
- When the underlying package might change (provider switch, pricing changes, deprecation)
- When the package requires real API calls in tests and you want to avoid that
- When multiple implementations of the same capability might coexist (multi-provider support)

## When NOT To Use

- For framework packages (Eloquent, Blade, routing, middleware) — these ARE the framework
- For packages that provide developer tooling (Debugbar, Telescope, IDE helpers) — no business logic depends on them
- When the package adds a single utility method that can be inlined in 5 lines
- When the wrapper becomes a "pass-through wrapper" with 1:1 method mapping and zero behavioral difference

---

# Best Practices

1. **Design the interface in business language, not vendor language** WHY: `chargeCustomer(Money $amount, PaymentMethod $method)` expresses intent. `createStripePaymentIntent(int $cents, string $pmId)` leaks vendor details. When the vendor changes, business language doesn't.

2. **Scope interfaces to what the application actually uses** WHY: Don't wrap the entire Stripe API. Wrap the 3-5 methods your application actually calls. A 50-method wrapper that mirrors the vendor API is just indirection without abstraction.

3. **Put the adapter in Infrastructure, not Domain** WHY: `App\Infrastructure\Billing\StripeCashierAdapter` is clearly infrastructure code. `App\Services\BillingGateway` blurs the line between business logic and infrastructure.

4. **Test the adapter separately from business logic** WHY: Adapter tests verify that Cashier/Stripe calls work correctly (integration tests). Business logic tests mock the interface (unit/feature tests). Mixing them creates slow, brittle tests.

5. **Use the wrapper from day one, not retroactively** WHY: Retrofitting a wrapper after business logic is already coupled to Cashier is a painful extraction. The wrapper costs 20 minutes at project start and weeks as a retrofit.

---

# Architecture Guidelines

- **Directory structure**:
  ```
  app/
    Contracts/
      BillingGateway.php           # Application-owned interface
    Infrastructure/
      Billing/
        StripeCashierAdapter.php   # Package implementation
        StripeDirectAdapter.php    # Escape hatch implementation
        FakeBillingGateway.php     # Test double
  ```

- **Interface granularity**: One interface per external concern. `BillingGateway`, not `PaymentAndInvoiceAndTaxGateway`. Segregate by business capability.
- **Return types must be application DTOs, not vendor objects**: `subscribeUserToPlan()` returns `App\DTOs\SubscriptionResult`, not `Laravel\Cashier\Subscription`. This prevents vendor types from leaking into business code.
- **Exception translation**: The adapter catches vendor-specific exceptions and re-throws application exceptions. `Stripe\Exception\CardException` becomes `App\Exceptions\PaymentFailedException`.

---

# Performance Considerations

- **Wrapper overhead**: A wrapper adds one extra method call per operation — negligible performance cost (<1μs).
- **Interface segregation reduces method count**: Small interfaces (3-5 methods) are easier to implement and test than large ones (20+ methods).
- **Container binding cost**: Interface-to-concrete resolution adds ~0.01ms per resolution. Irrelevant for HTTP requests. Relevant for high-throughput queue workers — use singleton binding.

---

# Security Considerations

- **Exception translation must not leak secrets**: When translating `CardException('Invalid API key sk_live_xxx')`, strip the key before re-throwing.
- **DTO sanitization at the boundary**: The adapter's job includes sanitizing vendor responses before they enter application code. Never pass raw API responses upstream.
- **Vendor credential isolation**: The adapter class should be the only place that touches vendor credentials (API keys, webhook secrets). Business code should never see them.

---

# Common Mistakes

**Mistake: Passthrough wrapper with 1:1 method mapping**
- Description: Creating `BillingGateway::createSubscription()` that calls `Cashier::createSubscription()` with identical parameters
- Cause: Misunderstanding the purpose — the wrapper exists to abstract, not mirror
- Consequence: Zero architectural value. It's just indirection. Worse, it creates a false sense of "we can swap this anytime."
- Better: Identify the business operations and name them in business language. If the business operation IS "create subscription," that's still fine — but make the parameters business objects (DTOs), not vendor-specific arrays.

**Mistake: Leaking vendor types through the interface**
- Description: `BillingGateway::getSubscription(): CashierSubscription`
- Cause: Lazyness — just return what Cashier gives you
- Consequence: Every caller of the interface now depends on Cashier's types. The wrapper provides zero protection.
- Better: Return application DTOs or Value Objects. Map vendor types to application types inside the adapter.

**Mistake: Wrapping packages that don't need wrapping**
- Description: Creating `SessionGateway` to wrap Laravel's session, or `RouterGateway` to wrap routing
- Cause: Over-application of a pattern
- Consequence: Framework becomes unrecognizable, onboarding suffers, every framework change requires adapter updates
- Better: Only wrap external service integrations and packages that represent replaceable infrastructure choices. Never wrap Laravel's core.

---

# Anti-Patterns

- **The universal gateway**: One giant interface that wraps every external service. "If it's third-party, it goes through Gateway." This creates a god-interface that's impossible to implement and test.
- **Wrapper-in-wrapper**: Wrapping a package that itself is a wrapper around another package. Extra layers without architectural value.
- **Test-only wrappers**: Adding a wrapper solely to make testing easier. If wrapping makes tests easier, the underlying package has a testing problem — but wrapping for testing alone is valid if the benefit outweighs the indirection cost.

---

# Examples

## BillingGateway Interface + Cashier Adapter

```php
// app/Contracts/BillingGateway.php
namespace App\Contracts;

use App\DTOs\SubscriptionResult;
use App\DTOs\CreateSubscriptionData;
use App\DTOs\InvoiceData;
use App\Exceptions\PaymentFailedException;

interface BillingGateway
{
    public function subscribeUserToPlan(
        string $userId,
        CreateSubscriptionData $data
    ): SubscriptionResult;

    public function cancelSubscription(string $subscriptionId): void;

    /** @return InvoiceData[] */
    public function getUpcomingInvoices(string $userId): array;

    public function chargeOnce(string $userId, int $amountInCents, string $description): SubscriptionResult;
}
```

```php
// app/Infrastructure/Billing/StripeCashierAdapter.php
namespace App\Infrastructure\Billing;

use App\Contracts\BillingGateway;
use App\DTOs\SubscriptionResult;
use App\DTOs\CreateSubscriptionData;
use App\DTOs\InvoiceData;
use App\Exceptions\PaymentFailedException;
use App\Models\User;
use Laravel\Cashier\Exceptions\PaymentActionRequired;
use Stripe\Exception\CardException;

class StripeCashierAdapter implements BillingGateway
{
    public function subscribeUserToPlan(
        string $userId,
        CreateSubscriptionData $data
    ): SubscriptionResult {
        $user = User::findOrFail($userId);

        try {
            $subscription = $user->newSubscription('default', $data->priceId)
                ->trialDays($data->trialDays ?? 0)
                ->create($data->paymentMethodId);

            return new SubscriptionResult(
                id: $subscription->id,
                status: $subscription->stripe_status,
                trialEndsAt: $subscription->trial_ends_at,
            );
        } catch (CardException $e) {
            throw new PaymentFailedException(
                message: 'Payment was declined.',
                previous: $e,
            );
        } catch (PaymentActionRequired $e) {
            throw new PaymentFailedException(
                message: 'Additional authentication required.',
                paymentIntentId: $e->payment->id,
                previous: $e,
            );
        }
    }

    public function cancelSubscription(string $subscriptionId): void
    {
        $user = User::whereHas('subscriptions', fn ($q) =>
            $q->where('stripe_id', $subscriptionId)
        )->firstOrFail();

        $user->subscription('default')?->cancel();
    }

    /** @return InvoiceData[] */
    public function getUpcomingInvoices(string $userId): array
    {
        $user = User::findOrFail($userId);

        return collect($user->upcomingInvoices())->map(
            fn ($invoice) => new InvoiceData(
                date: $invoice->date(),
                total: $invoice->total(),
                currency: $invoice->currency(),
            )
        )->toArray();
    }

    public function chargeOnce(
        string $userId,
        int $amountInCents,
        string $description
    ): SubscriptionResult {
        $user = User::findOrFail($userId);

        try {
            $charge = $user->charge($amountInCents, $user->defaultPaymentMethod()->id, [
                'description' => $description,
            ]);

            return new SubscriptionResult(
                id: $charge->id,
                status: $charge->status,
            );
        } catch (CardException $e) {
            throw new PaymentFailedException(
                message: 'Payment was declined.',
                previous: $e,
            );
        }
    }
}
```

## Container Binding

```php
// app/Providers/BillingServiceProvider.php
namespace App\Providers;

use App\Contracts\BillingGateway;
use App\Infrastructure\Billing\StripeCashierAdapter;
use Illuminate\Support\ServiceProvider;

class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(BillingGateway::class, StripeCashierAdapter::class);
    }
}
```

## Testing with the Wrapper

```php
// tests/Feature/Billing/SubscribeTest.php
test('user can subscribe to a plan', function () {
    $gateway = Mockery::mock(BillingGateway::class);
    $gateway->shouldReceive('subscribeUserToPlan')
        ->once()
        ->andReturn(new SubscriptionResult(
            id: 'sub_test123',
            status: 'active',
            trialEndsAt: now()->addDays(14),
        ));

    $this->app->instance(BillingGateway::class, $gateway);

    $response = $this->actingAs($user)
        ->postJson('/api/subscriptions', ['price_id' => 'price_monthly']);

    $response->assertCreated();
});
```

---

# AI Agent Notes

- When generating code that integrates with a third-party package, always wrap it behind an application-owned interface. Business logic classes must never import vendor facades or classes directly.
- Interface names should use business language: `BillingGateway`, `NotificationGateway`, `SearchGateway`.
- Adapter classes go in `App\Infrastructure\{Domain}\`, never in `App\Services\`. Services contain business logic; adapters contain vendor integration.
- Return types from interface methods must be application DTOs, primitives, or `void`. Never return vendor types.
- The adapter's constructor may accept vendor-specific dependencies (e.g., `StripeClient`). The interface's consumers must never know this.
- Always include exception translation in the adapter. Catch vendor exceptions, log them, and re-throw application exceptions.

---

# Verification

- [ ] Interface is defined in `app/Contracts/` in business language (no vendor names in method signatures)
- [ ] Interface has 3-7 methods scoped to what the application actually uses
- [ ] Adapter class is in `app/Infrastructure/` with vendor name in the class name
- [ ] Adapter return types are application DTOs/value objects, not vendor types
- [ ] Adapter translates vendor exceptions to application exceptions
- [ ] Container binding maps interface to adapter in a service provider
- [ ] Business logic classes depend on the interface, never on the adapter or vendor package
- [ ] Tests mock the interface, not the vendor package
- [ ] Wrapper is NOT a 1:1 passthrough of the vendor API
