# Rules: Facade pattern risks at context boundaries

## Rule 1: Never use context-level facades
---
## Category
Architecture | Maintainability
---
## Never define a single "context facade" (e.g., `BillingFacade`, `InventoryFacade`) that exposes all capabilities of a bounded context through one class. Use multiple small capability-based interfaces instead.
---
## Reason
A context facade with dozens of unrelated methods becomes a god object — a coupling hub that every cross-context caller depends on. Changes to any part of the context potentially affect all consumers, and consumers depend on operations they don't need.
---
## Bad Example
```php
// God facade — single class exposing everything Billing does
class BillingFacade
{
    public function chargeCustomer(string $customerId, float $amount): ChargeResult;
    public function generateInvoice(string $orderId): Invoice;
    public function calculateTax(string $productId, string $region): float;
    public function applyDiscount(string $couponCode, float $amount): float;
    public function refundPayment(string $transactionId): void;
    public function getPaymentHistory(string $customerId): array;
    public function validateCreditCard(string $number): bool;
    // ... 20+ methods, growing with every new Billing feature
}

// Consumer depends on everything Billing does
class CheckoutService
{
    public function __construct(
        private BillingFacade $billing, // Coupled to ALL facade methods
    ) {}
}
```
---
## Good Example
```php
// Capability-based interfaces — small, focused contracts
interface PaymentProcessor
{
    public function charge(string $customerId, float $amount): ChargeResult;
    public function refund(string $transactionId): void;
}

interface InvoiceGenerator
{
    public function generate(string $orderId): Invoice;
}

interface TaxCalculator
{
    public function calculate(string $productId, string $region): float;
}

// Consumer depends only on what it needs
class CheckoutService
{
    public function __construct(
        private PaymentProcessor $paymentProcessor, // Only payment
        private InvoiceGenerator $invoiceGenerator, // Only invoicing
    ) {}
}
```
---
## Exceptions
Wrapping a complex third-party library (e.g., Stripe SDK) where a single facade simplifies the API. This applies to external libraries, not internal context boundaries.
---
## Consequences Of Violation
God facade with dozens of dependencies; every context feature addition affects all facade consumers; developers bypass the facade (importing internal classes) to avoid the bloated interface.
---

## Rule 2: Cap small facades at 5-7 methods
---
## Category
Maintainability
---
## If a facade is necessary, limit it to 5-7 methods covering a single concern. Split any facade that exceeds this threshold into smaller interfaces.
---
## Reason
A facade that keeps growing is a sign it needs decomposition. Beyond 5-7 methods, the facade inevitably covers multiple concerns and becomes a coupling hub. Splitting keeps interfaces focused and makes dependencies explicit.
---
## Bad Example
```php
// Bloated facade — 12 methods covering multiple concerns
class ShippingFacade
{
    public function calculateRate(Package $package): float;
    public function createLabel(Package $package): Label;
    public function trackShipment(string $trackingId): TrackingInfo;
    public function validateAddress(Address $address): AddressValidation;
    public function schedulePickup(Address $address, Carbon $time): void;
    public function getCarriers(): array;
    public function getDeliveryEstimate(string $from, string $to): Carbon;
    public function cancelShipment(string $shipmentId): void;
    public function getRates(Package $package, array $options): array;
    public function printManifest(array $shipmentIds): string;
    public function getInsuranceQuote(Package $package): float;
    public function fileClaim(string $shipmentId, string $reason): Claim;
}
```
---
## Good Example
```php
// Split into focused interfaces
interface RateCalculator
{
    public function calculateRate(Package $package): float;
    public function getRates(Package $package, array $options): array;
}

interface LabelGenerator
{
    public function createLabel(Package $package): Label;
}

interface ShipmentTracker
{
    public function trackShipment(string $trackingId): TrackingInfo;
}

interface AddressValidator
{
    public function validateAddress(Address $address): AddressValidation;
}
```
---
## Exceptions
A facade wrapping a third-party library where the library's API itself has many methods (e.g., an email service facade). Even then, consider multiple facades grouped by concern.
---
## Consequences Of Violation
Single responsibility violated; facade becomes a dumping ground for new methods; consumers depend on operations they don't need.
---

## Rule 3: Never expose internal types through the facade
---
## Category
Architecture | Maintainability
---
## Ensure facades never return internal value objects, enums, or entities. Facades must convert all return types to shared or public DTOs.
---
## Reason
If the facade returns internal types, consumers become coupled to the facade's internals. Changing those internal types (rename enum, restructure value object) breaks consumers. The facade is supposed to isolate, not propagate, internals.
---
## Bad Example
```php
// Internal types exposed through the facade
namespace Billing\Internal;

enum PaymentStatus: string // Internal enum
{
    case Pending = 'pending';
    case Captured = 'captured';
    case Failed = 'failed';
}

class BillingFacade
{
    public function processPayment(float $amount): PaymentStatus // Exposes internal!
    {
        // Returns internal enum — consumer imports Billing\Internal\PaymentStatus
    }
}

// Consumer now depends on internal enum
use Billing\Internal\PaymentStatus;
```
---
## Good Example
```php
// Shared DTO — not internal
namespace Kernel\Contracts\Billing;

readonly class PaymentResult
{
    public function __construct(
        public bool $success,
        public string $status,
        public ?string $transactionId,
        public ?string $errorMessage,
    ) {}
}

namespace Billing\Internal;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Captured = 'captured';
    case Failed = 'failed';
}

class BillingFacade
{
    public function processPayment(float $amount): PaymentResult
    {
        $status = $this->processor->charge($amount);

        return new PaymentResult(
            success: $status === PaymentStatus::Captured,
            status: $status->value,
            transactionId: $this->processor->transactionId,
            errorMessage: null,
        );
    }
}

// Consumer depends only on shared Kernel\Contracts DTO
use Kernel\Contracts\Billing\PaymentResult;
```
---
## Exceptions
None. Internal types must never cross the facade boundary.
---
## Consequences Of Violation
Consumers coupled to internal implementation; changing internal enums/objects breaks external consumers; facade fails to provide abstraction.
---

