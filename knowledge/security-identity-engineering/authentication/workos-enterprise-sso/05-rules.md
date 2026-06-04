# Rules: WorkOS Enterprise SSO

## Match WorkOS Users by Email Across IdPs
---
## Category
Architecture
---
## Rule
Match WorkOS-authenticated users by email address or WorkOS `external_id`. Do not create separate user records per IdP connection.
---
## Reason
A user may authenticate through different IdPs across sessions (Okta at work, Google Workspace at home) or the organization may switch IdPs. Matching by email ensures a single user record regardless of which IdP they used. Per-IdP user records cause data fragmentation and poor UX.
---
## Bad Example
```php
// Creates new user per IdP — duplicates
User::create(['email' => $workosUser['email'], 'workos_id' => $workosUser['id']]);
```
---
## Good Example
```php
// Match by email — single user record across IdPs
$user = User::firstOrCreate(
    ['email' => $workosUser['email']],
    ['name' => $workosUser['firstName'], 'workos_id' => $workosUser['id']]
);
```
---
## Exceptions
Applications where email is not unique across tenants (multi-tenant with non-unique emails).
---
## Consequences Of Violation
Duplicate user accounts, data fragmentation across IdP connections.
---

## Create Local Session/Token After WorkOS Auth
---
## Category
Security
---
## Rule
After successful WorkOS SSO authentication, create a proper Laravel session or API token. Never pass the WorkOS token directly to the client.
---
## Reason
The WorkOS token is scoped to WorkOS's API, not your application. Passing it to the client exposes it to XSS and leaks authentication material that could be used against WorkOS APIs. A local session or token maintains auth within your application's security boundary.
---
## Bad Example
```php
// WorkOS token returned to client — security risk
return response()->json(['workos_token' => $workosToken]);
```
---
## Good Example
```php
$profile = $workos->sso->getProfileAndToken([...]);
Auth::login($user); // Local Laravel session
$token = $user->createToken('sso-session')->plainTextToken; // Local API token
```
---
## Exceptions
No common exceptions — always create a local auth context.
---
## Consequences Of Violation
WorkOS token exposure, XSS vulnerability, token leakage.
---

## Verify WorkOS Webhook Signatures
---
## Category
Security
---
## Rule
Validate the signature on every incoming WorkOS webhook using the configured webhook secret before processing the payload.
---
## Reason
WorkOS webhooks deliver sensitive data (user provisioning, directory sync events). Without signature verification, any attacker can send forged webhooks to your endpoint, triggering unauthorized user creation, deactivation, or data changes.
---
## Bad Example
```php
// Webhook processed without signature verification
public function handleWebhook(Request $request) {
    $payload = $request->all(); // Unverified — could be forged
}
```
---
## Good Example
```php
public function handleWebhook(Request $request) {
    $signature = $request->header('workos-signature');
    $webhook->verifySignature($payload, $signature, env('WORKOS_WEBHOOK_SECRET'));
    // Process only after verification
}
```
---
## Exceptions
No common exceptions — webhook verification is mandatory.
---
## Consequences Of Violation
Forged webhooks cause unauthorized user provisioning/deactivation.
---

## Handle SCIM Directory Sync Webhooks for User Provisioning
---
## Category
Reliability
---
## Rule
Implement webhook handlers for SCIM directory sync events (`user.created`, `user.updated`, `user.deactivated`) to automate user provisioning and deprovisioning.
---
## Reason
SCIM sync ensures user accounts are automatically created, updated, and deactivated based on the customer's IdP directory. Without SCIM handling, user provisioning is manual, out of sync with the customer's HR system, and deactivated users retain access.
---
## Bad Example
```php
// SCIM events ignored — manual user management only
// Deactivated users in IdP still have active accounts
```
---
## Good Example
```php
[WorkOS\Webhooks::USER_CREATED => CreateUser::class,
 WorkOS\Webhooks::USER_DEACTIVATED => DeactivateUser::class,
 WorkOS\Webhooks::USER_UPDATED => UpdateUser::class];
```
---
## Exceptions
Applications not using directory sync (WorkOS SSO only, no SCIM).
---
## Consequences Of Violation
Stale user accounts, deactivated users retain access, manual provisioning burden.
---

## Store WorkOS API Keys in Environment Variables, Never in Code
---
## Category
Security
---
## Rule
Store the WorkOS API key and client ID in environment variables. Never commit them to version control or hardcode them in application code.
---
## Reason
The WorkOS API key provides access to your WorkOS environment and all connected IdP configurations. A committed key exposes enterprise SSO infrastructure to anyone with repository access. Environment variables keep keys environment-specific and out of version control.
---
## Bad Example
```php
// API key hardcoded in config
$workos = new Workos('sk_example_api_key_12345');
```
---
## Good Example
```php
// .env file
WORKOS_API_KEY=sk_example_key
WORKOS_CLIENT_ID=client_123

// config/workos.php
'api_key' => env('WORKOS_API_KEY'),
```
---
## Exceptions
No common exceptions — API keys belong in environment variables.
---
## Consequences Of Violation
API key exposure, enterprise SSO infrastructure compromised.
---

## Scope Data by Organization ID After SSO Login
---
## Category
Architecture
---
## Rule
Store the WorkOS `organization_id` on the User model and use it to scope all tenant-specific data access after SSO login.
---
## Reason
WorkOS organizations represent customer entities. Users from different organizations must not see each other's data. The `organization_id` links the authenticated user to their organization's data boundary, enabling proper multi-tenant data isolation.
---
## Bad Example
```php
// Organization not stored — no tenant isolation
Auth::login($user); // Missing organization context
```
---
## Good Example
```php
$user = User::firstOrCreate(['email' => $workosUser['email']], [
    'organization_id' => $workosUser['organization_id'],
]);
tenancy()->initialize($user->organization_id); // Scope all queries
```
---
## Exceptions
Single-tenant applications where WorkOS is used without multi-tenancy.
---
## Consequences Of Violation
Cross-organization data leakage, broken tenant isolation.
---

## Handle IdP Misconfiguration Errors Gracefully
---
## Category
Reliability
---
## Rule
Catch and handle WorkOS authentication errors caused by customer IdP misconfiguration. Present a clear error message suggesting the customer contact their IT admin.
---
## Reason
Enterprise SSO failures are often caused by customer-side IdP misconfiguration (expired certificate, wrong metadata, disabled user). Without handling, users see a generic 500 error and cannot resolve the issue. Clear error messages direct the right party to fix the problem.
---
## Bad Example
```php
// Raw exception propagates — user sees 500
$profile = $workos->sso->getProfileAndToken([...]);
```
---
## Good Example
```php
try {
    $profile = $workos->sso->getProfileAndToken([...]);
} catch (\Workos\Exception\AuthenticationException $e) {
    return redirect('/login')->with('error', 'SSO configuration issue. Please contact your IT administrator.');
}
```
---
## Exceptions
No common exceptions — IdP errors are expected in enterprise SSO.
---
## Consequences Of Violation
Poor user experience, support tickets for non-application issues.
