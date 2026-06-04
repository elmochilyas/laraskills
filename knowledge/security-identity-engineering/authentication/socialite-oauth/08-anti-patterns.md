# Anti-Patterns: Socialite OAuth1/OAuth2 Client

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Socialite OAuth1/OAuth2 Client |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SO-01 | Stateful Mode for API OAuth | High | High | Low |
| AP-SO-02 | Unguarded OAuth Error Handling | High | High | Low |
| AP-SO-03 | Unverified Email Trust | Critical | Medium | Medium |
| AP-SO-04 | Scalar Provider Storage | Medium | High | High |
| AP-SO-05 | Social Login as Sole Auth Method | Critical | Medium | High |

---

## Repository-Wide Anti-Patterns

- **Hardcoded Provider Credentials**: Embedding client IDs and secrets in controllers or routes
- **Missing Token Storage**: Discarding provider access/refresh tokens that could be used for API calls
- **Community Provider Without Maintenance Check**: Installing community providers without verifying maintenance activity

---

## 1. Stateful Mode for API OAuth

### Category
Architecture · Reliability

### Description
Using Socialite's default stateful session mode for OAuth authentication from an API, SPA, or mobile context that cannot maintain server-side sessions, causing `InvalidStateException` on the callback.

### Why It Happens
Socialite's default behavior is stateful — it stores the OAuth `state` parameter in the session and validates it on callback. Developers copy examples from server-rendered Blade applications without considering the architectural context. The `->stateless()` method is easy to overlook, and the error only surfaces during callback, not during the initial redirect.

### Warning Signs
- Socialite callback consistently throws `InvalidStateException`
- OAuth flow works in server-rendered pages but fails from API endpoints
- Callback is handled on a different server or container than the redirect
- No session persistence between the redirect and callback requests

### Why Harmful
The OAuth flow is completely broken for API clients, SPAs, and mobile apps — users cannot authenticate via social login from any non-server-rendered context. The application appears to support social login, but it only works for traditional full-page requests, limiting the application's architecture to server-rendered only.

### Real-World Consequences
- Mobile app users cannot sign in with Google — the only option is email/password
- SPA users get `InvalidStateException` when trying social login
- Developers spend hours debugging session config and cookie settings before discovering the missing `stateless()` call
- Workaround: redirecting to a server-rendered page specifically for OAuth (architectural hack)

### Preferred Alternative
Call `->stateless()` on the Socialite driver when authenticating from any context without server-side session support.

### Refactoring Strategy
1. Identify all Socialite callbacks that handle API, SPA, or mobile OAuth flows
2. Add `->stateless()` to the redirect call: `Socialite::driver('google')->stateless()->redirect()`
3. For API callbacks, implement alternative CSRF protection (PKCE or custom state management)
4. Test the OAuth flow from the API/SPA/mobile context
5. Remove any workaround code that bypassed Socialite's callback

### Detection Checklist
- [ ] Does the Socialite redirect call use `->stateless()` for API/SPA/mobile routes?
- [ ] Are API OAuth callbacks throwing `InvalidStateException`?
- [ ] Is there a server session available at the callback endpoint?
- [ ] Are OAuth redirect and callback on the same server/container?
- [ ] Do SPA/mobile users have functional social login?

### Related Rules/Skills/Trees
- Use Stateless Mode for API/OAuth Authentication (05-rules.md)
- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)
- Stateful vs Stateless Socialite Mode decision tree (07-decision-trees.md)

---

## 2. Unguarded OAuth Error Handling

### Category
Reliability · User Experience

### Description
Failing to wrap Socialite's callback in a try-catch block, exposing users to a 500 error page when the OAuth provider returns an error, denies permissions, or encounters a network failure.

### Why It Happens
Examples in documentation often show the happy path only: `$user = Socialite::driver('google')->user()`. Developers treat OAuth as reliable and forget that providers can return errors, users can deny permissions, or redirect URIs can mismatch. Error handling feels like scaffolding that can be added later — but it's often forgotten until production.

### Warning Signs
- Socialite callback controller has no try-catch block
- Users report "broken Google login" with no error message
- Logs show uncaught `InvalidArgumentException`, `AuthorizationDeniedException`, or `ProviderException`
- `/login` page shows 500 error when testing "Deny" flow from provider

