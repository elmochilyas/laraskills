# Experience Curation: IDP Architecture Patterns for Laravel Teams

## Metadata
- **KU ID:** internal-developer-platforms-idp/idp-architecture-patterns
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Emerging
- **Dependencies:** forge-based-internal-platforms, golden-path-paved-road-patterns, self-service-environment-provisioning
- **Related Technologies:** Backstage, Laravel Forge, Docker, Kubernetes, GitHub Actions
- **Target Audience:** Platform engineers, Laravel team leads, DevOps engineers

## Overview

Internal Developer Platforms (IDPs) for Laravel teams abstract infrastructure complexity behind a self-service interface, enabling developers to provision environments, deploy applications, and manage services without direct infrastructure access. The architecture follows a layered pattern: infrastructure layer (containers, VMs), orchestration layer (CI/CD, provisioning), service catalog layer (application registry), and developer portal layer (self-service UI). For Laravel specifically, IDPs compose existing tools—Sail for local dev, Forge for server management, GitHub Actions for CI—into a unified experience rather than building from scratch. The platform team maintains the paved road; developers choose to stay on it for efficiency or leave it when necessary.

## Core Concepts

- **Golden Path / Paved Road:** A pre-defined, opinionated workflow for common developer tasks with documented escape hatches for edge cases
- **Service Catalog:** A registry of all Laravel applications with metadata (owner, dependencies, health status, documentation)
- **Self-Service Actions:** Automated workflows triggered through a portal or CLI (e.g., "Create new Laravel project with Breeze + MySQL")
- **Template Registry:** Versioned project skeletons that encode organizational standards
- **Environment Abstraction:** Consistent environments across dev, staging, production via declarative configuration
- **Platform as a Product:** Treat the IDP as a product with users, UX design, SLAs, and a roadmap
- **Thin Platform, Thick Tooling:** The platform layer should be minimal; most value comes from composing existing tools

## When To Use

- Team has 3+ Laravel applications that need consistent deployment and environment management
- Developers spend significant time on infrastructure setup rather than application code
- Organization needs standardized compliance, security, and quality enforcement across all Laravel projects
- Team size exceeds 10 developers and onboarding time is a concern
- Multiple teams own different Laravel services requiring self-service capabilities
- Organization practices DevOps but wants to reduce cognitive load on developers

## When NOT To Use

- Single application or small team (< 5 developers) — simpler tools suffice
- Organization lacks dedicated platform engineering resources to build and maintain the IDP
- Requirements are too volatile — IDP investment requires stable development patterns
- Existing tools (Forge + GitHub Actions) already meet all needs without additional abstraction
- Team culture strongly prefers direct infrastructure access and custom configurations

## Best Practices (WHY)

1. **Start with Developer Pain Points (Why):** Build the IDP to solve specific, measured developer frustrations. Interview teams about their biggest friction points before designing any platform component. An IDP that doesn't address real pain points will see zero adoption regardless of technical quality.

2. **Compose Before Build (Why):** Use existing tools (Forge API, GitHub Actions, Sail, Composer) and compose them into a coherent experience. Building custom infrastructure components is expensive and rarely provides proportional value over composing mature tools. The best Laravel IDPs are thin orchestration layers over existing tooling.

3. **Progressive Automation (Why):** Automate a process only after it's stable and well-understood manually. Premature automation locks in suboptimal workflows and creates maintenance burden. Run a process manually 3-5 times, document it, then automate the documented version.

4. **Golden Path with Escape Hatches (Why):** Provide opinionated defaults for 80% of use cases but always document how to deviate. Forcing every project onto identical workflows creates resentment and workarounds. The platform's value is making the right thing easy, not making other things impossible.

5. **Product-Minded Maintenance (Why):** Treat the IDP as a product with a roadmap, user feedback cycles, and deprecation policies. Undocumented platforms with no clear ownership become abandoned infrastructure. Assign a product manager (even part-time) for the platform.

