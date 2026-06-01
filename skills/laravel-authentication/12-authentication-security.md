# Authentication Security

## Objective

Define comprehensive authentication security standards for Laravel applications covering OWASP recommendations, credential protection, session security, MFA, brute force prevention, and advanced authentication security patterns.

## Core Philosophy

Authentication security must follow OWASP guidelines and defense-in-depth principles. Every authentication control must have a bypass-resistant design. Security must be layered, defaults must be secure, and failures must not leak information.

## Architecture Standards

### OWASP Authentication Cheat Sheet

The following OWASP requirements are mandatory:

1. **Credential Service** — Use dedicated credential storage with strong hashing
2. **Secure Password Recovery** — Time-limited tokens, no password reset via email in plaintext
3. **Rate Limiting** — Lockout after N failed attempts with exponential backoff
4. **Session Management** — Regeneration, idle timeout, absolute timeout
5. **Multi-Factor Authentication** — At least TOTP or WebAuthn for all admin accounts
6. **Transaction Authorization** — Step-up authentication for sensitive operations

### Credential Storage

```php
// config/hashing.php
return [
    'driver' => env('HASHING_DRIVER', 'bcrypt'),
    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12), // Minimum 12 for production
    ],
    'argon' => [
        'memory' => 65536,
        'time' => 4,
        'threads' => 1,
    ],
];

// Never use MD5, SHA1, or unsalted hashes
// Never implement custom hashing algorithms
// Always use Laravel's Hash facade

Hash::make($password);              // Uses configured driver
Hash::check($password, $hash);      // Constant-time comparison
Hash::needsRehash($hash);           // Check if hash needs updating

// Rehash on login (stale hash upgrade)
if (Hash::needsRehash($user->password)) {
    $user->update(['password' => Hash::make($request->password)]);
}
```

### Password Recovery Security

```php
// Reset token standards:
// - Single-use (consumed after reset)
// - Time-limited (10-60 minutes)
// - Cryptographically random (64+ bytes)
// - Stored as SHA-256 hash
// - Invalidated on password change, email change, or account lock

class SecurePasswordReset
{
    public function createToken(User $user): string
    {
        // Invalidate existing tokens
        DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->delete();

        $token = Str::random(64); // 256-bit entropy

        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => hash('sha256', $token),
            'created_at' => now(),
        ]);

        return $token;
    }

    public function validateToken(string $email, string $token): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('created_at', '>', now()->subMinutes(60))
            ->first();

        if (!$record) {
            return false;
        }

        return hash_equals($record->token, hash('sha256', $token));
    }
}
```

### Email Verification

```php
// MustVerifyEmail contract enables automatic email verification
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    use MustVerifyEmail;
}

// Custom verification with time-limited tokens
class EmailVerificationService
{
    public function sendVerification(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $user->sendEmailVerificationNotification($verificationUrl);
    }

    public function verify(User $user, string $hash): bool
    {
        if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return false;
        }

        return $user->markEmailAsVerified();
    }
}
```

## Brute Force Protection

### Login Rate Limiting

```php
// App\Providers\AppServiceProvider.php
public function boot(): void
{
    RateLimiter::for('login', function (Request $request) {
        $key = Str::lower($request->input('email')) . '|' . $request->ip();

        return Limit::perMinute(5)->by($key)
            ->response(fn () => back()->withErrors([
                'email' => trans('auth.throttle'),
            ]));
    });

    RateLimiter::for('login-global', function (Request $request) {
        return Limit::perMinute(20)->by($request->ip());
    });

    RateLimiter::for('register', function (Request $request) {
        return Limit::perHour(3)->by($request->ip());
    });

    RateLimiter::for('password-reset', function (Request $request) {
        return Limit::perHour(5)->by($request->ip());
    });
}
```

### Account Lockout

```php
// App\Actions\AccountLockout.php
class AccountLockout
{
    public const MAX_ATTEMPTS = 5;
    public const LOCKOUT_DURATION = 15; // minutes

    public function recordFailedAttempt(User $user): void
    {
        $attempts = Cache::increment("login_attempts:{$user->id}", 1);

        if ($attempts === 1) {
            Cache::put("login_attempts:{$user->id}", 1, now()->addMinutes(self::LOCKOUT_DURATION));
        }

        if ($attempts >= self::MAX_ATTEMPTS) {
            $user->update(['locked_until' => now()->addMinutes(self::LOCKOUT_DURATION)]);
            event(new AccountLocked($user));
        }
    }

    public function isLocked(User $user): bool
    {
        return $user->locked_until && $user->locked_until->isFuture();
    }

    public function clearAttempts(User $user): void
    {
        Cache::forget("login_attempts:{$user->id}");
        $user->update(['locked_until' => null]);
    }
}
```

