# Knowledge Unit: Golden Path / Paved Road Patterns

## Metadata
- **Subdomain:** Internal Developer Platforms (IDP)
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** internal-developer-platforms-idp/golden-path-paved-road-patterns
- **Maturity:** Maturing
- **Related Technologies:** Laravel Sail, Laravel Breeze, Laravel Jetstream, Forge, GitHub Actions, Backstage Scaffolder

## Executive Summary

Golden paths (or paved roads) are opinionated, well-documented, and tool-supported workflows that guide Laravel developers through common tasks while allowing flexibility for edge cases. Rather than enforcing a single way of working, golden paths provide a "happy path" that works out of the box—scaffolding a new project, adding authentication, setting up CI, deploying to staging—with clear documentation for when and how to deviate. The concept originated from Spotify's engineering culture and is central to platform engineering: the platform team maintains the paved road, and developers choose to stay on it for efficiency or leave it when necessary.

## Core Concepts

- **The Golden Path:** A recommended, supported workflow for a specific developer task (e.g., "Creating a new Laravel API service") that includes all tooling, configuration, and documentation needed to complete the task correctly
- **Escape Hatch:** Documented alternatives when the golden path doesn't fit the use case; escape hatches ensure the platform doesn't become a straitjacket
- **Paved Road vs Guardrails:** Paved roads make the right thing easy; guardrails prevent wrong things (e.g., CI blocks non-standard PHP versions). Both are needed for effective platform engineering.
- **Default-Optimized Configuration:** The platform's defaults should work for 80% of use cases; customization is available but requires explicit opt-in

## Mental Models

- **The Sidewalk vs The Dirt Path:** A paved road is smooth and fast but follows a fixed route; developers can walk on dirt paths (custom solutions) when the paved road doesn't go where they need, but they accept the inconvenience
- **The Platform Magnet:** Make the golden path so easy, fast, and well-supported that developers naturally choose it over alternatives—attract, don't enforce
- **The 80/20 Rule:** Cover 80% of use cases with the golden path; provide escape hatches for the 20%; avoid trying to make one path fit every scenario
- **The Decision Tree:** Each golden path is a decision tree with standardized choices; at each fork, the platform provides the recommended option and documents the consequences of alternatives

## Internal Mechanics

1. **Path Definition:** Each golden path is defined as a combination of: template/project skeleton, CI pipeline configuration, deployment script, documentation/runbook, and monitoring dashboard.
2. **Path Discovery:** Developers discover paths through the developer portal (Backstage scaffolder), CLI commands (`laravel new --path=api-service`), or documentation.
3. **Path Execution:** Executing a golden path runs a sequence of automated steps: scaffold project → configure services → set up CI → provision environments → deploy → register in service catalog.
4. **Path Feedback Loop:** Platform team monitors path usage (adoption rate, completion time, deviation frequency) to identify pain points and improvement opportunities.

## Patterns

- **Skeleton-Based Paths:** Each golden path has a corresponding project skeleton repository with pre-configured tooling (Pint, PHPStan, Pest, Sail, GitHub Actions) and documentation templates.
- **Progressive Path Discovery:** Start with the most common path ("Create Laravel application"), then add specialized paths as teams identify needs ("Create Laravel package", "Create Laravel API with authentication").
- **Path Health Dashboard:** Monitor each golden path: usage frequency, completion time, failure rate at each step, and satisfaction score from developer surveys.
- **Versioned Paths:** Golden paths are versioned alongside the tools they integrate; a Laravel 11 path is distinct from a Laravel 12 path, and the platform supports migration between paths.
- **Escape Hatch Documentation:** For each golden path decision point, document: the standard choice, alternative choices, when to use each, and the tradeoffs of deviating.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Path enforcement | Hard enforcement (CI blocks deviations) vs soft (recommendations) | Soft for development; hard for production compliance |
| Path creation | Platform-team driven vs community-contributed | Platform team curates official paths; teams can contribute via PR |
| Path discovery | Portal vs CLI vs README | All three; CLI for speed, portal for discovery, README for reference |
| Path evolution | Major version releases vs continuous refinement | Continuous refinement for tooling versions; major releases for structural changes |

## Tradeoffs

