# Rules: Golden Path / Paved Road Patterns

## Metadata
- **Source KU:** golden-path-paved-road-patterns
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- GP-RULE-001: **Design from developer pain points** — Interview developers about friction before designing paths. Paths without developer input solve wrong problems.
- GP-RULE-002: **Attract, don't enforce** — Make the path so easy and well-supported that developers naturally choose it. Monitor adoption rate as success metric.
- GP-RULE-003: **80/20 rule** — Cover 80% of use cases with the golden path. Provide escape hatches for the remaining 20%.
- GP-RULE-004: **Start small, expand on demand** — Begin with 2-3 highest-value paths. Each additional path increases maintenance burden.
- GP-RULE-005: **Default-optimized configuration** — Platform defaults work for 80% of use cases. Customization requires explicit opt-in.

## Architecture Rules
- GP-RULE-006: **Path definition** — Each golden path combines: template/project skeleton, CI pipeline config, deployment script, documentation/runbook, monitoring dashboard.
- GP-RULE-007: **Multi-channel discovery** — Expose paths through developer portal (Scaffolder), CLI commands, and documentation. CLI for speed, portal for discovery, README for reference.
- GP-RULE-008: **Path feedback loop** — Monitor usage (adoption rate, completion time, deviation frequency). Collect satisfaction scores. Close the loop within 2 weeks.
- GP-RULE-009: **Path versioning** — Version paths alongside the tools they integrate. A Laravel 11 path is distinct from Laravel 12.
- GP-RULE-010: **Path deprecation** — Notify users with migration guidance. Never remove a path without a documented migration path.

## Implementation Rules
- GP-RULE-011: **Test paths in CI** — Each path must have automated CI validating the full workflow. Scheduled CI runs catch breakage from Laravel version updates.
- GP-RULE-012: **Document escape hatches thoroughly** — For each decision point, document the standard choice, alternatives, when to use each, and tradeoffs.
- GP-RULE-013: **Full automation** — Paths must be fully automated from start to finish. No manual final steps ("then deploy manually").

## Security Rules
- GP-RULE-014: **Compliance encoding** — In regulated environments, paths encode compliance requirements (audit logging, encryption, access controls). Deviations require compliance review.
- GP-RULE-015: **Secure defaults** — Templates start with HTTPS enforcement, secure session config, proper CORS, rate limiting, input validation.
- GP-RULE-016: **No baked-in credentials** — Secrets injected at runtime via environment variables, secret managers, or CI/CD secrets.
- GP-RULE-017: **Pin dependency versions** — Templates pin versions and include vulnerability scanning. Security updates trigger path version bumps.

## Performance Rules
- GP-RULE-018: **Path execution under 5 minutes** — From path selection to working dev environment. Optimize template generation and dependency installation.

## Decision Rules
- GP-RULE-019: **3+ Laravel apps** with similar requirements justifies golden paths.
- GP-RULE-020: **< 5 developers** — too small to justify path creation and maintenance investment.
- GP-RULE-021: **Heterogeneous workflows** — golden paths add little value when few common patterns exist.

## Anti-Pattern Rules
- GP-RULE-022: **Avoid the Toll Road** — Escape hatches should be self-serve, not requiring platform team approval.
- GP-RULE-023: **Avoid the Dead End** — Paths must be fully automated. No manual final steps.
- GP-RULE-024: **Avoid the Bicycle Path** — Don't build paths for rarely occurring use cases. Measure usage before investing.
- GP-RULE-025: **Avoid the Rat's Nest** — Periodically review and streamline paths that have grown organically.
- GP-RULE-026: **Avoid the Hidden Path** — Invest in discovery and marketing (portal, CLI, team demos).

## AI Guidance Rules
- GP-RULE-027: Before recommending golden paths, understand current onboarding time, CI setup pain points, and how developers create new projects.
- GP-RULE-028: Never suggest enforcement before understanding developer needs. Always include escape hatch documentation.
- GP-RULE-029: Laravel's starter kits (Breeze, Jetstream) and Sail are themselves golden paths. Compose and customize existing paths rather than replacing them.
