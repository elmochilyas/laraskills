# Laravel Jetstream (Fortify + Sanctum) — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Laravel Jetstream (Fortify + Sanctum — Legacy Context) |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Using Jetstream for New Laravel Projects
2. Using Jetstream Teams for Multi-Tenancy
3. Expecting Jetstream Features in Starter Kits
4. Storing Sensitive Data in Team Metadata
5. Not Migrating Fortify Actions During Migration

---

## Repository-Wide Anti-Patterns

- **Customizing Jetstream for tenant isolation**: Teams are collaborative groups, not tenant boundaries.
- **Staying on Jetstream indefinitely**: Deprecated package with no future updates.
- **Rewriting Fortify actions during migration**: Actions transfer directly to Starter Kits.
- **Expecting Starter Kits to have teams/API token UI**: These features are not included.

---

## Anti-Pattern 1: Using Jetstream for New Laravel Projects

### Category

Framework Usage

### Description

Installing `laravel/jetstream` on a new Laravel 12/13+ project instead of using the stack-specific Starter Kits.

### Why It Happens

Jetstream is a well-known package. Developers may not be aware it's been superseded by Starter Kits, or may assume the teams and API token features are essential.

### Warning Signs

- `composer.json` contains `laravel/jetstream` for a Laravel 12/13+ project
- Teams management is used but the application has no multi-tenant requirements
- API token management UI exists but no users or integrations need it
- Project was scaffolded with unnecessary features (teams, API tokens, Socialite)

### Why Harmful

Jetstream has been superseded by stack-specific Starter Kits (React, Vue, Svelte, Livewire) that provide the canonical Fortify + Sanctum + Passkeys stack without the overhead of teams management and API token UI. Jetstream receives no new feature development. New projects using Jetstream inherit legacy scaffolding with unnecessary complexity.

### Consequences

- Deprecated package with no future updates
- Unnecessary architectural weight (teams, API tokens)
- No support for new Laravel auth features (passkeys, WebAuthn)
- Migration effort to Starter Kits required eventually

### Alternative

Use the stack-specific Starter Kits. `php artisan install:livewire` provides the canonical auth stack without Jetstream's overhead.

### Refactoring Strategy

1. Remove Jetstream: `composer remove laravel/jetstream`
2. Install appropriate Starter Kit: `php artisan install:livewire`
3. Remove Jetstream-specific route references
4. Keep Fortify actions (they transfer directly)
5. Build custom teams/API token features only if actually needed

### Detection Checklist

- [ ] No `laravel/jetstream` in `composer.json` for Laravel 12/13+ projects
- [ ] New projects use `php artisan install:*` commands
- [ ] Teams and API token features are not present unless explicitly needed
- [ ] Auth stack is upgrade-safe via Fortify actions

### Related Rules

- Never Use Jetstream for New Laravel Projects (05-rules.md)

### Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md)

### Related Decision Trees

- Jetstream vs Starter Kit for New Projects (07-decision-trees.md)

---

## Anti-Pattern 2: Using Jetstream Teams for Multi-Tenancy

### Category

Architecture

### Description

Using Jetstream's built-in `Team` model and membership system to implement tenant-level data isolation.

### Why It Happens

Jetstream teams have roles (owner, admin, editor, viewer) and membership management, which looks like tenant isolation. The vocabulary overlap ("team") encourages misuse.

### Warning Signs

- Jetstream teams used to scope database queries
- Team membership treated as a security boundary for sensitive data
- No tenant-level database scoping or isolation
- Queries that forget to filter by team expose cross-tenant data

### Why Harmful

Jetstream's teams feature (owner, admin, editor, viewer roles) is designed for collaborative access within a single application — like project teams in a project management tool. It does NOT provide tenant-level data isolation: scoped database connections, row-level tenant filtering, or cross-tenant data separation. Using Jetstream teams for multi-tenancy creates data leakage vulnerabilities.

### Consequences

- Cross-tenant data leakage when queries forget membership checks
- No database-level tenant isolation
- Compliance failure — no data separation for regulated data
- Extremely difficult migration to proper multi-tenancy later

### Alternative

Use a dedicated multi-tenancy package like `stancl/tenancy` or `spatie/laravel-multitenancy` for tenant isolation. Use Jetstream teams only for collaborative groups within a single tenancy.

### Refactoring Strategy

1. Audit current team-scoped queries for data leakage
2. Replace Jetstream teams with a dedicated multi-tenancy package
3. Add global tenant scopes to models
4. Implement proper tenant-level database isolation
5. Remove Jetstream team membership as a security boundary

### Detection Checklist

- [ ] Jetstream teams are not used for tenant data isolation
- [ ] Tenant isolation uses a dedicated multi-tenancy package
- [ ] Database-level scoping prevents cross-tenant data leakage
- [ ] Jetstream teams (if used) are for collaborative groups only
- [ ] No sensitive data isolation depends on team membership checks

### Related Rules

- Never Use Jetstream Teams for Multi-Tenancy (05-rules.md)

### Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md)

### Related Decision Trees

- Jetstream Teams vs Multi-Tenancy Package (07-decision-trees.md)

---

## Anti-Pattern 3: Expecting Jetstream Features in Starter Kits

### Category

Architecture

### Description

Assuming that Laravel's current Starter Kits include Jetstream features like teams management, API token UI, Socialite integration, and profile photos.

### Why It Happens

Developers migrating from Jetstream or reading old documentation may expect feature parity. They look for `Jetstream::hasTeamFeatures()` equivalents and find nothing.

### Warning Signs

