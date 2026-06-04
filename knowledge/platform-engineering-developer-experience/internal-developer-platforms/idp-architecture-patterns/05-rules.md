# Rules: IDP Architecture Patterns for Laravel Teams

## Metadata
- **Source KU:** idp-architecture-patterns
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- IDP-RULE-001: **Compose before build** — Use existing tools (Forge API, GitHub Actions, Sail, Composer) as building blocks. Custom infrastructure components are rarely justified.
- IDP-RULE-002: **Layered architecture** — Structure the IDP as Infrastructure → Orchestration → Service Catalog → Developer Portal with clear API boundaries between layers.
- IDP-RULE-003: **Thin platform, thick tooling** — The platform layer should be minimal; most value comes from composing existing, mature tools.
- IDP-RULE-004: **Golden path with escape hatches** — Provide opinionated defaults for 80% of use cases with documented alternatives for edge cases.
- IDP-RULE-005: **Product-mindset** — Treat the IDP as a product with a roadmap, user feedback cycles, and deprecation policies.

## Architecture Rules
- IDP-RULE-006: **API-first design** — Every platform capability must be exposed via API before any UI is built. CLI and portal are consumers of the same API layer.
- IDP-RULE-007: **Idempotent operations** — All provisioning and deployment operations must be safe to re-run. Use check-before-create patterns.
- IDP-RULE-008: **Template-driven provisioning** — All infrastructure is created from version-controlled templates (Forge recipes, Docker Compose, Terraform). No manual server configuration.
- IDP-RULE-009: **Observability by default** — Every platform action must generate logs, metrics, and audit trails. If it can't be observed, don't automate it.

## Implementation Rules
- IDP-RULE-010: **Start with developer pain points** — Build IDP features to solve specific, measured developer frustrations. Interview teams before designing.
- IDP-RULE-011: **Progressive automation** — Automate a process only after it's stable and well-understood manually. Run manually 3-5 times, document, then automate.
- IDP-RULE-012: **Pre-warm resources** — Maintain pre-configured server pools and cached Docker images for instant provisioning.

## Security Rules
- IDP-RULE-013: **Least privilege integration** — API tokens, secrets, and credentials follow least-privilege access. Platform actions run with minimum required permissions.
- IDP-RULE-014: **Credential management** — Never expose production credentials in portal or CI output. Use secret managers. Rotate tokens quarterly.
- IDP-RULE-015: **Multi-tenant isolation** — Ensure one team's CI or provisioning actions cannot impact other teams. Implement rate limiting and resource quotas.
- IDP-RULE-016: **Network segmentation** — Platform components run in isolated network segments. Developer access to production is through the platform only.

## Performance Rules
- IDP-RULE-017: **Provisioning under 5 minutes** — Environment creation should complete in under 5 minutes. Optimize template downloads, image caching, and dependency installation.
- IDP-RULE-018: **CI under 10 minutes** — Full CI (test + lint + static analysis) should complete under 10 minutes. Longer pipelines discourage frequent commits.
- IDP-RULE-019: **Parallel provisioning** — Provision independent services in parallel rather than sequentially.
- IDP-RULE-020: **Portal under 500ms** — Service catalog queries should complete in under 500ms. Use caching and pagination.

## Decision Rules
- IDP-RULE-021: **Team >= 5 developers** to justify IDP investment. Smaller teams can use simpler tools.
- IDP-RULE-022: **3+ Laravel apps** before building an IDP. Fewer apps don't need a platform layer.
- IDP-RULE-023: **Forge vs K8s choice** depends on team size and existing investment. Forge is the default for Laravel teams.
- IDP-RULE-024: **Portal vs CLI-first** — Choose CLI-first for smaller teams, add portal when discovery becomes a problem.

## Anti-Pattern Rules
- IDP-RULE-025: **Avoid the Snowflake Platform** — Every team customizing their environment differently defeats standardization. Enforce through CI/CD gates.
- IDP-RULE-026: **Avoid the Black Box Platform** — Developers must have visibility into what happens, how long it takes, and why it fails.
- IDP-RULE-027: **Avoid the Kitchen Sink Platform** — Start with 2-3 highest-value golden paths and expand incrementally based on measured demand.
- IDP-RULE-028: **Avoid the Gatekeeper Platform** — Document escape hatches and empower teams to make decisions without platform team bottleneck.
- IDP-RULE-029: **Avoid Vendor Lock-In** — Maintain abstraction layers for critical interfaces (provisioning, compute, secrets).

## AI Guidance Rules
- IDP-RULE-030: Before recommending IDP architecture, assess team size, number of apps, existing tooling, and specific developer pain points.
- IDP-RULE-031: Never recommend Kubernetes-based IDPs for small Laravel teams. Forge API is sufficient for ~80% of cases.