## Architecture Guidelines

- **Layered Architecture:** Infrastructure → Orchestration → Service Catalog → Developer Portal. Each layer has clear APIs and boundaries. Lower layers can be replaced without affecting upper layers.
- **Template-Driven Provisioning:** All infrastructure is created from version-controlled templates (Forge recipes, Docker Compose, Terraform). No manual server configuration. Templates are CI-tested.
- **API-First Design:** Every platform capability is exposed via API before any UI is built. The CLI and portal are consumers of the same API layer. This ensures automation parity between human and machine consumers.
- **Idempotent Operations:** All provisioning and deployment operations are safe to re-run. Use check-before-create patterns and idempotent scripts.
- **Observability by Default:** Every platform action generates logs, metrics, and audit trails. If it can't be observed, it shouldn't be automated.
- **Least Privilege Integration:** API tokens, secrets, and credentials follow least-privilege access. Platform actions run with minimum required permissions.

## Performance

- **Provisioning Latency:** Environment creation should complete in under 5 minutes. Optimize template downloads, Docker image caching, and dependency installation.
- **CI Pipeline Duration:** Target under 10 minutes for full CI (test + lint + static analysis). Longer pipelines discourage frequent commits.
- **Portal Response Time:** Service catalog queries should complete in < 500ms. Use caching and pagination for large catalogs.
- **Template Rendering:** Pre-render templates rather than generating on-demand for commonly used skeletons.
- **Parallel Provisioning:** Provision independent services (database, cache, search) in parallel rather than sequentially.

## Security

- **Credential Management:** Never expose production credentials in portal or CI output. Use secret managers (Forge built-in secrets, GitHub Actions secrets, HashiCorp Vault). Rotate tokens quarterly.
- **Multi-Tenant Isolation:** Ensure one team's CI usage or provisioning actions cannot impact other teams. Implement rate limiting, resource quotas, and separate build runners.
- **Audit Trail:** All platform actions logged with actor, action, target, and timestamp. Logs are immutable and retained per compliance requirements.
- **Network Segmentation:** Platform components (portal, API, catalog) run in isolated network segments. Developer access to production is through the platform only.
- **Supply Chain Security:** Sign and verify all platform artifacts (templates, containers, packages). Use dependency scanning for platform components.

## Common Mistakes

### Mistake 1: Building Before Understanding Pain Points
- **Description:** Platform team builds IDP features based on assumptions rather than developer research
- **Cause:** Pressure to deliver, assumption that "more automation is always better"
- **Consequence:** Low adoption, wasted engineering effort, damaged credibility of platform team
- **Better:** Conduct structured developer interviews, measure baseline friction, build one feature at a time with validation

### Mistake 2: Over-Automating Unstable Processes
- **Description:** Automating workflows that are still changing frequently
- **Cause:** Enthusiasm for automation without process maturity
- **Consequence:** Automation breaks frequently, requires constant updates, erodes trust
- **Better:** Stabilize manual process, document it, run it 3-5 times, then automate the documented version

### Mistake 3: Neglecting Platform Maintenance
- **Description:** Building the IDP and treating it as "done"
- **Cause:** Project mindset instead of product mindset
- **Consequence:** Platform becomes outdated, broken, or insecure over time
- **Better:** Allocate ongoing maintenance budget, establish SLAs for platform uptime, schedule regular updates

### Mistake 4: One-Size-Fits-All Golden Paths
- **Description:** Single template/workflow for all application types
- **Cause:** Simplicity preference, underestimating diversity of use cases
- **Consequence:** Developers bypass the platform, create workarounds, fragment standards
- **Better:** Maintain 3-5 golden paths for different application patterns (API, monolith, package, queue worker)

## Anti-Patterns

