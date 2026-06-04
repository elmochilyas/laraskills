# Rules: Developer Portal Integration (Backstage)

## Metadata
- **Source KU:** developer-portal-integration-backstage
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- BACKSTAGE-RULE-001: **Scaffolder first** — Start with Backstage Scaffolder for self-service project creation before building custom plugins. Scaffolder provides the highest developer productivity value.
- BACKSTAGE-RULE-002: **catalog-info.yaml in every repo** — Make catalog registration part of project creation workflow. Auto-generate YAML with sensible defaults.
- BACKSTAGE-RULE-003: **TechDocs for documentation** — Use TechDocs as the lowest-effort, highest-value Backstage feature. Store ADRs, API docs, onboarding guides as Markdown in the repo.
- BACKSTAGE-RULE-004: **Integrate into existing workflows** — Don't require developers to visit Backstage. Surface information where developers already work (PR checks, CLI, notifications).

## Architecture Rules
- BACKSTAGE-RULE-005: **Self-host vs managed** — Self-host Backstage for deep customization (K8s + PostgreSQL). Use managed services (Roadie, Kion) for lower operational burden.
- BACKSTAGE-RULE-006: **Plugin architecture** — Frontend-only plugins for dashboards. Full plugins for scaffolder actions and external system integration.
- BACKSTAGE-RULE-007: **Auto-discovery for catalog** — Register existing repos via Git provider auto-discovery. CI auto-registration for new services.
- BACKSTAGE-RULE-008: **Upgrade cadence** — Backstage releases weekly. Establish regular upgrade cadence. Minimize UI customization to reduce upgrade pain.

## Implementation Rules
- BACKSTAGE-RULE-009: **Scaffolder templates must be parameterized** — Project name, PHP version, starter kit, database type, services. Actions: create repo, configure Forge, set up CI, register catalog.
- BACKSTAGE-RULE-010: **TechDocs CI pipeline** — Convert /docs folder Markdown to Backstage-compatible HTML via CI. Use mkdocs-material for optimization.
- BACKSTAGE-RULE-011: **Authentication via IdP** — Integrate with organization identity provider (GitHub OAuth, Okta, Azure AD) for SSO. RBAC for scaffolder and deployment actions.

## Security Rules
- BACKSTAGE-RULE-012: **OAuth2/OIDC/SAML** — Single sign-on required for all portal access.
- BACKSTAGE-RULE-013: **RBAC for actions** — Define who can scaffold projects, view health, trigger deployments. Use Backstage permission framework.
- BACKSTAGE-RULE-014: **Vet third-party plugins** — Backstage plugins run in same process space. Isolate untrusted plugins in separate instances.
- BACKSTAGE-RULE-015: **Secrets via Backstage secrets** — Scaffolder actions use Backstage secret management, not hardcoded credentials.

## Performance Rules
- BACKSTAGE-RULE-016: **Catalog handles thousands** — Performance issues arise from plugin backends making slow API calls, not Backstage itself.
- BACKSTAGE-RULE-017: **Scaffolder rendering under 2s** — Template rendering should complete in under 2 seconds. Long-running actions run asynchronously with progress updates.

## Decision Rules
- BACKSTAGE-RULE-018: **20+ Laravel services** to justify Backstage. Smaller orgs need simpler tools.
- BACKSTAGE-RULE-019: **No official Laravel Backstage plugin exists** — custom development required for deep integration.
- BACKSTAGE-RULE-020: **Laravel-only org** may benefit more from a custom dashboard than Backstage.

## Anti-Pattern Rules
- BACKSTAGE-RULE-021: **Avoid the Empty Portal** — Deploy Backstage only after meaningful content exists (catalog data, scaffolder templates, plugins).
- BACKSTAGE-RULE-022: **Avoid the Mandatory Portal** — If CLI or GitHub is faster, developers will bypass. Make the portal valuable, not mandatory.
- BACKSTAGE-RULE-023: **Avoid the Custom Plugin Graveyard** — Minimize custom plugin surface area. Use community plugins. Each custom plugin breaks on upgrades.

## AI Guidance Rules
- BACKSTAGE-RULE-024: Before recommending Backstage, assess team size, number of services, existing tooling, and specific discovery pain points.
- BACKSTAGE-RULE-025: Never recommend Backstage for teams under 20 developers or for Laravel-only organizations without clear discovery problems.
