# Enterprise Identity Management

## Objective

Define production-grade Enterprise Identity and Access Management (IAM) architecture for Laravel applications, covering identity governance, provisioning, directory services, SCIM, and integration with enterprise identity providers.

## Core Philosophy

Enterprise IAM is the backbone of organizational security. Identity must be managed as a critical business asset with governance, lifecycle management, and compliance. Every identity operation must be traceable and auditable.

## Architecture Standards

### IAM Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Identity Governance                       │
│  Policies ──> Reviews ──> Certifications ──> Remediations   │
├──────────────────────────────────────────────────────────────┤
│                  Identity Lifecycle                          │
│  Provision ──> Onboard ──> Maintain ──> Offboard ──> Audit  │
├────────────┬─────────────┬──────────────┬───────────────────┤
│  Directory │  AuthN      │  AuthZ       │  Federation        │
│  Services  │  Services   │  Services    │  Services          │
│ ─────────  │ ─────────   │ ─────────    │ ───────────         │
│ AD/LDAP    │ MFA/SSO     │ RBAC/ABAC    │ SAML/OIDC          │
│ Entra ID   │ Passwordless│ Policies     │ SCIM               │
│ Okta       │ WebAuthn    │ Permissions  │ Federation         │
└────────────┴─────────────┴──────────────┴───────────────────┘
```

### Identity Lifecycle

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐     ┌─────────┐
│ Request │ ──> │ Provision│ ──> │ Onboard  │ ──> │ Maintain  │ ──> │ Offboard│
└─────────┘     └──────────┘     └──────────┘     └───────────┘     └─────────┘
    │               │               │                │                 │
    │ HR System     │ Create        │ Welcome        │ Role            │ Deactivate
    │ Manager       │ Account       │ Email          │ Changes         │ Archive
    │ Approval      │ Assign Roles  │ Training       │ Permission      │ Purge
                      │                                │
                   ┌──┴──────────┐              ┌─────┴──────┐
                   │ SCIM Sync   │              │ Recertify  │
                   │ (automated) │              │ (quarterly)│
                   └─────────────┘              └────────────┘
```

## Identity Governance

### Access Certification

```php
// App\Services\AccessCertificationService.php
class AccessCertificationService
{
    public function createCertification(Campaign $campaign): void
    {
        $campaign->update(['status' => 'in_progress']);

        // Gather all active access
        $assignments = RoleUser::with('user', 'role')
            ->whereNull('deactivated_at')
            ->get()
            ->groupBy('user_id');

        foreach ($assignments as $userId => $roles) {
            CertificationItem::create([
                'campaign_id' => $campaign->id,
                'user_id' => $userId,
                'roles' => $roles->pluck('role.name')->toArray(),
                'status' => 'pending',
                'assigned_reviewer_id' => $this->getReviewer($userId),
            ]);
        }
    }

    public function certify(CertificationItem $item, User $reviewer, bool $approved, ?string $reason): void
    {
        $item->update([
            'status' => $approved ? 'certified' : 'revoked',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'reason' => $reason,
        ]);

        if (!$approved) {
            $this->revokeAccess($item->user, $item->roles);
        }

        AuditLog::create([
            'action' => $approved ? 'access.certified' : 'access.revoked',
            'actor_id' => $reviewer->id,
            'target_id' => $item->user_id,
            'metadata' => ['reason' => $reason],
        ]);
    }
}
```

### Provisioning (SCIM)

System for Cross-domain Identity Management (SCIM) enables automated user provisioning.

