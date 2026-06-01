# Multi-Tenant Authentication

## Objective

Define production-grade multi-tenant authentication architecture for Laravel SaaS applications, covering tenant isolation, tenant-aware sessions and tokens, cross-tenant protection, and identity architecture.

## Core Philosophy

Multi-tenant authentication must enforce strict tenant isolation at every layer. A user authenticated in one tenant must never be able to access another tenant's data. Tenant context must be established before any authorization decision.

## Architecture Standards

### Tenant Isolation Models

| Model | Database | Code | Complexity | Use Case |
|-------|----------|------|------------|----------|
| Single DB (Tenant Column) | Shared | `where tenant_id = ?` | Low | Simple SaaS, low compliance |
| Schema per Tenant | PostgreSQL schemas | `SET search_path` | Medium | Moderate scale, per-tenant compliance |
| Database per Tenant | Separate databases | Separate connections | High | Enterprise, strict isolation, high scale |

### Tenant Context Resolution

```php
// App\Services\TenantContext.php
class TenantContext
{
    private static ?Tenant $current = null;

    public static function set(Tenant $tenant): void
    {
        self::$current = $tenant;
    }

    public static function get(): ?Tenant
    {
        return self::$current;
    }

    public static function id(): ?string
    {
        return self::$current?->id;
    }

    public static function clear(): void
    {
        self::$current = null;
    }
}
```

### Tenant Middleware

```php
// App\Http\Middleware\IdentifyTenant.php
class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        // Strategy 1: Subdomain (tenant.example.com)
        $tenant = Tenant::findByDomain(explode('.', $request->getHost())[0]);

        // Strategy 2: Path prefix (example.com/{tenant})
        // $tenant = Tenant::findBySlug($request->segment(1));

        // Strategy 3: Header (for API)
        // $tenant = Tenant::find($request->header('X-Tenant-Id'));

        if (!$tenant || !$tenant->isActive()) {
            abort(404); // Don't reveal tenant existence
        }

        TenantContext::set($tenant);

        // Scope global queries
        $request->attributes->set('tenant_id', $tenant->id);

        return $next($request);
    }
}
```

### Tenant-Aware Authentication

```php
// App\Http\Middleware\TenantAuthentication.php
class TenantAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $tenant = TenantContext::get();

        if (!$user || !$tenant) {
            return $next($request);
        }

        // Verify user belongs to this tenant
        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->whereNull('deactivated_at')
            ->first();

        if (!$membership) {
            Auth::logout();
            abort(403, 'You do not have access to this tenant.');
        }

        // Attach tenant-specific role and permissions
        $request->attributes->set('tenant_role', $membership->role);
        $request->attributes->set('tenant_permissions', $membership->permissions);

        // Track last active tenant
        $user->update(['last_active_tenant_id' => $tenant->id]);

        return $next($request);
    }
}
```

### Tenant-Aware Sessions

```php
// config/session.php — always include tenant in session key
return [
    'cookie' => env('SESSION_COOKIE', 'laravel_session'),
    // For subdomain-based: cookie per tenant (automatic with subdomain)
    // For path-based: include tenant in cookie name
];

// Session binding
Session::put('tenant_id', $tenant->id);

// Validate session tenant on each request
if (Session::get('tenant_id') !== TenantContext::id()) {
    Session::invalidate();
    abort(419, 'Session tenant mismatch.');
}
```

### Tenant-Aware Tokens

```php
// Sanctum token creation with tenant binding
$token = $user->createToken(
    name: $request->input('device_name'),
    abilities: $tenantAbilities,
);

// Store tenant with token
$token->accessToken->forceFill([
    'tenant_id' => TenantContext::id(),
])->save();

// Token validation with tenant check
// app/Http/Middleware/ValidateTenantToken.php
class ValidateTenantToken
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->currentAccessToken()) {
            $tokenTenant = $request->user()->currentAccessToken()->tenant_id;
            $requestTenant = TenantContext::id();

            if ($tokenTenant !== $requestTenant) {
                return response()->json([
                    'message' => 'Token is not valid for this tenant.',
                ], 403);
            }
        }

        return $next($request);
    }
}
```

### Cross-Tenant Protection

```php
// Every service method must include tenant scope
// App\Services\DocumentService.php
class DocumentService
{
    public function listDocuments(User $user): Collection
    {
        return Document::where('tenant_id', TenantContext::id())
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('shares', fn ($q) => $q->where('user_id', $user->id));
            })
            ->get();
    }

    public function getDocument(User $user, string $documentId): Document
    {
        $document = Document::where('tenant_id', TenantContext::id())
            ->findOrFail($documentId);

        // Additional tenant-scoped authorization
        Gate::authorize('view', $document);

        return $document;
    }
}

// Global scope for tenant isolation
// App\Models\Scopes\TenantScope.php
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if ($tenantId = TenantContext::id()) {
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        }
    }
}

// Applied in model
#[ScopedBy(TenantScope::class)]
class Document extends Model {}
```