### Credential Stuffing Protection

```php
// Rate limit by IP + email hash (prevents credential stuffing)
RateLimiter::for('login', function (Request $request) {
    $emailHash = hash('sha256', Str::lower($request->input('email')));
    return Limit::perMinute(5)->by("login:{$emailHash}:{$request->ip()}");
});

// Additional protections:
// - Honeypot fields in registration
// - Delayed login response (200-500ms consistent delay)
// - JavaScript challenge for repeated failures
// - Known credential check (HaveIBeenPwned)
```

## Session Security

### Session Fixation Protection

```php
// Always regenerate session ID on privilege changes
public function login(Request $request): RedirectResponse
{
    if (Auth::attempt($request->only('email', 'password'))) {
        $request->session()->regenerate(true); // Delete old session
        return redirect()->intended('/dashboard');
    }

    return back()->withErrors(['email' => 'Invalid credentials.']);
}

// Regenerate on: login, logout, password change, email change, MFA verification
```

### Session Hijacking Prevention

```php
// config/session.php
return [
    'secure' => env('SESSION_SECURE_COOKIE', true),   // HTTPS only
    'http_only' => true,                                // No JS access
    'same_site' => 'strict',                            // CSRF + clickjack
    'encrypt' => env('SESSION_ENCRYPT', true),          // Encrypt payload

    // Bind session to user agent + IP (optional, may cause issues with VPN/nat)
    // Implemented in middleware:
];

// App\Http\Middleware\SessionBinding.php
class SessionBinding
{
    public function handle(Request $request, Closure $next): Response
    {
        if (($user = $request->user()) && Session::has('user_agent')) {
            // Detect if user agent has changed (possible hijacking)
            if (Session::get('user_agent') !== $request->userAgent()) {
                Auth::logout();
                $request->session()->invalidate();
                return redirect('/login')->with('message', 'Session expired due to security change.');
            }
        }

        return $next($request);
    }
}
```

## Multi-Factor Authentication

### TOTP (Time-based One-Time Password)

```php
// App\Actions\EnableTotpAction.php
class EnableTotpAction
{
    public function execute(User $user, string $secret, string $code): void
    {
        // Verify the current code before enabling
        $totp = OTPHP\TOTP::createFromSecret($secret);
        if (!$totp->verify($code, leeway: 1)) {
            throw new InvalidTotpCodeException('Invalid verification code.');
        }

        $user->update([
            'totp_secret' => encrypt($secret),
            'totp_enabled_at' => now(),
        ]);

        // Generate recovery codes
        $recoveryCodes = $this->generateRecoveryCodes();
        $user->update([
            'recovery_codes' => json_encode(array_map(fn ($c) => hash('sha256', $c), $recoveryCodes)),
        ]);

        event(new TwoFactorEnabled($user));
    }

    public function verify(User $user, string $code): bool
    {
        $secret = decrypt($user->totp_secret);
        $totp = OTPHP\TOTP::createFromSecret($secret);

        return $totp->verify($code, leeway: 1);
    }

    private function generateRecoveryCodes(): array
    {
        return array_map(fn () => implode('-', [
            strtoupper(Str::random(4)),
            strtoupper(Str::random(4)),
            strtoupper(Str::random(4)),
        ]), range(1, 8));
    }
}
```

### WebAuthn / Passkeys

```php
// WebAuthn registration and authentication
// App\Http\Controllers\Auth\WebAuthnController.php
class WebAuthnController
{
    public function registerOptions(Request $request): JsonResponse
    {
        $options = WebAuthn::prepareRegistration(
            user: $request->user(),
            timeout: 60000,
            authenticatorSelection: [
                'residentKey' => 'preferred',
                'userVerification' => 'preferred',
            ],
        );

        session(['webauthn_registration_challenge' => $options->challenge]);

        return response()->json($options);
    }

    public function register(Request $request): JsonResponse
    {
        $challenge = session()->pull('webauthn_registration_challenge');

        $credential = WebAuthn::register(
            publicKeyCredential: $request->all(),
            challenge: $challenge,
            store: true,
        );

        $request->user()->passkeys()->create([
            'credential_id' => $credential->getId(),
            'public_key' => $credential->getPublicKey(),
            'device_name' => $request->input('device_name', 'Unknown device'),
        ]);

        return response()->json(['status' => 'registered']);
    }

    public function authenticateOptions(Request $request): JsonResponse
    {
        $options = WebAuthn::prepareAuthentication(timeout: 60000);
        session(['webauthn_auth_challenge' => $options->challenge]);

        return response()->json($options);
    }

    public function authenticate(Request $request): JsonResponse
    {
        $challenge = session()->pull('webauthn_auth_challenge');

        $credential = WebAuthn::authenticate(
            publicKeyCredential: $request->all(),
            challenge: $challenge,
        );

        $passkey = Passkey::where('credential_id', $credential->getId())->firstOrFail();
        Auth::login($passkey->user);
        $request->session()->regenerate();

        return response()->json(['status' => 'authenticated']);
    }
}
```

