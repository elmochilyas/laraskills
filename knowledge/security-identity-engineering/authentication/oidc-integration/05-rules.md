# Rules: OIDC Integration

## Always Validate id_token Signature Using JWKS
---
## Category
Security
---
## Rule
Verify the `id_token` JWT signature using the IdP's JWKS endpoint on every authentication callback. Never accept unsigned or unverified tokens.
---
## Reason
Without signature verification, an attacker can forge an `id_token` claiming any identity. The JWKS endpoint provides the IdP's public keys. Validating the signature ensures the token was genuinely issued by the IdP and has not been tampered with.
---
## Bad Example
```php
$user = Socialite::driver('azure')->stateless()->user();
// id_token used without signature verification
```
---
## Good Example
```php
$user = Socialite::driver('azure')->stateless()->user();
$idToken = $user->id_token;
// Verify JWT signature using cached JWKS keys
$jwt->verify($idToken, $jwks); // Throws on invalid signature
```
---
## Exceptions
No common exceptions — signature verification is mandatory for OIDC security.
---
## Consequences Of Violation
Token forgery, identity spoofing, account takeover.
---

## Generate and Validate Nonce for Replay Protection
---
## Category
Security
---
## Rule
Implement nonce generation (cryptographically random string stored in session) and validate it on the OIDC callback to prevent replay attacks.
---
## Reason
Without nonce validation, an attacker who intercepts an `id_token` can replay it to authenticate as the victim. The nonce ties each authentication request to a specific session, making replayed tokens invalid.
---
## Bad Example
```php
// OAuth2-only flow — no nonce
return Socialite::driver('azure')->redirect();
```
---
## Good Example
```php
$nonce = Str::random(32);
session()->put('oidc_nonce', $nonce);
return Socialite::driver('azure')
    ->with(['nonce' => $nonce])
    ->redirect();
// On callback: validate nonce === session('oidc_nonce')
```
---
## Exceptions
OIDC providers that do not support nonce (rare — specification requires it).
---
## Consequences Of Violation
Replay attack, session hijacking.
---

## Use OIDC Discovery URL Instead of Hardcoded Endpoints
---
## Category
Maintainability
---
## Rule
Load OIDC configuration dynamically from the `/.well-known/openid-configuration` discovery URL rather than hardcoding authorization, token, and JWKS endpoints.
---
## Reason
IdPs may change endpoint URLs during updates or migration. Hardcoded endpoints break when the IdP modifies its configuration. Discovery URL loading ensures the application always uses the current IdP endpoints without code changes.
---
## Bad Example
```php
'authorize' => 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
'token' => 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
```
---
## Good Example
```php
// Load from discovery URL
$config = json_decode(file_get_contents('https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration'));
```
---
## Exceptions
Offline or air-gapped environments where discovery URL access is restricted.
---
## Consequences Of Violation
SSO broken when IdP changes endpoints, emergency config updates needed.
---

## Cache JWKS Keys With Appropriate TTL
---
## Category
Performance
---
## Rule
Cache the JWKS response from the IdP and respect `Cache-Control` headers or set a TTL aligned with the IdP's key rotation schedule.
---
## Reason
JWKS retrieval is an HTTP request to the IdP that adds latency to every first authentication. Keys change infrequently (typically monthly). Caching avoids repeated HTTP calls. Uncached keys cause the application to fetch on every new login, adding 100-500ms of IdP latency.
---
## Bad Example
```php
// JWKS fetched on every authentication callback — no cache
$jwks = json_decode(file_get_contents($jwksUri));
```
---
## Good Example
```php
$jwks = cache()->remember('oidc_jwks', 86400, function () use ($jwksUri) {
    return json_decode(file_get_contents($jwksUri));
});
```
---
## Exceptions
When the IdP rotates keys frequently (e.g., hourly) — align TTL with rotation window.
---
## Consequences Of Violation
Unnecessary IdP HTTP calls, slower authentication, rate-limited by IdP.
---

## Validate aud Claim Matches Client ID
---
## Category
Security
---
## Rule
Verify that the `aud` (audience) claim in the `id_token` matches your application's client ID.
---
## Reason
The `aud` claim specifies which client the token was issued for. Without audience validation, a token issued for a different application (or stolen from another client) could be used to authenticate users in your application, causing cross-client identity confusion.
---
## Bad Example
```php
$claims = $user->user; // Used without checking aud claim
```
---
## Good Example
```php
$claims = $user->user;
if ($claims['aud'] !== config('services.azure.client_id')) {
    throw new AuthenticationException('Invalid audience');
}
```
---
## Exceptions
No common exceptions — audience validation is foundational to OIDC security.
---
## Consequences Of Violation
Cross-client token reuse, identity spoofing.
---

## Enforce HTTPS for All OIDC Communication
---
## Category
Security
---
## Rule
Require HTTPS for all OIDC redirect URLs, callback endpoints, and IdP communication. Never allow HTTP for OIDC flows.
---
## Reason
OIDC exchanges tokens, authorization codes, and identity claims. HTTP transmits these in plaintext, allowing interception of authorization codes and tokens. HTTPS is required by the OIDC specification and is non-negotiable.
---
## Bad Example
```php
'redirect' => 'http://app.example.com/auth/callback', // HTTP
```
---
## Good Example
```php
'redirect' => 'https://app.example.com/auth/callback', // HTTPS
```
---
## Exceptions
Local development environments with `127.0.0.1` or `localhost`.
---
## Consequences Of Violation
Authorization code interception, token theft, account takeover.
---

## Monitor IdP Token Expiry and Implement Refresh Token Flow
---
## Category
Reliability
---
## Rule
Check the `exp` claim in the `id_token` and implement the refresh token flow to obtain new tokens without requiring re-authentication.
---
## Reason
OIDC access tokens are short-lived (typically 1 hour). Without refresh logic, users are forced to re-authenticate when tokens expire, disrupting their session. Refresh tokens provide seamless token renewal. Ignoring expiry causes silent authentication failures.
---
## Bad Example
```php
// No exp check, no refresh — session dies with token
$user = Socialite::driver('azure')->stateless()->user();
```
---
## Good Example
```php
$token = $user->token;
if (now()->timestamp >= $user->expiresIn) {
    // Use refresh token to get new access token
    $newToken = Socialite::driver('azure')->refreshToken($user->refreshToken);
}
```
---
## Exceptions
Providers that do not issue refresh tokens (some OIDC implementations).
---
## Consequences Of Violation
Unexpected authentication failures, forced re-authentication, session disruption.
