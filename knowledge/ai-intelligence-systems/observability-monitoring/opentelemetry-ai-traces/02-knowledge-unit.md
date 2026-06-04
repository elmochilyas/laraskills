# Knowledge Unit: OpenTelemetry for AI Traces

## Metadata

- **ID:** KU-044
- **Subdomain:** Cost Management & Observability
- **Slug:** opentelemetry-ai-traces
- **Version:** 1.0.0
- **Maturity:** Emerging
- **Status:** Published

## Executive Summary

OpenTelemetry (OTel) provides distributed tracing for AI applications, capturing the full lifecycle of an AI request: user→agent→tool→LLM→response. OTel's GenAI Semantic Conventions standardize how AI spans are named and tagged. Laravel AI applications can instrument agent execution as OTel spans, enabling trace visualization in tools like Grafana, Jaeger, or Datadog.

## Core Concepts

- **Span**: Unit of work — one AI call, one tool execution, one agent step
- **Trace**: Tree of spans representing the full request lifecycle
- **GenAI semantic conventions**: OTel standard for naming AI spans (gen_ai.request, gen_ai.tool_call)
- **Attributes**: Model name, provider, token count, latency, user ID — attached to spans
- **Events**: Annotations within spans (e.g., "tool call started", "response received")
- **Exporters**: Send spans to observability backends (OTLP, Zipkin, Prometheus)
- **Context propagation**: Link AI spans to HTTP request spans for end-to-end tracing

## Mental Models

- **X-ray for AI**: Like AWS X-Ray traces — see every step of an AI request, its duration, and errors. Trace from user's HTTP request through agent → tools → LLM calls.
- **DDTrace for GenAI**: Like Datadog APM for AI — automatic instrumentation of AI SDK calls, with custom span creation for business logic.

## Internal Mechanics

OTel instrumentation in Laravel AI:
1. Install OpenTelemetry PHP SDK + Laravel integration
2. Create a tracer provider and span processor
3. Wrap agent execution in a root span (`gen_ai.request`)
4. Create child spans for each: tool call (`gen_ai.tool_call`), LLM API request (`gen_ai.completion`)
5. Attach attributes: model name, provider, input_tokens, output_tokens, latency_ms
6. Export spans via OTLP exporter to configured backend
7. Correlate with HTTP request trace via context propagation headers

Laravel OTel packages (`open-telemetry/opentelemetry-auto-laravel`) provide automatic instrumentation for controllers, queues, HTTP clients — adding AI SDK spans extends this.

## Patterns

- **Automatic instrumentation**: Hook into agent lifecycle events to create spans without modifying agent code
- **Correlated tracing**: Attach user_id and conversation_id to all spans for cross-reference
- **Error spans**: Record failed AI calls as error spans with exception details
- **Cost in span attributes**: Attach estimated cost to each span — aggregate cost per trace in observability tool
- **Tool timeout detection**: Set span deadlines — alert if tool execution exceeds threshold

## Architectural Decisions

- **Decision**: OTel vs. custom logging → OTel for standardized, vendor-neutral tracing. Custom logging for application-specific metrics that don't fit span model.
- **Decision**: Auto-instrumentation vs. manual → Auto-instrumentation of SDK calls (agents, tools, LLM calls). Manual for custom business logic spans.
- **Decision**: OTLP vs. provider-specific exporters → OTLP for vendor neutrality. Provider-specific (Datadog, New Relic) for deeper integration with existing observability stack.

## Tradeoffs

| Aspect | OTel Traces | Custom Filament Dashboard | Both |
|--------|-------------|--------------------------|------|
| Detail level | Per-span, per-trace | Aggregated metrics | Both levels |
| Debugging depth | Deep (full trace) | Shallow (aggregate) | Both |
| Setup complexity | High (OTel collector) | Low (package install) | Highest |
| Storage | External (OTel backend) | Application DB | Both |
| Cost | External service cost | Free (app DB) | Both |

## Performance Considerations

- Span creation: negligible (<0.1ms)
- Attribute attachment: negligible
- Export overhead: batch export every 5s or 100 spans — no per-request network call
- Memory: spans held in buffer until export — configure buffer size appropriately
- Sampling: use head-based or tail-based sampling for high-volume apps

## Production Considerations

- Configure sampling rate — 100% for staging, 5-10% for production high-volume
- Never attach sensitive data (PII, API keys) to span attributes
- Set up OTel collector as sidecar or gateway — don't export directly from PHP workers
- Monitor OTel exporter errors — failed exports lose trace data silently
- Correlate traces with application logs — trace ID in log context
- Plan for storage costs — OTel backends charge per data ingested
- Implement tail-based sampling for error traces — capture 100% of error traces, sample successful ones

## Common Mistakes

- No sampling — OTel backend costs explode at production scale
- Attaching PII to spans — sensitive data in observability tool (compliance risk)
- Not correlating with HTTP request traces — can't trace from user click to AI response
- Synchronous export — blocking PHP worker during span export
- Over-instrumentation — creating too many spans (per-token spans) — noise over signal
- Not testing OTel setup before production — discovered during outage with no traces

## Failure Modes

- **Exporter failure**: OTel collector down — spans queued in buffer, eventually dropped if buffer overflows
- **Sampling bias**: Tail-based sampling misses relevant traces — tune sampling rules
- **Attribute explosion**: High-cardinality attributes (user IDs, conversation IDs) — index performance degradation in OTel backend
- **Span leak**: Long-running agent creates spans that aren't closed — unclosed spans accumulate in memory
- **Context propagation failure**: AI spans detached from HTTP trace — can't correlate

## Ecosystem Usage

- `open-telemetry/opentelemetry-auto-laravel`: Auto-instrumentation for Laravel
- OTel Collector: vendor-agnostic trace collection and routing
- Grafana Tempo: OTel-native trace storage and visualization
- Datadog, New Relic, Honeycomb: commercial OTel backends
- OpenLLMetry: OpenTelemetry-based instrumentation for LLM applications (community project)

## Related Knowledge Units

- KU-040: Token Tracking & Cost Estimation
- KU-043: Filament Observability Dashboards

## Research Notes

- OTel GenAI semantic conventions are in experimental status — may change
- No dedicated OTel auto-instrumentation for Laravel AI SDK exists — requires manual instrumentation
- OpenLLMetry (Python) is the reference implementation for LLM OTel tracing
- OTel for AI is emerging in PHP — most production Laravel AI apps use custom logging + Filament dashboards instead
- OTel collector is recommended as sidecar — not direct export from PHP workers
