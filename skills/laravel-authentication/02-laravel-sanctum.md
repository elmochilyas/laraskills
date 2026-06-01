# Laravel Sanctum

## Objective

Define production-grade Laravel Sanctum implementation standards covering SPA authentication, API token management, multi-device support, and security hardening.

## Core Philosophy

Sanctum is the default authentication solution for Laravel APIs and SPAs. It must be implemented with security-first defaults, token hygiene, and explicit ability scoping.

## Architecture Standards

### Sanctum Configuration

```php
// config/sanctum.php
return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000')),
    'guard' => ['web'],
    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 60),  // Minutes for access tokens
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),
    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
```

### SPA Authentication

SPA authentication uses cookie-based sessions with CSRF protection.

```php
// routes/api.php — SPA auth routes
Route::post('/login', [AuthController::class, 'login'])
    ->middleware(['throttle:login']);

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth:sanctum');

Route::get('/user', [AuthController::class, 'user'])
    ->middleware('auth:sanctum');
```

```php
// CORS configuration for SPA
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

```php
// SPA Login Flow
public function login(LoginRequest $request): JsonResponse
{
    $request->authenticate();

    $request->session()->regenerate();

    return response()->json([
        'user' => new UserResource($request->user()),
        'message' => 'Authenticated successfully.',
    ]);
}
```

### First-Party API Authentication

For first-party consumers (same ecosystem), use Sanctum's SPA auth. No tokens needed — the session cookie authenticates automatically.

```php
// Ensure the request is from a stateful domain
if (Auth::guard('web')->check()) {
    // First-party request, already authenticated via session
    return $request->user();
}
```

### Personal Access Tokens

For third-party consumers, mobile apps, or CLI tools:

```php
// Creating tokens
$token = $user->createToken(
    name: 'mobile-app',
    abilities: ['posts:read', 'posts:write'],
    expiresAt: now()->addDays(30),
);

return response()->json([
    'token' => $token->plainTextToken,
    'type' => 'Bearer',
]);
```

### Token Abilities

Define granular, resource-scoped abilities — never use `['*']`.

```php
// Ability naming convention: {resource}:{action}
// Read operations
'posts:read'
'comments:read'
'profile:read'

// Write operations
'posts:write'
'posts:delete'
'comments:write'

// Admin operations
'admin:users'
'admin:roles'
'admin:audit'

// Verification
$user->tokenCan('posts:read');
$user->tokenCan('*');
```

### Token Expiration

```php
// config/sanctum.php
'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 60),

// Override per-token
$token = $user->createToken('ci-deployment', expiresAt: now()->addHours(2));

// Check if current token is expired
if ($request->user()->currentAccessToken()->expires_at->isPast()) {
    return response()->json(['message' => 'Token expired.'], 401);
}
```

### Multi-Device Support

```php
class DeviceSession
{
    public function __construct(
        public readonly string $deviceId,
        public readonly string $deviceName,
        public readonly string $deviceType,  // mobile, desktop, tablet, cli
        public readonly string $ip,
        public readonly string $userAgent,
        public readonly ?string $location,
    ) {}
}

// Token creation with device tracking
$token = $user->createToken(
    name: $request->input('device_name', 'unknown'),
    abilities: $request->input('scopes', ['*']),
);

// Store device metadata
DB::table('personal_access_tokens')
    ->where('id', $token->accessToken->id)
    ->update([
        'device_id' => $request->input('device_id'),
        'device_type' => $request->input('device_type', 'unknown'),
        'ip' => $request->ip(),
        'user_agent' => $request->userAgent(),
    ]);
```

### Token Revocation

```php
// Revoke current token
$request->user()->currentAccessToken()->delete();

// Revoke all tokens for user
$user->tokens()->delete();

// Revoke specific token by ID
$user->tokens()->where('id', $tokenId)->delete();

// Revoke all tokens for device
$user->tokens()->where('device_id', $deviceId)->delete();

// Revoke expired tokens (scheduled job)
// app/Console/Commands/PruneExpiredTokens.php
class PruneExpiredTokens extends Command
{
    protected $signature = 'sanctum:prune-expired';
    public function handle(): void
    {
        DB::table('personal_access_tokens')
            ->where('expires_at', '<', now())
            ->delete();
    }
}
```

## Security Best Practices

### Token Hygiene

```php
// Never return plainTextToken after initial creation
// Store only the hash

// On login:
$token = $user->createToken('app')->plainTextToken;
// Return this once, then the client must store it securely

// On subsequent requests — never return the token
// The client sends the token in the Authorization header
```

### Token Rate Limiting

```php
RateLimiter::for('api', function (Request $request) {
    $token = $request->user()?->currentAccessToken();
    $key = $token ? 'token:' . $token->id : 'guest:' . $request->ip();

    return Limit::perMinute($token ? 120 : 30)->by($key);
});
```

### Device Tracking

```php
// List active sessions
public function activeSessions(Request $request): JsonResponse
{
    $sessions = $request->user()->tokens()
        ->where('id', '!=', $request->user()->currentAccessToken()->id)
        ->get()
        ->map(fn ($token) => [
            'id' => $token->id,
            'name' => $token->name,
            'device_type' => $token->device_type,
            'last_used_at' => $token->last_used_at,
            'created_at' => $token->created_at,
            'is_current' => false,
        ]);

    $current = $request->user()->currentAccessToken();
    $sessions->prepend([
        'id' => $current->id,
        'name' => $current->name,
        'device_type' => $current->device_type,
        'last_used_at' => $current->last_used_at,
        'created_at' => $current->created_at,
        'is_current' => true,
    ]);

    return response()->json(['data' => $sessions]);
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `['*']` abilities | Token has full access | Scope to specific abilities |
| No token expiration | Stolen tokens never expire | Set `expiration` in config |
| Returning token on every request | Token leak via logs | Only return on creation |
| Storing plaintext tokens | Database breach reveals all tokens | Sanctum hashes by default — never disable |
| No CORS restriction | Cross-origin token theft | Restrict `allowed_origins` |
| SPA without CSRF | CSRF attacks on auth endpoints | Always call `/sanctum/csrf-cookie` first |

## Production Standards

### Sanctum + Fortify Integration

```php
// config/fortify.php
use Laravel\Fortify\Features;

return [
    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]),
    ],
];
```

### Sanctum + Jetstream

Jetstream automatically configures Sanctum for SPA authentication. Do not manually configure Sanctum guards when using Jetstream.

## AI Coding Agent Rules

1. Never use `tokenCan('*')` — always define explicit abilities
2. Token names must be descriptive of the client/device
3. Always set an expiration time on every created token
4. Return `plainTextToken` exactly once — on creation
5. Implement token revocation endpoints for user self-service
6. Track token metadata (device, IP, user agent) for audit
7. Register a scheduled job to prune expired tokens
8. CORS must use explicit origins, never `*`
9. SPA auth must call `/sanctum/csrf-cookie` before login
10. Apply rate limiting to all Sanctum-guarded routes

## Production Checklist

- [ ] `SANCTUM_STATEFUL_DOMAINS` configured with explicit frontend domains
- [ ] `SANCTUM_TOKEN_EXPIRATION` set to reasonable value (60-480 minutes)
- [ ] CORS `allowed_origins` restricted to specific frontend URLs
- [ ] Token abilities are scoped and never `['*']`
- [ ] Token pruning command registered in `Kernel`
- [ ] Device tracking metadata stored with tokens
- [ ] Token revocation endpoints implemented
- [ ] Rate limiting applied to all Sanctum routes
- [ ] SPA CSRF flow tested end-to-end
- [ ] Token hash storage verified (never plaintext)
