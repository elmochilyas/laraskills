# Unleash

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** feature-flag-governance
- **Knowledge Unit:** Unleash
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Unleash is an open-source feature flag platform with self-hosted and cloud options, providing feature toggles, gradual rollouts, A/B testing, and operational controls. Its open-core model allows organizations to self-host for data sovereignty while providing enterprise features through a paid tier, making it suitable for compliance-conscious Laravel teams.

---

## Core Concepts

- **Feature toggles** with support for boolean and strategy-based activation
- **Activation strategies** define conditions for flag activation (user IDs, gradual rollout, IP allowlist, custom strategies)
- **Self-hosted deployment** with PostgreSQL database for full data control
- **API-first design** with REST API for flag management and client SDK for evaluation
- **Context fields** define the evaluation context (user, session, environment) for strategy evaluation
- **Metrics and impression data** track flag evaluation frequency for cleanup decisions
- **Project and environment organization** for multi-team, multi-stage deployments

---

## Mental Models

- **The Open Source Switchboard:** Unleash is a community-built switchboard for features — functional, customizable, and transparent about how it works.
- **The Town Hall Notice Board:** Feature flags are posted as notices. Different notices go to different boards (environments), and different people (users) see different notices based on posted rules.
- **The Recipe Box:** Each flag is a recipe with ingredients (strategies). Cooks (applications) follow the recipe to determine if the dish (feature) is served.

---

## Internal Mechanics

The Unleash server stores flag configurations in PostgreSQL. The Laravel SDK connects to the Unleash server, downloading flag configurations via HTTP polling (default 30 seconds) and optionally via SSE for real-time updates. Flag evaluation is local — the SDK evaluates activation strategies against provided context. Strategies are pluggable — custom strategies can be defined. The SDK sends metrics (evaluation counts) back to Unleash asynchronously. The admin UI provides flag management, strategy configuration, and basic analytics.

---

## Patterns

**Strategy-Based Flags Pattern:** Define reusable activation strategies (gradual rollout, user IDs, beta testers) that can be applied to multiple flags. Benefit: Consistency across flags, reusable logic. Tradeoff: Strategy definition requires application code changes.

**Self-Hosted Compliance Pattern:** Deploy Unleash server within network boundary, managing data entirely in-house. Benefit: Full data sovereignty, no external dependencies. Tradeoff: PostgreSQL server, Unleash server, and backup infrastructure to maintain.

**Custom Activation Strategy Pattern:** Implement application-specific strategies (per-plan, per-tenant, per-region) as custom strategy classes. Benefit: Flexible targeting beyond built-in strategies. Tradeoff: Custom strategies must be registered in the SDK.

---

## Architectural Decisions

Use Unleash for organizations that need open-source feature flag infrastructure with self-hosting capabilities. Choose Unleash over LaunchDarkly when cost or data sovereignty is a primary concern. Use the self-hosted deployment for compliance-controlled environments; use Unleash Cloud for teams that want managed infrastructure. Implement custom strategies for application-specific targeting logic that can't be expressed with built-in strategies.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Open-source, self-hostable | Self-hosting operational overhead (PostgreSQL, server, backup) | Full data control vs. infrastructure maintenance |
| API-first design | Additional integration work for non-SDK clients | Flexible but requires more setup than all-in-one platforms |
| Custom activation strategies | Strategy development and maintenance | Unlimited targeting flexibility at code complexity cost |
| Lower cost than enterprise competitors | Less mature ecosystem than LaunchDarkly | Fewer community packages and SDKs |
| SSE streaming for real-time updates | SSE connection management | Persistent connection overhead for self-hosted deployments |

---

## Performance Considerations

Polling interval (default 30 seconds) balances freshness with server load. Enable SSE for time-sensitive flags. Flag evaluation is local (process-side) — sub-millisecond. Custom strategies execute in-process — keep them performant. Metrics reporting is batched and async — minimal evaluation impact. Self-hosted Unleash server load scales with number of connected SDKs and polling frequency. PostgreSQL database performance affects admin UI responsiveness and SDK configuration download speed.

---

## Production Considerations

Monitor Unleash server health and SDK connectivity. Configure fallback values for all flags in the SDK. Back up Unleash PostgreSQL database regularly. Implement Unleash server high availability (multiple instances with shared database). Keep Unleash server and SDK versions compatible — upgrade both in coordination. Export Unleash audit logs for compliance. Set up flag cleanup workflows — monitor impression data to identify unused flags.

---

## Common Mistakes

**Not configuring fallback values** — if Unleash server is unreachable and no fallback is defined, flag evaluation throws. Always provide fallback values in SDK initialization.

**Running unsupported SDK version** — SDK version drift causes incompatibility with server API changes. Keep SDK version pinned and tested.

**Over-relying on default polling interval** — for time-critical kill switches, default 30-second polling may be too slow. Enable SSE or reduce polling interval.

---

## Failure Modes

- **Unleash server unreachable:** SDK uses cached configurations, no updates. Fallback values apply for unevaluated flags.
- **PostgreSQL database failure:** Unleash server returns empty flag configurations. Backup database needed for quick recovery.
- **SDK configuration corruption:** Malformed flag data causes evaluation errors. Validate Unleash server data integrity.
- **Custom strategy exception:** Error in custom activation strategy blocks flag evaluation. Wrap strategy execution in try-catch.

---

## Ecosystem Usage

Unleash provides a community-maintained PHP SDK that works with Laravel via service provider. The SDK supports `FeatureInterface` for custom flag resolution. Unleash's frontend API allows JavaScript SDK integration for client-side flag evaluation. Unleash webhooks can trigger Laravel event listeners on flag configuration changes. Unleash integrates with common monitoring and alerting tools for flag health tracking.

---

## Related Knowledge Units

### Prerequisites
- Feature Flag Fundamentals
- Self-Hosted Infrastructure Management
- SDK Integration Patterns

### Related Topics
- LaunchDarkly (enterprise competitor)
- GrowthBook (open-source alternative with experiments)
- ConfigCat (cloud alternative with CDN delivery)

### Advanced Follow-up Topics
- Unleash Server High Availability Configuration
- Custom Activation Strategy Development
- Feature Flag Migration (Self-Hosted to Cloud)

---

## Research Notes

Unleash's open-core model (Apache 2.0 license for self-hosted core) makes it an attractive option for organizations that need feature flags but cannot justify the cost of LaunchDarkly or cannot meet its compliance requirements. The self-hosted option addresses data sovereignty concerns that are increasingly important for EU-based companies. Unleash's strategy-based architecture is more flexible than Laravel Pennant's scope-based approach but requires more setup. The PHP SDK community is smaller than the LaunchDarkly ecosystem, but the SDK is functional and actively maintained. For Laravel teams that want to avoid vendor lock-in, Unleash's open-source model provides a viable path.
