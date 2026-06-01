# Laravel Passport & OAuth2

## Objective

Define production-grade Laravel Passport and OAuth2 implementation standards covering all grant types, security hardening, token management, and enterprise OAuth architecture.

## Core Philosophy

OAuth2 is the industry standard for delegated authorization. Passport is Laravel's OAuth2 server implementation. It must be deployed with PKCE for public clients, short-lived tokens, and strict grant type restrictions.

## Architecture Standards

### OAuth2 Architecture

```
┌──────────┐         ┌────────────┐         ┌──────────────┐
│  Client  │ ──────> │  Laravel   │ ──────> │  Passport    │
│  (App)   │         │  App       │         │  Server      │
└──────────┘         └────────────┘         └──────────────┘
     │                      │                      │
     │  Authorization       │  Authorization        │  Token
     │  Request             │  Grant                │  Generation
     │                      │                      │
     ▼                      ▼                      ▼
┌──────────┐         ┌────────────┐         ┌──────────────┐
│  Resource│         │  User      │         │  Database    │
│  Owner    │         │  Consent   │         │  (Tokens,    │
│  (User)   │         │            │         │   Clients)   │
└──────────┘         └────────────┘         └──────────────┘
```

### Passport Installation

```bash
composer require laravel/passport
php artisan passport:install
php artisan passport:keys  # Generate RSA keys for JWT tokens
```

### Grant Types and When to Use

| Grant Type | Use Case | Client Type | Security Level |
|-----------|----------|-------------|----------------|
| Authorization Code | Web apps, server-side | Confidential | High |
| Authorization Code + PKCE | SPAs, mobile apps | Public | High |
| Client Credentials | Machine-to-machine | Confidential | Medium |
| Refresh Token | Long-lived access | Any | High (with rotation) |
| Device Authorization | CLI tools, smart TVs | Public | Medium |

### Authorization Code Flow

```php
// routes/api.php
Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});
```

```php
// config/passport.php
return [
    'token_extend_seconds' => env('PASSPORT_TOKEN_TTL', 3600),       // 1 hour
    'refresh_token_extend_seconds' => env('PASSPORT_REFRESH_TTL', 604800), // 7 days
    'personal_access_client' => [
        'id' => env('PASSPORT_PERSONAL_ACCESS_CLIENT_ID'),
        'secret' => env('PASSPORT_PERSONAL_ACCESS_CLIENT_SECRET'),
    ],
];
```

### Authorization Code + PKCE (Recommended for SPAs)

PKCE (Proof Key for Code Exchange) prevents authorization code interception.

```php
// Server side — Passport supports PKCE automatically
// The client generates:
//   1. code_verifier = random string (43-128 chars)
//   2. code_challenge = base64url(sha256(code_verifier))

// Authorization request (client → server):
// GET /oauth/authorize?
//   response_type=code
//   client_id={client-id}
//   redirect_uri={redirect-uri}
//   code_challenge_method=S256
//   code_challenge={code-challenge}
//   scope=

// Token request (client → server):
// POST /oauth/token
//   grant_type=authorization_code
//   client_id={client-id}
//   code_verifier={code-verifier}
//   code={authorization-code}
//   redirect_uri={redirect-uri}
```

### Client Credentials Grant (Machine-to-Machine)

```php
// Creating a machine client
use Laravel\Passport\ClientRepository;

$clientRepository = app(ClientRepository::class);
$client = $clientRepository->create(
    userId: null,
    name: 'Email Service Client',
    redirectUri: 'http://localhost',
    provider: null,
    confidential: true,
);

// Scope the client
$client->scopes = ['emails:send', 'users:read'];
$client->save();

// Usage:
// POST /oauth/token
//   grant_type=client_credentials
//   client_id={client-id}
//   client_secret={client-secret}
//   scope=emails:send users:read
```

### Refresh Tokens

```php
// config/passport.php
'refresh_token_extend_seconds' => env('PASSPORT_REFRESH_TTL', 604800),

// Refresh token rotation — always issue new refresh token
// POST /oauth/token
//   grant_type=refresh_token
//   refresh_token={refresh-token}
//   client_id={client-id}
//   client_secret={client-secret}
//   scope=

// Response includes new access_token AND new refresh_token
// The old refresh token is revoked
```

### Device Authorization Flow (Device Grant)

For devices with limited input capabilities (smart TVs, CLI tools, IoT):

```php
// Step 1: Client requests device code
// POST /oauth/device/authorize
//   client_id={client-id}
//   scope=

// Response:
{
    "device_code": "device-code-value",
    "user_code": "ABCD-1234",
    "verification_uri": "https://app.example.com/device",
    "verification_uri_complete": "https://app.example.com/device?user_code=ABCD-1234",
    "expires_in": 1800,
    "interval": 5
}

// Step 2: User visits verification_uri and enters user_code
// Step 3: Device polls /oauth/token with device_code
// POST /oauth/token
//   grant_type=urn:ietf:params:oauth:grant-type:device_code
//   device_code={device-code}
//   client_id={client-id}
```

### Scopes (Fine-Grained Authorization)

