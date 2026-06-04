# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Never Use Jetstream for New Laravel Projects

## Category

Framework Usage

## Rule

Never install `laravel/jetstream` for a new Laravel project (Laravel 12/13+). Use the stack-specific Starter Kits instead. Jetstream is deprecated for new development.

## Reason

Jetstream has been superseded by stack-specific Starter Kits (React, Vue, Svelte, Livewire) that provide the canonical Fortify + Sanctum + Passkeys stack without the overhead of teams management and API token UI. Jetstream receives no new feature development. New projects using Jetstream inherit legacy scaffolding with unnecessary complexity.

## Bad Example

```bash
composer create-project laravel/laravel new-app
composer require laravel/jetstream
php artisan jetstream:install livewire
```

## Good Example

```bash
composer create-project laravel/laravel new-app
php artisan install:api
php artisan install:livewire
```

## Exceptions

Existing Laravel 11.x applications already using Jetstream may continue until the next major version upgrade, at which point migration to Starter Kits should be planned.

## Consequences Of Violation

Maintenance: Legacy package with no future updates. Security: No security patch support for deprecated package. Performance: Unnecessary teams overhead.

---

## Rule Name

Never Use Jetstream Teams for Multi-Tenancy

## Category

Architecture

## Rule

Do not use Jetstream's `Team` model for multi-tenant data isolation. Jetstream teams are collaborative groups, not tenant isolation boundaries.

## Reason

Jetstream's teams feature (owner, admin, editor, viewer roles) is designed for collaborative access within a single application — like project teams in a project management tool. It does NOT provide tenant-level data isolation: scoped database connections, row-level tenant filtering, or cross-tenant data separation. Using Jetstream teams for multi-tenancy creates data leakage vulnerabilities.

## Bad Example

```php
// Treating Jetstream teams as tenant isolation
$team = Team::find($teamId);
$users = $team->allUsers();
// No tenant scoping — cross-tenant data accessible
```

## Good Example

```php
// Use dedicated multi-tenancy package
use Stancl\Tenancy\Database\Models\Tenant;

$tenant = Tenant::find($tenantId);
$tenant->run(function () {
    // Scoped to tenant database
});
```

## Exceptions

Internal collaboration tools where team boundaries are informational rather than security-critical (no sensitive data isolation required).

## Consequences Of Violation

Security: Cross-tenant data leakage and unauthorized access. Compliance: Fails data isolation requirements for regulated data.

---

## Rule Name

Extract Team and API Token Features During Jetstream Migration

## Category

Maintainability

## Rule

When migrating from Jetstream to Starter Kits, build separate implementations for teams management and API token UI. Never expect Starter Kits to provide these features.

## Reason

Starter Kits deliberately exclude teams management and API token management UI — these are not part of the canonical auth stack. Jetstream's teams feature was tightly coupled to the `Jetstream\Jetstream` class and custom migration logic is required. API token management can be rebuilt using Sanctum's `HasApiTokens` trait.

## Bad Example

```php
// Expecting Starter Kits to have teams
// Checking for Jetstream features that don't exist
if (class_exists('Laravel\Jetstream\Jetstream')) {
    // Teams logic — never reached after migration
}
```

## Good Example

```php
// Custom teams implementation after migration
use App\Models\Team;

public function createTeam(array $data): Team
{
    return Team::create([
        'name' => $data['name'],
        'owner_id' => auth()->id(),
    ]);
}

// Custom API tokens using Sanctum
use Laravel\Sanctum\HasApiTokens;
```

## Exceptions

Projects that did not use Jetstream's teams or API token features — the migration is a pure simplification and no replacement is needed.

## Consequences Of Violation

Maintenance: Blocked migration waiting for "feature parity" that is not coming. Security: Unmaintained legacy Jetstream code continues in production.

---

## Rule Name

Keep Fortify and Sanctum Configuration Patterns When Migrating from Jetstream

## Category

