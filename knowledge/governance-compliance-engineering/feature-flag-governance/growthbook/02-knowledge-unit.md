# GrowthBook

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** feature-flag-governance
- **Knowledge Unit:** GrowthBook
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

GrowthBook is an open-source feature flag and A/B testing platform that provides both feature management and experimentation capabilities. For Laravel applications, GrowthBook enables data-driven feature decisions through integrated experimentation, with self-hosted or cloud deployment options for compliance-conscious organizations.

---

## Core Concepts

- **Feature flags** control feature availability with support for targeting, percentage rollouts, and forced values
- **Experiments (A/B tests)** are integrated with feature flags, automatically tracking which variant a user sees
- **Auto-generated experiment analysis** provides statistical significance calculations for decision making
- **Visual editor** allows non-technical users to modify feature targeting without code changes
- **Self-hosted option** enables on-premise deployment for data sovereignty compliance
- **Proxy SDK** for server-side evaluation with privacy-preserving client-side access
- **Metrics integration** connects experiment results to business metrics (revenue, engagement, retention)

---

## Mental Models

- **The Science Lab:** GrowthBook is a laboratory where experiments are designed (flags), conducted (rollouts), analyzed (statistics), and published (feature releases).
- **The Hypothesis Tester:** Every feature flag is a hypothesis — "this feature improves user engagement." GrowthBook provides the tools to test, measure, and validate.
- **The Control Panel:** Feature flags are switches on a control panel, and A/B experiments are the measurement instruments recording what happens when switches are flipped.

---

## Internal Mechanics

GrowthBook stores feature flag and experiment configurations in a data store (MongoDB or Postgres for self-hosted, managed infrastructure for cloud). The Laravel SDK fetches configurations via HTTP polling (default 30 seconds) or streaming. Flag evaluation is local — the SDK evaluates targeting rules against user attributes. For experiments, the SDK assigns users to variants consistently using a hash of user ID and experiment key. Experiment results are tracked via event tracking to the GrowthBook analytics pipeline, which calculates statistical significance. The self-hosted version gives full control over data storage and network boundaries.

---

## Patterns

**Experiment-Driven Development Pattern:** Create a feature flag with multiple variants, randomly assign users, and measure which variant performs better. Benefit: Data-driven feature decisions, reduced risk of negative impact. Tradeoff: Requires metric tracking infrastructure and sufficient sample size.

**Progressive Rollout Pattern:** Release feature to 1% of users, analyze metrics, increase to 5%, then 25%, 50%, 100% with constant measurement. Benefit: Early detection of issues with statistical confidence. Tradeoff: Rollout pace limited by statistical significance requirements.

**Self-Hosted Compliance Pattern:** Deploy GrowthBook self-hosted within network boundary for data sovereignty. Benefit: Full data control, no external API calls. Tradeoff: Operational overhead of self-hosting (database, web server, background jobs).

---

## Architectural Decisions

Choose GrowthBook for teams that need integrated A/B testing alongside feature flags. The self-hosted option is compelling for regulated industries where data cannot leave the network. Use GrowthBook's metrics integration to connect experiment results to business KPIs. For simple feature toggles without experimentation, a lighter solution (Pennant, ConfigCat) may be more appropriate. The visual editor enables product managers to manage flags without developer involvement.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Integrated A/B testing with feature flags | Additional SDK and event tracking overhead | Experiment setup requires more initial investment than simple flags |
| Open-source, self-hostable | Self-hosting operational costs | Full data control vs. infrastructure management |
| Auto-generated experiment analytics | Statistical knowledge needed to interpret results | Risk of misinterpreting experiment outcomes |
| Visual editor for non-technical users | Visual editor sync delay | UI changes may not reflect immediately in SDK polling |
| Privacy-preserving proxy SDK | Additional SDK setup complexity | Enables client-side feature evaluation without exposing targeting data |

---

## Performance Considerations

Flag evaluation is local (process-side) and fast. Experiment assignment uses consistent hashing — deterministic and fast. The 30-second polling interval is sufficient for most use cases. Event tracking for experiments adds network calls — batch events to reduce overhead. Self-hosted GrowthBook requires database and web server resources — size based on expected flag configuration volume and concurrent SDK connections. Enable caching for flag configurations in the application.

---

## Production Considerations

Set up monitoring for GrowthBook SDK connectivity. Configure fallback values for all flags. Export experiment results for compliance evidence if needed for regulated feature releases. Implement flag cleanup workflow — experiments that conclude should have their flags removed. Review flag targeting rules regularly for configuration drift. For self-hosted deployments, back up GrowthBook database regularly and test disaster recovery.

---

## Common Mistakes

**Running experiments without sufficient sample size** — statistically insignificant results lead to wrong decisions. Use GrowthBook's sample size calculator before starting experiments.

**Not separating experiment flags from permanent feature flags** — flags used for A/B tests should be temporary and removed after the experiment concludes.

**Ignoring experiment interaction effects** — running multiple concurrent experiments can interfere with each other. Use GrowthBook's experiment assignment tracking to detect overlaps.

---

## Failure Modes

- **GrowthBook SDK unreachable**: Feature flags fall back to defaults. Experiment assignment consistency may be affected if SDK was cached previously.
- **Self-hosted database failure**: Cannot update flag configurations. Revert to last known good backup.
- **Experiment result misinterpretation**: Incorrect statistical conclusions. Use GrowthBook's guardrails (minimum sample size, minimum effect size) to prevent premature conclusions.
- **SDK version drift**: Application updates without corresponding SDK update, causing evaluation mismatches. Pin SDK version and test upgrades.

---

## Ecosystem Usage

GrowthBook provides a Laravel SDK package (`growthbook/laravel`) that integrates via service provider. The SDK supports Blade directives for template-level feature flags. GrowthBook can be used alongside Laravel Pennant for feature management with experiment tracking. The self-hosted GrowthBook can be deployed on Laravel Vapor, Forge, or any PHP-compatible infrastructure.

---

## Related Knowledge Units

### Prerequisites
- Feature Flag Fundamentals
- A/B Testing Concepts (statistical significance, sample size)
- Laravel SDK Integration

### Related Topics
- Laravel Pennant (native feature flags without experiments)
- LaunchDarkly (enterprise feature flags with experiments)
- ConfigCat (feature flags without built-in experiments)

### Advanced Follow-up Topics
- Multi-Armed Bandit Experimentation
- Bayesian vs. Frequentist Experiment Analysis
- Feature Flag-Driven Continuous Delivery Pipeline

---

## Research Notes

GrowthBook's key differentiator is its open-source model and integrated experimentation. Unlike LaunchDarkly (experiments are separate/paid add-on) and ConfigCat (no built-in experiments), GrowthBook provides A/B testing as a core feature. The self-hosted option addresses data sovereignty concerns that are increasingly important for EU-regulated companies. The privacy-preserving proxy SDK enables client-side feature flag evaluation without exposing user attributes to the client. GrowthBook's statistical engine uses a Bayesian approach, which provides more intuitive results than frequentist methods for many product teams.