```php
// routes/api.php
Route::prefix('scim/v2')->group(function () {
    Route::apiResource('Users', ScimUserController::class);
    Route::apiResource('Groups', ScimGroupController::class);
    Route::post('/Users/.search', [ScimUserController::class, 'index']);
    Route::post('/Groups/.search', [ScimGroupController::class, 'index']);
    Route::get('/ServiceProviderConfig', [ScimConfigController::class, 'show']);
    Route::get('/Schemas', [ScimSchemaController::class, 'index']);
});

// App\Http\Controllers\Scim\ScimUserController.php
class ScimUserController
{
    public function store(Request $request): JsonResponse
    {
        $this->validateScimRequest($request);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'external_id' => $request->input('id'),
                'user_name' => $request->input('userName'),
                'name' => $request->input('name.formatted'),
                'email' => $request->input('emails.0.value'),
                'email_verified_at' => now(),
                'active' => $request->input('active', true),
                'password' => Hash::make(Str::random(32)),
            ]);

            // Map SCIM groups to local roles
            foreach ($request->input('groups', []) as $group) {
                if ($role = Role::where('external_id', $group['value'])->first()) {
                    $user->assignRole($role);
                }
            }

            return $user;
        });

        event(new UserProvisioned($user, $request->all()));

        return response()->json($this->formatScimUser($user), 201);
    }

    public function update(Request $request, string $userId): JsonResponse
    {
        $user = User::where('external_id', $userId)->firstOrFail();
        $user->update($request->only(['active', 'userName']));

        if ($request->has('active') && !$request->input('active')) {
            $user->tokens()->delete();
            $user->update(['password' => Hash::make(Str::random(32))]);
        }

        return response()->json($this->formatScimUser($user));
    }

    public function destroy(string $userId): JsonResponse
    {
        $user = User::where('external_id', $userId)->firstOrFail();
        $user->delete(); // Soft delete

        event(new UserDeprovisioned($user));

        return response()->json(null, 204);
    }

    private function formatScimUser(User $user): array
    {
        return [
            'schemas' => ['urn:ietf:params:scim:schemas:core:2.0:User'],
            'id' => $user->external_id,
            'userName' => $user->user_name,
            'name' => ['formatted' => $user->name],
            'emails' => [['value' => $user->email, 'primary' => true]],
            'active' => $user->active,
            'groups' => $user->roles->map(fn ($r) => [
                'value' => $r->external_id,
                'display' => $r->name,
            ])->toArray(),
            'meta' => [
                'resourceType' => 'User',
                'created' => $user->created_at->toIso8601String(),
                'lastModified' => $user->updated_at->toIso8601String(),
            ],
        ];
    }
}
```

### Deprovisioning

```php
// App\Actions\DeprovisionUser.php
class DeprovisionUser
{
    public function execute(User $user, string $reason): void
    {
        DB::transaction(function () use ($user, $reason) {
            // 1. Revoke all tokens
            $user->tokens()->delete();

            // 2. Remove all role assignments
            $user->roles()->detach();

            // 3. Invalidate all sessions
            DB::table('sessions')->where('user_id', $user->id)->delete();

            // 4. Update user status
            $user->update([
                'active' => false,
                'password' => Hash::make(Str::random(64)),
                'remember_token' => null,
                'deactivated_at' => now(),
                'deactivation_reason' => $reason,
            ]);

            // 5. Log deprovisioning
            AuditLog::create([
                'action' => 'user.deprovisioned',
                'target_id' => $user->id,
                'metadata' => ['reason' => $reason],
            ]);

            // 6. Notify relevant services
            event(new UserDeprovisioned($user));
        });
    }
}
```

## Directory Services

### LDAP/Active Directory Integration

