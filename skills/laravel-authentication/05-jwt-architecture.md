# JWT Architecture

## Objective

Define production-grade JWT implementation standards covering token structure, signing algorithms, refresh strategies, revocation, and security hardening for Laravel applications.

## Core Philosophy

JWT is a stateless authentication protocol. Its strength is decentralization and scalability. Its weakness is irreversibility — once issued, a JWT cannot be revoked until it expires. Design must account for this constraint.

## Architecture Standards

### JWT Structure

```
Base64URL(Header) . Base64URL(Payload) . Base64URL(Signature)
```

#### Header
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id-2024-01"
}
```

#### Payload (Registered Claims)
```json
{
  "iss": "https://api.example.com",
  "sub": "user-uuid-1234",
  "aud": "https://api.example.com",
  "exp": 1700000000,
  "nbf": 1699996400,
  "iat": 1699996400,
  "jti": "unique-token-id-5678",
  "sid": "session-id-9012"
}
```

#### Private Claims (Application-Specific)
```json
{
  "roles": ["admin", "editor"],
  "permissions": ["posts:read", "posts:write"],
  "tenant_id": "tenant-uuid",
  "device_id": "device-uuid",
  "auth_method": "mfa"
}
```

### Claims Standards

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `iss` | String | Yes | Issuer identifier |
| `sub` | String | Yes | Subject (user identifier) |
| `aud` | String/Array | Yes | Audience (intended recipient) |
| `exp` | NumericDate | Yes | Expiration time |
| `nbf` | NumericDate | No | Not before time |
| `iat` | NumericDate | Yes | Issued at time |
| `jti` | String | Yes | Unique token identifier |
| `sid` | String | No | Session identifier |

### Signing Algorithms

| Algorithm | Type | Key Size | Recommendation |
|-----------|------|----------|----------------|
| HS256 | Symmetric | 256+ bits | Avoid — shared secret |
| RS256 | Asymmetric | 2048+ bits | Recommended for most use cases |
| ES256 | Asymmetric | P-256 | Recommended for mobile/low-power |
| EdDSA | Asymmetric | Ed25519 | Best-in-class performance and security |

```php
// Algorithm selection rules:
// 1. Prefer RS256 or ES256 over HS256 (shared secrets are hard to rotate)
// 2. Use EdDSA (Ed25519) when possible for best performance
// 3. Never use `none` algorithm
// 4. Never allow algorithm confusion (verify algorithm matches expected)

// Key generation
// RS256: ssh-keygen -t rsa -b 4096 -m PEM -f private.pem
// ES256: openssl ecparam -genkey -name prime256v1 -noout -out private.pem
// EdDSA: ssh-keygen -t ed25519 -f private.pem
```

### Token Structure Standards

```php
// App\Services\TokenService.php
class TokenService
{
    private const ACCESS_TOKEN_TTL = 900;       // 15 minutes
    private const REFRESH_TOKEN_TTL = 604800;    // 7 days

    public function createAccessToken(User $user, array $claims = []): string
    {
        $now = time();

        $payload = array_merge([
            'iss' => config('app.url'),
            'sub' => $user->getAuthIdentifier(),
            'aud' => config('app.url'),
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + self::ACCESS_TOKEN_TTL,
            'jti' => Str::uuid()->toString(),
            'sid' => session()->getId(),
        ], $claims);

        return JWT::encode($payload, $this->privateKey, 'RS256');
    }
}
```

### Validation Pipeline

```php
// App\Http\Middleware\ValidateJwt.php
class ValidateJwt
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Token not provided.'], 401);
        }

        try {
            $payload = JWT::decode($token, $this->publicKey, ['RS256']);

            // Validate issuer
            if ($payload->iss !== config('app.url')) {
                throw new UnauthorizedException('Invalid issuer.');
            }

            // Validate audience
            if (!in_array(config('app.url'), (array) $payload->aud)) {
                throw new UnauthorizedException('Invalid audience.');
            }

            // Check if token is blacklisted
            if ($this->isBlacklisted($payload->jti)) {
                throw new UnauthorizedException('Token has been revoked.');
            }

            // Check if session was invalidated
            if ($this->isSessionRevoked($payload->sid)) {
                throw new UnauthorizedException('Session has been terminated.');
            }

            // Bind user to request
            $request->setUserResolver(fn () => User::findOrFail($payload->sub));

        } catch (ExpiredException) {
            return response()->json(['message' => 'Token has expired.', 'code' => 'TOKEN_EXPIRED'], 401);
        } catch (SignatureInvalidException) {
            return response()->json(['message' => 'Invalid token signature.'], 401);
        } catch (BeforeValidException) {
            return response()->json(['message' => 'Token is not yet valid.'], 401);
        } catch (\Exception $e) {
            Log::warning('JWT validation failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Token validation failed.'], 401);
        }

        return $next($request);
    }
}
```

## Refresh Token Strategy

### Rotation Strategy

```php
class RefreshTokenManager
{
    public function rotate(string $oldRefreshToken): array
    {
        DB::transaction(function () use ($oldRefreshToken, &$newTokens) {
            // 1. Validate old refresh token
            $refreshToken = RefreshToken::where('token', hash('sha256', $oldRefreshToken))
                ->where('expires_at', '>', now())
                ->whereNull('revoked_at')
                ->firstOrFail();

            // 2. Revoke old token
            $refreshToken->update(['revoked_at' => now()]);

            // 3. Issue new access + refresh token pair
            $user = User::findOrFail($refreshToken->user_id);
            $newAccessToken = $this->tokenService->createAccessToken($user);
            $newRefreshToken = $this->createRefreshToken($user);

            $newTokens = [
                'access_token' => $newAccessToken,
                'refresh_token' => $newRefreshToken,
                'token_type' => 'Bearer',
                'expires_in' => TokenService::ACCESS_TOKEN_TTL,
            ];
        });

        return $newTokens;
    }

