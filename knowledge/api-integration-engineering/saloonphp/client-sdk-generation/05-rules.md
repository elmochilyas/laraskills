## Use Saloon for 3+ Integrations; Http Facade for Simpler Needs
---
## Category
Architecture
---
## Rule
Use SaloonPHP Connector/Request pattern for structured integrations with 3+ endpoints; use Http facade for simple single-endpoint calls.
---
## Reason
Saloon provides consistent abstraction across integrations but adds overhead; matching complexity to need prevents over-engineering.
---
## Bad Example
```php
// Saloon for a single GET endpoint with no auth — over-engineering
class HealthConnector extends Connector {}
class HealthRequest extends Request {}
```
---
## Good Example
```php
// Simple: Http facade
Http::get('https://api.example.com/health');
// Complex: Saloon connector
$connector->send(new ListChargesRequest())->dto();
```
---
## Exceptions
When all integrations, even simple ones, benefit from consistent patterns enforced by Saloon.
---
## Consequences Of Violation
Over-engineering for simple integrations or inconsistent patterns across complex ones.
## Create One Connector Per API Service
---
## Category
Code Organization
---
## Rule
Create one Connector class per external API service (StripeConnector, GitHubConnector); never use one connector for multiple services.
---
## Reason
Each API has different base URL, auth, headers, and rate limits; a single connector violates SRP and creates configuration conflicts.
---
## Bad Example
```php
class ApiConnector extends Connector { // used for Stripe AND GitHub — conflicting configs
    public function resolveBaseUrl(): string { return $this->service === 'stripe' ? ... : ...; }
}
```
---
## Good Example
```php
class StripeConnector extends Connector { public function resolveBaseUrl(): string { return 'https://api.stripe.com/v1'; } }
class GitHubConnector extends Connector { public function resolveBaseUrl(): string { return 'https://api.github.com'; } }
```
---
## Exceptions
Test or mock connectors where multiple APIs share the same configuration.
---
## Consequences Of Violation
Conditional logic in connectors, conflicting configuration, difficult to test individual integrations.
## Keep SDK Separate from Application Code
---
## Category
Code Organization
---
## Rule
Package SDKs as separate Composer packages with independent versioning; never mix generated code with application source.
---
## Reason
Independent versioning lets SDK consumers update on their schedule; mixing generated code clutters application diffs and forces unwanted updates.
---
## Bad Example
```php
// app/Sdks/Stripe/ — generated SDK mixed with application code
```
---
## Good Example
```json
{
    "require": { "acme/stripe-sdk": "^2.0" }
}
```
---
## Exceptions
Monolithic applications where separate package overhead isn't justified.
---
## Consequences Of Violation
SDK changes force application-wide diffs, consumers must update on every application deploy.
## Always Add Request Logging Middleware Early
---
## Category
Observability
---
## Rule
Add request logging middleware to the connector's pipeline during initial setup; retrofitting is disruptive.
---
## Reason
Without logging from day one, production debugging requires reproducing issues; retrofitting requires changing all request paths.
---
## Bad Example
```php
class StripeConnector extends Connector {
    // No logging middleware — debugging requires guesswork
}
```
---
## Good Example
```php
class StripeConnector extends Connector {
    protected function bootConnector(): void {
        $this->addLogger(new RequestLogger()); // logging from day one
    }
}
```
---
## Exceptions
Extremely simple integrations with trivial debugging needs.
---
## Consequences Of Violation
Production debugging requires reproducing issues, incident response time increases significantly.
## Handle Nullable Fields Externally in DTOs
---
## Category
Maintainability
---
## Rule
Use nullable types for all optional response fields in DTOs; never assume all fields are always present.
---
## Reason
APIs may omit optional fields or return null; non-nullable types cause runtime type errors on null values.
---
## Bad Example
```php
readonly class UserDto {
    public function __construct(
        public string $name, // crashes if API returns null for name
    ) {}
}
```
---
## Good Example
```php
readonly class UserDto {
    public function __construct(
        public ?string $name, // safe — handles null
    ) {}
}
```
---
## Exceptions
Required fields documented as always present in the API contract.
---
## Consequences Of Violation
Runtime type errors, null pointer exceptions in production, hard-to-debug failures.