```php
// config/ldap.php
return [
    'default' => env('LDAP_CONNECTION', 'default'),
    'connections' => [
        'default' => [
            'hosts' => [env('LDAP_HOST', 'ldap.example.com')],
            'username' => env('LDAP_USERNAME'),
            'password' => env('LDAP_PASSWORD'),
            'port' => env('LDAP_PORT', 389),
            'base_dn' => env('LDAP_BASE_DN', 'dc=example,dc=com'),
            'use_ssl' => env('LDAP_USE_SSL', false),
            'use_tls' => env('LDAP_USE_TLS', true),
            'timeout' => env('LDAP_TIMEOUT', 5),
        ],
    ],
];

// App\Services\LdapIdentityService.php
class LdapIdentityService
{
    public function authenticate(string $username, string $password): ?User
    {
        $ldapUser = $this->bindAndSearch($username, $password);

        if (!$ldapUser) {
            return null;
        }

        $user = User::updateOrCreate(
            ['email' => $ldapUser['mail'][0]],
            [
                'name' => $ldapUser['displayname'][0] ?? $ldapUser['cn'][0],
                'password' => Hash::make(Str::random(32)), // LDAP-managed
                'email_verified_at' => now(),
                'provider' => 'ldap',
                'provider_id' => $ldapUser['objectguid'][0] ?? $ldapUser['dn'],
            ]
        );

        // Sync groups to roles
        $this->syncLdapGroups($user, $ldapUser['memberof'] ?? []);

        return $user;
    }

    public function searchUsers(string $query): Collection
    {
        $connection = LDAP::connection();
        $results = $connection->search()
            ->in(config('ldap.connections.default.base_dn'))
            ->where('cn', 'contains', $query)
            ->orWhere('mail', 'contains', $query)
            ->get();

        return collect($results)->map(fn ($entry) => [
            'cn' => $entry['cn'][0] ?? null,
            'mail' => $entry['mail'][0] ?? null,
            'dn' => $entry['dn'],
        ]);
    }
}
```

### Entra ID (Azure AD) Integration

```php
// config/services.php
'azure' => [
    'client_id' => env('AZURE_CLIENT_ID'),
    'client_secret' => env('AZURE_CLIENT_SECRET'),
    'redirect' => env('AZURE_REDIRECT_URI'),
    'tenant_id' => env('AZURE_TENANT_ID'),
    'proxy' => env('AZURE_PROXY'),
    'scopes' => 'openid profile email User.Read Directory.Read.All',
];

// App\Services\AzureIdentityService.php
class AzureIdentityService
{
    private string $graphEndpoint = 'https://graph.microsoft.com/v1.0';

    public function syncUsers(): void
    {
        $users = $this->getGraphUsers();

        foreach ($users as $azureUser) {
            User::updateOrCreate(
                ['email' => $azureUser['userPrincipalName']],
                [
                    'name' => $azureUser['displayName'],
                    'external_id' => $azureUser['id'],
                    'email_verified_at' => now(),
                    'provider' => 'azure',
                    'active' => $azureUser['accountEnabled'],
                ]
            );
        }
    }

    public function syncGroups(): void
    {
        $groups = $this->getGraphGroups();

        foreach ($groups as $group) {
            Role::updateOrCreate(
                ['external_id' => $group['id']],
                [
                    'name' => Str::slug($group['displayName']),
                    'display_name' => $group['displayName'],
                    'description' => $group['description'] ?? null,
                ]
            );
        }
    }

    private function getGraphUsers(): array
    {
        $token = $this->getAccessToken();
        $response = Http::withToken($token)
            ->get("{$this->graphEndpoint}/users", [
                '$select' => 'id,displayName,userPrincipalName,accountEnabled',
                '$top' => 999,
            ]);

        return $response->json('value', []);
    }
}
```

### Okta Integration

```php
// App\Services\OktaIdentityService.php
class OktaIdentityService
{
    public function provisionUser(array $oktaUser): User
    {
        return DB::transaction(function () use ($oktaUser) {
            $user = User::create([
                'external_id' => $oktaUser['id'],
                'email' => $oktaUser['profile']['email'],
                'name' => $oktaUser['profile']['displayName'],
                'email_verified_at' => now(),
                'provider' => 'okta',
                'active' => $oktaUser['status'] === 'ACTIVE',
                'password' => Hash::make(Str::random(32)),
            ]);

            // Map Okta groups to roles
            foreach ($this->getOktaUserGroups($oktaUser['id']) as $group) {
                if ($role = Role::where('name', $group['profile']['name'])->first()) {
                    $user->assignRole($role);
                }
            }

            event(new UserProvisioned($user, $oktaUser));

            return $user;
        });
    }

    public function deprovisionUser(string $oktaUserId): void
    {
        $user = User::where('external_id', $oktaUserId)->first();

        if ($user) {
            app(DeprovisionUser::class)->execute(
                $user,
                'Deleted in Okta'
            );
        }
    }
}
```

### Keycloak Integration

