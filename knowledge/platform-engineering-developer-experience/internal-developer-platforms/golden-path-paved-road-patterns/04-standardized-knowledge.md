# Experience Curation: Golden Path / Paved Road Patterns

## Metadata
- **KU ID:** internal-developer-platforms-idp/golden-path-paved-road-patterns
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** idp-architecture-patterns, self-service-environment-provisioning, internal-template-registries
- **Related Technologies:** Laravel Sail, Laravel Breeze, Laravel Jetstream, Forge, GitHub Actions, Backstage Scaffolder
- **Target Audience:** Platform engineers, Laravel team leads, developer experience teams

## Overview

Golden paths (or paved roads) are opinionated, well-documented, and tool-supported workflows that guide Laravel developers through common tasks while allowing flexibility for edge cases. Rather than enforcing a single way of working, golden paths provide a "happy path" that works out of the box—scaffolding a new project, adding authentication, setting up CI, deploying to staging—with clear documentation for when and how to deviate. The concept originated from Spotify's engineering culture and is central to platform engineering: the platform team maintains the paved road, and developers choose to stay on it for efficiency or leave it when necessary. The key insight is to attract developers through convenience and reliability rather than enforce through mandates.

## Core Concepts

- **The Golden Path:** A recommended, supported workflow for a specific developer task with all tooling, configuration, and documentation needed
- **Escape Hatch:** Documented alternatives when the golden path doesn't fit, ensuring the platform doesn't become a straitjacket
- **Paved Road vs Guardrails:** Paved roads make the right thing easy; guardrails prevent wrong things (e.g., CI blocks non-standard PHP versions)
- **Default-Optimized Configuration:** Platform defaults should work for 80% of use cases; customization requires explicit opt-in
- **The 80/20 Rule:** Cover 80% of use cases with the golden path; provide escape hatches for the 20%
- **The Decision Tree:** Each golden path is a decision tree; at each fork, the platform recommends an option and documents consequences of alternatives

## When To Use

- Team performs a task frequently (creating new projects, setting up CI, deploying) with consistent patterns
- Organization wants to standardize development practices across multiple teams
- Developer onboarding includes multiple repetitive steps that can be automated
- Platform team has capacity to create and maintain golden paths
- Organization has 3+ Laravel applications with similar requirements

## When NOT To Use

- Development workflows are highly heterogeneous with few common patterns
- Team is too small (< 5 developers) to justify the investment in path creation and maintenance
- Organizational standards are not yet established or change frequently
- Developers strongly prefer and are effective with ad-hoc workflows
- No dedicated platform engineering resources to maintain paths

## Best Practices (WHY)

1. **Design Paths from Developer Pain Points (Why):** Interview developers about their biggest friction points before designing golden paths. Paths designed without developer input solve the wrong problems. The most successful Laravel golden paths address environment setup time and CI/CD configuration complexity.

2. **Attract, Don't Enforce (Why):** Make the golden path so easy, fast, and well-supported that developers naturally choose it. Enforcement creates resentment and workarounds. Monitor adoption rate as the primary success metric—if developers aren't choosing the path, fix the path, not the enforcement.

3. **Start Small, Expand on Demand (Why):** Begin with 2-3 golden paths covering the most common workflows. Each additional path increases maintenance burden and fragments practices. Expand based on measured demand and developer requests, not assumptions.

4. **Test Paths in CI (Why):** Each golden path must have automated CI that validates the entire workflow end-to-end. A broken golden path erodes developer trust significantly more than the absence of a path. Scheduled CI runs catch breakage from Laravel version updates or package changes.

5. **Document Escape Hatches Thoroughly (Why):** For each decision point in a golden path, document the standard choice, alternative choices, when to use each, and the tradeoffs. This reduces support requests for the platform team and empowers developers to make informed decisions.

## Architecture Guidelines

- **Path Definition:** Each golden path combines: template/project skeleton, CI pipeline configuration, deployment script, documentation/runbook, and monitoring dashboard.
- **Path Discovery:** Expose paths through multiple channels: developer portal (Backstage scaffolder), CLI commands, and documentation. CLI for speed, portal for discovery, README for reference.
- **Path Execution:** Automate the full sequence: scaffold project → configure services → set up CI → provision environments → deploy → register in service catalog.
- **Path Feedback Loop:** Monitor path usage (adoption rate, completion time, deviation frequency) and collect developer satisfaction scores. Close the loop by communicating changes based on feedback.
- **Path Versioning:** Version golden paths alongside the tools they integrate. A Laravel 11 path is distinct from a Laravel 12 path, with support for migration between paths.
- **Path Deprecation:** When deprecating a path, notify existing users with migration guidance and timelines. Never remove a path without a documented migration path.

## Performance

- **Path Execution Speed:** From path selection to working development environment: under 5 minutes. Optimize template generation, dependency installation, and CI pipeline initialization.
- **Path Feedback Cycle:** Enable easy feedback (in-app rating, Slack command, automated survey after path completion). Close the loop within 2 weeks by communicating changes.
- **Path Testing:** Run automated CI for each skeleton repository on a schedule and on template changes. Detect breakage from Laravel version upgrades immediately.

## Security