### Why Harmful
When a user denies permissions or the provider has an outage, the application returns a generic 500 error page. The user has no explanation, no recovery path, and cannot attempt another login method. This creates a zero-recovery failure scenario for the primary onboarding flow.

### Real-World Consequences
- User denies Facebook permissions — sees 500 error, assumes the app is broken
- Provider redirect URI mismatch — 500 error with no indication of the cause
- User tries to register but hits provider error — abandons registration entirely
- Customer support flooded with "signup is broken" tickets

### Preferred Alternative
Wrap the Socialite callback in a try-catch that redirects users back to login with a clear, user-facing error message.

### Refactoring Strategy
1. Wrap `Socialite::driver('google')->user()` in a try-catch block
2. Catch `\Exception` or more specific Socialite exception classes
3. Log the exception details for debugging
4. Redirect the user to the login page with a session flash message
5. Ensure the error message is user-friendly ("Could not sign in with Google. Please try again.")

### Detection Checklist
- [ ] Does the callback controller have a try-catch around the Socialite `user()` call?
- [ ] Are users redirected to a friendly page on OAuth failure?
- [ ] Are OAuth errors logged for debugging?
- [ ] Does the application handle the "user denied permissions" scenario?
- [ ] Is there a user-facing error message on the redirected page?

### Related Rules/Skills/Trees
- Handle Provider Errors Gracefully With User-Facing Messages (05-rules.md)
- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)

---

## 3. Unverified Email Trust

### Category
Security · Critical

### Description
Accepting the email address returned by an OAuth provider without checking the provider's `email_verified` or `user_verified` flag, allowing users to create accounts with email addresses they do not control.

### Why It Happens
OAuth providers like Google and Apple return verified emails by default, so developers assume all providers do the same. The `email_verified` field is nested in the provider's user object and easy to miss. Many tutorials show `$socialUser->getEmail()` without mentioning verification status.

### Warning Signs
- Socialite callback creates users with `$socialUser->getEmail()` without any verification check
- The `email_verified_at` column is always populated for social login users
- No code references `$socialUser->user['email_verified']` or similar provider-specific fields
- Users can register with any email address by signing up with an unverified OAuth provider account

### Why Harmful
If a provider returns an unverified email (some providers do), a malicious user can create an OAuth provider account with someone else's email, log into your application, and hijack the victim's existing account or create a new account under the victim's identity. This bypasses your email verification system entirely.

### Real-World Consequences
- Attacker creates a Google account with victim@company.com (if Google allows), logs into app, hijacks victim's existing account
- Spam accounts created with unverified provider emails — moderation overhead
- Audit shows users with unverified email addresses bypassing email verification policy
- Compliance violation if email verification is required by regulation (financial, healthcare)

### Preferred Alternative
Always check the provider's email verification status before accepting the email. For unverified emails, require additional verification or deny registration.

### Refactoring Strategy
1. Add email verification check after `Socialite::driver('google')->user()`
2. Check provider-specific verification flags (`email_verified`, `user_verified`)
3. For unverified emails: deny automatic account creation, redirect to a verification flow
4. For existing account linking: only link by verified email, not by unverified email
5. Log unverified email attempts for security monitoring

### Detection Checklist
- [ ] Does the Socialite callback check `email_verified` before trusting the provider email?
- [ ] Can users register with a provider that returns unverified emails?
- [ ] Are provider emails marked as `email_verified_at` only when the provider confirms verification?
- [ ] Is there a fallback verification flow for unverified provider emails?
- [ ] Are provider-specific verification fields documented per provider?

### Related Rules/Skills/Trees
- Verify Provider-Reported Email Verification Status (05-rules.md)
- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)
- Account Linking Strategy decision tree (07-decision-trees.md)

---

## 4. Scalar Provider Storage

### Category
Architecture · Maintainability

### Description
Storing OAuth provider IDs (Google ID, Facebook ID) as individual columns on the `users` table instead of using a `social_accounts` pivot table.

### Why It Happens
The simplest approach is to add a `google_id` column to the `users` table. For the first provider, this seems clean and straightforward. When a second provider (Facebook, GitHub) is added, another column is appended. The pattern continues until the users table is cluttered with provider-specific columns, and adding a new provider requires a migration.

