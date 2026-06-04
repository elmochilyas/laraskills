# Skill: Design an IDP Architecture for Laravel Teams

## Purpose
Architect a layered Internal Developer Platform (IDP) that composes Laravel ecosystem tools (Forge, Sail, GitHub Actions) into a self-service developer experience, following the Infrastructure → Orchestration → Service Catalog → Developer Portal pattern.

## When To Use
- Team has 5+ developers and 3+ Laravel applications needing consistent deployment
- Developers spend significant time on infrastructure setup
- Organization needs standardized compliance and quality enforcement

## When NOT To Use
- Single application or small team (< 5 developers)
- No dedicated platform engineering resources
- Existing tools (Forge + GitHub Actions) already meet all needs

## Prerequisites
- Laravel Forge subscription or equivalent provisioning backend
- GitHub Actions or equivalent CI/CD platform
- Docker/Sail for local development standardization
- Git hosting (GitHub, GitLab) for repository management

## Inputs
- Team size and number of Laravel applications
- Existing infrastructure tooling inventory (Forge, CI, hosting)
- Developer pain point survey results
- Compliance and security requirements

## Workflow (numbered)
1. **Assess** — Survey developers on infrastructure friction points; inventory existing tools and platforms
2. **Layer** — Define the four-layer architecture: Infrastructure (Forge/VPS), Orchestration (GitHub Actions), Service Catalog (YAML/Backstage), Developer Portal (CLI/Backstage)
3. **Compose** — Identify which existing tools compose into each layer; avoid custom build unless proven necessary
4. **Golden Path** — Design 2-3 opinionated workflows for the most common developer tasks (new project, CI setup, deploy)
5. **API-First** — Expose every platform capability via API; CLI and portal consume the same API
6. **Automate Progressively** — Run processes manually 3-5 times, document, then automate
7. **Launch** — Release with CI/CD gates, observability, and escape hatch documentation

## Validation Checklist
- [ ] Architecture follows 4-layer pattern with clear API boundaries
- [ ] Each layer uses composed existing tools, not custom build
- [ ] Golden paths cover 80% of use cases with documented escape hatches
- [ ] Every platform action is idempotent and observable
- [ ] Provisioning completes in under 5 minutes; CI in under 10 minutes
- [ ] Least-privilege integration and credential management implemented
- [ ] Developer adoption metrics defined and baseline measured

## Common Failures
- **Building before understanding pain points** — leads to zero adoption
- **Over-automating unstable processes** — automation breaks frequently, erodes trust
- **One-size-fits-all platform** — developers create workarounds
- **Neglecting maintenance** — no allocated budget for platform upkeep

## Decision Points
- Compose vs build: always compose existing tools first
- Thin vs thick platform: keep platform minimal, compose mature tools
- Portal vs CLI-first: CLI for small teams, portal for discovery at scale
- Forge vs K8s provisioning: Forge is default for Laravel; K8s for orgs already invested

## Performance/Security Considerations
- Provisioning latency target: < 5 minutes; optimize image caching and parallel provisioning
- CI pipeline target: < 10 minutes; longer pipelines discourage frequent commits
- Never expose credentials in portal/CI output; rotate tokens quarterly
- Multi-tenant isolation with rate limiting and resource quotas
- Network segmentation between platform components and production

## Related Rules (from 05-rules.md)
- IDP-RULE-001: Compose before build
- IDP-RULE-002: Layered architecture with clear API boundaries
- IDP-RULE-003: Thin platform, thick tooling
- IDP-RULE-006: API-first design
- IDP-RULE-007: Idempotent operations
- IDP-RULE-009: Observability by default

## Related Skills
- Design Golden Paths for Laravel Development
- Integrate Backstage as a Developer Portal
- Implement Self-Service Environment Provisioning

## Success Criteria
- Developers can provision a new Laravel project with CI/CD in under 5 minutes via self-service
- 80% of teams use the golden paths for common workflows
- Platform team spends < 20% of time on maintenance; > 80% on feature development
- Measurable reduction in developer-reported infrastructure friction (survey before/after)

---

# Skill: Implement Platform Observability and Governance

## Purpose
Establish monitoring, audit trails, and governance guardrails across the IDP to ensure platform actions are observable, secure, and compliant.

## When To Use
- After initial IDP architecture is deployed
- Multi-team platform usage requires governance
- Compliance requirements (SOC2, PCI, HIPAA) apply to Laravel applications

## When NOT To Use
- Single team using the platform with no compliance requirements
- Platform is still in experimental/prototype phase

## Prerequisites
- IDP architecture with API-first design
- Centralized logging infrastructure (e.g., ELK, Grafana Loki)
- Secret management system (Forge secrets, GitHub Actions secrets, Vault)

## Inputs
- Platform action catalog (all automated operations)
- Compliance/security requirements matrix
- Team access control model

## Workflow (numbered)
1. **Catalog platform actions** — List every automated operation with its trigger, inputs, and target
2. **Implement audit logging** — Every action logs actor, action, target, timestamp, result; logs are immutable
3. **Set up metrics** — Measure provision time, CI duration, portal response time, adoption rate, error rate
4. **Define SLIs/SLOs** — Provisioning < 5 min, CI < 10 min, portal < 500ms, uptime > 99.9%
5. **Configure alerts** — Alert on SLO breaches, failed provisions, security anomalies
6. **Implement RBAC** — Define roles (platform-admin, team-lead, developer) with scoped permissions per action
7. **Establish review cycles** — Quarterly platform review with stakeholders; security review per release

## Validation Checklist
- [ ] Every platform action produces an immutable audit log entry
- [ ] SLIs/SLOs are defined, measured, and alerted on
- [ ] RBAC enforces least-privilege access to platform actions
- [ ] Secrets never appear in logs, CI output, or portal UI
- [ ] Quarterly review cycle established with stakeholder participation

## Common Failures
- **Black box platform** — developers trigger actions but can't see progress or failure reasons
- **No maintenance budget** — platform becomes outdated, insecure
- **Vendor lock-in** — deep integration with single provider makes migration costly

## Decision Points
- Observability tooling: ELK vs Grafana Loki vs managed observability
- SLO strictness: start with informative metrics, tighten to alerting thresholds
- Review frequency: quarterly for stable platforms; monthly for rapidly evolving ones

## Performance/Security Considerations
- Audit log storage costs grow with platform usage; set retention policies per log category
- RBAC must cover both human and machine (CI/CD) actors
- Compliance-critical actions require manual approval as well as automated gates

## Related Rules (from 05-rules.md)
- IDP-RULE-009: Observability by default
- IDP-RULE-013: Least privilege integration
- IDP-RULE-014: Credential management
- IDP-RULE-015: Multi-tenant isolation

## Related Skills
- Design an IDP Architecture for Laravel Teams
- Integrate Backstage as a Developer Portal
- Implement Self-Service Environment Provisioning

## Success Criteria
- All platform actions are logged with immutable audit trail
- Platform SLOs are met > 99% of the time over a 30-day rolling window
- Zero credential exposure incidents
- Quarterly reviews result in actionable platform improvements
