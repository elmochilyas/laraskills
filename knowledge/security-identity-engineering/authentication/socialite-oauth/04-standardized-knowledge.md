# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Socialite OAuth1/OAuth2 Client |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel Socialite is an OAuth1/OAuth2 client for "Sign in with Google/GitHub/Apple/Facebook/Twitter" and 50+ community providers. It abstracts the OAuth handshake (redirect to provider, callback handling, token exchange, user profile retrieval) into a unified API. Socialite supports OAuth2 (most providers) and OAuth1 (legacy Twitter v1). Community providers are available at socialiteproviders.com. Socialite is the standard for social login and OAuth client integration in Laravel.

---

## Core Concepts

- **OAuth2 Handshake**: Redirect → user authorizes → callback → code exchange → access token → user profile.
- **Stateless vs Stateful**: Stateless mode (API) skips session storage of state parameter. Stateless is required for API-driven authentication.
- **Scopes**: Requested permissions from the provider (`email`, `profile`, `openid`). Configured in `scopes()` method.
- **Community Providers**: Extend Socialite via SocialiteProviders.com. 100+ providers available. Each requires registration in `config/services.php`.
- **User Object**: `Socialite::driver('google')->user()` returns `Laravel\Socialite\Two\User` with `id`, `name`, `email`, `avatar`, `token`, `refreshToken`, `expiresIn`.

---

## When To Use

- Social login ("Sign in with Google/GitHub/Apple")
- OAuth client integration with third-party services
- Quick user onboarding (fewer registration fields)
- Enterprise SSO via OIDC (extended Socialite driver)

## When NOT To Use

- SAML 2.0 (use SocialiteProviders/Saml2 — different protocol)
- OAuth2 provider (use Passport — your app is the provider, not the client)
- Internal LDAP/Active Directory (use custom authentication provider)
- Social login as the sole authentication method (always maintain password fallback)

---

## Best Practices

- **Register All Providers in config/services.php**: Each provider needs client ID, secret, redirect URL.
- **Use Stateless for APIs**: API authentication cannot use sessions for the OAuth state parameter. Use `stateless()` method.
- **Handle Provider Errors Gracefully**: Users may deny permissions or encounter provider errors. Redirect with an error message, not a 500.
- **Link Accounts**: Allow users to link multiple social accounts to one user profile. Use the provider's ID as the linking key.
- **Privacy Considerations**: Social login relies on third-party availability — maintain alternative auth methods.

---

## Architecture Guidelines

- Socialite handles the OAuth handshake only — user creation/matching is your responsibility
- `user()` call returns token + profile data. Use the token for API calls to the provider.
- Provider-specific options via `with()` method: `Socialite::driver('google')->with(['hd' => 'company.com'])`.
- Community providers use SocialiteProviders manager — install the provider-specific package and register its listener.

---

## Performance Considerations

- Socialite adds provider redirect latency (user leaves your app, authenticates, returns)
- Token exchange: one HTTP request to the provider per login
- User profile retrieval: one HTTP request per login
- No persistent overhead — once authenticated, the application uses its own auth session/token

---

## Security Considerations

- **State Parameter**: Protects against CSRF on the OAuth callback. Socialite handles this in stateful mode. Stateless mode skips this — ensure your own CSRF protection.
- **HTTPS**: All redirect URLs must be HTTPS. Some providers (Apple) require HTTPS for the callback.
- **Email Verification**: Provider-returned emails may not be verified. Verify emails from OAuth providers (most verified providers mark `email_verified`).
- **Account Hijacking**: If a provider account is compromised, the linked Laravel account is at risk. Consider MFA for OAuth-linked accounts.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not handling provider errors | Assuming OAuth always succeeds | 500 error when user denies permissions | Catch exceptions; redirect with message |
| Using stateful for API auth | Copying browser examples | Session dependency breaks stateless auth | Use `stateless()` for APIs |
| Not verifying provider email | Trusting provider data blindly | Unverified emails in the system | Check `user_verified` or provider's email verification status |
| Making social login the only auth method | Simplifying registration | Users cannot log in when provider is down | Maintain password/email auth fallback |

---

## Anti-Patterns

- **Storing OAuth tokens in the user table (scalar)**: Users can link multiple providers — use a `social_accounts` pivot table.
- **Redirecting without error messages**: Users denied OAuth permissions and see a blank error screen.
- **Using Socialite for M2M OAuth2 calls**: Use Guzzle directly with Client Credentials grant.

---

## Examples

**Basic social login:**
```php
// config/services.php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

**Controller:**
```php
// Redirect to provider
return Socialite::driver('google')->redirect();

// Callback
$socialUser = Socialite::driver('google')->user();
// Create or match user by $socialUser->getId()
```

**Linking multiple providers:**
```php
// SocialAccount model
class SocialAccount extends Model
{
    protected $fillable = ['user_id', 'provider', 'provider_id', 'token', 'refresh_token'];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// Linking
SocialAccount::updateOrCreate([
    'provider' => 'google',
    'provider_id' => $socialUser->getId(),
], [
    'user_id' => Auth::id(),
    'token' => $socialUser->token,
]);
```

---

## Related Topics

- OIDC integration (OIDC via Socialite)
- SAML 2.0 SSO (SAML via SocialiteProviders)
- Sanctum/Passport (token auth after social login)
- Multi-tenant social login considerations

---

## AI Agent Notes

- Socialite is the standard for social login. If the project doesn't use it for social auth, check if there's a custom OAuth implementation that could be replaced.
- Community providers at socialiteproviders.com extend Socialite to 100+ providers. Most are well-maintained.
- Socialite handles OAuth handshake only — user matching, account linking, and fallback auth are the responsibility of the application.

---

## Verification

- [ ] Provider credentials configured in `config/services.php`
- [ ] Stateless mode for API/stateless authentication
- [ ] Error handling for provider exceptions (denied, network error, callback mismatch)
- [ ] Provider email verified on callback
- [ ] Multiple providers support (pivot table for social accounts)
- [ ] password/email auth fallback maintained
- [ ] HTTPS enforced on all OAuth callback URLs
- [ ] State parameter protection (unless stateless with alternative CSRF)
- [ ] Provider-specific options documented (hd for Google, tenant for Microsoft)
