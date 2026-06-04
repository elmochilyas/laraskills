# Anti-Patterns: WorkOS Enterprise SSO

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | WorkOS Enterprise SSO |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-WE-01 | Per-IdP User Duplication | High | Medium | Medium |
| AP-WE-02 | WorkOS Token Passthrough | Critical | Medium | Low |
| AP-WE-03 | Missing Webhook Signature Verification | Critical | Medium | Low |
| AP-WE-04 | SCIM Event Neglect | High | Medium | High |
| AP-WE-05 | Missing Organization Scoping | High | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Bypassing WorkOS for Direct IdP Integration**: Integrating directly with each customer's IdP instead of using WorkOS as the abstraction layer
- **Hardcoded WorkOS Credentials**: Committing API keys or client IDs to version control
- **Unhandled IdP Errors**: Not catching WorkOS authentication exceptions when customer IdPs are misconfigured

---

## 1. Per-IdP User Duplication

### Category
Architecture · Reliability

### Description
Creating separate user records for the same person based on which IdP they used to authenticate, instead of matching by email across all IdP connections.

### Why It Happens
The most natural matching strategy is to use the IdP-specific user ID or the WorkOS profile ID. Developers create a new user record on every authentication when `firstOrCreate` is keyed on the WorkOS `external_id` rather than the email. Since each IdP has a different `external_id` for the same person, the same user gets multiple records over time.

### Warning Signs
- User table has multiple records with the same email but different `workos_id` values
- Customer reports "I have two accounts" after switching IdPs
- `User::firstOrCreate(['workos_id' => ...])` is used instead of `['email' => ...]`
- A user who authenticates via Okta and later via Google Workspace sees different data
- Support team frequently merges duplicate user accounts

### Why Harmful
When a user authenticates through different IdPs (Okta at work, Google Workspace as contractor), or when a customer organization switches IdPs, the same person ends up with multiple user records. Data associated with one record is invisible to the other. The user sees different state depending on which IdP they used to log in. This creates a fragmented user experience and data integrity issues.

### Real-World Consequences
- User created via Okta has project data; next login via Azure AD creates a new empty account
- Customer switches from OneLogin to Okta — all existing user data is orphaned under old IdP records
- Support tickets: "I logged in but all my data is missing"
- Admin manually merges duplicate user accounts weekly
- Audit trail shows user activity split across multiple identities

### Preferred Alternative
Match users by email address or WorkOS `external_id` consistently. Use `firstOrCreate` keyed on email to ensure a single user record across all IdPs.

### Refactoring Strategy
1. Identify all duplicate user records (same email, different `workos_id`)
2. Merge duplicate records, keeping the earliest `created_at` and latest activity
3. Update the matching logic: `User::firstOrCreate(['email' => $workosUser['email']], ...)`
4. Add a unique index on the `email` column to prevent future duplicates
5. Update the `workos_id` on existing matches when a user authenticates via a different IdP
6. Write a one-time migration to clean up existing duplicates

### Detection Checklist
- [ ] Are users matched by email or by IdP-specific ID?
- [ ] Are there multiple user records with the same email?
- [ ] Is there a unique index on the email column?
- [ ] Does the user's data follow them when they switch IdPs?
- [ ] Is the WorkOS `organization_id` updated when a user authenticates via a new IdP?

### Related Rules/Skills/Trees
- Match WorkOS Users by Email Across IdPs (05-rules.md)
- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)

---

## 2. WorkOS Token Passthrough

### Category
Security · Critical

### Description
Returning the WorkOS access token to the client application after SSO authentication, exposing it to XSS attacks and leaking authentication material that could be used against WorkOS APIs.

### Why It Happens
The WorkOS token is immediately available after SSO callback — it seems natural to include it in the response for the client to use. Developers may think the WorkOS token is necessary for subsequent API calls, not realizing that a local session or token should be created instead.

### Warning Signs
- WorkOS callback returns the WorkOS token to the frontend
- Client-side code stores `workos_token` in localStorage or cookies
- Frontend sends `Authorization: Bearer <workos_token>` to local API endpoints
- No local Laravel session or Sanctum token is created after WorkOS callback
- WorkOS token is used for application-specific API authorization

### Why Harmful
The WorkOS token is scoped to WorkOS's API, not the application. Passing it to the client exposes it to XSS (if stored in localStorage), network interception, and leakage via client-side errors. An attacker with the WorkOS token can call WorkOS APIs to read organization data, enumerate users, and potentially access directory sync information. The token is also a persistent credential — unlike a session cookie, it doesn't expire with the browser session.

