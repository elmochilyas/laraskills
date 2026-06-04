# Rules: Passport OAuth2 Server

## Use PKCE for Public Clients (SPAs and Mobile Apps)
---
## Category
Security
---
## Rule
Require Authorization Code + PKCE for all public clients that cannot securely store a client secret. Never use the deprecated Password Grant.
---
## Reason
Password Grant exposes user credentials to the client application and does not support MFA. PKCE prevents authorization code interception attacks without requiring a client secret. It is the OAuth2 security best practice for browser-based and mobile apps.
---
## Bad Example
```php
$response = $http->post('/oauth/token', [
    'grant_type' => 'password', // Deprecated — exposes credentials
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'username' => $email,
    'password' => $password,
]);
```
---
## Good Example
```php
// Public client uses PKCE — no secret required
$response = $http->post('/oauth/token', [
    'grant_type' => 'authorization_code',
    'client_id' => $clientId,
    'code' => $authCode,
    'code_verifier' => $pkceVerifier,
    'redirect_uri' => $redirectUri,
]);
```
---
## Exceptions
Legacy clients that cannot be updated — migrate to PKCE as soon as possible.
---
## Consequences Of Violation
Credentials exposed to client, no MFA support, authorization code interception risk.
---

## Secure OAuth2 Private Key With 600 Permissions Outside Web Root
---
## Category
Security
---
## Rule
Set the OAuth2 private key file to 600 permissions and store it outside the web root. Never commit it to version control.
---
## Reason
The OAuth2 private key signs all access tokens. Anyone with access to this key can forge valid tokens for any user. Default permissions may allow other system users to read it. Version control exposure is catastrophic.
---
## Bad Example
```bash
# Default permissions — world-readable
storage/oauth-private.key (permissions 644)
```
---
## Good Example
```bash
chmod 600 storage/oauth-private.key
# Stored outside web root, not in .git
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Token forgery, complete authentication bypass.
---

## Design Scopes as Granular Permissions, Not Broad Roles
---
## Category
Architecture
---
## Rule
Define scopes as specific, granular permissions (`read-orders`, `write-orders`) rather than broad role-based scopes (`admin`, `full-access`).
---
## Reason
Granular scopes implement the principle of least privilege. A third-party app requesting `read-orders` should not automatically get `write-orders`. Broad scopes defeat the purpose of OAuth2's delegated authorization model and force users to grant excessive permissions.
---
## Bad Example
```php
Passport::tokensCan([
    'admin' => 'Full access to everything', // Too broad
]);
```
---
## Good Example
```php
Passport::tokensCan([
    'read-orders' => 'View your orders',
    'write-orders' => 'Create and modify orders',
    'read-profile' => 'View your profile',
]);
```
---
## Exceptions
Internal M2M clients where broad access within a bounded context is acceptable.
---
## Consequences Of Violation
Excessive permission grants, user reluctance to authorize, least-privilege violation.
---

## Schedule Token Pruning With passport:purge Command
---
## Category
Performance
---
## Rule
Schedule `php artisan passport:purge` in the console kernel to remove expired access tokens and authorization codes regularly.
---
## Reason
Passport creates a new token record for every authorization. Without pruning, token tables grow indefinitely, slowing down token validation queries (which check token existence and revocation status on every API request). Scheduled pruning maintains query performance and controls database bloat.
---
## Bad Example
```php
// No token pruning — tables grow unbounded
```
---
## Good Example
```php
// App\Console\Kernel
protected function schedule(Schedule $schedule): void
{
    $schedule->command('passport:purge')->hourly();
}
```
---
## Exceptions
No common exceptions — pruning is operational best practice.
---
## Consequences Of Violation
Degraded API performance, bloated database, slow introspection queries.
---

## Revoke Tokens on Security Events
---
## Category
Security
---
## Rule
Register event listeners that revoke all user tokens on password change, logout-from-all-devices, or security incident.
---
## Reason
When a password changes or a security incident occurs, existing tokens should be invalidated immediately. Without revocation, compromised or old tokens remain valid indefinitely, allowing continued access even after the user takes security action.
---
## Bad Example
```php
// Password changed but existing tokens remain valid
public function changePassword(Request $request) {
    $user->update(['password' => bcrypt($request->password)]);
    // No token revocation
}
```
---
## Good Example
```php
public function changePassword(Request $request) {
    $user->update(['password' => bcrypt($request->password)]);
    // Revoke all existing tokens
    $user->tokens()->each(fn ($token) => $token->revoke());
}
```
---
## Exceptions
No common exceptions — security events must always revoke tokens.
---
## Consequences Of Violation
Compromised tokens survive password change, persistent unauthorized access.
---

## Set Short Access Token Lifetimes With Longer Refresh Windows
---
## Category
Security
---
## Rule
Configure access tokens for short durations (15-60 minutes) with refresh tokens lasting 14-30 days. Enable refresh token rotation.
---
## Reason
Short-lived access tokens limit the damage window if a token is leaked. Refresh token rotation ensures each refresh invalidates the previous refresh token, preventing replay. Long-lived access tokens increase risk without refreshing.
---
## Bad Example
```php
// In PassportServiceProvider
Passport::tokensExpireIn(now()->addDays(30)); // Too long
```
---
## Good Example
```php
Passport::tokensExpireIn(now()->addMinutes(60));
Passport::refreshTokensExpireIn(now()->addDays(14));
Passport::personalAccessTokensExpireIn(now()->addMonths(1));
```
---
## Exceptions
M2M client credentials tokens may need longer durations since there is no user session to refresh.
---
## Consequences Of Violation
Extended token leak window, reduced security.
---

## Do Not Use Passport for First-Party SPA Authentication
---
## Category
Framework Usage
---
## Rule
Use Sanctum for first-party SPA and mobile app authentication. Reserve Passport for when your application must act as an OAuth2 provider for third-party applications.
---
## Reason
Passport introduces significant complexity (client management, grant types, scope negotiation, RSA keys) that is unnecessary for first-party auth. Sanctum provides simpler cookie-based SPA auth and token-based mobile auth with less setup and maintenance overhead.
---
## Bad Example
```php
// Using Passport OAuth2 for your own SPA — over-engineered
```
---
## Good Example
```php
// Sanctum for first-party SPA
'guards' => ['api' => ['driver' => 'sanctum', 'provider' => 'users']];
```
---
## Exceptions
When the application is an OAuth2 provider serving third-party apps primarily, and first-party auth is incidental.
---
## Consequences Of Violation
Unnecessary OAuth2 complexity, maintenance burden, slower development.