```php
// config/services.php
'keycloak' => [
    'client_id' => env('KEYCLOAK_CLIENT_ID'),
    'client_secret' => env('KEYCLOAK_CLIENT_SECRET'),
    'redirect' => env('KEYCLOAK_REDIRECT_URI'),
    'base_url' => env('KEYCLOAK_BASE_URL'),
    'realm' => env('KEYCLOAK_REALM'),
    'scopes' => 'openid profile email',
];

// OIDC middleware for Keycloak token validation
// App\Http\Middleware\ValidateKeycloakToken.php
class ValidateKeycloakToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            // Validate against Keycloak's JWKS endpoint
            $publicKey = $this->getKeycloakPublicKey();
            $payload = JWT::decode($token, $publicKey, ['RS256']);

            // Validate realm roles
            $realmRoles = $payload->realm_access->roles ?? [];
            $request->attributes->set('keycloak_roles', $realmRoles);
            $request->attributes->set('keycloak_user_id', $payload->sub);

            // Find or provision the user
            $user = User::firstOrCreate(
                ['external_id' => $payload->sub],
                [
                    'email' => $payload->email,
                    'name' => $payload->name,
                    'email_verified_at' => now(),
                    'provider' => 'keycloak',
                    'password' => Hash::make(Str::random(32)),
                ]
            );

            Auth::setUser($user);

        } catch (\Exception $e) {
            Log::warning('Keycloak token validation failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid token.'], 401);
        }

        return $next($request);
    }
}
```

## Workforce vs Customer Identity

| Aspect | Workforce (Employee) | Customer (CIAM) |
|--------|---------------------|-----------------|
| IdP | Corporate AD/Entra ID/Okta | Social login, email/password |
| Provisioning | SCIM/HRIS sync | Self-registration |
| MFA | Mandatory, corporate policy | Optional or risk-based |
| SSO | SAML/OIDC mandated | Social login (Google, Apple) |
| Governance | Access certifications | Consent management |
| Directory | Centralized corporate directory | Per-tenant or shared |
| Compliance | SOX, HIPAA, SOC2 | GDPR, CCPA, PSD2 |
| Scale | Thousands | Millions |

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No deprovisioning process | Orphaned accounts for former employees | Automated deprovisioning on HR termination |
| Manual provisioning | Errors, delays, no audit trail | SCIM/automated provisioning |
| No access recertification | Privilege creep over time | Quarterly access certifications |
| No SCIM support | Cannot integrate with enterprise IdP | Implement SCIM 2.0 endpoints |
| Ignoring directory service | No centralized identity source | Integrate with AD/Entra ID/Okta/LDAP |
| Over-provisioning | Excessive default permissions | Least-privilege by default, request elevation |
| No separation of duties | Fraud and compliance violations | Enforce SoD policies programmatically |

## AI Coding Agent Rules

1. Implement SCIM 2.0 endpoints for automated provisioning and deprovisioning
2. Support multiple enterprise identity providers (Azure AD, Okta, Keycloak, LDAP)
3. Deprovisioning must revoke tokens, sessions, roles, and mark user as inactive
4. JIT (Just-In-Time) provisioning must be supported with role mapping from IdP groups
5. Access recertification workflows must be implementable
6. Log all identity lifecycle events for compliance audit
7. Support both workforce (enterprise SSO) and customer (CIAM) identity models
8. External ID (provider identifier) must be stored as the canonical reference
9. Provisioning hooks must fire events for downstream service synchronization
10. Handle identity conflicts (email already exists with different provider) gracefully

## Production Checklist

- [ ] SCIM 2.0 endpoints implemented (Users, Groups, Schemas, Config)
- [ ] Automated deprovisioning on identity source deletion
- [ ] LDAP/AD integration tested and documented
- [ ] Azure AD / Entra ID integration tested
- [ ] Okta integration tested
- [ ] Keycloak integration tested
- [ ] JIT provisioning with group-to-role mapping
- [ ] Access recertification workflow ready
- [ ] Identity lifecycle audit logging in place
- [ ] Separation of duties policies defined
- [ ] Workforce vs customer identity path documented
