# Rules for Package Wrapper / Boundary Pattern

## Design the Interface in Business Language, Not Vendor Language
---
## Category
Architecture | Maintainability
---
## Rule
Application-owned interfaces that wrap third-party packages should use business language in method names and parameters, not vendor-specific terminology. `subscribeUserToPlan(Money $amount)` expresses intent; `createStripeSubscription(int $cents, string $pmId)` leaks vendor details.
---
## Reason
When the vendor changes (Stripe to Paddle, Cashier to direct API), business language doesn't change. Vendor-specific method names must be updated everywhere they're referenced. Business language methods remain valid regardless of the underlying implementation.
---
## Bad Example
```php
// Vendor language leaks into the interface
interface BillingGateway
{
    public function createStripeSubscription(string $priceId, string $paymentMethod): StripeSubscription;
    public function getStripeInvoices(string $customerId): StripeCollection;
}
```
---
## Good Example
```php
// Business language, vendor-agnostic
interface BillingGateway
{
    public function subscribeUserToPlan(string $userId, CreateSubscriptionData $data): SubscriptionResult;
    public function getUpcomingInvoices(string $userId): array;
    public function cancelSubscription(string $subscriptionId): void;
}
```
---
## Exceptions
When the business domain itself is tightly coupled to vendor concepts (e.g., a Stripe analytics dashboard), vendor language in the interface may be acceptable because the business domain IS the vendor domain.
---
## Consequences Of Violation
When the payment provider changes, every consumer of the interface must be updated. The wrapper provides zero vendor abstraction. The interface name promises abstraction but delivers vendor lock-in.

## Scope Interfaces to What the Application Actually Uses
---
## Category
Architecture | Maintainability
---
## Rule
Package wrapper interfaces should expose only the 3-7 methods that application business logic actually calls — not the entire vendor API surface. A 50-method interface that mirrors the Stripe API is indirection without abstraction.
---
## Reason
Large interfaces are harder to implement, test, and migrate. Every method on the interface must be implemented by every adapter (Cashier adapter, direct Stripe adapter, test fake). A 5-method interface takes 30 minutes to re-implement for a new provider; a 50-method interface takes weeks.
---
## Bad Example
```php
// Mirroring the entire Stripe API — 40+ methods
interface BillingGateway
{
    public function createSubscription(/* ... */);
    public function updateSubscription(/* ... */);
    public function cancelSubscription(/* ... */);
    public function createInvoice(/* ... */);
    public function createInvoiceItem(/* ... */);
    public function createRefund(/* ... */);
    public function createPaymentIntent(/* ... */);
    public function confirmPaymentIntent(/* ... */);
    public function createSetupIntent(/* ... */);
    // ... 30 more methods
}
```
---
## Good Example
```php
// Only the methods the application actually calls
interface BillingGateway
{
    public function subscribeUserToPlan(string $userId, CreateSubscriptionData $data): SubscriptionResult;
    public function cancelSubscription(string $subscriptionId): void;
    public function getUpcomingInvoices(string $userId): array;
    public function chargeOnce(string $userId, Money $amount, string $description): ChargeResult;
    public function getBillingPortalUrl(string $userId): string;
}
```
---
## Exceptions
Multi-provider abstractions where the interface is shared across multiple implementations (e.g., a `PaymentGateway` that supports Stripe, Paddle, and Braintree) may need more methods to cover all providers' capabilities. Even then, prefer a core interface with provider-specific extensions rather than one giant interface.
---
## Consequences Of Violation
Wrapper becomes a maintenance burden. Adding a new payment provider requires implementing 50 methods, most of which throw "not supported." The wrapper costs more to maintain than direct vendor integration.

## Put the Adapter in Infrastructure, Not Domain
---
## Category
Architecture | Separation of Concerns
---
## Rule
Package adapter classes (`StripeCashierAdapter`, `TwilioSmsAdapter`) belong in `App\Infrastructure\{Domain}\`, not in `App\Services\` or `App\Domain\`. Services contain business logic; adapters contain vendor integration.
---
## Reason
Directory structure communicates architectural intent. `App\Infrastructure\Billing\StripeCashierAdapter` clearly signals "this is Stripe infrastructure code." `App\Services\BillingGateway` blurs the line between business logic and vendor integration, making it harder to identify what should be replaced when the vendor changes.
---
## Bad Example
```php
// Adapter in Services — blurs business/infrastructure boundary
namespace App\Services\Billing;
class StripeCashierAdapter implements BillingGateway { /* ... */ }
```
---
## Good Example
```php
// Adapter in Infrastructure — clear boundary
namespace App\Infrastructure\Billing;
class StripeCashierAdapter implements BillingGateway { /* ... */ }

// Business logic stays in Services
namespace App\Services\Billing;
class SubscriptionService
{
    public function __construct(
        private BillingGateway $gateway, // Depends on contract, not adapter
    ) {}
}
```
---
## Exceptions
Very small applications where the infrastructure layer would be a single file may keep adapters alongside services, but the naming should still indicate infrastructure status (e.g., `StripeBillingAdapter` not `BillingService`).
---
## Consequences Of Violation
New team members cannot distinguish business logic from vendor integration. When the vendor changes, the team must audit all "Services" to find Stripe-specific code. Refactoring becomes dangerous because business logic and vendor code are interleaved.

## Return Application DTOs, Not Vendor Types
---
## Category
Architecture | Maintainability
---
## Rule
Interface methods must return application DTOs or value objects — never vendor types (e.g., `Laravel\Cashier\Subscription`, `Stripe\Subscription`). Vendor types leaking through the interface make every consumer dependent on the vendor package.
---
## Reason
If `BillingGateway::subscribeUserToPlan()` returns `Laravel\Cashier\Subscription`, every class that calls this method now imports Cashier. The interface doesn't protect anything — it's just a passthrough. When the vendor changes, every consumer breaks.
---
## Bad Example
```php
use Laravel\Cashier\Subscription;