Architecture

## Rule

When migrating from Jetstream to Starter Kits, preserve the Fortify action classes and Sanctum configuration. These patterns transfer directly and do not need reimplementation.

## Reason

Jetstream and Starter Kits both use Fortify for backend authentication and Sanctum for SPA/token auth. The Fortify action classes (`App\Actions\Fortify\CreateNewUser`, `UpdateUserPassword`, etc.) and Sanctum configuration (`config/sanctum.php`) are identical in both systems. Rewriting them during migration introduces unnecessary risk of regression.

## Bad Example

```php
// Rewriting existing Fortify actions during migration
// App\Actions\Fortify\CreateNewUser.php deleted and recreated
class CreateNewUser implements CreatesNewUsers
{
    // Logic duplicated, potential regression
}
```

## Good Example

```php
// Fortify actions unchanged during migration
// App\Actions\Fortify\CreateNewUser.php remains exactly as-is
```

## Exceptions

Fortify actions that reference Jetstream-specific classes or helpers (e.g., `Jetstream::managesProfilePhotos()`) must be updated to remove those dependencies.

## Consequences Of Violation

Maintenance: Unnecessary rework and regression risk. Reliability: Authentication behavior may differ after migration.

---

## Rule Name

Never Store Sensitive Data in Jetstream Team Metadata

## Category

Security

## Rule

Do not use Jetstream team properties or custom attributes to store sensitive information (PII, credentials, configuration secrets). Treat team data as non-isolated collaborative data.

## Reason

Jetstream teams provide no data encryption at rest for custom properties, no tenant-level access controls, and no audit logging for team data access. Any user with sufficient role permissions can read team attributes. Sensitive data in team metadata is exposed to all team members with appropriate roles and is not audited.

## Bad Example

```php
// Storing sensitive configuration in team metadata
$team->update([
    'api_key' => $externalServiceApiKey,
    'webhook_secret' => $webhookSecret,
]);
```

## Good Example

```php
// Store sensitive data in encrypted, access-controlled storage
use Illuminate\Support\Facades\Crypt;

$encrypted = Crypt::encryptString($externalServiceApiKey);
// Store in a dedicated, audited configuration table
```

## Exceptions

No common exceptions. Jetstream team properties are not suitable for sensitive data storage at any security level.

## Consequences Of Violation

Security: Sensitive data exposed to unauthorized team members. Compliance: Fails encryption-at-rest and access control requirements.

---

## Rule Name

Do Not Expect Jetstream Features in Starter Kits

## Category

Architecture

## Rule

When moving from Jetstream to Starter Kits, audit your codebase for Jetstream-specific feature dependencies (teams, API token management UI, profile photos, account deletion) before migration. Never assume these will be available.

## Reason

Starter Kits provide only the canonical auth stack: login, registration, password reset, email verification, passkey registration, 2FA, and profile management. Jetstream-specific features — teams invitations, team roles, API token creation/revocation UI, connected Socialite accounts, terms/privacy policy pages, profile photos — are not included. Code referencing `Jetstream::` or `JetstreamFeatures::` must be refactored.

## Bad Example

```php
// Code that will break after migration
use Laravel\Jetstream\Jetstream;
use Laravel\Jetstream\Features;

if (Features::hasApiFeatures()) {
    // This check always returns false after migration
}

if (Jetstream::hasTeamFeatures()) {
    // Jetstream class no longer exists
}
```

## Good Example

```php
// Feature check after migration — build your own
if (config('app.features.api_tokens')) {
    // Custom API token implementation
}

if (config('app.features.teams')) {
    // Custom teams implementation
}
```

## Exceptions

Projects that used Jetstream only for its core auth stack (login, register, 2FA) and did not enable teams, API, or Socialite features. These projects can migrate without feature replacement.

## Consequences Of Violation

Reliability: Broken feature checks after migration. Maintenance: Unexpected missing functionality blocks deployment.
