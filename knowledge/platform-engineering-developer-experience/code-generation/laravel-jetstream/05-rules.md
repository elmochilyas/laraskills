# Rules: Laravel Jetstream

## Metadata
- **Source KU:** laravel-jetstream
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- JET-RULE-001: **Scope queries to teams** — Always check `$user->currentTeam` and filter by `team_id` to prevent cross-team data access.
- JET-RULE-002: **Use Jetstream's action classes** — Bypassing CreateTeam, AddTeamMember, etc. breaks validation and side effects.
- JET-RULE-003: **Configure Sanctum for SPAs** — Set `SANCTUM_STATEFUL_DOMAINS` and CORS settings for Inertia stack API auth.
- JET-RULE-004: **Rate limit auth endpoints** — Login, 2FA verification, and invitation sending.
- JET-RULE-005: **Use database sessions** — `SESSION_DRIVER=database` enables session management features.
- JET-RULE-006: **Test team isolation** — Verify that users from different teams cannot access each other's data.

## Architecture Rules
- JET-RULE-007: **Mirror action class pattern** — Jetstream's pattern -> application code should follow same action/service pattern.
- JET-RULE-008: **Enforce team data isolation** — Middleware or global scopes on all team-scoped models.
- JET-RULE-009: **Customize through configuration** — `Jetstream::teams()` rather than modifying generated code.
- JET-RULE-010: **Extend generated code, don't modify** — Prevents update conflicts.

## Decision Rules
- JET-RULE-011: **Use for apps needing teams/workspaces out of the box** — Multi-tenant SaaS.
- JET-RULE-012: **Use when 2FA is required** for security compliance.
- JET-RULE-013: **Use Breeze instead** for simple apps needing only authentication.
- JET-RULE-014: **Use Fortify directly** for heavy custom auth flows without Jetstream's UI.
