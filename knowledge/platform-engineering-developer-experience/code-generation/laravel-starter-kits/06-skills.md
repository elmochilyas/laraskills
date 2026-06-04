# Skill: Choose Laravel Starter Kit

## Purpose
Select the appropriate Laravel starter kit (Breeze, Jetstream, or none) and frontend stack based on project requirements for authentication, teams, API tokens, and team skills.

## When To Use
- Starting a new Laravel application
- Evaluating authentication and frontend needs before project setup
- Choosing between Breeze and Jetstream

## When NOT To Use
- Existing applications with established auth (don't re-install)
- API-only backends with no UI authentication
- Heavy custom auth flows that need Fortify directly

## Prerequisites
- Understanding of authentication requirements
- Knowledge of team frontend skills
- Knowledge of Jetstream features (teams, 2FA, API tokens)

## Inputs
- Project requirements document
- Team skill matrix

## Workflow

1. **Assess Auth Requirements:** Determine if the app needs: simple auth only (Breeze), teams/workspaces (Jetstream), 2FA (Jetstream), API tokens (Jetstream), or none (no starter kit).

2. **Evaluate Frontend Skills:** Match stack to team skills: Blade + Alpine for backend-heavy teams; Livewire for interactive UIs with minimal JS; React/Vue with Inertia for SPA-experienced teams.

3. **Choose Starter Kit:**
   - **Breeze:** Most new Laravel web apps needing auth but not teams/2FA
   - **Jetstream:** SaaS/multi-tenant apps requiring teams, 2FA, API tokens
   - **None:** API-only backends, microservices, custom auth implementations

4. **Select Frontend Stack:**
   - **Blade + Alpine:** Minimal JS, backend-driven templates
   - **Livewire (Volt):** Interactive UIs without writing JavaScript
   - **React + Inertia:** SPA-like with React skills
   - **Vue + Inertia:** SPA-like with Vue skills

5. **Prototype with Breeze (If Unsure):** Start with Breeze. Upgrade to Jetstream if teams become necessary (documented migration path exists).

## Validation Checklist

- [ ] Starter kit selected based on project requirements
- [ ] Stack matches team skills
- [ ] Prototype path documented (Breeze → Jetstream if needed)
- [ ] No starter kit for API-only projects
- [ ] Fortify considered for heavy custom auth

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Jetstream for simple project | Unnecessary complexity; Breeze would suffice |
| Breeze for multi-tenant app | Missing team/workspace features from day one |
| Wrong stack for team skills | Team struggles with unfamiliar frontend technology |
| Starter kit on existing app | Overwrites existing auth files |

## Decision Points

- **Choose kit based on needs** — Breeze for simple auth; Jetstream for teams/2FA/API tokens; none for API-only
- **Match stack to team skills** — Blade for backend-heavy; Livewire for interactive UIs; React/Vue for SPA experts
- **Extend, don't modify** — Keep generated code in designated directories
- **Use Fortify directly** for heavy custom auth without Jetstream's UI layers

## Performance/Security Considerations

- **Breeze is lighter:** Less code, fewer database tables, simpler maintenance
- **Jetstream has more surface area:** More models, migrations, and middleware to manage
- **Plan for customization:** Starter kits are starting points; most production apps need custom auth flows

## Related Rules

- KIT-RULE-001: Choose kit based on needs
- KIT-RULE-002: Match stack to team skills
- KIT-RULE-005: Plan for customization
- KIT-RULE-006: Start with Breeze for prototyping

## Related Skills

- Scaffold Laravel Authentication with Breeze
- Scaffold Laravel with Jetstream
- Create New Laravel Projects with the Installer

## Success Criteria

- Correct starter kit selected for project requirements
- Frontend stack matches team skills and preferences
- Application auth scaffolded with appropriate features (simple auth vs teams/2FA)
- Migration path documented if upgrading from Breeze to Jetstream later
