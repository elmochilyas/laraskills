# LaunchDarkly

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** feature-flag-governance
- **Knowledge Unit:** LaunchDarkly
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

LaunchDarkly is the leading enterprise feature management platform, providing advanced feature flag capabilities including multi-variant flags, targeted rollouts, A/B testing, and real-time configuration changes. For Laravel applications at scale, LaunchDarkly provides the infrastructure for sophisticated release strategies, operational controls, and compliance governance for feature flag lifecycles.

---

## Core Concepts

- **Feature flags** with multi-variant support (not just boolean on/off) for complex experimentation
- **Targeting rules** with multi-attribute conditions, percentage rollouts, and user segments
- **Real-time streaming** via Server-Sent Events (SSE) for sub-second flag value propagation
- **Prerequisite flags** that create flag dependency chains for staged rollouts
- **Flag lifecycle management** with approval workflows, scheduled changes, and flag auto-cleanup
- **Experimentation** with built-in A/B testing and statistical analysis
- **Audit log** with detailed change history and rollback capability

---

## Mental Models

- **The Mission Control:** LaunchDarkly is NASA mission control for your features — monitoring, controlling, and measuring every feature across every environment with real-time telemetry.
- **The Smart Grid:** Like an electrical smart grid, features are directed where needed, turned off during overload (circuit breaker), and usage is metered (analytics).
- **The Orchestrator's Console:** A conductor controls every instrument (feature) in the orchestra (application), adjusting volume (rollout percentage) and directing sections (user segments) in real-time.

---

## Internal Mechanics

The LaunchDarkly Laravel SDK connects to LaunchDarkly's streaming API via SSE, maintaining a persistent connection for real-time flag updates. Flag configurations are cached locally and evaluated client-side (no server-side API call on evaluation). The SDK stores flag rules, targeting conditions, and user segments in memory. Evaluation uses a deterministic bucketing algorithm to assign users to flag variants consistently. The SDK sends analytics events (flag evaluations, custom events) back to LaunchDarkly for dashboard reporting. The Relay Proxy can be deployed on-premise to reduce outbound connections and improve latency.

---

## Patterns

**Canary Release Pattern:** Deploy new feature to 1% of users, monitor metrics, increase to 10%, then 100% with automatic rollback on error metrics. Benefit: Safe, controlled releases with automatic safety. Tradeoff: Requires comprehensive metric monitoring integration.

**Operator Override Pattern:** Allow customer support or operations to override feature flags for specific users or organizations. Benefit: Flexible incident response (disable problematic feature for specific customer). Tradeoff: Override management requires careful access control.

**Flag Dependency Pattern:** Define prerequisite flags that must be enabled before a dependent flag activates. Benefit: Staged rollouts where infrastructure changes precede application changes. Tradeoff: Dependency chain complexity increases with flag count.

---

## Architectural Decisions

Use LaunchDarkly for enterprise applications requiring advanced feature management, multi-environment control, and compliance governance. For simpler feature flagging needs, Laravel Pennant or ConfigCat may be more cost-effective. Implement the Relay Proxy for on-premise deployments or high-security environments. Use LaunchDarkly's approval workflows for compliance-controlled flag changes. Enable analytics for visibility into feature adoption and performance.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Real-time flag updates via streaming | Persistent SSE connection overhead | Additional network connections per application instance |
| Multi-variant and advanced targeting | Configuration complexity for simple flags | Over-engineering if advanced features aren't needed |
| Built-in experimentation and analytics | Cost scales with usage (MAU, flags, seats) | May be cost-prohibitive for smaller teams |
| Approval workflows and audit logs | Process overhead for flag changes | Compliance benefit but slower flag updates |
| Relay Proxy for on-premise | Additional infrastructure to manage | Required for air-gapped or data-sovereignty deployments |

---

## Performance Considerations

Flag evaluation is local — sub-millisecond for cached flags. SSE connection maintains persistent TCP connection per application instance — consider Relay Proxy for reducing outbound connections. Memory usage scales with number of flags and targeting rules — monitor in large-scale deployments. SDK analytics events are batched and sent asynchronously. The Relay Proxy reduces latency by providing a local connection endpoint. Cache flag configurations in Redis for shared-nothing architectures.

---

## Production Considerations

Always implement SDK fallback values. Monitor SSE connection health and alert on disconnections. Use LaunchDarkly's approval workflows for production flag changes. Schedule flag changes during maintenance windows when possible. Export audit logs for compliance evidence. Establish flag cleanup procedures — LaunchDarkly's auto-cleanup can be configured. Implement canary flag evaluation in CI/CD to catch targeting rule misconfigurations.

---

## Common Mistakes

**Not setting fallback values in SDK** — if LaunchDarkly is unreachable and no fallback is provided, flag evaluation throws an exception. Always provide sensible defaults.

**Overusing flags — permanent flags become technical debt** — not all flags should be permanent. Use LaunchDarkly's flag lifecycle features to track and remove stale flags.

**Incorrect targeting rule ordering** — LaunchDarkly evaluates rules in order, first match wins. Rules must be ordered from most specific to most general.

---

## Failure Modes

- **SSE connection loss:** SDK uses cached configurations, no updates until reconnection. Fallback values apply for unevaluated flags.
- **Flag configuration corruption:** Invalid targeting rule causes unexpected flag values. Use LaunchDarkly's rollback to previous configuration.
- **Relay Proxy failure:** On-premise proxy goes down. SDK falls back to direct LaunchDarkly cloud connection (if allowed by network policy).
- **SDK memory exhaustion:** Large flag configuration consumes excessive memory. Monitor SDK memory usage and limit flag count.

---

## Ecosystem Usage

LaunchDarkly provides an official Laravel SDK that integrates with service container, Blade, and middleware. The SDK registers a `LaunchDarklyServiceProvider` and provides a facade for feature flag evaluation. LaunchDarkly integrates with monitoring tools (Datadog, New Relic) for flag-related alerting. The platform's webhooks can trigger Laravel event listeners on flag changes. LaunchDarkly is SOC 2 compliant and supports HIPAA-ready configurations for healthcare applications.

---

## Related Knowledge Units

### Prerequisites
- Feature Flag Fundamentals
- SDK Integration with Service Providers
- Release Engineering Concepts (canary, blue-green)

### Related Topics
- Laravel Pennant (native alternative for simple flags)
- ConfigCat (cloud alternative with CDN delivery)
- GrowthBook (open-source alternative with experiments)

### Advanced Follow-up Topics
- Multi-Service Feature Flag Synchronization
- Feature Flag-Driven Incident Response
- Compliance Governance for Feature Flag Lifecycles

---

## Research Notes

LaunchDarkly is the market leader in feature management, and its SDK design has influenced most competitors. The local evaluation + streaming update pattern is now the industry standard. LaunchDarkly's pricing model (based on monthly active users and feature flags) makes it most cost-effective for applications with a focused flag set and moderate user base. The Relay Proxy addresses the data sovereignty concern that prevents regulated industries from using cloud-managed feature flag services. LaunchDarkly's compliance certifications (SOC 2, HIPAA, ISO 27001, FedRAMP) make it the enterprise default for regulated Laravel applications.
