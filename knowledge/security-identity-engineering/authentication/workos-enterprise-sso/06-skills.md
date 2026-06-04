# Skill: Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On

## Purpose
Connect Laravel applications to WorkOS managed SSO service to support enterprise single sign-on across multiple identity providers (Okta, Azure AD, OneLogin, Google Workspace) through a unified API.

## When To Use
- Enterprise SaaS supporting multiple customer IdPs
- Reducing SAML/OIDC integration maintenance per customer
- Needing directory sync (SCIM) for automatic user provisioning
- Starting enterprise SSO without building per-IdP integrations

## When NOT To Use
- Single IdP with straightforward SAML/OIDC (direct integration is simpler)
- Consumer-facing social login (use Socialite)
- Applications where WorkOS cost (per-connection pricing) is not justified
- When data residency requires on-premise IdP integration

## Prerequisites
- WorkOS account and API key (from WorkOS dashboard)
- `composer require workos/workos-php` or `laravel-workos` community package
- Customer IdP connections configured in WorkOS dashboard
- HTTPS endpoints for SSO callbacks

## Inputs
- WorkOS API key and client ID
- Organization-specific IdP connection IDs
- Redirect URI for SSO callback
- User matching strategy (email-based)

## Workflow (numbered)
1. Install WorkOS PHP SDK: `composer require workos/workos-php`
2. Configure WorkOS API key and client ID in `config/services.php`
3. Create SSO redirect route: redirect user to WorkOS authorization URL with connection ID
4. Create SSO callback route: exchange code for profile via WorkOS API
5. Match or create local user by email from WorkOS profile
6. Create local session (not pass WorkOS token to client)
7. Implement organization-based access control using WorkOS organization ID
8. Set up directory sync webhook endpoint for SCIM provisioning/deprovisioning
9. Verify webhook signatures for security (WorkOS signs webhook payloads with API key)

## Validation Checklist
- [ ] WorkOS API key and client ID configured in services config
- [ ] SSO redirect route generates correct WorkOS authorization URL
- [ ] SSO callback route exchanges code for user profile
- [ ] Users matched by email, not by IdP-specific ID
- [ ] Local session/token created (WorkOS token not leaked to client)
- [ ] Directory sync webhook endpoint configured with signature verification
- [ ] Organization ID used for access control and data isolation

## Common Failures
- Matching users by IdP-specific ID instead of email (duplicate accounts across IdPs)
- Passing WorkOS token directly to client (security risk — exposes WorkOS API scope)
- Not verifying webhook signatures (accepting forged SCIM events)
- Not handling IdP connection changes (customer switches IdP — existing user records should persist)

## Decision Points
- **User matching strategy**: Match by email (preferred) or WorkOS external_id
- **Directory sync**: Enable SCIM for automatic user provisioning; manual for smaller deployments
- **Organization structure**: Each customer gets one WorkOS organization; map to local tenant

## Performance Considerations
- SSO redirect adds IdP latency (user authenticates at IdP)
- Token exchange: one WorkOS API call per authentication
- Directory sync: webhook-based, no polling overhead
- No persistent overhead after authentication

## Security Considerations
- WorkOS token must not be passed to client — create local session/token
- Verify webhook signatures to prevent forged SCIM events
- Email matching across IdPs prevents duplicate accounts
- Log all SSO authentication and directory sync events for audit trail
- WorkOS handles IdP certificate management and metadata exchange

## Related Rules (from 05-rules.md)
- Match WorkOS Users by Email Across IdPs
- Create Local Session/Token After WorkOS Auth
- Verify Webhook Signatures on Directory Sync Endpoints
- Log WorkOS SSO and Directory Sync Events for Audit
- Handle IdP Connection Changes Gracefully

## Related Skills
- Implement SAML 2.0 SSO
- Integrate OpenID Connect (OIDC) SSO
- Configure Socialite OAuth Client Authentication
- Configure Multi-Tenancy (Stancl Tenancy)

## Success Criteria
- Users authenticate via their corporate IdP through WorkOS
- Single user record maintained across different IdPs (matched by email)
- Local session created after WorkOS authentication (no WorkOS token leaked)
- Directory sync provisions and deprovisions users automatically
- Webhook signatures verified on all SCIM endpoints
- Organization ID used for data isolation
- IdP connection changes handled without data loss
