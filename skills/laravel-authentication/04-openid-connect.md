# OpenID Connect

## Objective

Define standards for implementing OpenID Connect (OIDC) as an identity layer on top of OAuth2, covering identity tokens, claims, discovery, federation, and integration with Laravel applications.

## Core Philosophy

OIDC standardizes authentication on top of OAuth2 authorization. It provides a verified identity token (ID Token) alongside the access token, enabling interoperable identity across domains and providers.

## Architecture Standards

### OIDC vs OAuth2

| Aspect | OAuth2 | OIDC |
|--------|--------|------|
| Purpose | Authorization (delegated access) | Authentication (identity verification) |
| Token | Access Token | ID Token (JWT) + Access Token |
| Format | Opaque or JWT | Always JWT |
| Claims | No standardized claims | Standardized claims (`sub`, `name`, `email`) |
| UserInfo | Optional | Required endpoint |
| Discovery | No standard | Well-known discovery document |

### OIDC Flow

```
Client                    Authorization Server                UserInfo Endpoint
  │                              │                                   │
  │── Auth Request──────────────>│                                   │
  │    scope=openid profile      │                                   │
  │                              │                                   │
  │<── Auth Code ───────────────│                                   │
  │                              │                                   │
  │── Token Request─────────────>│                                   │
  │    code + client_secret     │                                   │
  │                              │                                   │
  │<── ID Token + Access Token──│                                   │
  │                              │                                   │
  │── Access Token ─────────────┼──────────────────────────────────>│
  │                              │                                   │
  │<── UserInfo Claims ─────────┼──────────────────────────────────│
```

### Identity Token Structure (JWT)

```json
{
  "iss": "https://auth.example.com",
  "sub": "user-uuid-1234",
  "aud": "client-id-5678",
  "exp": 1700000000,
  "iat": 1699996400,
  "auth_time": 1699996400,
  "nonce": "random-nonce-value",
  "acr": "phr",
  "amr": ["pwd", "mfa"],
  "azp": "client-id-5678",
  "name": "John Doe",
  "preferred_username": "johndoe",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

### Standard Claims

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | String | Subject identifier (unique, never reused) |
| `name` | String | Display name |
| `given_name` | String | First name |
| `family_name` | String | Last name |
| `middle_name` | String | Middle name |
| `nickname` | String | Casual name |
| `preferred_username` | String | Username |
| `profile` | String | Profile page URL |
| `picture` | String | Avatar URL |
| `website` | String | Website URL |
| `email` | String | Email address |
| `email_verified` | Boolean | Email verification status |
| `gender` | String | Gender |
| `birthdate` | String | Birthdate (ISO 8601) |
| `zoneinfo` | String | Timezone |
| `locale` | String | Locale (BCP47) |
| `phone_number` | String | Phone number |
| `phone_number_verified` | Boolean | Phone verification status |
| `address` | JSON | Structured address |
| `updated_at` | Number | Last update timestamp |

### Discovery Document

OIDC providers expose a discovery document at `/.well-known/openid-configuration`:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "end_session_endpoint": "https://auth.example.com/logout",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email", "address", "phone"],
  "response_types_supported": ["code", "code id_token", "id_token"],
  "response_modes_supported": ["query", "fragment", "form_post"],
  "grant_types_supported": ["authorization_code", "implicit", "refresh_token"],
  "subject_types_supported": ["public", "pairwise"],
  "id_token_signing_alg_values_supported": ["RS256", "ES256"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "private_key_jwt"],
  "claims_supported": ["sub", "name", "email", "email_verified"]
}
```

### UserInfo Endpoint

The UserInfo endpoint returns identity claims for a valid access token:

```
GET /userinfo
Authorization: Bearer {access_token}

Response (200):
{
  "sub": "user-uuid-1234",
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified": true
}

Response (401):
{
  "error": "invalid_token",
  "error_description": "The access token is expired or invalid"
}
```

### ID Token Validation

```php
class IdTokenValidator
{
    public function validate(string $idToken, string $expectedIssuer, string $expectedAudience): array
    {
        // 1. Parse JWT header
        $header = json_decode(base64_decode(explode('.', $idToken)[0]), true);

        // 2. Fetch JWKS from issuer
        $jwks = $this->fetchJwks($expectedIssuer);

        // 3. Verify signature using matching key
        $key = $this->findKey($jwks, $header['kid']);
        $payload = JWT::decode($idToken, $key, [$header['alg']]);

        // 4. Validate issuer
        if ($payload->iss !== $expectedIssuer) {
            throw new InvalidIssuerException('Invalid token issuer');
        }

        // 5. Validate audience
        if (!in_array($expectedAudience, (array) $payload->aud)) {
            throw new InvalidAudienceException('Invalid token audience');
        }

        // 6. Validate expiration
        if ($payload->exp < time()) {
            throw new ExpiredTokenException('Token has expired');
        }

        // 7. Validate not before (if present)
        if (isset($payload->nbf) && $payload->nbf > time()) {
            throw new TokenNotYetValidException('Token is not yet valid');
        }

        // 8. Validate auth time (if MFA is required)
        if (isset($payload->acr) && !$this->isAcceptableAcr($payload->acr)) {
            throw new InsufficientAuthenticationException('Authentication level insufficient');
        }

        return (array) $payload;
    }
}
```