### Warning Signs
- `users` table has columns like `google_id`, `facebook_id`, `github_id`, `apple_id`
- Adding a new OAuth provider requires a database migration
- Users cannot link more than one account from the same provider
- Provider-related columns are NULL for most users (sparse table)

### Why Harmful
This design does not scale. Each new provider requires a schema change. Users cannot link multiple accounts from the same provider (e.g., two Google accounts). The users table becomes cluttered with sparse provider columns. Disconnecting a provider leaves NULL columns. The database schema becomes tightly coupled to the current set of supported providers.

### Real-World Consequences
- Adding Twitter login requires a migration and deployment
- Cannot support a user linking both a work and personal Google account
- User table has 8 NULL provider columns for every user — schema bloat
- Refactoring from scalar columns to pivot table requires data migration and application changes
- Developer onboarding friction: "Why does the users table have all these provider columns?"

### Preferred Alternative
Use a `social_accounts` pivot table with `user_id`, `provider`, `provider_id`, `token`, and `refresh_token` columns.

### Refactoring Strategy
1. Create a `social_accounts` migration with `user_id`, `provider`, `provider_id`, `token`, `refresh_token`
2. Create a `SocialAccount` model with `belongsTo(User::class)` relationship
3. Add `hasMany(SocialAccount::class)` to the User model
4. Write a data migration to move existing provider data from users table to social_accounts
5. Drop the provider-specific columns from users table
6. Update Socialite callback code to use the pivot table
7. Implement a provider-agnostic account linking method

### Detection Checklist
- [ ] Are provider IDs stored as columns on the users table?
- [ ] Can users link more than one account from the same provider?
- [ ] Does adding a new provider require a schema migration?
- [ ] Is there a `social_accounts` table in the database?
- [ ] Are provider tokens stored alongside provider IDs in a scalable structure?

### Related Rules/Skills/Trees
- Use a Pivot Table for Multiple Linked Social Accounts (05-rules.md)
- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)
- Account Linking Strategy decision tree (07-decision-trees.md)

---

## 5. Social Login as Sole Auth Method

### Category
Reliability · Critical

### Description
Implementing social login as the only authentication method, with no email/password fallback, creating a single point of failure when the OAuth provider is unavailable.

### Why It Happens
Social login reduces registration friction — fewer fields, one-click signup. Developers optimize for onboarding velocity and assume OAuth providers are highly available. The "what if Google goes down?" question is dismissed as unlikely. Over time, the password reset flow, email login form, and local registration code are removed or never built.

### Warning Signs
- Login page has only social login buttons — no email/password form
- No password reset functionality exists in the application
- User model has no `password` column
- OAuth provider outage = total application lockout

### Why Harmful
OAuth providers experience outages, change API versions with breaking changes, or may ban your application. Users can lose access to their social account. Without a fallback, all users are locked out simultaneously. Account recovery is impossible without support intervention. The authentication system has a single point of failure — the third-party provider's availability.

### Real-World Consequences
- Google OAuth outage — 100% of users cannot log in for 4 hours
- Facebook API deprecation — all Facebook login users locked out, requiring emergency migration
- User loses access to their Google account — cannot access your application, no recovery path
- Business-critical operations halt because no user can authenticate
- Support team overwhelmed with "I can't log in" tickets during provider outage

### Preferred Alternative
Always offer email/password authentication as a fallback alongside social login. Social login should be additive, never the exclusive method.

### Refactoring Strategy
1. Add email/password registration and login forms alongside social login buttons
2. Add a `password` column to the users table (nullable — existing social users keep it null)
3. Implement password reset flow
4. For existing social-only users, prompt them to set a password on next login
5. Ensure all authentication-related features work with both auth methods
6. Document the fallback auth strategy for operations team

### Detection Checklist
- [ ] Is there an email/password login form on the application?
- [ ] Is there a password reset flow?
- [ ] Do users have a `password` column on the users table?
- [ ] Can an administrator create accounts without social login?
- [ ] What happens to authentication when the OAuth provider has an outage?

### Related Rules/Skills/Trees
- Maintain Password Fallback for Social Login Users (05-rules.md)
- Maintain Alternative Auth Methods — Never Make Social Login Sole Auth (05-rules.md)
- Configure Socialite OAuth Client for Social Login and Third-Party OAuth (06-skills.md)
- Account Linking Strategy decision tree (07-decision-trees.md)
