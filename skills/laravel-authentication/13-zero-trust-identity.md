# Zero Trust Identity

## Objective

Define zero-trust identity architecture for Laravel applications, covering continuous verification, device trust, identity-aware access, conditional access, and enterprise security models.

## Core Philosophy

Zero Trust assumes breach and verifies every request as if it originates from an untrusted network. Never trust, always verify. Authentication is not a single event — it is a continuous verification process.

## Architecture Standards

### Zero Trust Principles Applied to Identity

| Principle | Identity Application |
|-----------|---------------------|
| Verify explicitly | Authenticate and authorize every request, not just at login |
| Least privilege | Minimum access rights, just-in-time elevation |
| Assume breach | Short token lifetimes, continuous re-validation, session monitoring |

### Zero Trust Identity Architecture

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│ Request │ ──> │ Identity     │ ──> │ Policy       │ ──> │ Resource │
│         │     │ Verification │     │ Evaluation   │     │ Access   │
└─────────┘     └──────────────┘     └──────────────┘     └──────────┘
                     │                      │
                     ▼                      ▼
              ┌──────────────┐     ┌──────────────┐
              │ Device       │     │ Context      │
              │ Trust        │     │ (Time, IP,   │
              │              │     │ Location)    │
              └──────────────┘     └──────────────┘
```

### Continuous Verification

```php
// App\Http\Middleware\ContinuousVerification.php
class ContinuousVerification
{
    public function handle(Request $request, Closure $next): Response
    {
        // Every request must pass re-verification
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Check session age (re-verify after TTL)
        $sessionStartedAt = session('auth_started_at');
        $sessionTtl = config('auth.continuous_verification_ttl', 300); // 5 minutes

        if ($sessionStartedAt && now()->diffInSeconds($sessionStartedAt) > $sessionTtl) {
            // Require step-up authentication
            session(['requires_reauth' => true]);
        }

        // Check for anomalous behavior
        if ($this->detectAnomaly($request, $user)) {
            Auth::logout();
            $request->session()->invalidate();
            return redirect('/login')->with('message', 'Session terminated due to suspicious activity.');
        }

        return $next($request);
    }

    private function detectAnomaly(Request $request, User $user): bool
    {
        $anomalies = 0;

        // Impossible travel detection
        $lastRequestAt = session('last_request_at');
        $lastRequestIp = session('last_request_ip');

        if ($lastRequestAt && $lastRequestIp) {
            $timeDiff = now()->diffInMinutes($lastRequestAt);
            $ipLocation = GeoIP::getLocation($request->ip());
            $lastLocation = GeoIP::getLocation($lastRequestIp);

            // If requests from different countries within minutes — impossible travel
            if ($timeDiff < 10 && $ipLocation->country !== $lastLocation->country) {
                $anomalies++;
            }
        }

        // Update session with current request info
        session(['last_request_at' => now()]);
        session(['last_request_ip' => $request->ip()]);

        return $anomalies >= config('auth.anomaly_threshold', 1);
    }
}
```

### Device Trust

```php
// App\Services\DeviceTrustService.php
class DeviceTrustService
{
    public function evaluateTrust(Request $request): DeviceTrustLevel
    {
        $score = 0;

        // Device fingerprint
        $fingerprint = $this->generateFingerprint($request);
        $isKnownDevice = $this->isKnownDevice($request->user(), $fingerprint);

        if ($isKnownDevice) {
            $score += 40;
        }

        // Device has trusted passkey
        if ($this->hasTrustedPasskey($request->user(), $fingerprint)) {
            $score += 30;
        }

        // Device is managed (MDM/JAMF/Intune)
        if ($this->isManagedDevice($request)) {
            $score += 30;
        }

        // Device compliance (OS version, encryption, antivirus)
        $complianceHeaders = $request->header('X-Device-Compliance');
        if ($complianceHeaders && $this->checkCompliance($complianceHeaders)) {
            $score += 20;
        }

        return match (true) {
            $score >= 80 => DeviceTrustLevel::HIGH,
            $score >= 50 => DeviceTrustLevel::MEDIUM,
            default => DeviceTrustLevel::LOW,
        };
    }

    private function generateFingerprint(Request $request): string
    {
        return hash('sha256', implode('|', [
            $request->userAgent(),
            $request->header('Accept-Language'),
            $request->header('Accept-Encoding'),
            $request->header('Sec-Ch-Ua'),
            $request->header('Sec-Ch-Ua-Platform'),
        ]));
    }