## Federation

### Identity Federation Flow

```
User ──> Laravel App ──> OIDC Discovery ──> IdP (Okta/Azure/Google)
  │                          │                        │
  │  1. Login                │  2. Fetch discovery    │
  │  3. Redirect             │                        │
  │<─────────────────────────────────────────────────│
  │  4. Authenticate         │                        │
  │──────────────────────────────────────────────────>│
  │  5. Auth Code            │                        │
  │<─────────────────────────────────────────────────│
  │  6. Exchange Code        │                        │
  │──────────────────────────────────────────────────>│
  │  7. ID + Access Token    │                        │
  │<─────────────────────────────────────────────────│
  │  8. Validate Token       │                        │
  │  9. Create/Link User     │                        │
  │  10. Session Created     │                        │
```

### Laravel OIDC Integration (Socialite)

```php
// config/services.php
'okta' => [
    'client_id' => env('OKTA_CLIENT_ID'),
    'client_secret' => env('OKTA_CLIENT_SECRET'),
    'redirect' => env('OKTA_REDIRECT_URI'),
    'base_url' => env('OKTA_BASE_URL'),  // Okta org URL,
    'scopes' => 'openid profile email',
],

'azure' => [
    'client_id' => env('AZURE_CLIENT_ID'),
    'client_secret' => env('AZURE_CLIENT_SECRET'),
    'redirect' => env('AZURE_REDIRECT_URI'),
    'tenant_id' => env('AZURE_TENANT_ID'),
    'proxy' => env('AZURE_PROXY'),  // Optional proxy
],

'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

```php
// App\Http\Controllers\Auth\OidcController.php
class OidcController
{
    public function redirect(string $provider): RedirectResponse
    {
        Session::put('oidc_state', Str::random(40));

        return Socialite::driver($provider)
            ->scopes(['openid', 'profile', 'email'])
            ->with(['state' => Session::get('oidc_state'), 'nonce' => Str::random(40)])
            ->redirect();
    }

    public function callback(string $provider): RedirectResponse
    {
        // Validate state
        if (Session::pull('oidc_state') !== request('state')) {
            throw new InvalidStateException('Invalid OIDC state parameter');
        }

        $socialUser = Socialite::driver($provider)->user();

        // Validate ID token
        $idToken = $socialUser->idToken;
        $claims = $this->validateIdToken($idToken, $provider);

        // Find or create user
        $user = User::updateOrCreate(
            ['email' => $socialUser->email],
            [
                'name' => $socialUser->name,
                'email_verified_at' => $claims['email_verified'] ? now() : null,
                'provider' => $provider,
                'provider_id' => $socialUser->id,
                'avatar' => $socialUser->avatar,
            ]
        );

        Auth::login($user, remember: true);
        Session::regenerate();

        return redirect()->intended('/dashboard');
    }
}
```

### OIDC Best Practices

| Practice | Requirement |
|----------|-------------|
| Always use `openid` scope | Without it, you get OAuth2, not OIDC |
| Validate ID Token signature | Use JWKS from discovery URL |
| Validate `aud` claim | Must include your client ID |
| Validate `iss` claim | Must match expected issuer |
| Use `nonce` for replay protection | Required for implicit flow, recommended for code flow |
| Use PKCE for public clients | Mandatory for SPA and mobile |
| Validate `auth_time` for MFA | Check authentication age if ACR requires it |
| Use `pairwise` sub where possible | Prevents user correlation across clients |

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Not validating ID token | Identity spoofing | Always validate signature and claims |
| Ignoring `nonce` | Token replay attacks | Always use and validate nonce |
| Not checking `email_verified` | Unverified email accounts | Require `email_verified: true` |
| Using opaque access tokens | No identity info | Use ID Token for identity, access token for API |
| Hardcoding provider URLs | Discovery changes break auth | Use discovery document URLs |
| Not handling token expiry | Silent login failure | Implement silent refresh with `prompt=none` |

## AI Coding Agent Rules

1. Always request `openid` scope to get an ID Token
2. Validate every ID Token's signature, issuer, audience, and expiration
3. Use `nonce` parameter to prevent replay attacks
4. Require `email_verified: true` before creating local accounts
5. Use discovery documents, never hardcode endpoint URLs
6. Implement UserInfo endpoint calls for additional claims
7. Handle all OIDC error responses (login_required, consent_required, interaction_required)
8. Use `pairwise` subject type for privacy-preserving identifiers across clients
9. Store the `sub` claim as the canonical user identifier from the IdP
10. Implement session management with `prompt=none` for silent authentication

## Production Checklist

- [ ] ID Token signature validation implemented
- [ ] `iss`, `aud`, `exp`, `nonce` validated on every ID Token
- [ ] Discovery document URL used (not hardcoded endpoints)
- [ ] UserInfo endpoint implemented or consumed
- [ ] `email_verified` claim checked before account creation
- [ ] PKCE enabled for all public OIDC clients
- [ ] State parameter validated for CSRF protection
- [ ] Account linking strategy defined (by email, by sub)
- [ ] Session logout propagates to IdP end_session_endpoint
- [ ] Silent token refresh implemented for long-lived sessions
