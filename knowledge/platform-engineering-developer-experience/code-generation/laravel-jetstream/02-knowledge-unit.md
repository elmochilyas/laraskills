# Knowledge Unit: Laravel Jetstream

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/laravel-jetstream
- **Maturity:** Mature
- **Related Technologies:** Laravel, Jetstream, Livewire, React, Vue, Inertia, Tailwind CSS, Sanctum, Two-Factor Auth, Teams

## Executive Summary

Laravel Jetstream is a feature-rich application starter kit that provides complete authentication scaffolding with advanced features: login, registration, email verification, two-factor authentication, session management, API token management (via Sanctum), and team management with customizable roles and permissions. Jetstream builds on Laravel Breeze's authentication foundation and adds enterprise-ready features. It uses Tailwind CSS for styling and offers two frontend stacks: Livewire (with Alpine.js) and Inertia (with React or Vue). Jetstream is designed for applications that need robust authentication and team features from the start—it eliminates the weeks of development required to build team management, invitation systems, and API authentication. It's installed via the Laravel Installer with `laravel new project --jet` or via Composer.

## Core Concepts

- **Two-Factor Authentication:** Time-based one-time password (TOTP) via QR code; users can enable/disable in profile settings with recovery codes
- **Team Management:** Create teams, invite members by email, manage team roles (owner, admin, editor), switch between personal and team contexts
- **API Token Management:** Full UI for creating Sanctum API tokens with named permissions (read, create, update, delete) for API authentication
- **Session Management:** View and terminate active sessions across devices with secure session revocation
- **Profile Management:** Update name, email, profile photo (via Gravatar or Laravolt), and delete account with confirmation
- **Role-Based Access Control:** Predefined team roles with configurable permissions; each role maps to specific abilities (can create projects, manage billing, etc.)
- **Browser Sessions:** List of active sessions with device information, IP address, and last active timestamp; ability to log out other sessions

## Mental Models

- **Jetstream as Enterprise Auth:** Jetstream provides what every "real" application needs—auth, teams, 2FA, API tokens—that's production-ready from day one
- **Jetstream as Feature Platform:** Beyond authentication, Jetstream's feature set (teams, API tokens, sessions) serves as the foundation for multi-tenant applications and API-first products
- **Jetstream as Reference Architecture:** The generated code demonstrates Laravel best practices: Livewire components for interactive UIs, Inertia pages for SPA-like experiences, form requests for validation, and policies for authorization

## Internal Mechanics

1. **Installation:** `composer require laravel/jetstream` → `php artisan jetstream:install [stack]` → publishes Livewire components or Inertia pages, configures Sanctum, sets up teams, compiles assets
2. **Stack Selection:** `jetstream:install livewire` (with Alpine.js) or `jetstream:install inertia` (with React/Vue); the stack choice determines the frontend technology
3. **Livewire Stack:** Authentication and team features are Livewire components in `App\Http\Livewire` with corresponding Blade views; Alpine.js adds interactivity (dropdown toggles, modals)
4. **Inertia Stack:** Features are Inertia page components in `resources/js/Pages` (React `.jsx` or Vue `.vue`) with Laravel controllers providing data
5. **Sanctum Integration:** Jetstream configures Laravel Sanctum for API token management, session management, and SPA authentication
6. **Team Model:** A `Team` model with `User` relationship (many-to-many via `team_user` pivot with role column) handles team membership and role assignments
7. **Actions/Service Classes:** Jetstream uses action classes (Laravel 10+ pattern) for complex operations: `CreateTeam`, `AddTeamMember`, `UpdateTeamMemberRole`, `RemoveTeamMember`, `DeleteTeam`

## Patterns

- **Team Scoping Pattern:** All team-related data is scoped to the current team; controllers check `$user->currentTeam` and filter models by team association
- **Invitation Workflow Pattern:** Team invitations create `TeamInvitation` records; invited users receive email notifications; the invitation is accepted or declined via dedicated Livewire/Inertia components
- **Profile Photo Pattern:** Jetstream uses Gravatar by default with Laravolt as a fallback; profile photos are managed via the `ProfilePhoto` trait on the User model
- **Two-Factor Setup Pattern:** Users enable 2FA via QR code (TOTP), generate recovery codes, and confirm with a verification code before activation
- **API Token Scoping Pattern:** Sanctum tokens are created with named abilities (e.g., `'create', 'read', 'update', 'delete'`); middleware checks token abilities on API routes

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Frontend stack | Livewire vs Inertia (React/Vue) | Livewire for server-rendered, backend-driven apps; Inertia for SPA-like experiences |
| Team model | Separate Team model vs User-based roles | Team model (Jetstream default) for multi-tenant apps; User-based roles for single-org apps |
| API authentication | Sanctum (Jetstream default) vs Passport vs custom | Sanctum for simple API auth and SPA; Passport for OAuth; custom for specialized needs |
| Profile photo | Gravatar vs Laravolt vs custom upload | Gravatar for simplicity; Laravolt for Gravatar fallback; custom upload for full control |
| Two-factor auth | TOTP (Jetstream default) vs SMS vs authenticator app | TOTP (no SMS gateway dependency, works offline) |

## Tradeoffs