interface BillingGateway
{
    public function subscribeUserToPlan(string $userId, array $data): Subscription;
    // ↑ Returns Cashier type — all consumers now depend on Cashier
}
```
---
## Good Example
```php
use App\DTOs\SubscriptionResult;

interface BillingGateway
{
    public function subscribeUserToPlan(string $userId, CreateSubscriptionData $data): SubscriptionResult;
    // ↑ Returns application DTO — consumers depend only on the application contract
}

// Inside the adapter — vendor-to-DTO mapping
class StripeCashierAdapter implements BillingGateway
{
    public function subscribeUserToPlan(string $userId, CreateSubscriptionData $data): SubscriptionResult
    {
        $cashierSubscription = $user->newSubscription('default', $data->priceId)->create();
        return new SubscriptionResult(
            id: $cashierSubscription->id,
            status: $cashierSubscription->stripe_status,
            trialEndsAt: $cashierSubscription->trial_ends_at,
        );
    }
}
```
---
## Exceptions
When the vendor type is a simple value object (e.g., a `Money` object from a money library that is used application-wide), returning it from the interface may be acceptable if the team has consciously adopted it as a domain primitive.
---
## Consequences Of Violation
The wrapper is a leaky abstraction. Every consumer imports vendor classes. Switching providers requires updating every consumer. The wrapper's only benefit is a consistent method name — everything else still couples to the vendor.

## Translate Vendor Exceptions to Application Exceptions
---
## Category
Architecture | Reliability
---
## Rule
Adapter classes must catch vendor-specific exceptions and re-throw them as application exceptions. `Stripe\Exception\CardException` becomes `App\Exceptions\PaymentFailedException`. Business logic should never catch or handle vendor exceptions directly.
---
## Reason
Business logic should not know which payment provider is in use. A `CardException` means "card declined" whether it comes from Stripe, Paddle, or Braintree. Application-level exceptions abstract the failure mode; vendor exceptions leak the implementation. Additionally, exception messages from vendors may contain sensitive data (API keys, tokens) that must be stripped before re-throwing.
---
## Bad Example
```php
// Business logic handling vendor exception
class OrderService
{
    public function placeOrder(PlaceOrderDto $dto): Order
    {
        try {
            $result = $this->gateway->charge($dto->amount, $dto->paymentMethod);
        } catch (\Stripe\Exception\CardException $e) {
            // Business logic knows about Stripe — coupling
            Log::error('Stripe card declined', ['error' => $e->getMessage()]);
            throw $e; // Vendor exception propagates to controller
        }
    }
}
```
---
## Good Example
```php
// Adapter translates vendor exception
class StripeCashierAdapter implements BillingGateway
{
    public function charge(Money $amount, PaymentMethod $method): ChargeResult
    {
        try {
            // Stripe API call
        } catch (CardException $e) {
            throw new PaymentFailedException(
                message: 'Payment was declined.',
                previous: $e,
            ); // Stripped of sensitive data, application-level
        }
    }
}

// Business logic handles application exception
class OrderService
{
    public function placeOrder(PlaceOrderDto $dto): Order
    {
        try {
            $result = $this->gateway->charge($dto->amount, $dto->paymentMethod);
        } catch (PaymentFailedException $e) {
            // Business logic knows about payment failure, not Stripe
            Log::warning('Payment failed', ['order_id' => $dto->orderId]);
            throw $e;
        }
    }
}
```
---
## Exceptions
When the vendor exception itself has become a de facto standard (e.g., PSR interfaces like `Psr\Log\LoggerInterface`), catching and re-throwing them may add unnecessary indirection.
---
## Consequences Of Violation
Business logic coupled to vendor exception types. Sensitive data leaked through exception messages to logs and error trackers. When the provider changes, every catch block must be updated.

## Use the Wrapper from Day One, Not Retroactively
---
## Category
Architecture | Maintainability
---
## Rule
When adopting a package that represents a replaceable infrastructure choice (billing, search, notifications, file storage), wrap it behind an application-owned interface from the first integration — not months later when escape becomes necessary.
---
## Reason
Retrofitting a wrapper after business logic is already coupled to the package is a painful extraction. The wrapper costs 20-30 minutes at project start and may take days or weeks as a retrofit when all business logic directly imports vendor classes. The wrapper pays for itself the first time a provider-specific issue requires an escape hatch.
---
## Bad Example
```php
// Month 1: Cashier used directly in 8 controllers, 5 services, 3 commands
$user->newSubscription('default', 'price_monthly')->create($pmId);

// Month 12: Need to support Paddle. Must find all 16 Cashier usages and wrap them.
```
---
## Good Example
```php
// Month 1: Wrapper created before first integration
interface BillingGateway { /* 5 methods */ }
class StripeCashierAdapter implements BillingGateway { /* ... */ }

// All business logic depends on BillingGateway, not Cashier

// Month 12: Need to support Paddle — create PaddleAdapter, swap binding
class PaddleAdapter implements BillingGateway { /* ... */ }
// One-line binding change: $this->app->bind(BillingGateway::class, PaddleAdapter::class);
```
---
## Exceptions
Packages selected with full awareness of lock-in and with documented acceptance of that lock-in (e.g., a Stripe-only startup that will never switch) may defer wrapping. But this is a conscious tradeoff decision, not an oversight.
---
## Consequences Of Violation
When the package needs to be replaced, the team faces a big-bang migration instead of a gradual adapter swap. Every usage of the package in the codebase must be found and changed simultaneously.