### Real-World Consequences
- XSS vulnerability leaks WorkOS token — attacker reads organization metadata
- Client-side error reporting service captures the WorkOS token in exception logs
- WorkOS token stored in localStorage persists after logout — next user on shared computer has SSO access
- Security penetration test flags "WorkOS token exposed to client" as critical finding
- WorkOS API key rotation required after token exposure incident

### Preferred Alternative
After WorkOS SSO callback, create a proper Laravel session or Sanctum token. Never expose the WorkOS token to the client.

### Refactoring Strategy
1. Remove any code that passes the WorkOS token to the client
2. After successful WorkOS callback, call `Auth::login($user)` for session-based auth
3. For API clients, create a Sanctum token: `$user->createToken('sso')->plainTextToken`
4. Update frontend to use the local session cookie or local API token
5. Clear any stored WorkOS tokens from client-side storage
6. Verify that the frontend can no longer access the WorkOS token

### Detection Checklist
- [ ] Is the WorkOS token returned to the client in any API response?
- [ ] Does the frontend store a `workos_token` in localStorage?
- [ ] Is a local Laravel session created after WorkOS authentication?
- [ ] Are API requests authenticated with local tokens, not WorkOS tokens?
- [ ] What happens to the WorkOS token after the callback?

### Related Rules/Skills/Trees
- Create Local Session/Token After WorkOS Auth (05-rules.md)
- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)
- SSO Auth Flow: Stateful vs Stateless decision tree (07-decision-trees.md)

---

## 3. Missing Webhook Signature Verification

### Category
Security · Critical

### Description
Processing WorkOS directory sync webhooks (SCIM events) without verifying the webhook signature, allowing attackers to forge webhook requests that create, modify, or deactivate users.

### Why It Happens
Setting up webhook signature verification requires extra steps — retrieving the webhook secret from the WorkOS dashboard, adding verification logic, and handling verification failures. Developers skip this during initial implementation to "get it working" and never come back to add security. The endpoint works without verification, so the omission goes unnoticed.

### Warning Signs
- WorkOS webhook handler accepts any POST request without signature validation
- No code references `workos-signature` header or webhook secret
- Webhook secret not present in `.env` or application configuration
- Anyone with knowledge of the webhook URL can send forged provisioning requests
- No logging of webhook verification status

### Why Harmful
Without signature verification, any attacker who discovers the webhook URL can send forged SCIM events. They can create unauthorized user accounts (provisioning access), modify existing user details (escalating privileges), or deactivate legitimate users (denial of service). SCIM events carry sensitive user data (names, emails, roles) which could be exfiltrated by sending forged "query" events if supported.

### Real-World Consequences
- Attacker sends `user.deactivated` webhook for the CEO's account — CEO locked out
- Forged `user.created` webhook creates 10,000 fake user accounts — database bloat, billing impact
- Attacker sends `user.updated` webhook changing a support user's role to admin
- Ransomware scenario: attacker deactivates all users via forged SCIM webhooks
- Compliance audit finds unverified webhooks — security violation

### Preferred Alternative
Always verify the WorkOS webhook signature using the webhook secret before processing any event.

### Refactoring Strategy
1. Get the webhook secret from the WorkOS dashboard
2. Add `WORKOS_WEBHOOK_SECRET` to `.env`
3. Implement signature verification using the WorkOS SDK's `Webhook::verifySignature()` method
4. Return 401 for requests with invalid signatures without processing
5. Log all webhook verification failures as security events
6. Add monitoring for repeated verification failures (possible attack)

### Detection Checklist
- [ ] Is the WorkOS webhook signature verified before processing?
- [ ] Is `WORKOS_WEBHOOK_SECRET` configured in `.env`?
- [ ] Does the webhook handler return 401 for invalid signatures?
- [ ] Are signature verification failures logged?
- [ ] Can a POST to the webhook URL with no signature create user accounts?

### Related Rules/Skills/Trees
- Verify WorkOS Webhook Signatures (05-rules.md)
- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)
- Directory Sync (SCIM) Enablement decision tree (07-decision-trees.md)

---

## 4. SCIM Event Neglect

### Category
Reliability · Maintainability

### Description
Not implementing handlers for WorkOS SCIM directory sync events (`user.created`, `user.updated`, `user.deactivated`), resulting in manual user provisioning and stale user accounts that retain access after deactivation.

### Why It Happens
SCIM webhook handling requires building and maintaining event processing infrastructure. Teams prioritize SSO authentication and postpone directory sync implementation. Since users can still authenticate via SSO (JIT provisioning), the missing SCIM integration is not immediately visible. The problem surfaces only when users who left the organization still have active accounts.

