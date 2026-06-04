## Always Use WSS in Production
---
## Security
---
Always enforce WSS (WebSocket Secure) in production by setting `forceTLS: true` in Echo configuration and terminating TLS at Nginx.
---
Plain `ws://` transmits all real-time data — including potentially sensitive event payloads — unencrypted over the network, enabling eavesdropping and MITM attacks.
---
```javascript
forceTLS: false // Falls back to ws:// — unencrypted
```
---
```javascript
forceTLS: true  // Always uses wss:// — encrypted
```
---
Local development environments. No common exceptions for production.
---
Unencrypted data transmission; MITM vulnerability; compliance violations.

## Always Configure `allowed_origins` with an Explicit Allowlist
---
## Security
---
Always set a non-empty `allowed_origins` array in Reverb config with specific allowed origins — never use wildcards.
---
Without origin validation, any website can open a WebSocket connection to your server (CSWSH attack). An attacker's page can subscribe to channels and read events using the victim's session.
---
```php
'allowed_origins' => ['*'], // Any origin can connect — CSWSH vulnerability
```
---
```php
'allowed_origins' => [
    'https://example.com',
    'https://admin.example.com',
], // Explicit allowlist — CSWSH protection
```
---
No common exceptions; origin validation is required for CSWSH prevention.
---
Cross-Site WebSocket Hijacking; unauthorized channel subscriptions.

## Always Use Token-Based Authentication Over Cookie-Only
---
## Security
---
Always prefer token-based authentication (Bearer tokens) over cookie-only authentication for WebSocket connections.
---
Browsers automatically send cookies with WebSocket upgrade requests, enabling CSWSH attacks. Tokens are explicitly provided and not automatically attached, providing defense against CSWSH.
---
```javascript
// Cookie-only auth — vulnerable to CSWSH
new Echo({ authEndpoint: '/broadcasting/auth' }); // Cookies sent automatically
```
---
```javascript
// Token-based auth — CSWSH resistant
new Echo({
    authEndpoint: '/broadcasting/auth',
    auth: { headers: { Authorization: 'Bearer ' + token } },
});
```
---
Internal applications on isolated networks. No common exceptions for internet-facing apps.
---
CSWSH vulnerability; session hijacking.

## Never Rely Solely on CORS for WebSocket Protection
---
## Security
---
Never rely on CORS headers to protect WebSocket connections; use server-side origin validation.
---
CORS does not apply to WebSocket handshakes — browsers do not enforce CORS preflight for `ws://`/`wss://` connections. Server-side origin validation is the only effective defense.
---
```php
// Relying on CORS — doesn't protect WebSocket
header('Access-Control-Allow-Origin: https://example.com');
```
---
```php
// config/reverb.php — server-side origin validation
'allowed_origins' => ['https://example.com'],
```
---
No common exceptions; CORS is ineffective for WebSocket protection.
---
CSWSH vulnerability; false sense of security.

## Always Validate Origins at Both Reverb and Application Level
---
## Security
---
Always configure origin validation in both Reverb config (`allowed_origins`) and the Laravel application (middleware) for defense in depth.
---
A single layer of origin validation can be bypassed or misconfigured. Two independent layers provide redundancy — if one fails, the other still protects.
---
```php
// Single layer — single point of failure
'allowed_origins' => ['https://example.com'],
```
---
```php
// config/reverb.php
'allowed_origins' => ['https://example.com'],
// app/Http/Middleware/ValidateWebSocketOrigin.php
public function handle($request, $next) {
    if (!in_array($request->header('Origin'), ['https://example.com'])) abort(403);
    return $next($request);
}
```
---
No common exceptions; defense in depth is always preferred for security.
---
CSWSH bypass if single validation layer is misconfigured.

## Always Keep Reverb Updated for Security Patches
---
## Security
---
Always keep `laravel/reverb` on the latest version to receive security patches.
---
Security vulnerabilities (CVE-2026-23524, future CVEs) are patched in newer versions. Running outdated versions exposes the application to known exploits.
---
```json
// Locked to old version — vulnerable
"laravel/reverb": "1.5.*"
```
---
```json
// Latest version — patched
"laravel/reverb": "^1.7"
```
---
No common exceptions; keeping dependencies updated is a security requirement.
---
Known vulnerability exposure; RCE risk; data breach potential.
