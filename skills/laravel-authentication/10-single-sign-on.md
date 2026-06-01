# Single Sign-On

## Objective

Define production-grade Single Sign-On (SSO) implementation standards for Laravel applications, covering SAML, OAuth2, OpenID Connect SSO, identity federation, and enterprise identity provider integration.

## Core Philosophy

SSO centralizes authentication across multiple applications. It improves security through centralized credential management and enables seamless user experience. The IdP is the authoritative source for identity state — treat it as such.

## Architecture Standards

### SSO Protocols Comparison

| Protocol | Standard | Use Case | Complexity | Maturity |
|----------|----------|----------|------------|----------|
| SAML 2.0 | OASIS | Enterprise, AD FS, Okta | High | Very mature |
| OAuth2 + OIDC | IETF | Modern web, mobile, API | Medium | Modern standard |
| LDAP | IETF | Internal apps, legacy | Medium | Legacy |
| CAS | Jasig | University ecosystems | Medium | Declining |
| RADIUS | IETF | Network access, VPN | Low | Specialized |

### SSO Flow (SP-Initiated)

```
User ──> Laravel (SP) ──> IdP Discovery ──> IdP Login ──> SAML/OIDC Response ──> Laravel Callback ──> Session
  1         2                  3                   4                   5                    6           7
```

### Identity Federation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Application  │     │  Identity    │     │  External    │
│  A (SP)       │     │  Provider    │     │  IdP (Azure) │
│               │     │  (Internal)  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                      │
       │──── SAML ─────────>│                      │
       │                    │──── WS-Fed ─────────>│
       │                    │<─── Assertion ───────│
       │<─── SAML ─────────│                      │
       │                    │                      │
```

### SAML 2.0 Integration

```php
// config/services.php
'saml' => [
    'sp' => [
        'entity_id' => env('SAML_SP_ENTITY_ID', config('app.url') . '/saml/metadata'),
        'assertion_consumer_service_url' => env('SAML_ACS_URL', config('app.url') . '/saml/acs'),
        'single_logout_service_url' => env('SAML_SLS_URL', config('app.url') . '/saml/sls'),
        'private_key' => storage_path('saml/sp-private.key'),
        'certificate' => storage_path('saml/sp-certificate.crt'),
    ],
    'idp' => [
        'entity_id' => env('SAML_IDP_ENTITY_ID'),
        'single_sign_on_service_url' => env('SAML_IDP_SSO_URL'),
        'single_logout_service_url' => env('SAML_IDP_SLS_URL'),
        'certificate' => storage_path('saml/idp-certificate.crt'),
    ],
    'strict' => env('SAML_STRICT', true),
    'debug' => env('SAML_DEBUG', false),
    'baseurl' => config('app.url'),
];

// SAML Controller
// App\Http\Controllers\Auth\SamlController.php
class SamlController
{
    public function login(): RedirectResponse
    {
        $auth = new OneLogin\Saml2\Auth(config('services.saml'));
        return redirect()->away($auth->login());
    }

    public function acs(Request $request): RedirectResponse
    {
        $auth = new OneLogin\Saml2\Auth(config('services.saml'));
        $auth->processResponse();

        if ($errors = $auth->getErrors()) {
            Log::error('SAML ACS error', ['errors' => $errors]);
            throw new SamlAuthenticationException('SAML authentication failed.');
        }

        $attributes = $auth->getAttributes();
        $nameId = $auth->getNameId();

        $user = $this->findOrCreateUser($nameId, $attributes);

        // Map SAML attributes to user
        if ($attributes['email'][0] ?? null) {
            $user->email = $attributes['email'][0];
        }
        if ($attributes['firstName'][0] ?? null) {
            $user->name = $attributes['firstName'][0] . ' ' . ($attributes['lastName'][0] ?? '');
        }
        $user->save();

        Auth::login($user);
        Session::regenerate();

        return redirect()->intended('/dashboard');
    }