    private function createRefreshToken(User $user): string
    {
        $plainText = Str::random(64);
        $hash = hash('sha256', $plainText);

        RefreshToken::create([
            'user_id' => $user->id,
            'token' => $hash,
            'expires_at' => now()->addDays(7),
        ]);

        return $plainText;
    }
}
```

### Revocation Strategy

```php
// Immediate revocation strategies (by priority)
//
// 1. Blacklist (Redis) — Fastest, best for high-security
//    - Store {jti -> exp} in Redis with matching TTL
//    - Check on every token validation
//
// 2. Token Family (Database) — Balance of performance and security
//    - Track token chains (parent -> child)
//    - Revoke entire family on breach detection
//
// 3. Session-Based (Database) — User control
//    - Link tokens to sessions
//    - Revoke all tokens for a session on logout

class TokenBlacklist
{
    private Redis $redis;

    public function blacklist(string $jti, int $ttl): void
    {
        $this->redis->setex("blacklist:jwt:$jti", $ttl, 'revoked');
    }

    public function isBlacklisted(string $jti): bool
    {
        return (bool) $this->redis->exists("blacklist:jwt:$jti");
    }

    public function blacklistAllForUser(User $user): void
    {
        // If using database-backed tokens, update all
        UserToken::where('user_id', $user->id)
            ->where('expires_at', '>', now())
            ->update(['revoked_at' => now()]);

        // Signal to blacklist via user-level key
        $this->redis->setex("blacklist:user:{$user->id}", 86400, now()->timestamp);
    }
}
```

## Security Concerns

### Common JWT Vulnerabilities

| Vulnerability | Attack Vector | Mitigation |
|--------------|---------------|------------|
| Algorithm confusion | `alg: none` or symmetric key confusion | Always validate `alg` against expected list |
| Token injection | Crafted tokens with future `nbf` | Validate `nbf` is in the past |
| Replay attacks | Reusing captured tokens | Use `jti` + nonce, short TTL |
| Information disclosure | Sensitive data in payload | Never put secrets in JWT payload |
| Weak key | Brute-force HMAC secret | Use asymmetric keys (RS256/ES256) |
| Token sidejacking | XSS + theft from localStorage | Use httpOnly cookies for storage |
| Refresh token theft | Stolen refresh token reuse | Rotation + family tracking |
| Cross-subject confusion | `sub` claim mismatch | Always validate `sub` matches resource owner |

### Storage Security

```php
// NEVER store access token in:
// - localStorage (vulnerable to XSS)
// - sessionStorage (vulnerable to XSS)
// - URL parameters (leak via logs/referrers)

// RECOMMENDED:
// - httpOnly, Secure, SameSite cookies (for web apps)
// - Secure device storage (Keychain for iOS, Keystore for Android)
// - In-memory + secure cookie refresh token

// For web apps: Access token in memory, refresh token in httpOnly cookie
// For mobile: Both tokens in secure device storage
// For SPAs: Short-lived access token in memory, refresh with PKCE
```

### Clock Skew Handling

```php
public function validateWithSkew(\stdClass $payload, int $maxSkew = 30): void
{
    $now = time();

    // Allow configured clock skew (default 30 seconds)
    if ($payload->exp + $maxSkew < $now) {
        throw new ExpiredException('Token has expired.');
    }

    if (isset($payload->nbf) && $payload->nbf - $maxSkew > $now) {
        throw new BeforeValidException('Token is not yet valid.');
    }
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No token expiration | Stolen tokens valid forever | Always set `exp` (max 15 min) |
| Sensitive data in payload | `sub` leak in decoded tokens | Only include identifiers and non-sensitive claims |
| Using HS256 in multi-service | Shared secret compromises all services | Use RS256 with per-service key pairs |
| No blacklist | Cannot revoke compromised tokens | Implement Redis blacklist or database revocation |
| Long-lived access tokens | Wide window for token theft | 15 minutes max, use refresh tokens |
| Not validating `aud` | Token accepted by wrong service | Validate `aud` equals receiving service |
| Algorithm not whitelisted | Algorithm confusion attacks | Explicitly whitelist allowed algorithms |

## AI Coding Agent Rules

1. Always set `exp`, `iat`, `jti`, `iss`, `aud`, and `sub` claims
2. Use asymmetric algorithms (RS256, ES256, EdDSA) — never HS256 in multi-service
3. Access token TTL must be 15 minutes or less
4. Validate algorithm against an explicit whitelist — never trust the JWT header alone
5. Implement token blacklisting with TTL-matched Redis keys
6. Use refresh token rotation — invalidate old tokens on each refresh
7. Never put secrets, passwords, or sensitive PII in JWT payload
8. Validate `aud` claim — token must be intended for the receiving service
9. Handle clock skew (max 30 seconds) across distributed services
10. Store refresh tokens as SHA-256 hashes, never plaintext

## Production Checklist

- [ ] Algorithm whitelist enforced (RS256/ES256 only, no `none`)
- [ ] `exp`, `iat`, `jti`, `iss`, `aud`, `sub` all populated
- [ ] Access token TTL ≤ 15 minutes
- [ ] Refresh token rotation enabled
- [ ] Token blacklist implemented (Redis)
- [ ] Clock skew handling (max 30s)
- [ ] Private key secured (file permissions, HSM, or vault)
- [ ] Public key available via JWKS endpoint
- [ ] Refresh tokens stored as SHA-256 hashes
- [ ] All token validation errors return generic 401 messages