## Rule 4: Do not make the facade the only entry point
---
## Category
Architecture | Maintainability
---
## Allow consumers to use capability interfaces directly without going through a facade. Never force all consumers through a single facade for simple operations.
---
## Reason
A facade that is the only entry point adds ceremony without value for simple operations. If a consumer needs only one operation (e.g., `calculateTax`), forcing it through a 20-method facade creates unnecessary dependency on the entire facade.
---
## Bad Example
```php
// Facade is the ONLY entry point
class BillingFacade
{
    public function calculateTax(string $productId, string $region): float;
    public function chargeCustomer(string $customerId, float $amount): ChargeResult;
    public function generateInvoice(string $orderId): Invoice;
    // ...
}

// Everything must go through the facade
class TaxService
{
    public function __construct(
        private BillingFacade $billing, // Must inject the entire facade for one method
    ) {}

    public function getTax(string $productId, string $region): float
    {
        return $this->billing->calculateTax($productId, $region);
    }
}
```
---
## Good Example
```php
// Standalone capability interface
interface TaxCalculator
{
    public function calculate(string $productId, string $region): float;
}

// Consumer uses only what it needs
class TaxService
{
    public function __construct(
        private TaxCalculator $calculator,
    ) {}

    public function getTax(string $productId, string $region): float
    {
        return $this->calculator->calculate($productId, $region);
    }
}

// Facade (if needed) is an option, not the only path
class BillingFacade
{
    public function __construct(
        private PaymentProcessor $paymentProcessor,
        private InvoiceGenerator $invoiceGenerator,
        private TaxCalculator $taxCalculator,
    ) {}

    // Convenience methods for complex workflows that need multiple capabilities
    public function completeCheckout(array $data): CheckoutResult
    {
        $tax = $this->taxCalculator->calculate($data['productId'], $data['region']);
        $this->paymentProcessor->charge($data['customerId'], $data['amount'] + $tax);
        return new CheckoutResult(/* ... */);
    }
}
```
---
## Exceptions
Very simple subsystems with 2-3 closely related methods where separate interfaces add more overhead than value.
---
## Consequences Of Violation
Consumers depend on large facades for simple needs; unnecessary coupling; reduced testability because consumers must mock the entire facade.
---

## Rule 5: Use facades for third-party integration only
---
## Category
Architecture | Maintainability
---
## Reserve the facade pattern for wrapping external, third-party libraries (Stripe, Twilio, Mailchimp). Prefer capability-based interfaces for internal context boundaries.
---
## Reason
Third-party libraries have APIs you cannot change. A facade isolates your code from the vendor API. When the vendor changes their API, only the facade needs updating. Internal services already follow your conventions — they don't need the same isolation.
---
## Bad Example
```php
// Facade for an INTERNAL service — unnecessary
class InventoryFacade
{
    public function reserveProduct(string $sku, int $quantity): bool;
    public function releaseProduct(string $sku, int $quantity): void;
    public function getStockLevel(string $sku): int;
}

// The internal Inventory service is already under your control
// No need for a facade — use a well-defined interface
```
---
## Good Example
```php
// Facade for a third-party payment gateway
class StripeFacade
{
    public function __construct(
        private StripeClient $client, // Third-party SDK
    ) {}

    public function charge(string $customerId, float $amount): ChargeResult
    {
        try {
            $payment = $this->client->payments->create([
                'customer' => $customerId,
                'amount' => (int) ($amount * 100),
                'currency' => 'usd',
            ]);

            return new ChargeResult(
                success: true,
                transactionId: $payment->id,
            );
        } catch (StripeException $e) {
            Log::error('Stripe charge failed', ['error' => $e->getMessage()]);
            return new ChargeResult(
                success: false,
                errorMessage: $e->getMessage(),
            );
        }
    }

    public function refund(string $paymentIntentId): RefundResult
    {
        try {
            $refund = $this->client->refunds->create([
                'payment_intent' => $paymentIntentId,
            ]);

            return new RefundResult(
                success: true,
                refundId: $refund->id,
            );
        } catch (StripeException $e) {
            return new RefundResult(
                success: false,
                errorMessage: $e->getMessage(),
            );
        }
    }
}

// If Stripe changes their SDK or you switch to a different provider,
// only this facade class needs to change
```
---
## Exceptions
A complex internal subsystem (e.g., a report generation engine with many steps) may benefit from a facade for client simplicity.
---
## Consequences Of Violation
Unnecessary abstraction layer for internal services; developer frustration with ceremony; facade pattern applied where simpler interfaces suffice.
---
