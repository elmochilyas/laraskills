# Skill: Configure Socialite OAuth Client for Social Login and Third-Party OAuth

## Purpose
Implement social login and OAuth client authentication using Laravel Socialite for "Sign in with Google/GitHub/Apple" and 50+ community providers.

## When To Use
- Social login ("Sign in with Google/GitHub/Apple")
- OAuth client integration with third-party services
- Quick user onboarding (fewer registration fields)
- Enterprise SSO via OIDC (extended Socialite driver)

## When NOT To Use
- SAML 2.0 enterprise SSO (use SocialiteProviders/Saml2)
- OAuth2 provider (use Passport — your app is the provider, not client)
- Internal LDAP/Active Directory (use custom auth provider)
- Social login as sole authentication method (always maintain password fallback)

## Prerequisites
- `composer require laravel/socialite`
- Provider credentials (client ID, secret, redirect URI) from each OAuth provider
- Community provider package if needed (socialiteproviders.com)

## Inputs
- Provider list (Google, GitHub, Apple, Facebook, etc.)
- Provider credentials (client ID, secret, redirect URI)
- Scope requirements (email, profile, openid)
- User matching strategy (email-based, provider ID-based)

## Workflow (numbered)
1. Register each provider in `config/services.php` with credentials from `.env`
2. Install community provider packages if needed (SocialiteProviders)
3. Create routes for redirect and callback
4. Implement redirect: `Socialite::driver('google')->redirect()`
5. Implement callback: `$socialUser = Socialite::driver('google')->user()`
6. Wrap callback in try-catch for graceful provider error handling
7. Verify email verification status from provider
8. Match or create user: find by provider ID in `social_accounts` pivot table
9. Maintain password/email authentication as fallback
10. Build account linking UI for multiple providers per user

## Validation Checklist
- [ ] Provider credentials configured in `config/services.php` (not hardcoded)
- [ ] Stateless mode for API-driven OAuth (`->stateless()`)
- [ ] Error handling for provider exceptions (catch and redirect with message)
- [ ] Provider email verified before accepting as verified email
- [ ] `social_accounts` pivot table for multiple providers
- [ ] Password/email auth fallback maintained
- [ ] HTTPS enforced on all OAuth callback URLs

## Common Failures
- Not handling provider errors (500 error when user denies permissions)
- Using stateful mode for API auth (InvalidStateException)
- Not verifying provider email (unverified emails in system)
- Storing provider tokens in user table columns (doesn't scale to multiple providers)
- Social login as the only authentication method (provider downtime = total lockout)

## Decision Points
- **Stateful vs Stateless**: Stateful for browser apps (session); Stateless for API clients
- **Account linking**: Match by email or by social_accounts pivot table with provider_id
- **Email verification**: Check provider's `email_verified` flag before accepting

## Performance Considerations
- Provider redirect adds latency (user leaves app, authenticates, returns)
- Token exchange: one HTTP request per login
- User profile retrieval: one HTTP request per login
- No persistent overhead after authentication

## Security Considerations
- State parameter protects OAuth callback CSRF — Socialite handles in stateful mode
- HTTPS required for all OAuth redirect URLs
- Provider emails may not be verified — check verification status
- Linked accounts at risk if provider account is compromised — consider MFA

## Related Rules (from 05-rules.md)
- Register All OAuth Providers in config/services.php
- Use Stateless Mode for API/OAuth Authentication
- Handle Provider Errors Gracefully With User-Facing Messages
- Verify Provider-Reported Email Verification Status
- Use a Pivot Table for Multiple Linked Social Accounts
- Maintain Password Fallback for Social Login Users

## Related Skills
- Integrate OpenID Connect (OIDC) SSO
- Implement SAML 2.0 SSO
- Configure Passport OAuth2 Server
- Configure Auth Guards and Providers

## Success Criteria
- Users can sign in with Google, GitHub, Apple, or other configured providers
- Provider errors handled gracefully (redirect with message, not 500)
- Email verification status respected from provider
- Users can link multiple social accounts to one profile
- Password fallback available when providers are down
- Stateless mode works for API-driven OAuth flows
