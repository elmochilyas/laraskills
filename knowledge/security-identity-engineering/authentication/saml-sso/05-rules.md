# Rules: SAML 2.0 SSO

## Always Validate SAML Assertion XML Signature
---
## Category
Security
---
## Rule
Validate the XML signature of every SAML assertion against the IdP's certificate. Reject unsigned assertions immediately.
---
## Reason
SAML assertions contain identity claims (user identity, attributes, roles). An attacker can forge a SAML assertion to impersonate any user if signature validation is skipped. The XML signature proves the assertion was genuinely issued by the trusted IdP and has not been tampered with in transit.
---
## Bad Example
```php
// Assuming HTTPS is sufficient — no signature validation
$assertion = $request->input('SAMLResponse');
$user = $this->parseAssertionWithoutSignatureCheck($assertion);
```
---
## Good Example
```php
// SocialiteProviders/Saml2 validates the signature
// Never parse SAML assertions manually
$user = Socialite::driver('saml2')->user();
```
---
## Exceptions
No common exceptions — signature validation is mandatory for SAML security.
---
## Consequences Of Violation
Assertion forgery, identity spoofing, account takeover.
---

## Import IdP Metadata Instead of Manual Configuration
---
## Category
Maintainability
---
## Rule
Import the IdP metadata XML to configure SAML endpoints and certificates. Avoid manually configuring ACS URL, entity ID, and certificate settings.
---
## Reason
IdP metadata contains all necessary configuration (SSO endpoint, logout URL, certificate, binding types). Manual configuration is error-prone, inconsistent with IdP documentation, and breaks when the IdP updates its metadata (e.g., certificate rotation, endpoint changes).
---
## Bad Example
```php
// Manually configured endpoints — fragile
'saml2' => [
    'idp_sso' => 'https://idp.example.com/sso',
    'idp_cert' => 'MIID...',
],
```
---
## Good Example
```php
// Import IdP metadata
'saml2' => [
    'metadata' => env('SAML2_IDP_METADATA'), // URL or file path
],
```
---
## Exceptions
IdPs that do not publish a metadata endpoint (rare among enterprise IdPs).
---
## Consequences Of Violation
SSO breaks on IdP configuration changes, manual update needed per IdP.
---

## Use Stable ACS URL Generated From Route Helper
---
## Category
Reliability
---
## Rule
Generate the ACS (Assertion Consumer Service) URL using Laravel's `route()` helper. Never hardcode the ACS URL.
---
## Reason
The ACS URL is registered with the IdP and must match exactly the callback URL on your application. If the URL changes (domain, path, protocol), all existing IdP integrations break until the IdP updates its configuration. Hardcoded URLs are brittle and easily outdated.
---
## Bad Example
```php
'acs' => 'https://app.example.com/saml/acs', // Hardcoded
```
---
## Good Example
```php
'acs' => route('saml.acs'), // Dynamic — updates with route changes
```
---
## Exceptions
No common exceptions — ACS URL stability is critical for SAML.
---
## Consequences Of Violation
SSO integration breaks, enterprises cannot log in until IdP reconfigures.
---

## Allow Clock Skew for Timestamp Validation
---
## Category
Reliability
---
## Rule
Configure a 5-minute clock skew allowance when validating SAML assertion `NotBefore` and `NotOnOrAfter` timestamps.
---
## Reason
Identity Provider and Service Provider server clocks may differ by seconds or minutes. Without a clock skew allowance, perfectly valid assertions from an IdP with a slightly different clock are rejected as expired or not-yet-valid, causing non-deterministic SSO failures.
---
## Bad Example
```php
// Strict timestamp validation — no skew allowance
if (now() < $assertion->getNotBefore()) { throw new Exception('Too early'); }
```
---
## Good Example
```php
// 5-minute clock skew allowance
if (now()->subMinutes(5) < $assertion->getNotBefore()) { /* valid */ }
```
---
## Exceptions
No common exceptions — clock skew must be allowed for reliable SAML operation.
---
## Consequences Of Violation
Intermittent SSO failures, hard-to-diagnose clock skew issues.
---