## Adaptive / Risk-Based Authentication

```php
// App\Services\AdaptiveAuthService.php
class AdaptiveAuthService
{
    public function assessRisk(Request $request): RiskLevel
    {
        $score = 0;

        // Device recognition
        if (!$this->isKnownDevice($request->user(), $request->userAgent())) {
            $score += 30;
        }

        // Geographic anomaly
        $location = GeoIP::getLocation($request->ip());
        if ($location->country !== $request->user()->last_login_country) {
            $score += 40;
        }

        // Time anomaly
        $hour = now()->hour;
        if ($hour < 6 || $hour > 23) {
            $score += 15;
        }

        // IP reputation
        if ($this->isSuspiciousIp($request->ip())) {
            $score += 30;
        }

        // Failed attempts recently
        $recentFailures = Cache::get("recent_failures:{$request->user()->id}", 0);
        if ($recentFailures > 0) {
            $score += $recentFailures * 10;
        }

        return match (true) {
            $score >= 70 => RiskLevel::HIGH,
            $score >= 40 => RiskLevel::MEDIUM,
            default => RiskLevel::LOW,
        };
    }

    public function requireStepUp(User $user, string $action): bool
    {
        // Require MFA for sensitive actions
        $highRiskActions = ['password.change', 'email.change', 'payment.method', 'account.delete', 'admin.action'];
        $sessionAuthLevel = session('auth_level', 'password');

        if (in_array($action, $highRiskActions) && $sessionAuthLevel === 'password') {
            return true; // Requires step-up MFA
        }

        return false;
    }
}

enum RiskLevel: string
{
    case LOW = 'low';            // Proceed normally
    case MEDIUM = 'medium';      // Require MFA
    case HIGH = 'high';          // Block or require admin approval
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No rate limiting on login | Brute force attacks | Always rate limit by email+IP |
| Generic error messages not consistent | User enumeration via timing | Constant-time comparison, consistent responses |
| No MFA on admin accounts | Admin account takeover | Mandatory MFA for all admin users |
| Plaintext password recovery | Password sent via email | Time-limited tokens, no password in email |
| Weak password hashing | `md5`, `sha1`, or no salt | bcrypt (12+ rounds) or argon2id |
| No session binding | Session hijacking | Regenerate on privilege change, bind to user agent |
| Unlimited failed attempts | Credential stuffing | Lockout after N attempts with backoff |

## AI Coding Agent Rules

1. All passwords must be hashed with bcrypt (12+ rounds) or argon2id — never plaintext
2. Rate limit all auth endpoints (login, register, password reset, MFA)
3. Implement account lockout with exponential backoff after N failed attempts
4. Session must be regenerated on login, logout, and privilege escalation
5. MFA must be enforced for all administrative operations
6. Recovery codes must be single-use and stored as SHA-256 hashes
7. Password reset tokens must be single-use, time-limited, and stored as hashes
8. Error messages must not reveal which field is invalid (generic "Invalid credentials")
9. Implement adaptive/risk-based authentication for high-risk operations
10. All authentication events must be logged for security monitoring

## Production Checklist

- [ ] Password hashing uses bcrypt (12+ rounds) or argon2id
- [ ] Login rate limiting (5/min per email+IP)
- [ ] Registration rate limiting (3/hour per IP)
- [ ] Password reset rate limiting (5/hour per IP)
- [ ] Account lockout after 5 failed attempts
- [ ] Session regeneration on all privilege changes
- [ ] MFA enabled for all admin accounts
- [ ] Recovery codes generated with MFA setup
- [ ] Email verification required for new accounts
- [ ] OWASP Top 10 review passed
- [ ] Authentication audit logging active
- [ ] Adaptive auth rules defined for sensitive actions
- [ ] Password expiry and rotation policy defined (if not using SSO)
