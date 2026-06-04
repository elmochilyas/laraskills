# Always Use the $ Prefix for Primitive Parameter Bindings
---
## Category
Reliability
---
## Rule
Always prefix the parameter name with `$` in `needs('$paramName')` when binding primitive constructor parameters.
---
## Reason
The container matches the `needs()` argument against the constructor parameter name including the `$` prefix. Omitting it causes the binding to be silently ignored — the parameter is resolved using its default or throws an error.
---
## Bad Example
```php
$this->app->when(PaymentService::class)
    ->needs('apiKey')          // Missing $ prefix — silently ignored
    ->give(config('services.stripe.key'));
```
---
## Good Example
```php
$this->app->when(PaymentService::class)
    ->needs('$apiKey')         // Correct — matches constructor parameter
    ->give(config('services.stripe.key'));
```
---
## Exceptions
No common exceptions. The `$` prefix is required syntax for primitive parameter bindings.
---
## Consequences Of Violation
Binding silently ignored; parameter uses default value or throws `BindingResolutionException`.

---

# Use config() in give() — Never Hardcode Values
---
## Category
Security
---
## Rule
Always use `config()` or environment variables inside `give()` for sensitive values. Never hardcode secrets or API keys directly.
---
## Reason
Hardcoded secrets in service providers are committed to version control, exposed in code reviews, and cannot be rotated without a deployment. Using `config()` ensures values come from environment configuration.
---
## Bad Example
```php
$this->app->when(PaymentService::class)
    ->needs('$stripeSecret')
    ->give('sk_live_12345abcdef'); // Hardcoded secret in provider
```
---
## Good Example
```php
$this->app->when(PaymentService::class)
    ->needs('$stripeSecret')
    ->give(config('services.stripe.secret')); // From environment
```
---
## Exceptions
Non-sensitive default values or constants that are safe to hardcode (timeouts, page sizes).
---
## Consequences Of Violation
Secrets committed to source control; security breach; difficult key rotation.

---

# Prefer Specific Primitive Bindings Over Injecting Entire Config
---
## Category
Architecture
---
## Rule
Bind specific configuration values to named constructor parameters rather than injecting the entire `Config` repository.
---
## Reason
Injecting specific primitives makes the class's exact requirements visible in its constructor signature. Injecting the entire `Config` object creates a hidden dependency on the configuration structure and makes testing harder.
---
## Bad Example
```php
class PaymentService
{
    public function __construct(private Config $config) {}

    public function charge(float $amount): void
    {
        $secret = $this->config->get('services.stripe.secret');
    }
}
```
---
## Good Example
```php
class PaymentService
{
    public function __construct(
        private string $stripeSecret,
    ) {}
}

// In provider
$this->app->when(PaymentService::class)
    ->needs('$stripeSecret')
    ->give(config('services.stripe.secret'));
```
---
## Exceptions
When a class needs many related configuration values — consider a configuration DTO instead.
---
## Consequences Of Violation
Hidden configuration dependencies; harder testing; coupling to Config infrastructure.

---

# Use Primitive Bindings for Values That Differ Per Consumer
---
## Category
Architecture
---
## Rule
Use contextual primitive bindings when different consumers need different values for the same parameter name.
---
## Reason
Without contextual binding, a primitive parameter receives the same value for all consumers. Contextual binding allows each consumer to receive its own value while keeping a clean constructor signature.
---
## Bad Example
```php
class PaymentService
{
    public function __construct(
        private string $apiKey, // Must be different for different implementations
    ) {}
}

// All consumers get the same value — can't differentiate
$this->app->when(PaymentService::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.key'));
```
---
## Good Example
```php
$this->app->when(StripePayment::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.key'));

$this->app->when(PayPalPayment::class)
    ->needs('$apiKey')
    ->give(config('services.paypal.key'));
```
---
## Exceptions
When the value is truly the same for all consumers — use a global binding or class constant.
---
## Consequences Of Violation
Incorrect configuration values; all consumers forced to share the same primitive value.

---

# Limit Primitive Bindings per Class to 3 or Fewer
---
## Category
Maintainability
---
## Rule
Keep primitive bindings per class to 3 or fewer. A class needing 4+ primitive configuration values should be refactored to use a configuration DTO.
---
## Reason
Many individual primitive bindings indicate the class is configuration-heavy and may be doing too much. A dedicated configuration object bundles related values into a single, type-safe parameter.
---
## Bad Example
```php
class MailService
{
    public function __construct(
        private string $host,
        private int $port,
        private string $username,
        private string $password,
        private string $encryption,
        private int $timeout,
    ) {}
}
```
---
## Good Example
```php
class MailConfiguration
{
    public function __construct(
        public readonly string $host,
        public readonly int $port,
        public readonly string $username,
        public readonly string $password,
        public readonly string $encryption,
        public readonly int $timeout,
    ) {}
}

class MailService
{
    public function __construct(
        private MailConfiguration $config,
    ) {}
}
```
---
## Exceptions
When the configuration values are genuinely independent and a DTO would be over-engineering.
---
## Consequences Of Violation
Proliferating primitive bindings; harder to manage configuration; class doing too much.

---

# Ensure give() Value Types Match Parameter Types
---
## Category
Reliability
---
## Rule
Match the type of the value in `give()` to the constructor parameter's declared type.
---
## Reason
The container does not validate primitive binding types. Passing a string where an `int` is expected causes a runtime `TypeError` when the class is used.
---
## Bad Example
```php
public function __construct(
    private int $timeout,
) {}

$this->app->when(Service::class)
    ->needs('$timeout')
    ->give('thirty'); // String instead of int — runtime TypeError
```
---
## Good Example
```php
$this->app->when(Service::class)
    ->needs('$timeout')
    ->give(30); // Correct type
```
---
## Exceptions
No common exceptions. Type safety must be maintained between binding and constructor.
---
## Consequences Of Violation
Runtime `TypeError`; application crash when the class is used.
