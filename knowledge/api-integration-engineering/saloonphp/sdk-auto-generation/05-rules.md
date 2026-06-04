## Use Verified Specs as SDK Generation Source Only
---
## Category
Reliability
---
## Rule
Generate SDKs only from OpenAPI specs that are validated against the real API behavior; never trust unverified specs.
---
## Reason
A spec that doesn't match the actual API produces SDKs that compile but fail at runtime, wasting debugging time.
---
## Bad Example
```php
// Generated from unverified spec — compiles but fails at runtime
$charge = $sdk->charges->list(); // throws unexpected type error
```
---
## Good Example
```php
// CI pipeline: spec validation → SDK generation → integration test against sandbox → merge
```
---
## Exceptions
Internal APIs where the spec is automatically generated from the implementation.
---
## Consequences Of Violation
Runtime type errors, null pointer exceptions from incorrectly typed fields, production incidents.
## Never Modify Generated Code Directly
---
## Category
Maintainability
---
## Rule
Never edit auto-generated SDK code directly; extend generated classes or wrap them in a service layer.
---
## Reason
Edits are lost on regeneration; manual modifications create a drift between generated and modified code that breaks on next regeneration.
---
## Bad Example
```php
// Modified generated file — changes lost on next `speakeasy generate`
class StripeConnector extends Connector { /* hand-edited */ }
```
---
## Good Example
```php
// Wrap generated SDK in a service layer
class StripeService {
    public function __construct(private StripeConnector $connector) {}
    public function getCharges(): ChargeCollection { /* Laravel-specific logic here */ }
}
```
---
## Exceptions
When the generator is no longer used and SDK is maintained manually from that point forward.
---
## Consequences Of Violation
Lost customizations on regeneration, SDK drift, inability to regenerate without losing changes.
## Pin Generator Versions in CI
---
## Category
Maintainability
---
## Rule
Pin the SDK generator version in CI configuration; never use `latest` or floating tags.
---
## Reason
Different generator versions produce different output from the same spec, causing unexpected SDK changes and breaking consumer interfaces.
---
## Bad Example
```yaml
# .github/workflows/sdk.yml
- run: speakeasy generate  # uses latest — unpredictable output
```
---
## Good Example
```yaml
- run: speakeasy generate --version 1.45.2  # pinned — deterministic output
```
---
## Exceptions
When actively evaluating generator upgrades in a feature branch.
---
## Consequences Of Violation
CI pipeline produces different SDK output on different days, surprising breaking changes in SDK interfaces.
## Keep Generated SDKs in a Separate Package
---
## Category
Code Organization
---
## Rule
Version generated SDKs as a separate Composer package with independent versioning; never commit generated code in the main application.
---
## Reason
Independent versioning lets consumers update SDK on their schedule, decoupled from application deploys.
---
## Bad Example
```php
// app/Sdks/Stripe/ — generated code mixed with application code
```
---
## Good Example
```php
// composer.json
"require": {
    "acme/stripe-sdk": "^2.0" // separate package, versioned independently
}
```
---
## Exceptions
Small projects where package overhead isn't justified.
---
## Consequences Of Violation
Generated code pollutes application diffs, consumers forced to update SDK on every application deploy.
## Test Generated SDK Against Real API Fixtures
---
## Category
Testing
---
## Rule
Write integration tests comparing generated SDK output against recorded real API responses.
---
## Reason
Generated DTOs may have type mismatches, missing nullable handling, or incorrect field mappings that only surface with real data.
---
## Bad Example
```php
// No integration test — only unit tests with fabricated fixtures
```
---
## Good Example
```php
public function test_list_charges_dto(): void {
    $fixture = json_decode(file_get_contents('tests/Fixtures/stripe/charges-list.json'), true);
    $dto = ChargeDto::fromArray($fixture);
    $this->assertInstanceOf(Carbon::class, $dto->created);
    $this->assertNotNull($dto->id);
}
```
---
## Exceptions
APIs where the spec is guaranteed to be the source of truth (spec-first workflow).
---
## Consequences Of Violation
Generated DTOs that don't match real responses cause runtime errors in production.
