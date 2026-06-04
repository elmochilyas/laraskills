# Rules: Bridge/adapter pattern for context boundaries

## Rule 1: Use a bridge interface for every cross-context synchronous call
---
## Category
Architecture
---
## Always define a bridge interface for every synchronous call between bounded contexts. Never directly instantiate or import classes from another context.
---
## Reason
Direct instantiation creates tight coupling — the consumer knows the producer's namespace, constructor, and implementation. A bridge interface decouples them: the consumer depends only on the interface.
---
## Bad Example
```php
// Consumer directly imports and instantiates a producer class
use Billing\Services\PaymentProcessor;

class CheckoutController
{
    public function checkout(Request $request): JsonResponse
    {
        $processor = new PaymentProcessor(
            apiKey: config('billing.secret'),
        );
        $processor->charge($request->amount);
    }
}
```
---
## Good Example
```php
// Consumer depends only on the bridge interface
use Kernel\Contracts\Billing\PaymentProcessorInterface;

class CheckoutController
{
    public function __construct(
        private PaymentProcessorInterface $paymentProcessor,
    ) {}

    public function checkout(Request $request): JsonResponse
    {
        $this->paymentProcessor->charge($request->amount);
    }
}
```
---
## Exceptions
Within a single bounded context, direct instantiation is acceptable.
---
## Consequences Of Violation
Tight coupling between contexts; producer constructor changes break the consumer; testing requires complex mocking of concrete classes.
---

## Rule 2: Place the adapter in the producer context
---
## Category
Architecture | Code Organization
---
## Implement the bridge adapter in the context that provides the functionality (producer), never in the consumer context.
---
## Reason
If the adapter lives in the consumer, the consumer must know both the bridge interface and the producer's concrete API — defeating the purpose. The producer already knows its own API and can adapt it to the bridge contract.
---
## Bad Example
```php
// Adapter lives in consumer context — consumer knows producer's internals
// src/Contexts/Checkout/Adapters/BillingAdapter.php

use Billing\Services\PaymentProcessor;

class BillingAdapter implements PaymentProcessorInterface
{
    public function charge(float $amount): void
    {
        $processor = new PaymentProcessor(config('billing.secret'));
        $processor->charge($amount);
    }
}
```
---
## Good Example
```php
// Adapter lives in producer context
// src/Contexts/Billing/Adapters/PaymentProcessorAdapter.php

use Kernel\Contracts\Billing\PaymentProcessorInterface;

class PaymentProcessorAdapter implements PaymentProcessorInterface
{
    public function __construct(
        private PaymentProcessor $processor,
    ) {}

    public function charge(float $amount): void
    {
        $this->processor->charge($amount);
    }
}

// Service provider in the producer context binds the adapter
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            PaymentProcessorInterface::class,
            PaymentProcessorAdapter::class,
        );
    }
}
```
---
## Exceptions
If the producer context is a third-party package that cannot be modified, the adapter must live in the consumer context as an anti-corruption layer.
---
## Consequences Of Violation
Consumer knows producer internals; adapter logic duplicated across consumers; producer API changes require updating every consumer's adapter.
---

## Rule 3: Define the bridge in a shared kernel
---
## Category
Code Organization
---
## Place bridge interfaces in a shared kernel or contracts directory that both contexts depend on. Never define the bridge inside either context.
---
## Reason
If the bridge lives in one context, the other context must import from it, creating a circular or one-way dependency. A shared location ensures both contexts depend on a common contract without depending on each other.
---
## Bad Example
```php
// Bridge defined inside the billing context
// src/Contexts/Billing/Contracts/PaymentProcessorInterface.php

// Checkout context must import from Billing — creates dependency direction
use Billing\Contracts\PaymentProcessorInterface;
```
---
## Good Example
```php
// Bridge defined in shared kernel
// src/Kernel/Contracts/Billing/PaymentProcessorInterface.php

namespace Kernel\Contracts\Billing;

interface PaymentProcessorInterface
{
    public function charge(float $amount): ChargeResult;
}

// Both contexts import from Kernel
use Kernel\Contracts\Billing\PaymentProcessorInterface;
```
---
## Exceptions
In a monorepo with strict namespace boundaries, a dedicated `Contracts/` directory at the root level serves the same purpose.
---
## Consequences Of Violation
Circular package dependencies; one context becomes a "dependency hub"; architectural boundaries eroded.
---