### Warning Signs
- WorkOS Directory Sync is enabled in the dashboard but no webhook endpoint exists
- User deactivation in the IdP does not deactivate the user in the application
- User accounts accumulate indefinitely with no deactivation mechanism
- Former employees have active accounts weeks after leaving
- Customer IT admin asks "Why don't user changes in Okta sync to your app?"

### Why Harmful
Without SCIM handler, user provisioning and deprovisioning are manual processes. When an employee leaves the organization and is deactivated in the company's IdP, their application account remains active. The former employee retains access to sensitive data, and there is no automated process to revoke it. This is a security risk and often a compliance violation.

### Real-World Consequences
- Former employee accesses customer data 3 months after leaving — security incident
- Compliance audit finds deprovisioning process is manual — fails SOC2/ISO 27001
- IT admin at customer company must manually request user deactivation via support
- New hires cannot access the application until IT manually creates their account
- Customer churn: "Your app doesn't integrate with our HR system for user provisioning"

### Preferred Alternative
Implement webhook handlers for all SCIM directory sync events (`user.created`, `user.updated`, `user.deactivated`, `group.assigned`).

### Refactoring Strategy
1. Create a webhook endpoint for WorkOS SCIM events
2. Implement handlers for SCIM event types: `user.created` (create account), `user.updated` (update details), `user.deactivated` (deactivate/suspend)
3. Implement `group.assigned` handler if group-based access control is needed
4. Add signature verification to the webhook endpoint
5. Test the full provisioning/deprovisioning lifecycle
6. Add monitoring and alerting for SCIM event processing failures

### Detection Checklist
- [ ] Is there a webhook endpoint for SCIM directory sync events?
- [ ] Are `user.deactivated` events handled to deactivate local accounts?
- [ ] Are `user.created` events handled to provision new accounts automatically?
- [ ] Are `user.updated` events handled to sync name, email, or role changes?
- [ ] Is there an ongoing process to handle users deactivated while the webhook was down?

### Related Rules/Skills/Trees
- Handle SCIM Directory Sync Webhooks for User Provisioning (05-rules.md)
- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)
- Directory Sync (SCIM) Enablement decision tree (07-decision-trees.md)

---

## 5. Missing Organization Scoping

### Category
Architecture · Security

### Description
Not storing the WorkOS `organization_id` on the User model and failing to scope data access by organization, allowing users from different customer organizations to see each other's data.

### Why It Happens
After SSO authentication, the immediate focus is on user login — creating the session, redirecting to the dashboard. The organization context from the WorkOS profile is easily overlooked. In single-tenant setups or during initial development, multi-tenant data isolation seems unnecessary. The organization scoping is deferred until "multi-tenancy is needed" — by which time data has already leaked.

### Warning Signs
- User model has no `organization_id` or `tenant_id` column
- Queries do not filter by organization after SSO login
- User A (from Org A) can see User B's data by guessing URLs
- No tenancy middleware or global scope for organization filtering
- WorkOS profile's `organization_id` is received but not stored

### Why Harmful
WorkOS organizations represent customer entities. Without organization scoping, User A from Customer Corp can see data belonging to User B from Acme Inc. This is a catastrophic data breach — Customer A's sensitive business data is exposed to Customer B. The SSO implementation authenticates the user but provides no authorization boundary between tenants.

### Real-World Consequences
- Support agent logs in via SSO — sees data from all customer organizations
- Customer A's invoices are visible to Customer B's user
- Data breach notification required due to cross-tenant data exposure
- Enterprise customer demands data isolation guarantee — cannot be provided
- Legal liability: contract violations for failing to maintain data separation
- Emergency project to implement multi-tenancy after customers discover the issue

### Preferred Alternative
Store the WorkOS `organization_id` on the User model and apply organization-scoped queries for all data access.

### Refactoring Strategy
1. Add an `organization_id` column to the users table
2. Store `$workosUser['organization_id']` when creating or matching users
3. Apply a global scope or middleware that filters all queries by the authenticated user's organization
4. Verify data isolation: User A from Org A should not see Org B's data
5. Add cross-tenant access tests to the test suite
6. Document the organization scoping strategy for future feature development

### Detection Checklist
- [ ] Does the User model have an `organization_id` column?
- [ ] Is `organization_id` populated during WorkOS SSO callback?
- [ ] Are all data queries scoped by organization?
- [ ] Can a user from Org A access data from Org B?
- [ ] Is there a global scope or middleware enforcing tenant isolation?

### Related Rules/Skills/Trees
- Scope Data by Organization ID After SSO Login (05-rules.md)
- Integrate WorkOS Enterprise SSO for Multi-IdP Single Sign-On (06-skills.md)
- Directory Sync (SCIM) Enablement decision tree (07-decision-trees.md)
