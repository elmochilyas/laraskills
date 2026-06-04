# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Socialite OAuth1/OAuth2 Client
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Stateful vs Stateless Socialite Mode | Session dependency for OAuth state parameter | architectural, security |
| 2 | Account Linking Strategy | How to match OAuth users to existing accounts | user-experience, security |
| 3 | Provider Selection: First-Party vs Community | Choosing between first-party Socialite providers and community extensions | maintainability, reliability |

---

# Architecture-Level Decision Trees

---

## Stateful vs Stateless Socialite Mode

---

## Decision Context

Choosing between Socialite's default stateful mode (session-based state parameter) and stateless mode (no session dependency) for OAuth flows.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the OAuth flow initiated from a server-rendered web application with session support?
↓
YES → Stateful mode (Socialite stores OAuth state in session, validates on callback)
NO → Is the OAuth flow initiated from an API/SPA without server sessions?
    YES → Stateless mode (`->stateless()`) — implement your own CSRF protection
    NO → Is this a mobile app that opens a browser for OAuth?
        YES → Stateless mode (mobile apps don't have server sessions)
        NO → Stateful mode

Do you need to customize the state parameter?
↓
YES → Stateless mode (manually generate and validate state)
NO → Stateful mode (Socialite handles state automatically)

---

## Rationale

Stateful mode uses the session to store the OAuth `state` parameter, which prevents CSRF on the callback. Stateless mode skips this — the application must implement alternative CSRF protection (PKCE, custom state management). API clients, SPAs, and mobile apps typically cannot maintain server sessions, requiring stateless mode.

---

## Recommended Default

**Default:** Stateful mode for server-rendered web apps; Stateless mode for APIs, SPAs, and mobile apps
**Reason:** Stateful mode provides automatic CSRF protection via the OAuth state parameter. Stateless mode is required when there's no server session to store the state. For SPAs, implement PKCE or custom state management as the CSRF equivalent.

---

## Risks Of Wrong Choice

- Stateful mode for API: `InvalidStateException` on callback (no session to validate state)
- Stateless mode without CSRF protection: CSRF on OAuth callback, attacker can initiate OAuth from victim's browser
- Stateful mode for mobile: OAuth redirect opens system browser — no session cookie available

---

## Related Rules

- Use Stateless Mode for API/OAuth Authentication (05-rules.md)
- Register All OAuth Providers in config/services.php (05-rules.md)
- Handle Provider Errors Gracefully With User-Facing Messages (05-rules.md)

---

## Related Skills

- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)

---

## Account Linking Strategy

---

## Decision Context

How to match users from OAuth provider responses to existing application accounts — by email, by provider ID, or by a combination.

---

## Decision Criteria

* user-experience
* security

---

## Decision Tree

Does the OAuth provider return a verified email address?
↓
YES → Link by email (matching verified email to existing user) — safest automatic linking
NO → Link by provider ID only (social_accounts pivot table) — no automatic account matching

Are you supporting multiple OAuth providers per user?
↓
YES → Pivot table (`social_accounts` with provider + provider_id + user_id) — required for multi-provider
NO → Single provider per user — can store provider ID on users table (but less flexible for future)

Do you want automatic account creation on first login?
↓
YES → Match by verified email or create new account if no match
NO → Require manual account linking (user must authorize linking each provider)

---

## Rationale

Matching by verified email is the safest automatic linking strategy — only link if the provider has confirmed email ownership. Matching by provider ID (`social_accounts` pivot table) is more robust (handles email changes). A pivot table supports multiple providers per user. Auto-creating accounts from provider data is common but should require verified email to prevent impersonation.

---

## Recommended Default

**Default:** Pivot table (`social_accounts`) with matching by provider ID for existing accounts; auto-create new accounts from verified email
**Reason:** Pivot table supports multiple providers per user and is resilient to email changes. Auto-creation from verified email reduces registration friction. Always verify the provider's email verification status before auto-linking or auto-creating.

---

## Risks Of Wrong Choice

- Matching by unverified email: attacker can create provider account with victim's email and hijack account
- Storing provider ID on users table (single column): cannot support multiple providers per user
- No auto-creation: users must register first, then link — more friction
- Auto-creation without email verification: fake accounts created from unverified provider emails

---

## Related Rules

- Verify Provider-Reported Email Verification Status (05-rules.md)
- Use a Pivot Table for Multiple Linked Social Accounts (05-rules.md)
- Maintain Password Fallback for Social Login Users (05-rules.md)

---

## Related Skills

- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)

---

## Provider Selection: First-Party vs Community

---

## Decision Context

Choosing between Socialite's first-party providers (Google, GitHub, Facebook, LinkedIn, Twitter, Bitbucket) and community providers from SocialiteProviders.com.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Is the provider available as a first-party Socialite driver?
↓
YES → Use first-party driver (no additional package, maintained by Laravel core)
NO → Is the provider available via SocialiteProviders.com?
    YES → Is the community provider actively maintained (recent commits, open issues resolved)?
        YES → Community provider (install via `composer require socialiteproviders/providername`)
        NO → Consider custom driver or alternative approach
    NO → Custom Socialite driver implementation required

Is the community provider critical to your authentication flow?
↓
YES → Monitor repository for maintenance activity; have migration plan
NO → Community provider is fine for non-critical providers

---

## Rationale

First-party providers are maintained by the Laravel core team and require no additional package installation. Community providers from SocialiteProviders.com extend Socialite to 100+ providers (Okta, Slack, Discord, Twitch, etc.) but vary in maintenance quality. For critical auth flows, prefer first-party providers or well-maintained community ones.

---

## Recommended Default

**Default:** First-party providers for common social login (Google, GitHub, Facebook); community providers for niche providers
**Reason:** First-party providers have zero maintenance risk. Community providers are generally reliable for popular services but should be evaluated for maintenance activity before adoption.

---

## Risks Of Wrong Choice

- Community provider with no maintenance: breaks on Socialite API changes, no security patches
- Custom provider implementation: high development cost, must handle OAuth protocol edge cases
- First-party provider for unsupported service: impossible — must use community or custom
- Installing community package without checking: broken OAuth flow on production if package is outdated

---

## Related Rules

- Register All OAuth Providers in config/services.php (05-rules.md)
- Handle Provider Errors Gracefully With User-Facing Messages (05-rules.md)
- Maintain Password Fallback for Social Login Users (05-rules.md)

---

## Related Skills

- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)