    public function trustDevice(User $user, string $fingerprint): void
    {
        $user->trustedDevices()->updateOrCreate(
            ['fingerprint' => $fingerprint],
            ['trusted_at' => now(), 'expires_at' => now()->addDays(30)]
        );
    }
}

enum DeviceTrustLevel: string
{
    case HIGH = 'high';     // Managed device + passkey + known
    case MEDIUM = 'medium'; // Known device
    case LOW = 'low';       // Unknown device
}
```

### Identity-Aware Access

```php
// App\Services\IdentityAwareAccessService.php
class IdentityAwareAccessService
{
    public function evaluateAccess(User $user, string $resource, Request $request): AccessDecision
    {
        $userRisk = $this->calculateUserRisk($user);
        $deviceTrust = app(DeviceTrustService::class)->evaluateTrust($request);
        $resourceSensitivity = $this->getResourceSensitivity($resource);

        // Low sensitivity resource: most conditions pass
        if ($resourceSensitivity === ResourceSensitivity::LOW) {
            if ($userRisk === UserRisk::LOW && $deviceTrust !== DeviceTrustLevel::LOW) {
                return AccessDecision::ALLOW;
            }
            return AccessDecision::ALLOW_WITH_MFA;
        }

        // Medium sensitivity resource: require trusted device
        if ($resourceSensitivity === ResourceSensitivity::MEDIUM) {
            if ($deviceTrust === DeviceTrustLevel::HIGH && $userRisk !== UserRisk::HIGH) {
                return AccessDecision::ALLOW;
            }
            if ($deviceTrust === DeviceTrustLevel::MEDIUM && $userRisk === UserRisk::LOW) {
                return AccessDecision::ALLOW_WITH_MFA;
            }
            return AccessDecision::BLOCK;
        }

        // High sensitivity resource: maximum security
        if ($resourceSensitivity === ResourceSensitivity::HIGH) {
            if ($deviceTrust === DeviceTrustLevel::HIGH && $userRisk === UserRisk::LOW) {
                return AccessDecision::ALLOW_WITH_MFA;
            }
            return AccessDecision::BLOCK;
        }

        return AccessDecision::BLOCK;
    }

    private function calculateUserRisk(User $user): UserRisk
    {
        $score = 0;

        // Account age
        if ($user->created_at->diffInDays(now()) < 7) {
            $score += 20; // New accounts are higher risk
        }

        // Recent password change
        if ($user->password_changed_at && $user->password_changed_at->diffInHours(now()) < 1) {
            $score += 15;
        }

        // Failed login attempts
        $recentFailures = LoginAttempt::where('user_id', $user->id)
            ->where('successful', false)
            ->where('created_at', '>', now()->subHours(24))
            ->count();
        $score += $recentFailures * 10;

        return $score >= 30 ? UserRisk::HIGH : ($score >= 10 ? UserRisk::MEDIUM : UserRisk::LOW);
    }
}

enum AccessDecision: string
{
    case ALLOW = 'allow';
    case ALLOW_WITH_MFA = 'allow_with_mfa';
    case BLOCK = 'block';
}

enum ResourceSensitivity: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
}

enum UserRisk: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
}
```

### Conditional Access

```php
// App\Services\ConditionalAccessService.php
class ConditionalAccessService
{
    private array $policies;