- **Opinionated vs Flexible:** More opinionated paths provide faster developer velocity but may not fit all use cases. Finding the right level of opinionation requires understanding developer workflows and pain points.
- **Path Maintenance Cost:** Each golden path requires ongoing maintenance (tooling updates, documentation, testing). More paths mean more maintenance burden. Start with 2-3 paths and expand based on demand.
- **Standardization vs Innovation:** Strong golden paths standardize practices and reduce cognitive load but may discourage innovation. Encourage escape hatches and capture feedback on why developers deviate.
- **Platform Team Authority vs Developer Autonomy:** Golden paths represent the platform team's recommendations; developers may resist perceived loss of autonomy. Frame paths as productivity multipliers, not restrictions.

## Performance Considerations

- **Path Execution Speed:** The time from path selection to a working development environment should be under 5 minutes for high developer satisfaction. Optimize template generation, dependency installation, and CI pipeline initialization.
- **Path Feedback Cycle:** Developers should be able to provide feedback on golden paths easily (in-app rating, Slack command, automated survey after path completion); close the loop by communicating changes based on feedback.
- **Path Testing:** Golden paths must be tested regularly (automated CI for each skeleton repository) to ensure they work end-to-end; a broken golden path erodes developer trust in the platform.

## Production Considerations

- **Path Deprecation:** When a golden path is deprecated (e.g., Laravel version EOL), existing users must be notified with migration guidance and timelines. Never remove a golden path without a documented migration path.
- **Path Compliance:** For regulated environments, golden paths encode compliance requirements (audit logging, data encryption, access controls). Deviations must be reviewed and approved through the compliance process.
- **Path Metrics:** Track adoption rate (percentage of new projects using golden paths), completion rate (percentage of path executions that finish without manual intervention), and deviation rate (percentage of projects that modify the path after creation).

## Common Mistakes

- **Enforcing paths without understanding developer needs:** Paths designed without developer input solve the wrong problems; interview developers about their pain points before designing paths
- **Too many paths too quickly:** Each new path fragments the organization's practices; introduce paths incrementally based on proven demand
- **Paths without escape hatches:** Forcing all projects onto a single path frustrates teams with legitimate different needs; document when and how to deviate
- **Neglecting path maintenance:** A golden path that's not updated for Laravel version upgrades or new tooling becomes a liability rather than an asset
- **Path as source of truth for documentation only:** A golden path must include automated tooling, not just documentation; developers won't follow a path that requires manual steps

## Failure Modes

- **Path Rot:** Golden paths become outdated as Laravel versions, packages, and infrastructure evolve. Mitigate: automated CI for path skeletons against the latest stable Laravel release.
- **Path Bypass:** Developers consistently deviate from golden paths due to friction or missing features. Mitigate: capture deviation data through CI tooling detection and conduct root cause analysis.
- **Path Fragmentation:** Multiple competing golden paths emerge for the same workflow (e.g., three different ways to create a queue worker). Mitigate: periodically review path catalog and merge redundant paths.
- **Platform Team as Path Bottleneck:** Path creation and updates require platform team intervention, creating delays. Mitigate: empower senior developers to contribute path improvements through a lightweight review process.

## Ecosystem Usage

- **Spotify:** Originated the "Golden Path" concept; internal platform provides ~20 golden paths covering backend, mobile, web, and data engineering workflows
- **Laravel Breeze/Jetstream:** Official Laravel golden paths for authentication scaffolding; provide Blade, Livewire, React, and Vue variants with all configuration pre-set
- **Laravel Sail:** The golden path for local Laravel development; default Docker Compose configuration covers the most common services
- **Backstage Scaffolder:** Provides the tooling to implement golden paths as self-service templates; Backstage's "Scaffolder" was designed specifically for the golden path pattern
- **Humanitec:** Commercial IDP with "Workload" abstraction that implements golden path patterns with environment provisioning and deployment automation

## Related Knowledge Units

- idp-architecture-patterns
- self-service-environment-provisioning
- internal-template-registries
- developer-portal-integration-backstage

## Research Notes

- Spotify's original golden path paper (2017) is still the most-cited reference for this pattern; the concept has been adapted for Laravel ecosystem since 2020
- The industry trend is moving from "paved road" (the platform team builds it) to "golden path" (the platform team maintains it, but it's discovered and evolved through usage)
- Golden paths work best when they solve real, measured developer pain points; the most successful Laravel golden paths address environment setup time and CI/CD configuration complexity
- Organizations typically need 3-5 golden paths to cover 80% of use cases; adding more than 10 paths creates discoverability problems and maintenance burden
