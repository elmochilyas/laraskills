# 04-Standardized Knowledge: Laravel Jetstream

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-jetstream |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-breeze, laravel-starter-kits, laravel-installer |
| **Framework/Language** | Laravel, Jetstream, Livewire, React, Vue, Inertia, Tailwind CSS, Sanctum |

## Overview

Laravel Jetstream is a feature-rich application starter kit providing complete authentication scaffolding with advanced features: login, registration, email verification, two-factor authentication (TOTP), session management, API token management (via Sanctum), and team management with customizable roles/permissions. Built on Breeze's foundation, Jetstream offers two frontend stacks: Livewire (with Alpine.js) and Inertia (with React or Vue). It's designed for applications needing enterprise-ready auth from day one.

## Core Concepts

- **Two-Factor Authentication**: TOTP via QR code with recovery codes
- **Team Management**: create teams, invite members, manage roles (owner, admin, editor), switch contexts
- **API Token Management**: Sanctum-based token creation with named permissions
- **Session Management**: view and terminate active sessions across devices
- **Profile Management**: name, email, profile photo, account deletion
- **Role-Based Access Control**: predefined team roles with configurable permissions
- **Action Classes**: Jetstream uses action classes for complex operations (CreateTeam, AddTeamMember, etc.)

## When to Use

- Applications needing teams/workspaces out of the box
- Multi-tenant SaaS applications requiring team scoping
- Projects needing two-factor authentication for security compliance
- Applications with API-first architecture needing token management
- Products where team-based permissions are a core requirement

## When NOT to Use

- Simple applications needing only authentication (use Breeze)
- Projects where Jetstream's code volume (~80+ files) is disproportionate to needs
- Existing applications where Jetstream's file generation would overwrite custom code
- Applications where you want to choose a different authentication approach entirely

## Best Practices (WHY)

- **Scope queries to teams**: always check `$user->currentTeam` and filter by `team_id` to prevent cross-team data access
- **Use Jetstream's action classes**: bypassing CreateTeam, AddTeamMember, etc. breaks Jetstream's validation and side effects
- **Configure Sanctum for SPAs**: set `SANCTUM_STATEFUL_DOMAINS` and CORS settings for Inertia stack API auth
- **Rate limit auth endpoints**: add rate limiting on login, 2FA verification, and invitation sending
- **Use database sessions**: `SESSION_DRIVER=database` enables session management features
- **Test team isolation**: verify that users from different teams cannot access each other's data

## Architecture Guidelines

- Jetstream's action classes follow Laravel's action/service class pattern — mirror this in application code
- Enforce team data isolation with middleware or global scopes on all team-scoped models
- Customize through configuration (Jetstream::teams()) rather than modifying generated code
- Extend generated code (add new features), don't modify it directly (prevents update conflicts)
- For heavy custom auth flows, consider using Fortify directly instead of Jetstream's UI

## Performance Considerations

- Livewire components compile on first render — enable route/config caching
- Team membership queries should use eager loading to avoid N+1
- TOTP verification adds ~10-50ms per request when 2FA is active
- Session listing queries the sessions table — paginate for large user bases
- Jetstream adds ~80+ files to the project; this affects initial project size but not runtime

## Security Considerations

- Enforce team data isolation in all models — cross-team data access is a common vulnerability
- Configure Sanctum token expiry (`config/sanctum.php`) based on security requirements
- Enable `MustVerifyEmail` for production applications
- Rate limit: login attempts, 2FA code verification, invitation sending
- 2FA recovery codes should be saved by users; provide support recovery flow
- API tokens stored in SPA client code can be extracted — use short-lived tokens and HTTPS-only cookies

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Not scoping queries to teams | Cross-team data access | Forgetting team context | Data leakage | Always filter by currentTeam |
| Modifying generated components | Lost on re-install | Customizing generated files | Lost customizations | Extend, don't modify |
| Bypassing action classes | Direct DB manipulation without validation | Not knowing the pattern | Broken side effects | Use Jetstream action classes |
| No Sanctum SPA config | API auth broken for Inertia | Missing config | CORS/auth failures | Configure SANCTUM_STATEFUL_DOMAINS |
| Ignoring email verification | Invitations/notifications fail | Not enabling MustVerifyEmail | Broken email flows | Configure mail and enable verification |

## Anti-Patterns

- **Jetstream for Everything**: using Jetstream when only Breeze-level auth is needed adds unnecessary complexity
- **No Team Scoping**: building features without enforcing team boundaries defeats Jetstream's primary value
- **Direct Database Manipulation**: updating team membership or roles directly in DB instead of using actions
- **Over-Customization**: modifying Jetstream's core components instead of extending with new features
- **Ignoring Upgrade Path**: modifying generated files creates painful upgrade conflicts for future Laravel versions

## Examples

```bash
# Install with Livewire stack
laravel new my-app --jet --stack=livewire --teams --pest

# Install with Inertia + React
laravel new my-app --jet --stack=react --teams

# After installation
npm install && npm run build
php artisan migrate

# Configure team features in App\Providers\JetstreamServiceProvider
Jetstream::teamRoles([
    'admin' => 'Administrator',
    'editor' => 'Editor',
]);
```

## Related Topics

- laravel-breeze — minimal auth scaffolding
- laravel-starter-kits — comparison and selection
- laravel-installer — project creation tool
- stub-customization-laravel — customizing generated scaffolding

## AI Agent Notes

- Jetstream uses Sanctum for API auth — configure `SANCTUM_STATEFUL_DOMAINS` for SPA authentication
- Team roles are defined in `JetstreamServiceProvider` using policies and gates
- Action classes pattern (`App\Actions\Jetstream\CreateTeam`) was refined in Jetstream 5+ (Laravel 11)
- For multi-tenant apps, enforce team scoping at the query level using middleware or global scopes

## Verification

- [ ] Authentication works (login, register, password reset)
- [ ] Two-factor authentication (TOTP) setup and verification works
- [ ] Team creation, invitation, and role assignment work
- [ ] API tokens can be created, listed, and revoked
- [ ] Active sessions visible and can be terminated
- [ ] Team data isolation enforced (cross-team access blocked)
- [ ] Rate limiting configured on auth endpoints
- [ ] Email verification flow works (if enabled)
- [ ] Sanctum configured for SPA authentication (if Inertia stack)
- [ ] Session driver set to database for session management
