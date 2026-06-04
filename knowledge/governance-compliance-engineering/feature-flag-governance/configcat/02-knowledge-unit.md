# ConfigCat

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** feature-flag-governance
- **Knowledge Unit:** ConfigCat
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

ConfigCat is a cloud-based feature flag and configuration management service that provides targeted feature releases, A/B testing, and kill switches with a global CDN-backed delivery infrastructure. For Laravel applications, ConfigCat enables safe, gradual feature rollouts with fine-grained targeting and real-time configuration changes without redeployment.

---

## Core Concepts

- **Feature flags** are toggles controlling feature availability, evaluated in the application at runtime
- **Targeting rules** define who sees a feature based on user attributes, percentage rollout, or custom conditions
- **CDN-backed delivery** serves flag configurations from a global CDN for low-latency access
- **Evaluation on client side** — flag values are evaluated locally using the ConfigCat SDK, not via a server-side API call
- **Configuration snapshots** allow rollback to previous flag configurations
- **Audit log** tracks who changed what flag and when
- **Environment-based flags** support dev, staging, production with independent configurations

---

## Mental Models

- **The Light Switch:** Feature flags are light switches in a control room. Each switch controls a feature (light) in a specific area (environment/target group).
- **The Dimmable Switch:** ConfigCat allows more than on/off — percentage-based rollouts are like dimmer switches, gradually increasing brightness (rollout percentage).
- **The GPS Navigation:** ConfigCat serves a map (configuration) to every car (application instance). The map is updated centrally, and all cars see the new routes (feature states) immediately.

---

## Internal Mechanics

The ConfigCat SDK polls the ConfigCat CDN for configuration changes at configurable intervals (default 60 seconds). When a flag is evaluated, the SDK uses the cached configuration to determine the flag value based on user attributes and targeting rules. No server-side evaluation API call is needed — all evaluation is local. Configuration changes propagate via CDN cache invalidation. The SDK supports overrides for local development and testing. Flag evaluations are cached in memory within the application process.

---

## Patterns

**Gradual Rollout Pattern:** Release features to 5% of users initially, gradually increasing to 100% while monitoring metrics. Benefit: Early detection of issues with minimal blast radius. Tradeoff: Requires metric monitoring infrastructure to detect problems.

**Kill Switch Pattern:** Wrap new functionality in a feature flag that can be instantly disabled if problems occur. Benefit: Immediate rollback without deployment. Tradeoff: Flags that are never cleaned up become technical debt.

**Targeted Release Pattern:** Enable features for internal teams, beta testers, or specific user segments before general availability. Benefit: Controlled exposure for feedback and testing. Tradeoff: Multiple flag states to manage.

---

## Architectural Decisions

Use ConfigCat when you need managed feature flag infrastructure with global CDN delivery, audit logging, and team collaboration features. For simple feature toggles without targeting rules, Laravel Pennant may suffice. Use ConfigCat's percentage rollouts for gradual deployment and targeting rules for beta programs. Always implement fallback/default values in application code for when ConfigCat SDK is unavailable.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Global CDN with low-latency flag delivery | External dependency on ConfigCat service | Application features break if ConfigCat is unreachable |
| Rich targeting rules (user attributes, % rollout) | Targeting rule complexity | Overly complex rules are hard to audit |
| Built-in audit log | Audit log retention limited in lower tiers | Export audit logs for long-term compliance |
| Team collaboration features | Per-seat pricing at scale | Cost increases with team size |
| No server-side API calls for evaluation | Polling interval delay (default 60s) | Configuration changes not instantaneous |

---

## Performance Considerations

Flag evaluations are local (in-process, no HTTP call) — they take microseconds. Polling for configuration updates adds minimal background network traffic. The default 60-second polling interval balances freshness with network efficiency. Override polling interval for time-sensitive flags (down to 10 seconds minimum). Local caching ensures feature evaluation is not affected by network conditions. Memory usage scales with configuration size — keep flag configurations concise.

---

## Production Considerations

Implement application fallback values for when ConfigCat SDK is unavailable — features should default to safe values. Test flag evaluation behavior during degraded network conditions. Monitor ConfigCat SDK connectivity and alert on failures. Export ConfigCat audit logs for compliance evidence. Review flag usage periodically — remove stale flags to reduce technical debt. Implement canary deployments where flags are tested in staging before production activation.

---

## Common Mistakes

**Not implementing local fallback values** — if ConfigCat is unreachable and no fallback is defined, feature evaluation fails with an exception. Always provide fallback values.

**Overusing percentage-based rollouts without monitoring** — gradual rollouts without metric monitoring hide problems until the rollout is complete. Implement observability for flagged features.

**Never cleaning up feature flags** — flags for fully released features accumulate, increasing configuration complexity and evaluation overhead. Establish flag cleanup process.

---

## Failure Modes

- **ConfigCat SDK unreachable:** Application uses fallback values. Critical flags with no fallback cause feature failure. Ensure all flags have appropriate defaults.
- **Configuration corruption:** Invalid configuration causes unexpected flag values. ConfigCat supports rollback to previous snapshots.
- **Polling delay during incident:** Emergency kill switch takes up to 60 seconds to propagate. Use lower polling intervals for critical kill switches.
- **SDK version incompatibility:** New SDK doesn't handle old configuration format. Test SDK upgrades in staging before production.

---

## Ecosystem Usage

ConfigCat provides a first-party Laravel SDK that integrates via a service provider. The SDK can be registered in the container and injected into controllers, services, or Blade directives. ConfigCat flags can be used with Laravel Pennant for a unified feature flag interface. The ConfigCat dashboard provides flag management, targeting rules, and audit logs. The service supports team management for enterprise deployments.

---

## Related Knowledge Units

### Prerequisites
- Feature Flag Fundamentals
- Laravel Service Provider Registration
- SDK Integration Patterns

### Related Topics
- Laravel Pennant (native Laravel feature flags)
- LaunchDarkly (enterprise competitor)
- GrowthBook (open-source alternative)

### Advanced Follow-up Topics
- Multi-Service Feature Flag Synchronization
- Feature Flag Governance and Cleanup Automation
- A/B Testing Infrastructure with Feature Flags

---

## Research Notes

ConfigCat's key architectural advantage is CDN-backed delivery with local evaluation — no server-side API call means flag evaluation is fast and works offline. The 60-second polling interval is suitable for most use cases but creates a tradeoff for emergency kill switches where faster propagation is needed. ConfigCat's SDK design follows the same pattern as LaunchDarkly (local evaluation, polling updates) but at a lower price point. For Laravel applications that need managed feature flags without the cost of LaunchDarkly, ConfigCat provides a balanced solution.