- **Compliance Encoding:** For regulated environments, golden paths encode compliance requirements (audit logging, data encryption, access controls). Deviations require compliance review and approval.
- **Secure Defaults:** Templates start with secure defaults: HTTPS enforcement, secure session configuration, proper CORS settings, rate limiting, input validation.
- **Secrets Handling:** Golden paths never bake in credentials. Secrets are injected at runtime via environment variables, secret managers, or CI/CD secrets.
- **Dependency Security:** Templates pin dependency versions and include vulnerability scanning. Security updates trigger path version bumps.

## Common Mistakes

### Mistake 1: Enforcing Without Understanding Developer Needs
- **Description:** Platform team mandates golden paths without consulting developers
- **Cause:** Assumption that platform team knows best, pressure to standardize quickly
- **Consequence:** Low adoption, developers create workarounds, platform team credibility damaged
- **Better:** Interview developers about pain points, prototype paths, collect feedback iteratively

### Mistake 2: Too Many Paths Too Quickly
- **Description:** Launching 10+ golden paths simultaneously
- **Cause:** Desire to cover every use case from day one
- **Consequence:** High maintenance burden, confusing developer choice, paths fall out of date
- **Better:** Start with 2-3 highest-value paths, expand based on proven demand

### Mistake 3: Paths Without Escape Hatches
- **Description:** Golden path is the only supported way to accomplish a task
- **Cause:** Desire for complete standardization, underestimating edge cases
- **Consequence:** Frustrated teams with legitimate different needs, shadow IT
- **Better:** Document when and how to deviate for each path decision point

### Mistake 4: Neglecting Path Maintenance
- **Description:** Golden paths not updated for new Laravel versions or tooling changes
- **Cause:** No allocated maintenance time, treated as "done" after initial creation
- **Consequence:** Paths become liabilities rather than assets, erode platform trust
- **Better:** Allocate ongoing maintenance, schedule regular updates, test paths in CI

## Anti-Patterns

- **The Toll Road:** Path requires platform team approval for every deviation. Creates bottleneck and resentment. Escape hatches should be documented and self-serve.
- **The Dead End:** Path looks complete but the final steps are manual ("then deploy manually"). Paths must be fully automated from start to finish.
- **The Bicycle Path:** Path designed for a use case that rarely occurs. Effort would be better spent on high-frequency workflows. Measure usage before investing.
- **The Rat's Nest:** Path has grown organically with multiple branching paths and no clear documentation. Periodically review and streamline paths.
- **The Hidden Path:** Path exists but developers don't know about it. Invest in discovery and marketing (portal, CLI, team demos).

## Examples

### Example 1: Create New Laravel API Service
```
Golden Path: "Create a new Laravel API service"
Flow:
  1. CLI: platform:new api-service
  2. Select project name and PHP version
  3. Skeleton created from template
  4. Composer installs dependencies
  5. Sail configured with MySQL + Redis
  6. CI pipeline set up (Pint, PHPStan, Pest)
  7. Repository created with initial commit
  8. Forge server provisioned (staging)
  9. First deploy to staging
  10. URL returned to developer
Total time: ~5 minutes
```

### Example 2: Decision Tree for API Service Path
```
? Starter kit:
  ├─ None (bare API) ← recommended for microservices
  ├─ Breeze (API) ← recommended for public APIs
  └─ Jetstream (Livewire/React) ← use only for monolith apps
? Database:
  ├─ MySQL ← default
  ├─ PostgreSQL ← use if existing infra uses PG
  └─ SQLite ← dev-only, not for production
? Queue:
  ├─ Redis ← default
  └─ Database ← use only for low-volume, simple queues
```

## Related Topics

- **idp-architecture-patterns:** IDP architecture that hosts golden paths
- **self-service-environment-provisioning:** Automated environment creation within paths
- **internal-template-registries:** Templates used as path skeletons
- **developer-portal-integration-backstage:** Backstage scaffolder for path discovery
- **service-catalog-patterns:** Service registration as path final step

## AI Agent Notes

- **Context Requirements:** When discussing golden paths, first understand the team's current onboarding time, CI setup pain points, and how developers currently create new projects. Golden paths solve specific problems—identifying the right problem is critical.
- **Key Decision Points:** The critical choices are: (1) which workflows to path first, (2) level of opinionation, (3) enforcement vs attraction balance, (4) path discovery mechanism. Each choice affects adoption and maintenance.
- **Common Pitfalls in AI Assist:** Avoid recommending golden paths for every workflow. Don't suggest enforcement before understanding developer needs. Always include escape hatch documentation. Never suggest a path without a maintenance plan.
- **Laravel-Specific Nuances:** Laravel's starter kits (Breeze, Jetstream) are themselves golden paths. Sail is the golden path for local development. Forge is the golden path for deployment. The platform team's job is to compose and customize these existing paths, not replace them.

## Verification

- [ ] KU accurately defines golden paths with Laravel context
- [ ] Core concepts include escape hatches, paved roads vs guardrails
- [ ] When To Use / When NOT To Use is clear and actionable
- [ ] Best practices prioritize developer needs and attraction over enforcement
- [ ] Architecture guidelines cover definition, discovery, execution, and feedback
- [ ] Performance targets include quantified execution time
- [ ] Security addresses compliance encoding and secure defaults
- [ ] Common Mistakes include cause, consequence, and better approach
- [ ] Anti-patterns are distinct and relevant
- [ ] Examples show realistic golden path flow with decision trees
- [ ] Related topics cross-reference is complete
- [ ] AI Agent Notes provide actionable guidance for assistants