## Rule 4: Use tiered adapters for different environments
---
## Category
Testing | Maintainability
---
## Provide multiple adapter implementations for different environments (production, development, testing). Use a fake or stub adapter in tests, never mock the concrete implementation.
---
## Reason
Fake adapters are lightweight, deterministic, and don't require network calls. They make tests fast and reliable. Swapping adapters requires no consumer code changes — only the binding changes.
---
## Bad Example
```php
// Tests mock the concrete adapter — brittle and requires knowledge of internals
public function test_checkout(): void
{
    $this->mock(PaymentProcessorAdapter::class)
        ->shouldReceive('charge')
        ->once();

    // Test is coupled to the adapter class name and methods
}
```
---
## Good Example
```php
// Fake adapter for testing
class FakePaymentProcessor implements PaymentProcessorInterface
{
    public array $charges = [];

    public function charge(float $amount): ChargeResult
    {
        $this->charges[] = $amount;
        return new ChargeResult(success: true, transactionId: 'fake_123');
    }
}

// Service provider — binding per environment
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('production')) {
            $this->app->bind(
                PaymentProcessorInterface::class,
                PaymentProcessorAdapter::class,
            );
        } else {
            $this->app->bind(
                PaymentProcessorInterface::class,
                FakePaymentProcessor::class,
            );
        }
    }
}

// Test uses the fake
public function test_checkout(): void
{
    $response = $this->post('/checkout', ['amount' => 50.00]);
    $response->assertOk();

    $processor = app(FakePaymentProcessor::class);
    $this->assertCount(1, $processor->charges);
    $this->assertEquals(50.00, $processor->charges[0]);
}
```
---
## Exceptions
If the environment switching is handled by a container configuration file (e.g., `phpunit.xml` binding), code-based conditionals can be avoided.
---
## Consequences Of Violation
Tests are slow and brittle; environment-specific bugs go undetected; switching implementations requires consumer code changes.
---

## Rule 5: Include both data and operations in the bridge contract
---
## Category
Design
---
## Define the bridge contract to include both the data DTOs and the allowed operations. Never define a bridge as data-only without specifying how the data is used.
---
## Reason
A data-only bridge (just DTOs) doesn't define how operations are invoked. The consumer still couples to the producer's operation methods. The full contract includes both the "what" (data) and the "how" (operations).
---
## Bad Example
```php
// Data-only bridge — no operation contract
namespace Kernel\Contracts\Billing;

readonly class ChargeDto
{
    public function __construct(
        public float $amount,
        public string $currency,
    ) {}
}

// Consumer must import and call the producer's operation method directly
use Billing\Services\PaymentProcessor;

$dto = new ChargeDto(50.00, 'USD');
$processor = new PaymentProcessor();
$processor->processCharge($dto->amount, $dto->currency);
```
---
## Good Example
```php
// Full contract — DTO + operation interface
namespace Kernel\Contracts\Billing;

readonly class ChargeDto
{
    public function __construct(
        public float $amount,
        public string $currency,
    ) {}
}

readonly class ChargeResultDto
{
    public function __construct(
        public bool $success,
        public string $transactionId,
    ) {}
}

interface PaymentProcessorInterface
{
    public function charge(ChargeDto $dto): ChargeResultDto;
}

// Consumer only knows the interface and DTOs
class CheckoutService
{
    public function __construct(
        private PaymentProcessorInterface $paymentProcessor,
    ) {}

    public function checkout(float $amount): void
    {
        $dto = new ChargeDto($amount, 'USD');
        $result = $this->paymentProcessor->charge($dto);
    }
}
```
---
## Exceptions
None. A bridge contract is always a data + operations contract.
---
## Consequences Of Violation
Consumer still depends on the producer's method signatures; incomplete decoupling; producer changes operation signatures and consumer breaks despite the bridge.
---