- **The Snowflake Platform:** Every team customizes their environment differently from the platform standard, defeating standardization goals. Enforce platform standards through CI/CD gates and automated compliance checks.
- **The Black Box Platform:** Developers trigger actions but have no visibility into what happens, how long it takes, or why it failed. Always provide progress feedback, logging, and error messages in developer-consumable format.
- **The Kitchen Sink Platform:** Trying to automate every possible developer workflow at once. Start with 2-3 highest-value golden paths and expand incrementally based on measured demand.
- **The Gatekeeper Platform:** Platform team becomes the bottleneck for every deviation or exception. Document escape hatches, empower teams to make their own decisions, and use platform metrics to identify where golden paths need expansion.
- **The Vendor Lock-In Platform:** Deep integration with a single vendor (Forge, AWS) makes migration costly. Maintain abstraction layers for critical interfaces (provisioning, compute, secrets).

## Examples

### Example 1: Layered IDP Architecture
```
Developer Portal (Backstage)
  └── Service Catalog (catalog-info.yaml)
        └── Orchestration Engine (GitHub Actions)
              └── Provisioning Layer (Forge API + Terraform)
                    └── Infrastructure (Docker Compose / VPS / K8s)
```

### Example 2: Scaffold Command CI Flow
```
Developer runs: platform:new api-service
  → Backstage Scaffolder triggers template
  → GitHub Actions workflow starts
  → Composer create-project from skeleton
  → Apply organization-specific modifications
  → Configure Sail with MySQL + Redis
  → Initialize Git repository
  → Register in service catalog
  → Deploy to staging environment
  → Return service URL to developer
```

### Example 3: Forge-Based Self-Service Environment Provisioning
```
Platform Action → Forge API (create server, install recipe, create site, configure daemon)
  → Server provisions (5-15 min)
  → Webhook notifies CI
  → CI runs tests against new environment
  → Developer portal shows "Environment Ready"
  → Developer receives environment URL + credentials
```

## Related Topics

- **forge-based-internal-platforms:** Forge API as provisioning backend
- **golden-path-paved-road-patterns:** Designing opinionated developer workflows
- **self-service-environment-provisioning:** Automated environment creation
- **developer-portal-integration-backstage:** Backstage as developer portal
- **service-catalog-patterns:** Service registration and discovery
- **internal-template-registries:** Project skeleton management

## AI Agent Notes

- **Context Requirements:** When assisting with IDP architecture, first understand the team size, number of Laravel applications, existing tooling (Forge, Actions, Sail), and specific developer pain points. The architecture recommendation depends heavily on scale.
- **Key Decision Points:** The critical architectural choices are: (1) compose vs build, (2) thin vs thick platform, (3) portal vs CLI-first, (4) Forge vs K8s provisioning. Each choice depends on team size, existing investment, and future growth trajectory.
- **Common Pitfalls in AI Assist:** Avoid recommending Kubernetes-based IDPs for small Laravel teams. Do not suggest building custom infrastructure components when Forge API already provides the capability. Always consider the maintenance burden of platform components.
- **Laravel-Specific Nuances:** Forge API is the most common provisioning backend in the Laravel ecosystem. Custom IDP building from scratch is rare; composing Forge + Actions + Sail covers ~80% of platform engineering needs for most Laravel teams.

## Verification

- [ ] KU correctly identifies layered IDP architecture pattern
- [ ] All core concepts are accurately defined with Laravel context
- [ ] When To Use / When NOT To Use provides clear decision criteria
- [ ] Best practices are actionable and justified with "Why"
- [ ] Architecture guidelines are specific to Laravel IDPs
- [ ] Performance targets are quantified (5 min provisioning, 10 min CI)
- [ ] Security considerations address credential management and isolation
- [ ] Common Mistakes include cause, consequence, and better approach
- [ ] Anti-patterns are distinct from common mistakes
- [ ] Examples reflect real Laravel IDP implementations
- [ ] Related topics cross-reference is complete
- [ ] AI Agent Notes include actionable guidance for AI assistants
