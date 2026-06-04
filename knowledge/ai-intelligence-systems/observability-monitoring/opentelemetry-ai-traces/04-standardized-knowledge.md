---
id: KU-044
title: "OpenTelemetry for AI Traces"
subdomain: "observability-monitoring"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/12-observability-monitoring/opentelemetry-ai-traces/04-standardized-knowledge.md"
---

# OpenTelemetry for AI Traces

## Overview

OpenTelemetry (OTel) provides distributed tracing for AI applications, capturing the full lifecycle of an AI request: userâ†’agentâ†’toolâ†’LLMâ†’response. OTel's GenAI Semantic Conventions standardize how AI spans are named and tagged. Laravel AI applications can instrument agent execution as OTel spans, enabling trace visualization in tools like Grafana, Jaeger, or Datadog.

## Core Concepts

- **Span**: Unit of work â€” one AI call, one tool execution, one agent step
- **Trace**: Tree of spans representing the full request lifecycle
- **GenAI semantic conventions**: OTel standard for naming AI spans (gen_ai.request, gen_ai.tool_call)
- **Attributes**: Model name, provider, token count, latency, user ID â€” attached to spans
- **Events**: Annotations within spans (e.g., "tool call started", "response received")
- **Exporters**: Send spans to observability backends (OTLP, Zipkin, Prometheus)
- **Context propagation**: Link AI spans to HTTP request spans for end-to-end tracing

## When To Use

- Production applications requiring OpenTelemetry for AI Traces functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Automatic instrumentation**: Hook into agent lifecycle events to create spans without modifying agent code
- **Correlated tracing**: Attach user_id and conversation_id to all spans for cross-reference
- **Error spans**: Record failed AI calls as error spans with exception details
- **Cost in span attributes**: Attach estimated cost to each span â€” aggregate cost per trace in observability tool
- **Tool timeout detection**: Set span deadlines â€” alert if tool execution exceeds threshold

- **X-ray for AI**: Like AWS X-Ray traces â€” see every step of an AI request, its duration, and errors. Trace from user's HTTP request through agent â†’ tools â†’ LLM calls.
- **DDTrace for GenAI**: Like Datadog APM for AI â€” automatic instrumentation of AI SDK calls, with custom span creation for business logic.

## Architecture Guidelines

- **Decision**: OTel vs. custom logging â†’ OTel for standardized, vendor-neutral tracing. Custom logging for application-specific metrics that don't fit span model.
- **Decision**: Auto-instrumentation vs. manual â†’ Auto-instrumentation of SDK calls (agents, tools, LLM calls). Manual for custom business logic spans.
- **Decision**: OTLP vs. provider-specific exporters â†’ OTLP for vendor neutrality. Provider-specific (Datadog, New Relic) for deeper integration with existing observability stack.

## Performance Considerations

- Span creation: negligible (<0.1ms)
- Attribute attachment: negligible
- Export overhead: batch export every 5s or 100 spans â€” no per-request network call
- Memory: spans held in buffer until export â€” configure buffer size appropriately
- Sampling: use head-based or tail-based sampling for high-volume apps

| Aspect | OTel Traces | Custom Filament Dashboard | Both |
|--------|-------------|--------------------------|------|
| Detail level | Per-span, per-trace | Aggregated metrics | Both levels |
| Debugging depth | Deep (full trace) | Shallow (aggregate) | Both |
| Setup complexity | High (OTel collector) | Low (package install) | Highest |
| Storage | External (OTel backend) | Application DB | Both |
| Cost | External service cost | Free (app DB) | Both |

## Security Considerations

- Configure sampling rate â€” 100% for staging, 5-10% for production high-volume
- Never attach sensitive data (PII, API keys) to span attributes
- Set up OTel collector as sidecar or gateway â€” don't export directly from PHP workers
- Monitor OTel exporter errors â€” failed exports lose trace data silently
- Correlate traces with application logs â€” trace ID in log context
- Plan for storage costs â€” OTel backends charge per data ingested
- Implement tail-based sampling for error traces â€” capture 100% of error traces, sample successful ones

## Common Mistakes

- No sampling â€” OTel backend costs explode at production scale
- Attaching PII to spans â€” sensitive data in observability tool (compliance risk)
- Not correlating with HTTP request traces â€” can't trace from user click to AI response
- Synchronous export â€” blocking PHP worker during span export
- Over-instrumentation â€” creating too many spans (per-token spans) â€” noise over signal
- Not testing OTel setup before production â€” discovered during outage with no traces

## Anti-Patterns

- **Exporter failure**: OTel collector down â€” spans queued in buffer, eventually dropped if buffer overflows
- **Sampling bias**: Tail-based sampling misses relevant traces â€” tune sampling rules
- **Attribute explosion**: High-cardinality attributes (user IDs, conversation IDs) â€” index performance degradation in OTel backend
- **Span leak**: Long-running agent creates spans that aren't closed â€” unclosed spans accumulate in memory
- **Context propagation failure**: AI spans detached from HTTP trace â€” can't correlate

## Examples

The following ecosystem packages provide reference implementations:

- `open-telemetry/opentelemetry-auto-laravel`: Auto-instrumentation for Laravel
- OTel Collector: vendor-agnostic trace collection and routing
- Grafana Tempo: OTel-native trace storage and visualization
- Datadog, New Relic, Honeycomb: commercial OTel backends
- OpenLLMetry: OpenTelemetry-based instrumentation for LLM applications (community project)

## Related Topics

- KU-040: Token Tracking & Cost Estimation
- KU-043: Filament Observability Dashboards

## AI Agent Notes

- When asked about OpenTelemetry for AI Traces, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