```php
// App\Providers\AuthServiceProvider.php
use Laravel\Passport\Passport;

Passport::tokensCan([
    'posts:read' => 'Read posts',
    'posts:write' => 'Create and edit posts',
    'posts:delete' => 'Delete posts',
    'users:read' => 'Read user profiles',
    'users:write' => 'Update user profiles',
    'admin' => 'Full administrative access',
]);

Passport::setDefaultScope([
    'posts:read',
    'users:read',
]);

// Middleware for scope verification
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('scope:posts:read');

Route::post('/posts', [PostController::class, 'store'])
    ->middleware('scopes:posts:write,admin');
```

## Security Hardening

### Token Lifetime Management

```php
// Short-lived access tokens
Passport::tokensExpireIn(now()->addMinutes(15));

// Short-lived refresh tokens with rotation
Passport::refreshTokensExpireIn(now()->addDays(7));

// Revoke old refresh tokens on rotation
Passport::$refreshTokenRotationEnabled = true;
```

### RSA Key Management

```php
// Generate keys during deployment (not at runtime)
php artisan passport:keys --force

// Use encrypted keys in production
Passport::loadKeysFrom('/path/to/encrypted-keys');

// Key rotation procedure:
// 1. Generate new keys: php artisan passport:keys
// 2. Keep old keys valid during transition period
// 3. Invalid old tokens naturally expire
// 4. Remove old keys after max token lifetime expires
```

### Client Management

```php
// App\Actions\CreateOAuthClient.php
class CreateOAuthClient
{
    public function execute(string $name, string $redirectUri, ?array $scopes = null): Client
    {
        $client = app(ClientRepository::class)->create(
            userId: null,
            name: $name,
            redirectUri: $redirectUri,
        );

        if ($scopes) {
            $client->scopes = $scopes;
            $client->save();
        }

        // Log client creation for audit
        Log::info('OAuth client created', [
            'client_id' => $client->id,
            'name' => $client->name,
            'redirect_uri' => $client->redirectUri,
        ]);

        return $client;
    }
}
```

### OAuth Attack Prevention

| Attack | Prevention |
|--------|-----------|
| Authorization code interception | PKCE (required for all public clients) |
| CSRF on authorization endpoint | `state` parameter validation |
| Redirect URI manipulation | Exact match validation, no wildcards |
| Client credential theft | Client secrets rotation, short expiry |
| Access token theft | Short TTL, TLS everywhere |
| Refresh token theft | Rotation on each use, sender-constraining |
| Scope elevation | Validate scopes against client's allowed scopes |
| Mix-up attack | `iss` parameter validation |
| Code replay | One-time use authorization codes |

### Redirect URI Validation

```php
// App\Providers\AuthServiceProvider.php
Passport::redirectUriValidator(function ($redirectUri, $client) {
    // Exact match — no partial matching allowed
    $allowedUris = collect($client->redirectUri)->map(fn ($uri) => rtrim($uri, '/'));

    return $allowedUris->contains(rtrim($redirectUri, '/'));
});
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using password grant | Exposes credentials to client app | Use authorization code + PKCE |
| No scope enforcement | Tokens have implicit wildcard access | Always validate scopes |
| Unlimited token lifetime | Stolen tokens never expire | Set TTL, enforce rotation |
| Plaintext client secrets | Credential leak | Hash secrets, use env variables |
| Wildcard redirect URIs | Open redirect vulnerability | Exact match validation |
| Ignoring PKCE for SPAs | Authorization code interception | Always use PKCE for public clients |

## Production Standards

### Passport Performance

```php
// Use Redis for token storage in production
// config/passport.php
'storage' => [
    'driver' => env('PASSPORT_STORAGE', 'redis'),
    'redis' => [
        'connection' => 'default',
    ],
],

// Prune expired tokens
// Schedule: daily
php artisan passport:purge --revoked --expired
```

### Token Introspection

```php
// For resource servers to validate tokens
// POST /oauth/tokens/introspect
//   token={access-token}

// Response:
{
    "active": true,
    "scope": "posts:read users:read",
    "client_id": "client-id",
    "sub": "user-id",
    "exp": 1700000000,
    "iat": 1699996400
}
```

## AI Coding Agent Rules

1. Never use the password grant — always prefer authorization code + PKCE
2. PKCE is mandatory for all public clients (SPAs, mobile apps)
3. All tokens must have explicit, granular scopes — never `*`
4. Redirect URIs must be validated by exact match, never wildcard
5. Refresh token rotation must be enabled
6. Access tokens must expire in 15 minutes or less
7. Client secrets must be stored as hashes, never plaintext
8. Expired and revoked tokens must be pruned regularly
9. Audit logging must track all client and token lifecycle events
10. Scopes must be validated on both authorization and resource access

## Production Checklist

- [ ] Password grant is disabled (not registered)
- [ ] PKCE is required for all public clients
- [ ] Access token TTL ≤ 15 minutes
- [ ] Refresh token rotation enabled
- [ ] Redirect URI validation by exact match
- [ ] RSA keys generated and secured
- [ ] Client secrets hashed at rest
- [ ] Scope middleware applied to all protected routes
- [ ] `passport:purge` scheduled daily
- [ ] Token introspection endpoint secured
- [ ] OAuth audit logging implemented
- [ ] Rate limiting on `/oauth/token` endpoint