- Code references `Laravel\Jetstream\Jetstream` after migration
- `Features::hasApiFeatures()` or `Features::hasTeamFeatures()` calls exist
- Missing teams page, API token management UI after migration
- Team-related static calls (`Jetstream::`) used throughout the codebase

### Why Harmful

Starter Kits deliberately exclude teams management, API token management UI, Socialite integration, and profile photo management. They provide only the canonical auth stack. Code referencing `Jetstream::` or `JetstreamFeatures::` must be refactored. Expecting these features to exist blocks migration or causes runtime errors when the Jetstream class is not found.

### Consequences

- Migration blocked waiting for features that are not coming
- Runtime errors from missing Jetstream class references
- Prolonged use of deprecated Jetstream code
- Unnecessary complexity from unused Jetstream features carried forward

### Alternative

Audit the codebase for Jetstream-specific feature dependencies before migration. Build custom implementations for teams, API tokens, and Socialite if actually needed.

### Refactoring Strategy

1. Search codebase for `Jetstream::`, `Features::`, and `Laravel\Jetstream` references
2. Replace team features with custom implementation (or Spatie Permission)
3. Replace API token UI with custom Sanctum-based implementation
4. Remove Jetstream-specific feature checks (replace with config checks)
5. Verify no runtime errors after Jetstream package removal

### Detection Checklist

- [ ] No `Laravel\Jetstream` namespace references in application code
- [ ] No `Jetstream::` static calls
- [ ] No `Features::has*` checks for Jetstream-specific features
- [ ] Teams and API token features (if needed) have custom implementations
- [ ] Migration from Jetstream is complete without missing features

### Related Rules

- Do Not Expect Jetstream Features in Starter Kits (05-rules.md)

### Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md)

### Related Decision Trees

- Jetstream vs Starter Kit for New Projects (07-decision-trees.md)

---

## Anti-Pattern 4: Storing Sensitive Data in Team Metadata

### Category

Security

### Description

Storing API keys, credentials, PII, or other sensitive configuration data in Jetstream team custom attributes or properties.

### Why It Happens

The team model is convenient — it has dynamic attributes and is easily accessible. Developers may store per-team configuration in the team record without considering security implications.

### Warning Signs

- Team model stores API keys, webhook secrets, or tokens
- Sensitive PII in team custom attributes
- No encryption at rest for team property values
- Team data accessible to all members with appropriate roles

### Why Harmful

Jetstream teams provide no data encryption at rest for custom properties, no tenant-level access controls, and no audit logging for team data access. Any user with sufficient role permissions can read team attributes. Sensitive data in team metadata is exposed to all team members with appropriate roles and is not audited.

### Consequences

- API keys and credentials exposed to unauthorized team members
- Sensitive data stored without encryption at rest
- No audit log for access to sensitive team data
- Compliance violation for unencrypted sensitive data storage

### Alternative

Store sensitive data in encrypted, access-controlled storage. Use dedicated configuration tables with encryption at rest.

### Refactoring Strategy

1. Identify sensitive data stored in team properties
2. Move to encrypted storage (Laravel `Crypt::encryptString()`)
3. Implement access control for sensitive data retrieval
4. Add audit logging for sensitive data access
5. Remove sensitive data from team attributes

### Detection Checklist

- [ ] No API keys or secrets in team properties
- [ ] No PII in team custom attributes
- [ ] Sensitive data is encrypted at rest
- [ ] Access to sensitive data is logged
- [ ] Team members cannot see other teams' sensitive data

### Related Rules

- Never Store Sensitive Data in Jetstream Team Metadata (05-rules.md)

### Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md)

### Related Decision Trees

- Jetstream Teams vs Multi-Tenancy Package (07-decision-trees.md)

---

## Anti-Pattern 5: Not Migrating Fortify Actions During Jetstream Migration

### Category

Maintainability

### Description

Rewriting or deleting existing Fortify action classes during migration from Jetstream to Starter Kits, introducing unnecessary risk of regression.

### Why It Happens

Developers may think the entire Jetstream auth stack needs to be replaced. They rewrite Fortify actions that already work correctly.

### Warning Signs

- `App\Actions\Fortify\*` files are deleted and recreated during migration
- Registration workflow has regressions after migration
- Password update behavior changed after migration
- Custom logic from Fortify actions is lost

### Why Harmful

Jetstream and Starter Kits both use Fortify for backend authentication and Sanctum for SPA/token auth. The Fortify action classes (`App\Actions\Fortify\CreateNewUser`, `UpdateUserPassword`, etc.) and Sanctum configuration (`config/sanctum.php`) are identical in both systems. Rewriting them during migration introduces unnecessary risk of regression in the most critical application functionality — authentication.

### Consequences

- Unnecessary rework of working code
- Regression risk in authentication workflows
- Custom registration or password logic lost
- User-facing auth bugs after migration

### Alternative

Keep existing Fortify action classes unchanged during migration. Only update references to Jetstream-specific classes.

### Refactoring Strategy

1. Audit Fortify actions for Jetstream-specific references (`Jetstream::`)
2. Remove any Jetstream-specific code from actions
3. Keep all other Fortify action logic exactly as-is
4. Test all auth flows after migration (login, register, password reset, 2FA)

### Detection Checklist

- [ ] Fortify actions are preserved during Jetstream migration
- [ ] No authentication regressions after migration
- [ ] Custom registration/password logic still works
- [ ] Only Jetstream-specific references removed from actions
- [ ] Auth flows are tested end-to-end after migration

### Related Rules

- Keep Fortify and Sanctum Configuration Patterns When Migrating from Jetstream (05-rules.md)

### Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md)

### Related Decision Trees

- Jetstream vs Starter Kit for New Projects (07-decision-trees.md)