    public function __construct()
    {
        $this->policies = config('auth.conditional_access.policies', [
            'require_mfa_outside_network' => [
                'conditions' => [
                    'locations' => ['exclude' => ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']],
                    'platforms' => ['include' => ['*']],
                ],
                'grant' => ['mfa'],
            ],
            'block_unknown_countries' => [
                'conditions' => [
                    'locations' => ['exclude' => array_merge(
                        config('auth.allowed_countries', ['US', 'CA', 'GB', 'DE']),
                    )],
                ],
                'grant' => ['block'],
            ],
            'require_managed_device_for_admin' => [
                'conditions' => [
                    'roles' => ['include' => ['admin', 'super-admin']],
                    'platforms' => ['include' => ['*']],
                ],
                'grant' => ['device_compliance'],
            ],
        ]);
    }

    public function evaluate(Request $request, User $user): ConditionalAccessResult
    {
        $requirements = [];

        foreach ($this->policies as $name => $policy) {
            if ($this->matchesConditions($request, $user, $policy['conditions'])) {
                $requirements = array_merge($requirements, $policy['grant']);
            }
        }

        $requirements = array_unique($requirements);

        if (in_array('block', $requirements)) {
            return new ConditionalAccessResult(granted: false, reason: 'Access blocked by conditional access policy.');
        }

        $mfaRequired = in_array('mfa', $requirements) || in_array('device_compliance', $requirements);

        return new ConditionalAccessResult(
            granted: true,
            mfaRequired: $mfaRequired,
            deviceComplianceRequired: in_array('device_compliance', $requirements),
        );
    }

    private function matchesConditions(Request $request, User $user, array $conditions): bool
    {
        // Location check
        if (isset($conditions['locations'])) {
            $ip = $request->ip();
            $excluded = $conditions['locations']['exclude'] ?? [];

            foreach ($excluded as $cidr) {
                if ($this->ipInCidr($ip, $cidr)) {
                    return false; // Excluded location
                }
            }

            $included = $conditions['locations']['include'] ?? [];
            if (!empty($included) && !in_array(GeoIP::getLocation($ip)->country, $included)) {
                return false;
            }
        }

        // Role check
        if (isset($conditions['roles'])) {
            $roleNames = $user->roles->pluck('name')->toArray();
            $included = $conditions['roles']['include'] ?? [];

            if (!empty($included) && empty(array_intersect($roleNames, $included))) {
                return false;
            }
        }

        // Platform check
        if (isset($conditions['platforms'])) {
            $platform = $this->detectPlatform($request);
            $included = $conditions['platforms']['include'] ?? [];

            if (!empty($included) && !in_array($platform, $included)) {
                return false;
            }
        }

        return true;
    }
}

class ConditionalAccessResult
{
    public function __construct(
        public readonly bool $granted,
        public readonly bool $mfaRequired = false,
        public readonly bool $deviceComplianceRequired = false,
        public readonly ?string $reason = null,
    ) {}
}
```

## Enterprise Security Models

### Identity-Aware Proxy Pattern

```
User ──> IAP (Identity-Aware Proxy) ──> Laravel App
            │
            ├── Verify JWT
            ├── Check device trust
            ├── Evaluate conditional access
            └── Inject identity headers
```

### Step-Up Authentication

```php
// Step-up authentication for sensitive operations
class StepUpAuthentication
{
    public function requireConfirmation(User $user, string $action): void
    {
        session(['step_up_action' => $action]);
        session(['step_up_required' => true]);
    }

    public function confirm(Request $request, User $user): bool
    {
        $action = session('step_up_action');

        // Require current password confirmation
        if (!Hash::check($request->input('password'), $user->password)) {
            return false;
        }

        // If MFA is enabled, require TOTP code
        if ($user->hasMfaEnabled()) {
            $totp = app(TotpService::class);
            if (!$totp->verify($user, $request->input('totp_code'))) {
                return false;
            }
        }

        session()->forget(['step_up_action', 'step_up_required']);
        session(['last_step_up' => now()]);

        AuditLog::create([
            'action' => "step_up.{$action}.confirmed",
            'user_id' => $user->id,
        ]);

        return true;
    }
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Trust after first login | Compromised session stays trusted | Continuous verification on every request |
| No device trust | Any device can access sensitive data | Evaluate device trust level per request |
| Static access policies | Security doesn't adapt to risk | Conditional access with risk scoring |
| No impossible travel detection | Stolen tokens used from other locations | Monitor geographic request patterns |
| Single factor for all actions | MFA only at login | Step-up auth for sensitive operations |
| Trusting network location | VPN bypasses IP-based rules | Combine with device trust and MFA |

## AI Coding Agent Rules

1. Verify identity on every request, not just at login
2. Implement device trust scoring (known device, managed device, compliance)
3. Apply conditional access policies based on location, device, role, and risk
4. Detect impossible travel and anomalous behavior patterns
5. Require step-up authentication for all sensitive operations
6. Support identity-aware proxy integration (IAP, Cloudflare Access, Google IAP)
7. Short session TTL with continuous re-verification
8. Device fingerprint must be privacy-preserving (no PII in fingerprint)
9. Risk scoring must incorporate multiple signals (user, device, network, behavior)
10. All zero-trust decisions must be logged for security analysis

## Production Checklist

- [ ] Continuous verification middleware implemented
- [ ] Device trust scoring implemented
- [ ] Conditional access policies defined and evaluated
- [ ] Impossible travel detection active
- [ ] Step-up authentication for sensitive operations
- [ ] Device compliance checks integrated (MDM/Intune)
- [ ] Risk-based authentication scoring configured
- [ ] Zero-trust audit logging implemented
- [ ] Identity-aware proxy integration tested
- [ ] Access decisions mapped to resource sensitivity levels
