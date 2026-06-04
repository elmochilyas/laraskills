# Skill: Scaffold Laravel with Jetstream

## Purpose
Install and configure Laravel Jetstream for enterprise-ready authentication with teams, two-factor authentication, API token management, and session management.

## When To Use
- Applications needing teams/workspaces out of the box (multi-tenant SaaS)
- Production apps requiring two-factor authentication for security compliance
- Projects needing API token management via Sanctum
- Applications requiring session management across devices

## When NOT To Use
- Simple apps needing only authentication (use Breeze instead)
- API-only backends (no UI scaffolding needed)
- Heavy custom auth flows (use Fortify directly)

## Prerequisites
- Fresh Laravel application
- Composer and NPM installed
- Database configured

## Inputs
- Composer (for Jetstream package)
- Terminal (for artisan commands)

## Workflow

1. **Install Jetstream:** Run `composer require laravel/jetstream`.

2. **Choose Stack:** Run `php artisan jetstream:install livewire` or `jetstream:install inertia` (with `--teams` flag for team support).

3. **Enable Teams (If Needed):** Use `--teams` flag during install for team/workspace features. This generates team migration, Team model, membership pivot, and team-invitation system.

4. **Install NPM Dependencies:** Run `npm install && npm run build` to compile Tailwind CSS and Vite assets.

5. **Run Migrations:** Execute `php artisan migrate` to create Jetstream's tables (users, teams, team_user, team_invitations, personal_access_tokens, sessions).

6. **Configure Sanctum for SPAs:** Set `SANCTUM_STATEFUL_DOMAINS` in `.env` and configure CORS settings for Inertia stack API authentication.

7. **Configure Session Driver:** Set `SESSION_DRIVER=database` to enable session management features. Run session table migration if not already present.

8. **Rate Limit Auth Endpoints:** Add rate limiting on login, 2FA verification, and invitation sending endpoints.

## Validation Checklist

- [ ] Jetstream installed with correct stack and team support
- [ ] Team creation, invitation, and member management work
- [ ] Two-factor authentication setup works (QR code + recovery codes)
- [ ] API token creation and management function
- [ ] Session management shows active sessions
- [ ] Team data isolation verified (cross-team access blocked)
- [ ] Rate limiting configured on auth endpoints
- [ ] `MustVerifyEmail` enabled for production

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Cross-team data access | Missing team_id scoping on queries; use middleware or global scopes |
| Sanctum configuration missing | SPA authentication fails; configure `SANCTUM_STATEFUL_DOMAINS` |
| Session management not working | `SESSION_DRIVER` not set to `database` |

## Decision Points

- **Use for apps needing teams/workspaces** — Multi-tenant SaaS
- **Use when 2FA is required** for security compliance
- **Use Breeze instead** for simple apps needing only authentication
- **Use Fortify directly** for heavy custom auth flows without Jetstream's UI
- **Scope queries to teams** — Always check `$user->currentTeam` and filter by `team_id`

## Performance/Security Considerations

- **Team data isolation:** Middleware or global scopes on all team-scoped models
- **2FA:** Enforce for admin/privileged roles; optional for regular users
- **Rate limiting:** Login, 2FA verification, invitation sending
- **Session driver:** Must be database for session management features

## Related Rules

- JET-RULE-001: Scope queries to teams
- JET-RULE-002: Use Jetstream's action classes
- JET-RULE-003: Configure Sanctum for SPAs
- JET-RULE-004: Rate limit auth endpoints
- JET-RULE-006: Test team isolation

## Related Skills

- Scaffold Laravel Authentication with Breeze
- Choose Laravel Starter Kit
- Create New Laravel Projects with the Installer

## Success Criteria

- Teams, 2FA, API tokens, and session management all work correctly
- Team data is properly isolated (no cross-team access)
- Sanctum configured for SPA/API authentication
- Auth endpoints are rate-limited for production