### Tenant Impersonation (Admin Feature)

```php
// App\Actions\TenantImpersonation.php
class TenantImpersonation
{
    public function impersonate(User $admin, Tenant $tenant, User $targetUser): void
    {
        // Verify admin has impersonation permission
        Gate::authorize('impersonate', [$tenant, $targetUser]);

        // Verify target belongs to tenant
        throw_unless(
            $targetUser->belongsToTenant($tenant),
            InvalidImpersonationException::class,
        );

        // Log impersonation start
        AuditLog::create([
            'actor_id' => $admin->id,
            'action' => 'impersonation.start',
            'target_id' => $targetUser->id,
            'metadata' => ['tenant_id' => $tenant->id],
        ]);

        // Start impersonation session
        Session::put('impersonator_id', $admin->id);
        Session::put('impersonated_id', $targetUser->id);
        Session::put('impersonated_tenant_id', $tenant->id);

        Auth::login($targetUser);
    }

    public function stopImpersonation(): void
    {
        $impersonatorId = Session::pull('impersonator_id');
        $targetId = Session::pull('impersonated_id');

        AuditLog::create([
            'action' => 'impersonation.end',
            'metadata' => [
                'impersonator_id' => $impersonatorId,
                'target_id' => $targetId,
            ],
        ]);

        Auth::loginUsingId($impersonatorId);
    }
}
```

### Tenant Switching

```php
// App\Http\Controllers\TenantSwitchController.php
class TenantSwitchController
{
    public function switch(SwitchTenantRequest $request): RedirectResponse
    {
        $tenant = Tenant::findOrFail($request->input('tenant_id'));

        // Verify user can access this tenant
        throw_unless(
            $request->user()->belongsToTenant($tenant),
            AuthorizationException::class,
        );

        // Regenerate session for tenant switch
        $request->session()->regenerate();

        // Store new tenant context
        Session::put('tenant_id', $tenant->id);

        // Update last active tenant
        $request->user()->update(['last_active_tenant_id' => $tenant->id]);

        return redirect()->intended('/dashboard');
    }
}
```

## SaaS Identity Architecture

### User Models

```
Option 1: Shared User + Tenant Membership (Recommended)
  users (global) ──> tenant_user (pivot with role) ──> tenants
  - One user across multiple tenants
  - Per-tenant roles and permissions
  - Works for B2B and B2C SaaS

Option 2: Separate User per Tenant
  tenant_1.users ──> schema per tenant
  - Full isolation
  - User must re-register per tenant
  - Works for white-label SaaS
```

### Registration Flow

```php
class TenantRegistrationFlow
{
    public function registerWithTenant(RegistrationDto $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $tenant = Tenant::create([
                'name' => $dto->companyName,
                'slug' => Str::slug($dto->companyName),
                'plan' => $dto->plan,
            ]);

            $user = User::create([
                'name' => $dto->name,
                'email' => $dto->email,
                'password' => Hash::make($dto->password),
            ]);

            $tenant->users()->attach($user, [
                'role' => 'owner',
            ]);

            event(new TenantCreated($tenant, $user));

            return $user;
        });
    }
}
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Forgetting tenant scope | Data leak across tenants | Global TenantScope on all models |
| Tenant ID from user input | Tenant switching attack | Resolve tenant from URL/domain/auth context |
| No tenant validation on login | Cross-tenant credential reuse | Verify user belongs to requested tenant |
| Shared cache keys | Cross-tenant cache poison | Prefix all caches with tenant ID |
| No tenant in audit log | Cannot trace cross-tenant actions | Always log tenant context |
| Global role bypasses tenant | Admin from tenant A accesses tenant B | Check tenant membership on every request |

## AI Coding Agent Rules

1. Every query must include tenant scope — never query without it
2. Tenant context must be resolved from secure sources (subdomain, path, header, auth)
3. Never accept tenant ID from user input that can override the resolved context
4. All cache keys must include tenant ID prefix
5. Session tenant must be validated on every request
6. API tokens must be bound to a specific tenant
7. Cross-tenant data access must be impossible at the query level
8. Tenant impersonation must be logged with full audit trail
9. Tenant switching must regenerate the session
10. Global scopes must be applied to all tenant-scoped models

## Production Checklist

- [ ] Tenant isolation model selected and implemented
- [ ] Global TenantScope applied to all tenant-scoped models
- [ ] Tenant middleware resolves and validates tenant on every request
- [ ] Tenant authentication middleware verifies user membership
- [ ] API tokens bound to tenant ID
- [ ] Cache keys prefixed with tenant ID
- [ ] Audit logs include tenant context
- [ ] Tenant switching endpoint secured and logged
- [ ] Impersonation feature (if any) logged with full audit trail
- [ ] Cross-tenant data leak tests cover all major features
