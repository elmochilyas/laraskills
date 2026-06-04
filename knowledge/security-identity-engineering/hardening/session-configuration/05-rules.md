# Rules: Session Configuration

## Use Database or Redis Sessions in Production, Never File Sessions
---
## Category
Security
---
## Rule
Set `SESSION_DRIVER=redis` or `SESSION_DRIVER=database` in production. Never use `file` sessions in production or shared hosting.
---
## Reason
File sessions store session data in the server filesystem. On shared hosting or multi-server setups, file sessions are not shared across instances (users get logged out on different servers), and other users on the same machine may read the session files if permissions are misconfigured. Database and Redis sessions are centralized, shared, and more secure.
---
## Bad Example
```dotenv
SESSION_DRIVER=file # File sessions in production — not shared, not secure
```
---
## Good Example
```dotenv
SESSION_DRIVER=redis # Centralized session storage
SESSION_CONNECTION=cache # Or use the cache connection
```
---
## Exceptions
Single-server production environments with strict filesystem permissions.
---
## Consequences Of Violation
Session mismatch across servers, potential session file disclosure.
---

## Set session.lifetime to a Reasonable Short Duration
---
## Category
Security
---
## Rule
Set `session.lifetime` (in `config/session.php`) to the minimum duration required for the application's UX, typically 120 minutes or less.
---
## Reason
Long session lifetimes increase the window of opportunity for session hijacking. If a session cookie is stolen, a long lifetime gives the attacker more time to use it. Shorter lifetimes force re-authentication, reducing exposure.
---
## Bad Example
```php
'lifetime' => 43200, // 30 days — excessive exposure window
```
---
## Good Example
```php
'lifetime' => 120, // 2 hours — reasonable for most apps
```
---
## Exceptions
Applications requiring long sessions (e.g., dashboard monitors) — use "remember me" tokens instead of extending session lifetime.
---
## Consequences Of Violation
Wider session hijacking window, increased risk.
---

## Enable Session HTTP-Only and Secure Flags
---
## Category
Security
---
## Rule
Set `http_only => true` and `secure => true` in `config/session.php`. In production, also set `same_site => 'lax'`.
---
## Reason
`http_only` prevents JavaScript from reading the session cookie (mitigates XSS-based session theft). `secure` ensures the cookie is only sent over HTTPS (prevents interception on HTTP). `same_site=lax` prevents CSRF in most browsers without breaking navigation flows.
---
## Bad Example
```php
'http_only' => false, // JS can read session cookie
'secure' => false, // Cookie sent over HTTP
'same_site' => null, // No CSRF protection
```
---
## Good Example
```php
'http_only' => true,
'secure' => true, // Requires HTTPS in production
'same_site' => 'lax',
```
---
## Exceptions
`secure` must be `false` in local development without HTTPS.
---
## Consequences Of Violation
Session theft via XSS, session interception on HTTP.
---

## Rotate Session ID on Login and Privilege Escalation
---
## Category
Security
---
## Rule
Ensure Laravel's `session()->regenerate()` is called after login and after any privilege escalation (e.g., user becomes admin). Laravel's `AuthenticateSession` middleware does this for login.
---
## Reason
Session fixation attacks set a known session ID before the user logs in. If the session ID is not regenerated, the attacker's known session ID becomes the authenticated session. Regeneration invalidates the old session ID.
---
## Bad Example
```php
// Login without session regeneration — session fixation vulnerability
public function login(Request $request) {
    Auth::login($user);
    // session()->regenerate() not called
}
```
---
## Good Example
```php
public function login(Request $request) {
    Auth::login($user);
    $request->session()->regenerate(); // Session ID changed
}
```
---
## Exceptions
No common exceptions — session regeneration is mandatory on auth.
---
## Consequences Of Violation
Session fixation attack, attacker assumes user's session.
---

## Expire Inactive Sessions (Session Timeout)
---
## Category
Security
---
## Rule
Implement idle session timeout that logs out users after a configurable period of inactivity. Use middleware that checks `last_activity`.
---
## Reason
An inactive session left open on a shared computer can be used by anyone who accesses that computer. Idle timeout forces re-authentication after inactivity, protecting abandoned sessions.
---
## Bad Example
```php
// No idle timeout — session stays valid indefinitely while open
```
---
## Good Example
```php
class IdleTimeoutMiddleware {
    public function handle($request, $next) {
        $timeout = config('session.idle_timeout', 30); // minutes
        if (session('last_activity') && now()->diffInMinutes(session('last_activity')) > $timeout) {
            Auth::logout();
            session()->flush();
            return redirect('/login');
        }
        session(['last_activity' => now()]);
        return $next($request);
    }
}
```
---
## Exceptions
Background API workers that must maintain long-running sessions.
---
## Consequences Of Violation
Abandoned sessions accessible to unauthorized users.
---

## Use a Unique, Random Cookie Name per Application
---
## Category
Security
---
## Rule
Set a unique `cookie` name in `config/session.php` that does not conflict with other applications on the same domain.
---
## Reason
If two applications on the same domain use the same session cookie name, the browser sends both cookies, and one application may read the other's session. A unique cookie name prevents cookie namespace collisions and unintended session sharing.
---
## Bad Example
```php
'cookie' => 'laravel_session', // Default — conflicts with other Laravel apps on same domain
```
---
## Good Example
```php
'cookie' => env('SESSION_COOKIE', 'myapp_session'), // Unique to this application
```
---
## Exceptions
Single application per domain — still recommended for clarity.
---
## Consequences Of Violation
Session collision between applications on the same domain.
---

## Never Store Sensitive Data Directly in Session
---
## Category
Security
---
## Rule
Store only identifiers (user ID, last activity timestamp) in the session. Never store passwords, API keys, credit card numbers, or PII.
---
## Reason
Session data is serialized and stored in files, database, or Redis. An attacker with filesystem or database access can read session data. If sensitive data is stored in the session, it is exposed. Identifiers can be looked up from secure storage.
---
## Bad Example
```php
session(['api_key' => $request->api_key]); // API key stored in session
```
---
## Good Example
```php
session(['user_id' => $user->id]); // Only identifier stored
```
---
## Exceptions
Encrypted session driver — still avoid storing raw secrets.
---
## Consequences Of Violation
Exposure of API keys, passwords, or PII if session storage is compromised.