    public function metadata(): Response
    {
        $auth = new OneLogin\Saml2\Auth(config('services.saml'));
        $settings = $auth->getSettings();
        $metadata = $settings->getSPMetadata();

        return response($metadata, 200, ['Content-Type' => 'text/xml']);
    }

    public function sls(Request $request): RedirectResponse
    {
        $auth = new OneLogin\Saml2\Auth(config('services.saml'));
        $auth->processSlo();

        Auth::logout();
        Session::invalidate();

        return redirect('/');
    }
}
```

### OAuth2 SSO

```php
// App\Http\Controllers\Auth\OAuthSsoController.php
class OAuthSsoController
{
    public function redirect(string $provider): RedirectResponse
    {
        Session::put('sso_state', Str::random(40));

        return Socialite::driver($provider)
            ->scopes(config("services.{$provider}.scopes", []))
            ->with(['state' => Session::get('sso_state')])
            ->redirect();
    }

    public function callback(string $provider): RedirectResponse
    {
        // Validate state parameter
        if (Session::pull('sso_state') !== request('state')) {
            throw new InvalidStateException('Invalid SSO state parameter.');
        }

        $socialUser = Socialite::driver($provider)->user();

        // Map provider user to local user
        $user = User::updateOrCreate(
            ['email' => $socialUser->email],
            [
                'name' => $socialUser->name ?? explode('@', $socialUser->email)[0],
                'email_verified_at' => now(), // Trust IdP verification
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

### OpenID Connect SSO

```php
// config/services.php
'azure' => [
    'client_id' => env('AZURE_CLIENT_ID'),
    'client_secret' => env('AZURE_CLIENT_SECRET'),
    'redirect' => env('AZURE_REDIRECT_URI'),
    'tenant_id' => env('AZURE_TENANT_ID'),
    'scopes' => 'openid profile email',
    'discovery' => 'https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration',
],

// OIDC callback includes ID Token validation
public function oidcCallback(string $provider): RedirectResponse
{
    $socialUser = Socialite::driver($provider)->user();

    // Validate ID Token
    $this->validateIdToken($socialUser->idToken, $provider);

    // Check email_verified claim
    if (!($socialUser->user['email_verified'] ?? false)) {
        throw new UnverifiedEmailException('Email not verified by identity provider.');
    }

    $user = User::updateOrCreate(
        ['provider_id' => $socialUser->id],
        [
            'name' => $socialUser->name,
            'email' => $socialUser->email,
            'email_verified_at' => now(),
            'provider' => $provider,
            'avatar' => $socialUser->avatar,
        ]
    );

    Auth::login($user);
    Session::regenerate();

    return redirect()->intended('/dashboard');
}
```

## Enterprise SSO

### Identity Provider Discovery

```php
// App\Services\IdpDiscoveryService.php
class IdpDiscoveryService
{
    public function discoverIdp(string $email): ?IdpConfig
    {
        $domain = substr(strrchr($email, '@'), 1);

        // Known enterprise domains
        $idpConfigs = IdpConfig::where('domain', $domain)->first();

        if (!$idpConfigs) {
            return null; // Fallback to local authentication
        }

        return $idpConfigs;
    }
}

// Usage in login flow
public function login(LoginRequest $request): RedirectResponse|JsonResponse
{
    $idp = app(IdpDiscoveryService::class)->discoverIdp($request->input('email'));

    if ($idp) {
        // Redirect to enterprise IdP
        Session::put('sso_email', $request->input('email'));
        return redirect()->away($idp->getLoginUrl());
    }

    // Fall back to local authentication
    return $this->localLogin($request);
}
```

### Just-In-Time (JIT) Provisioning

```php
class JitProvisioningService
{
    public function provision(string $providerId, string $email, array $attributes): User
    {
        return DB::transaction(function () use ($providerId, $email, $attributes) {
            $user = User::create([
                'name' => $attributes['name'] ?? explode('@', $email)[0],
                'email' => $email,
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(32)), // Random password — IdP-managed
                'provider' => $attributes['provider'],
                'provider_id' => $providerId,
            ]);

            // Assign default role(s) from IdP attributes
            if ($groups = $attributes['groups'] ?? null) {
                $this->syncGroupRoles($user, $groups);
            }

            event(new UserProvisioned($user, $attributes));

            return $user;
        });
    }
}
```

### Account Linking

```php
class AccountLinkingService
{
    public function link(User $user, string $provider, string $providerId): void
    {
        // Prevent linking to another existing account
        $existing = User::where('provider', $provider)
            ->where('provider_id', $providerId)
            ->where('id', '!=', $user->id)
            ->first();

        if ($existing) {
            throw new AccountLinkingConflictException(
                'This identity is already linked to another account.'
            );
        }

        $user->update([
            'provider' => $provider,
            'provider_id' => $providerId,
        ]);

        event(new AccountLinked($user, $provider, $providerId));
    }

    public function unlink(User $user, string $provider): void
    {
        // Prevent unlinking if no other auth method exists
        $authMethods = $user->provider ? 1 : 0;
        $hasPassword = $user->password !== null;

        if (!$hasPassword && $authMethods <= 1) {
            throw new LastAuthenticationMethodException(
                'Cannot unlink the only authentication method.'
            );
        }

        $user->update([
            'provider' => null,
            'provider_id' => null,
        ]);

        // Set a random password if none exists
        if (!$hasPassword) {
            $user->password = Hash::make(Str::random(32));
            $user->save();
        }

        event(new AccountUnlinked($user, $provider));
    }
}
```

### Session Management with IdP

```php
class SsoSessionManager
{
    public function handleLogout(Request $request): RedirectResponse
    {
        $idpLogoutUrl = Session::get('idp_logout_url');

        // Clear local session
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect to IdP for global logout
        if ($idpLogoutUrl) {
            return redirect()->away($idpLogoutUrl);
        }

        return redirect('/');
    }

    public function handleIdpInitiatedLogout(SamlRequest $request): void
    {
        // Process IdP-initiated logout
        $sessionId = $request->getSessionId();

        // Invalidate all sessions with this IdP session
        Session::where('idp_session_id', $sessionId)->delete();
    }
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No SP metadata validation | SAML response injection | Validate all SAML assertions with IdP certificate |
| Trusting IdP without validation | Rogue IdP login | Validate signature, issuer, audience, timestamps |
| Ignoring `email_verified` | Unverified email accounts | Require `email_verified: true` from IdP |
| No JIT provisioning | Users must be pre-created | Support JIT with attribute mapping |
| No account linking | Same user creates multiple accounts | Link by verified email or sub claim |
| No IdP logout propagation | Logged out locally but still active at IdP | Implement SLO (Single Logout) |
| No state validation | CSRF attacks on callback | Always validate state parameter |
| Hardcoded provider URLs | Break when IdP changes | Use discovery documents |

## AI Coding Agent Rules

1. Always validate IdP responses — signature, issuer, audience, timestamps, nonce
2. Implement IdP-initiated and SP-initiated SSO flows
3. Support JIT provisioning with attribute mapping from IdP claims
4. Link accounts by verified email or `sub` claim — never by name alone
5. Propagate logout to IdP (SLO) — never assume local logout is sufficient
6. Validate state parameter on every OAuth/OIDC callback
7. Use IdP discovery to route users to the correct provider by email domain
8. Handle account linking conflicts gracefully
9. Never expose IdP technical details in error messages
10. Audit all SSO login events with provider and assertion details

## Production Checklist

- [ ] IdP response validation implemented (signature, issuer, audience)
- [ ] SP metadata endpoint configured and accessible
- [ ] IdP discovery by email domain implemented
- [ ] JIT provisioning with attribute mapping working
- [ ] Account linking (by email or sub) implemented
- [ ] SLO (Single Logout) implemented
- [ ] State parameter validated on all callbacks
- [ ] IdP certificate rotation procedure documented
- [ ] SSO audit logging implemented
- [ ] Fallback to local authentication for unlinked domains
- [ ] Multiple IdP support tested (SAML + OIDC)