- **Jetstream vs Breeze:** Jetstream includes teams, 2FA, and API tokens at the cost of additional complexity and generated code mass. Choose Breeze for simple applications that don't need these features; Jetstream when they're planned from the start.
- **Livewire vs Inertia:** Livewire keeps all logic in PHP (simpler for PHP developers) but has limitations for complex client-side state. Inertia provides true SPA experience but requires frontend framework expertise. Choose based on team composition.
- **Generated Code vs Understanding:** Jetstream generates a lot of code (team management, 2FA, API tokens) that's production-ready but may be opaque to new developers. Teams must understand the generated code to extend it effectively.

## Performance Considerations

- **Component Compilation:** Livewire components are compiled on first render; with proper caching (route:cache, config:cache), this overhead is minimal. Inertia pages are compiled once during `npm run build`.
- **Team Queries:** Jetstream's team management loads team membership data on many pages. Use eager loading (`$user->load('teams')`) to avoid N+1 queries. For apps with many teams, consider caching team membership.
- **Two-Factor Auth Overhead:** TOTP verification adds ~10-50ms overhead per request when 2FA is active (reading the secret, generating the expected code). This is negligible for most applications.
- **Session Management:** Session listing queries the `sessions` database table. For applications with millions of sessions, this query can become slow. Implement session pagination or cleanup as needed.

## Production Considerations

- **Team Data Isolation:** Enforce team-based data isolation in all models: add `team_id` foreign key to team-scoped models and use global scopes or query constraints to prevent cross-team data access.
- **Rate Limiting:** Add rate limiting on: login attempts (5 per minute), 2FA code verification, invitation sending (5 per hour), and API token creation.
- **Email Configuration:** Team invitations and 2FA backup codes rely on email delivery. Configure Laravel's mail system (Mailgun, SES, Postmark) before going live.
- **Session Driver:** Use database sessions (`SESSION_DRIVER=database`) for session management features to work correctly; file/cookie sessions may not properly track active sessions across devices.
- **Sanctum Token Expiry:** Configure Sanctum token expiry (`expiration` in config/sanctum.php) based on your security requirements. Shorter expiry for production; longer for development.

## Common Mistakes

- **Not scoping queries to teams:** Building features on top of Jetstream but forgetting to check `$user->currentTeam` or filter by `team_id`; users from one team see data from another team
- **Modifying Jetstream's generated components directly:** Customizing Jetstream's Livewire or Inertia components, then running `jetstream:install` again—customizations are overwritten
- **Ignoring Jetstream's action classes:** Jetstream uses action classes for complex operations; bypassing them by directly manipulating the database breaks Jetstream's validation and side effects
- **Not configuring Sanctum properly for SPAs:** Jetstream's Inertia stack needs Sanctum's SPA authentication configuration; forgetting `SANCTUM_STATEFUL_DOMAINS` or CORS settings breaks API authentication
- **Overlooking email verification requirements:** Jetstream's email verification is optional but assumed by many features (invitations, notifications); configure mail and enable `MustVerifyEmail`

## Failure Modes

- **Team Switching Corruption:** When a user switches teams in a Livewire request race condition, data may be processed in the wrong team context. Mitigate: use middleware to validate `currentTeam` on every request.
- **Invitation Email Delivery Failure:** Team invitations are sent via email; if mail delivery fails, the invitation is created but never received. Mitigate: show invitation URL in the UI as a fallback.
- **2FA Recovery Code Loss:** Users who enable 2FA and lose their recovery codes are locked out. Mitigate: encourage saving recovery codes during setup; provide a support-based recovery flow.
- **Sanctum Token Security Issue:** API tokens stored in client-side code (JavaScript SPAs) can be extracted from browser storage. Mitigate: use short-lived tokens, HTTPS-only cookies for SPA auth, and educate developers about token security.

## Ecosystem Usage

- **Laravel Documentation:** Jetstream is featured prominently in Laravel's authentication documentation as the recommended solution for advanced auth needs
- **Laravel Bootcamp:** The Chirper tutorial has a Jetstream version demonstrating team-aware application development
- **Laracasts:** The "Laravel Jetstream" series covers building applications on top of Jetstream's foundation
- **Spas/tall-stack:** The TALL stack (Tailwind, Alpine, Livewire, Laravel) community sees Jetstream as the canonical starter kit for TALL applications
- **Multi-Tenant SaaS:** Jetstream's team management is the foundation for many Laravel-based SaaS applications, with extensions for billing, subscription tiers, and plan-based feature gating

## Related Knowledge Units

- laravel-breeze
- laravel-starter-kits
- laravel-installer
- stub-customization-laravel

## Research Notes

- Jetstream was introduced in Laravel 8.x, replacing the earlier `laravel/ui` package and Laravel 7.x's Jetstream predecessor
- The action class pattern (`App\Actions\Jetstream\CreateTeam`) was refined in Jetstream 5+ for Laravel 11, following the framework's move toward action/service classes
- Jetstream's team roles system uses Laravel policies and gates; custom roles are defined in `App\Providers\JetstreamServiceProvider`
- The profile photo system integrates with Gravatar by default but can be replaced with file uploads via the `Jetstream::profilePhotos()` method
