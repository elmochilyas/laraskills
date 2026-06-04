# Rules: MFA/TOTP with Fortify

## Require Password Confirmation for 2FA Setup Changes
---
## Category
Security
---
## Rule
Enable `confirmPassword` in the `twoFactorAuthentication` feature configuration so users must re-enter their password before enabling or disabling 2FA.
---
## Reason
Without password confirmation, anyone with an active session can disable the user's 2FA protection. Password re-entry ensures the legitimate user is controlling 2FA settings, preventing session-based 2FA removal attacks.
---
## Bad Example
```php
Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => false])
```
---
## Good Example
```php
Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])
```
---
## Exceptions
No common exceptions — this is a mandatory security control for 2FA.
---
## Consequences Of Violation
Session hijacker can disable 2FA, account takeover.
---

## Enforce MFA for Admin and Privileged Roles
---
## Category
Security
---
## Rule
Implement a policy or middleware that requires users with admin or privileged roles to have 2FA enabled before accessing sensitive areas.
---
## Reason
Admin accounts are high-value targets. Making MFA optional for all users while enforcing it for privileged roles ensures that elevated access requires stronger authentication. This is a compliance requirement for SOC2, HIPAA, and PCI DSS.
---
## Bad Example
```php
// No enforcement — admins can access without 2FA
public function viewAdminPanel() { return view('admin'); }
```
---
## Good Example
```php
public function accessAdmin(User $user): bool
{
    return $user->hasRole('admin') && $user->two_factor_secret !== null;
}
```
---
## Exceptions
Applications where MFA is enforced for all users universally.
---
## Consequences Of Violation
Admin accounts compromised via password-only attacks, compliance violations.
---

## Store Recovery Codes Securely and Display Once
---
## Category
Security
---
## Rule
Display recovery codes to the user only once during 2FA setup. Store only the hashed version in the database. Never show plaintext recovery codes after the initial setup screen.
---
## Reason
Recovery codes are single-use passwords that bypass TOTP. If stored in plaintext, database compromise exposes them. If displayed after setup, shoulder-surfing or screen recording captures them. Hashing ensures database compromise does not expose recovery access.
---
## Bad Example
```php
// Recovery codes stored in plaintext, shown on every settings page
$user->recovery_codes; // Plaintext array
```
---
## Good Example
```php
// Fortify handles this — codes hashed (bcrypt), shown once on setup
// Users must save them during the initial setup flow
```
---
## Exceptions
Support recovery flows where an agent verifies identity and issues new codes (with audit logging).
---
## Consequences Of Violation
Recovery code theft, permanent account lockout, unauthorized access bypassing 2FA.
---

## Prefer TOTP Over SMS-Based 2FA
---
## Category
Security
---
## Rule
Implement TOTP-based 2FA (authenticator app) instead of SMS-based 2FA for multifactor authentication.
---
## Reason
SMS 2FA is vulnerable to SIM-swapping attacks, SS7 protocol interception, and depends on mobile carrier security. TOTP is generated locally on the device, cannot be intercepted in transit, and provides stronger security guarantees without carrier dependency.
---
## Bad Example
```php
// SMS-based 2FA implementation using third-party SMS API
```
---
## Good Example
```php
// Fortify TOTP 2FA — no SMS dependency
Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])
```
---
## Exceptions
Applications in regions where authenticator apps are not widely adopted, using hardware TOTP tokens as alternative.
---
## Consequences Of Violation
SIM-swap account takeover, SMS interception, carrier downtime blocks login.
---

## Log All 2FA Enable and Disable Events
---
## Category
Audit Logging
---
## Rule
Log every 2FA enable, disable, and reset event with user ID, IP address, and timestamp. Alert on 2FA disable events.
---
## Reason
2FA changes directly affect account security. Disabling 2FA may indicate account compromise or malicious insider activity. Without logging, these security-critical events leave no audit trail for incident response.
---
## Bad Example
```php
// No logging for 2FA changes
public function disable(Request $request) { $user->disable2FA(); }
```
---
## Good Example
```php
public function disable(Request $request) {
    $user->disable2FA();
    ActivityLog::create([
        'event' => '2fa_disabled',
        'user_id' => $user->id,
        'ip' => $request->ip(),
    ]);
}
```
---
## Exceptions
No common exceptions — 2FA events must always be logged.
---
## Consequences Of Violation
Undetected account compromise, compliance audit failures.
---

## Provide a Documented Recovery Flow for Lost Authenticator
---
## Category
Reliability
---
## Rule
Document and implement a recovery flow for users who lose access to their authenticator device, using recovery codes or support team verification.
---
## Reason
Hardware failure, device loss, or app reset can lock users out of their accounts permanently. Without a documented recovery flow, users lose access to their accounts and data entirely. Recovery codes provide self-service recovery; support verification provides a human fallback.
---
## Bad Example
```php
// No recovery mechanism — user locked out permanently
```
---
## Good Example
```php
// Recovery code flow implemented
if ($request->has('recovery_code')) {
    // Verify hashed recovery code, consume it, allow login
}
// Support flow: email verification + identity confirmation -> reset 2FA
```
---
## Exceptions
Applications where account recovery is handled by an external identity provider.
---
## Consequences Of Violation
Permanent account lockout, data loss, support ticket escalation.
---

## Rate-Limit TOTP Verification Attempts
---
## Category
Security
---
## Rule
Configure rate limiting for the TOTP challenge endpoint to prevent brute force attacks against the 6-digit code.
---
## Reason
TOTP codes are 6 digits (1,000,000 combinations). Without rate limiting, an attacker can try 1,000 codes per second and exhaust the keyspace in minutes. Rate limiting limits attempts to a practical bound, making brute force infeasible.
---
## Bad Example
```php
// No rate limiting on 2FA challenge
Route::post('/two-factor-challenge', [TwoFactorController::class, 'verify']);
```
---
## Good Example
```php
RateLimiter::for('two-factor', fn ($request) => Limit::perMinute(5)->by($request->ip()));
```
---
## Exceptions
No common exceptions — TOTP rate limiting is always necessary.
---
## Consequences Of Violation
TOTP brute force bypass of 2FA protection.
