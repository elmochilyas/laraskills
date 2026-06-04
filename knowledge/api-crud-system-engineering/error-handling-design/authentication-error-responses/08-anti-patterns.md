# Anti-Patterns — Authentication Error Responses

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Authentication Error Responses |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Returning 403 for Missing Auth | High | Medium | Code review: 403 response for unauthenticated requests |
| Missing WWW-Authenticate Header | High | Medium | Code review: 401 response without WWW-Authenticate |
| Leaking User Existence | Critical | High | Code review: "User not found" vs "Invalid password" messages |
| Generic Code for All Failures | Medium | Medium | Code review: same error code for expired, invalid, missing tokens |
| Stack Traces in 401 Responses | Critical | Medium | Code review: 401 response with exception details |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Returning 200 with `authenticated: false` | HTTP 200 with a body flag instead of 401 | Breaks HTTP semantics, defeats caching and automated auth handling |
| Returning 401 with HTML Body | API routes returning HTML for auth errors | Client cannot parse HTML as JSON |
| Same Code for All Guards | Web auth and API auth errors indistinguishable | Client cannot implement guard-specific error handling |

---

## Anti-Pattern Details

### AP-AER-01: Returning 403 for Missing Auth

**Description**: An unauthenticated request receives HTTP 403 Forbidden instead of 401 Unauthorized. This confuses the client: 403 means "authenticated but not allowed," so the client thinks their credentials are valid but insufficient. The client may persist invalid credentials instead of re-authenticating.

**Root Cause**: Misunderstanding the HTTP specification. The developer conflates authentication (who you are) with authorization (what you can do).

**Impact**:
- Client persists invalid credentials (thinks auth succeeded but authorization failed)
- Automated 401 → refresh token logic never triggers
- Security monitoring cannot distinguish auth failures from authorization denials
- Breaks HTTP standards compliance

**Detection**:
- Code review: authentication middleware or guard returns 403 for missing/invalid tokens
- Code review: `AuthenticationException` mapped to 403 response
- Bug reports: "I keep getting 403 but my token is correct"

**Solution**:
- Use 401 for all authentication failures (missing, expired, invalid credentials)
- Reserve 403 for authenticated requests that fail authorization (Gates, Policies)
- Map `AuthenticationException` explicitly to 401

**Example**:
```php
// BEFORE: 403 for missing auth
public function render(AuthenticationException $e, Request $request): JsonResponse
{
    return response()->json(['error' => 'Forbidden'], 403); // ❌ should be 401
}

// AFTER: Correct 401 for missing auth
public function render(AuthenticationException $e, Request $request): JsonResponse
{
    return response()->json(
        new ErrorEnvelope(ErrorCodes::USER_AUTH_UNAUTHENTICATED, 'Authentication required.', 401),
        401,
        ['WWW-Authenticate' => 'Bearer realm="api"']
    );
}
```

---

### AP-AER-02: Leaking User Existence

**Description**: Authentication error messages differentiate between "user not found" and "wrong password." An attacker can probe the API to discover which email addresses are registered, enabling targeted phishing or credential stuffing. This is an enumeration vulnerability.

**Root Cause**: Helpfulness. The developer wants legitimate users to understand exactly what went wrong during login. The security implications of user enumeration are not considered.

**Impact**:
- User enumeration vulnerability: attackers can verify email existence
- Targeted phishing campaigns using known-valid emails
- Credential stuffing lists curated by confirmed accounts
- GDPR/Privacy implications for exposing registration status

**Detection**:
- Code review: login endpoint returns "User not found" vs "Invalid password"
- Code review: registration endpoint returns "Email already taken" vs generic error
- Penetration testing: different response times or messages for existing vs non-existing users

**Solution**:
- Use identical generic messages for all authentication failures
- "Invalid credentials" or "Authentication failed" for both user-not-found and wrong-password
- Never reveal whether a user exists, is locked, or is inactive
- Use the same response timing (add artificial delay if needed)

**Example**:
```php
// BEFORE: Leaking user existence
class LoginController
{
    public function __invoke(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'User not found'], 401); // ❌ enumeration
        }
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Wrong password'], 401); // ❌ enumeration
        }
        // ...
    }
}

// AFTER: Generic authentication failure
class LoginController
{
    public function __invoke(LoginRequest $request): JsonResponse
    {
        // Always the same response regardless of which check failed
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(
                new ErrorEnvelope(ErrorCodes::USER_AUTH_UNAUTHENTICATED, 'Invalid credentials.', 401),
                401,
                ['WWW-Authenticate' => 'Bearer realm="api"']
            );
        }
        // ...
    }
}
```

---

### AP-AER-03: Generic Code for All Failures

**Description**: Every authentication failure — expired token, invalid token, missing token, revoked token — returns the same error code. Clients cannot distinguish between "my token expired (refresh it)" and "my token was stolen (revoke it)." The client treats all auth errors identically, preventing targeted error recovery.

**Root Cause**: Simplicity. Using a single `USER.AUTH_FAILED` code is easier than implementing guard-aware, scenario-specific codes.

**Impact**:
- Clients cannot implement silent token refresh for expired tokens
- Clients cannot distinguish revoked tokens (re-authenticate) from expired tokens (refresh)
- Attackers cannot be detected via distinct error patterns
- Security monitoring cannot differentiate auth failure types

**Detection**:
- Code review: error code map has a single entry for all authentication scenarios
- Code review: `AuthenticationException` mapped to one code regardless of guard
- Client code review: "if (code === 'AUTH_FAILED')" — no branching

**Solution**:
- Use distinct codes: `USER.AUTH_UNAUTHENTICATED`, `USER.AUTH_TOKEN_EXPIRED`, `USER.AUTH_TOKEN_INVALID`
- Map by guard type (Sanctum vs Passport vs custom)
- The client can branch on the code for appropriate recovery

**Example**:
```php
// BEFORE: Single code for all failures
protected array $exceptionCodeMap = [
    AuthenticationException::class => 'USER.AUTH_FAILED', // ❌ same for expired, invalid, missing
];

// AFTER: Guard-aware, scenario-specific codes
public function render(AuthenticationException $e, Request $request): JsonResponse
{
    $code = match ($e->guards()) {
        ['sanctum'] => ErrorCodes::USER_AUTH_TOKEN_EXPIRED,
        ['passport'] => ErrorCodes::USER_AUTH_TOKEN_INVALID,
        default => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
    };
    // ...
}
```