## Monitor IdP Certificate Expiry and Automate Renewal
---
## Category
Reliability
---
## Rule
Set up monitoring for IdP certificate expiration dates. Automate certificate import or have a manual renewal process documented and tested.
---
## Reason
SAML assertions are signed with the IdP's certificate. When the certificate expires, the IdP rotates to a new one. If the application still uses the old certificate, signature validation fails and all SSO logins are rejected. Certificate expiry is a common production SAML outage cause.
---
## Bad Example
```php
// IdP certificate imported once, never checked for expiry
```
---
## Good Example
```php
// Schedule a check that warns 30 days before IdP cert expiry
$schedule->call(function () {
    $cert = Certificate::fromFile(config('services.saml2.idp_cert'));
    if ($cert->expiresAt() < now()->addDays(30)) {
        Notification::route('mail', 'admin@example.com')
            ->notify(new CertificateExpiringNotification($cert));
    }
})->daily();
```
---
## Exceptions
IdPs that use short-lived certificates with automated metadata-based rotation (rare).
---
## Consequences Of Violation
Complete SSO outage until certificate is updated.
---

## Implement Replay Prevention for SAML Assertions
---
## Category
Security
---
## Rule
Track used SAML assertion IDs (`AssertionID`) and reject assertions that have been processed before.
---
## Reason
SAML assertions can be captured by an attacker and replayed to authenticate without the user's knowledge. Each assertion has a unique ID. Storing processed IDs and rejecting duplicates prevents replay attacks that would otherwise allow an attacker to reuse a captured assertion.
---
## Bad Example
```php
// No replay detection — same assertion can be reused
$user = Socialite::driver('saml2')->user();
Auth::login($user);
```
---
## Good Example
```php
$assertionId = $request->input('SAMLResponse'); // Extract assertion ID
if (ProcessedAssertion::where('assertion_id', $assertionId)->exists()) {
    throw new AuthenticationException('Assertion already used');
}
ProcessedAssertion::create(['assertion_id' => $assertionId]);
```
---
## Exceptions
No common exceptions — replay prevention is a SAML security requirement.
---
## Consequences Of Violation
Replay attack, unauthorized authentication, session hijacking.
---

## Validate Audience Restriction Against SP Entity ID
---
## Category
Security
---
## Rule
Validate that the `Audience` element in the SAML assertion matches the SP (Service Provider) entity ID.
---
## Reason
A SAML assertion may be intended for a different service provider. Without audience restriction validation, a user could use an assertion issued for one application to authenticate to another, enabling cross-service identity confusion and unauthorized access.
---
## Bad Example
```php
// Audience not validated — assertion from any SP accepted
```
---
## Good Example
```php
$audience = $assertion->getAudience();
if ($audience !== config('services.saml2.entityid')) {
    throw new AuthenticationException('Invalid audience');
}
```
---
## Exceptions
No common exceptions — audience validation is foundational to SAML.
---
## Consequences Of Violation
Cross-service identity confusion, unauthorized access.
---

## Test With Each Specific IdP Variant
---
## Category
Testing
---
## Rule
Maintain test fixtures or test environments for each IdP variant (Azure AD, Okta, Keycloak) that the application supports.
---
## Reason
IdPs implement SAML with variations — attribute naming, NameID format, binding types, and metadata structure differ. Testing against only one IdP guarantees breakage when a customer uses a different IdP. Per-IdP test coverage prevents production SSO failures.
---
## Bad Example
```php
// Tested only with Keycloak — fails when customer uses Azure AD
```
---
## Good Example
```php
// Test fixtures for each supported IdP
'saml_test_cases' => [
    'azure_ad' => ['metadata' => 'tests/Fixtures/Saml/azure_ad_metadata.xml'],
    'okta' => ['metadata' => 'tests/Fixtures/Saml/okta_metadata.xml'],
    'keycloak' => ['metadata' => 'tests/Fixtures/Saml/keycloak_metadata.xml'],
];
```
---
## Exceptions
Applications supporting only a single, known IdP.
---
## Consequences Of Violation
Production SSO failures when onboarding customers with untested IdPs.
