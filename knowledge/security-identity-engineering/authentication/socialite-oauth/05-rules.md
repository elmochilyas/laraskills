# Rules: Socialite OAuth1/OAuth2 Client

## Register All OAuth Providers in config/services.php
---
## Category
Architecture
---
## Rule
Define every OAuth provider's credentials (client ID, secret, redirect URL) in `config/services.php` and reference them from `.env`. Never hardcode credentials in controllers or routes.
---
## Reason
Centralized provider configuration enables environment-specific credentials, keeps secrets out of application code, and provides a single location for audit. Hardcoded credentials prevent different environments from using different keys and risk accidental commits.
---
## Bad Example
```php
Socialite::driver('google')->setClientId('123456')->redirect(); // Hardcoded
```
---
## Good Example
```php
// config/services.php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```
---
## Exceptions
No common exceptions — all provider configs belong in config/services.php.
---
## Consequences Of Violation
Environment-specific credentials impossible, secrets in code.
---

## Use Stateless Mode for API/OAuth Authentication
---
## Category
Architecture
---
## Rule
Call `->stateless()` on the Socialite driver when authenticating from an API context that cannot maintain session state.
---
## Reason
Socialite's default stateful mode stores the OAuth state parameter in the session. API clients and stateless frontends do not have server-side sessions, causing state validation to fail. The `stateless()` method skips session-based state validation, allowing API-driven OAuth flows.
---
## Bad Example
```php
// API controller — stateful mode fails without session
return Socialite::driver('google')->redirect(); // Session dependency
```
---
## Good Example
```php
// API controller — stateless mode
return Socialite::driver('google')->stateless()->redirect();
```
---
## Exceptions
Server-rendered applications with full session support.
---
## Consequences Of Violation
OAuth callback fails with state mismatch, `InvalidStateException`.
---

## Handle Provider Errors Gracefully With User-Facing Messages
---
## Category
Reliability
---
## Rule
Wrap Socialite authentication in try-catch blocks and redirect users with a clear error message when the provider returns an error or the user denies permissions.
---
## Reason
Users may deny permissions, providers may experience downtime, or redirect URIs may mismatch. Without error handling, these scenarios result in a generic 500 error page, confusing users and creating a poor onboarding experience. Graceful error handling provides recovery guidance.
---
## Bad Example
```php
public function callback() {
    $user = Socialite::driver('google')->user(); // Throws on any error
    // 500 error page if user denies permissions
}
```
---
## Good Example
```php
public function callback() {
    try {
        $socialUser = Socialite::driver('google')->user();
    } catch (\Exception $e) {
        return redirect('/login')->with('error', 'Could not sign in with Google. Please try again.');
    }
}
```
---
## Exceptions
No common exceptions — OAuth providers can always fail.
---
## Consequences Of Violation
500 errors on provider failure, poor UX, user confusion.
---

## Verify Provider-Reported Email Verification Status
---
## Category
Security
---
## Rule
Check the `email_verified` or `user_verified` flag returned by the OAuth provider. Do not treat unverified emails as verified.
---
## Reason
Some OAuth providers return unverified email addresses. Treating an unverified email as verified enables users to create accounts with email addresses they do not control, bypassing email verification and enabling impersonation or spam accounts.
---
## Bad Example
```php
$user = User::firstOrCreate(['email' => $socialUser->getEmail()]); // No verification check
```
---
## Good Example
```php
$socialUser = Socialite::driver('google')->user();
if (!$socialUser->user['email_verified']) {
    // Require additional verification or deny registration
    return redirect('/register')->with('error', 'Please use a verified Google account.');
}
```
---
## Exceptions
Providers that only return verified emails (Google, Apple for sign-in).
---
## Consequences Of Violation
Unverified email addresses in the system, spam accounts, impersonation.
---

## Use a Pivot Table for Multiple Linked Social Accounts
---
## Category
Architecture
---
## Rule
Store linked social accounts in a `social_accounts` pivot table with fields for provider, provider_id, token, and user_id. Never store multiple provider tokens in a single user table column.
---
## Reason
Users can link multiple OAuth providers to one account. Storing provider tokens in a pivot table scales to any number of providers, supports easy disconnection, and keeps the user table free of provider-specific columns. A single column cannot represent multiple providers.
---
## Bad Example
```php
// User table has single columns — only one provider supported
Schema::table('users', function ($table) {
    $table->string('google_id')->nullable();
    $table->string('facebook_id')->nullable();
});
```
---
## Good Example
```php
// SocialAccount pivot table — supports any number of providers
Schema::create('social_accounts', function ($table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->string('provider'); // 'google', 'github', etc.
    $table->string('provider_id');
    $table->text('token')->nullable();
    $table->timestamps();
});
```
---
## Exceptions
Single-provider applications where only one social login method is used.
---
## Consequences Of Violation
Schema changes needed for new providers, migration complexity.
---

## Maintain Password Fallback for Social Login Users
---
## Category
Reliability
---
## Rule
Always offer email/password authentication in addition to social login. Social login should be additive, not the sole authentication method.
---
## Reason
OAuth providers can experience downtime, change their APIs, or the user may lose access to their social account. Without a password fallback, users are locked out when their social provider is unavailable. Social login is a convenience, not a replacement for primary auth.
---
## Bad Example
```php
// Social login is the ONLY authentication method
// Provider downtime = all users locked out
```
---
## Good Example
```php
// Login page offers both social login AND email/password
// Users with social accounts also set a password during registration
```
---
## Exceptions
Enterprise SSO applications where the IdP is considered the authoritative auth source.
---
## Consequences Of Violation
Provider downtime locks all users out, account recovery requires support intervention.
---

## Maintain Alternative Auth Methods — Never Make Social Login Sole Auth
---
## Category
Reliability
---
## Rule
Always keep email/password authentication as a fallback. Social login must be additive, never the exclusive authentication method.
---
## Reason
OAuth providers may have outages, deprecate APIs, or change terms. Users may lose access to their social account. A password fallback ensures continuous authentication regardless of third-party provider availability.
---
## Bad Example
```php
// Socialite as sole authentication
if (!$socialUser) { abort(401); }
```
---
## Good Example
```php
// Multiple auth methods available
if ($socialUser) {
    Auth::login($user);
} elseif (Auth::attempt($credentials)) {
    // Password fallback
}
```
---
## Exceptions
Enterprise SSO-only applications where the identity provider is contractually guaranteed.
---
## Consequences Of Violation
Complete authentication failure during provider outage.
