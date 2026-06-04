# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | WorkOS Enterprise SSO |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

WorkOS provides a managed enterprise SSO service that abstracts the complexity of connecting to multiple identity providers (Okta, Azure AD, OneLogin, Google Workspace). Instead of implementing SAML or OIDC integrations per customer IdP, WorkOS handles the IdP-specific variations and provides a unified API. WorkOS also offers directory sync (SCIM) for provisioning/deprovisioning users and groups, and audit trail logging. Integration in Laravel is via the `workos/workos-php` SDK or the `laravel-workos` community package.

---

## Core Concepts

- **WorkOS SSO**: Managed service that abstracts enterprise IdP connections. Your app connects to WorkOS; WorkOS connects to the customer's IdP.
- **IdP Connection**: Per-organization configuration linking WorkOS to the customer's SAML/OIDC provider. WorkOS handles metadata exchange.
- **Directory Sync (SCIM)**: Automatic user/group provisioning from the customer's IdP to your application via SCIM protocol.
- **WorkOS User**: The user object returned after successful SSO authentication — contains `id`, `email`, `firstName`, `lastName`, `organizationId`.
- **Organization**: A customer entity in WorkOS. Each organization has one or more IdP connections.

---

## When To Use

- Enterprise SaaS applications with multiple customers using different IdPs
- Reducing IdP integration maintenance (WorkOS handles variations)
- SCIM-based user provisioning (directory sync)
- Rapid addition of new enterprise SSO customers without per-IdP engineering

## When NOT To Use

- Consumer-facing social login (use Socialite)
- Single IdP integration where direct SAML/OIDC is simpler
- When WorkOS's pricing model does not fit the business (per-organization monthly cost)
- Applications with minimal enterprise SSO requirements (direct SAML/OIDC is cheaper)

---

## Best Practices

- **Unified User Matching**: Match WorkOS users by email — do not create duplicate accounts per IdP.
- **Organization Routing**: Use the WorkOS organization ID to scope data after SSO login.
- **Session After SSO**: After WorkOS authentication, create a local session/token for the application.
- **SCIM Hooks**: Handle directory sync webhooks (user.created, user.updated, user.deactivated, group.assigned).
- **Handle IdP Errors Gracefully**: WorkOS may return authentication errors if the customer's IdP is misconfigured.

---

## Architecture Guidelines

- Install `workos/workos-php` SDK via Composer
- Configure WorkOS API key and client ID in `.env`
- SSO flow: redirect to WorkOS → customer IdP login → WorkOS callback → local session creation
- Directory sync: register webhook endpoints for SCIM events → process user provisioning
- Organization context: store WorkOS `organization_id` on the User model for tenancy routing
- User matching: use `external_id` (WorkOS user ID) or email for linking

---

## Performance Considerations

- SSO redirect adds IdP authentication latency (typically 1-5 seconds for enterprise IdPs)
- WorkOS API calls for user info — cache WorkOS user data with short TTL
- Directory sync is event-driven (webhook) — no impact on request performance

---

## Security Considerations

- **WorkOS API Key**: Protect the API key — scoped to your WorkOS environment. Rotate if compromised.
- **Webhook Verification**: Verify WorkOS webhook signatures using the webhook secret. Do not process unverified webhooks.
- **Session Security**: After WorkOS SSO, create a proper Laravel session or token. Do not pass WorkOS tokens directly to the client.
- **SCIM Security**: SCIM webhooks contain sensitive user data — process over HTTPS only.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not matching users by email | Creating new user per SSO session | Duplicate user accounts per IdP | Match by email or WorkOS external_id |
| Passing WorkOS tokens directly to client | Convenience | Token exposure; missing local auth layer | Create local session/token after WorkOS auth |
| Not handling webhook verification | Skipping security setup | Processed attacker-forged webhooks | Verify webhook signatures |
| Ignoring directory sync events | Not implementing SCIM webhooks | User provisioning is manual | Handle SCIM user.created/updated/deactivated |

---

## Anti-Patterns

- **Creating a WorkOS account per user instead of organization**: WorkOS organizations map to customers, not individual users
- **Storing WorkOS API keys in version control**: Keys must be environment-specific
- **Direct IdP integration for every customer**: WorkOS is the abstraction — don't bypass it

---

## Examples

**SSO redirect:**
```php
use Workos\Workos;

$workos = new Workos(env('WORKOS_API_KEY'));
$authorizationUrl = $workos->sso->getAuthorizationUrl([
    'client_id' => env('WORKOS_CLIENT_ID'),
    'redirect_uri' => route('auth.workos.callback'),
    'connection' => $connectionId, // or 'organization' => $organizationId
]);

return redirect($authorizationUrl);
```

**SSO callback:**
```php
$profile = $workos->sso->getProfileAndToken([
    'client_id' => env('WORKOS_CLIENT_ID'),
    'code' => request()->query('code'),
]);

$workosUser = $profile['profile'];

// Match or create local user
$user = User::firstOrCreate([
    'email' => $workosUser['email'],
], [
    'name' => $workosUser['firstName'] . ' ' . $workosUser['lastName'],
    'workos_id' => $workosUser['id'],
    'organization_id' => $workosUser['organization_id'],
]);

Auth::login($user);
```

---

## Related Topics

- SAML 2.0 SSO
- OIDC integration
- Socialite OAuth client
- Multi-tenancy security
- SCIM protocol

---

## AI Agent Notes

- WorkOS is a commercial service — evaluate pricing against the cost of maintaining direct IdP integrations.
- For SaaS companies with 5+ enterprise customers, WorkOS typically saves engineering time vs direct SAML/OIDC.
- Directory sync (SCIM) is a key differentiator — WorkOS handles IdP-specific SCIM variations.

---

## Verification

- [ ] WorkOS SDK installed and configured
- [ ] API key and client ID stored in `.env` (not version controlled)
- [ ] SSO redirect and callback flow implemented
- [ ] Users matched by email or WorkOS external_id
- [ ] Local session/token created after WorkOS auth (not WorkOS token passthrough)
- [ ] Webhook endpoints registered for directory sync events
- [ ] Webhook signature verification implemented
- [ ] Organization context handled after authentication
- [ ] Error handling for IdP misconfiguration or WorkOS API errors
