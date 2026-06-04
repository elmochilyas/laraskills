---
id: ku-05
title: "Provider Abstraction Layer - Rules"
subdomain: "ai-middleware-gateway"
ku-type: "architecture"
date-created: "2026-06-02"
---

## Rules for Provider Abstraction Layer

### R1: Always implement streaming via provider-agnostic SSE events, not provider-specific event types
- **Category:** Architecture
- **Rule:** Normalize all streaming responses into a standard SSE event format (event, data, id) regardless of the source provider; never pass through provider-specific event names or formats to consumers.
- **Reason:** Providers use different streaming formats (OpenAI's chunk deltas, Anthropic's content blocks, Google's server-sent events). Consumers should not know or care which provider generated the response.
- **Bad Example:** Frontend code reading `response.choices[0].delta.content` directly from a streamed response.
- **Good Example:** The abstraction layer converts all responses to `new StreamEvent(type: 'token', data: $text)` and consumers read `event.data`.
- **Exceptions:** Provider-specific features (function calling, tool use) that have no standard equivalent.
- **Consequences of Violation:** Provider swaps require frontend code changes; abstractions leak provider-specific details throughout the application.

### R2: Implement a type-safe provider capability registry to prevent unsupported operation calls
- **Category:** Reliability
- **Rule:** Register each provider's supported capabilities (streaming, function calling, vision, json mode, parallel tools) in a typed registry and check before dispatching; never assume all providers support the same features.
- **Reason:** Calling an unsupported operation on a provider (e.g., `json_mode` on a provider that doesn't support it) causes runtime errors that are hard to diagnose.
- **Bad Example:** Sending `response_format: { type: 'json_object' }` to a provider that only started supporting JSON mode in a later model version — old or alternative models fail.
- **Good Example:** `$capabilities->supports('json_mode')` check before setting `response_format`; fallback to string parsing if not supported.
- **Exceptions:** When using a single provider exclusively with full knowledge of its capabilities.
- **Consequences of Violation:** Runtime provider errors, failed requests, wasted tokens on requests that return errors, and confusing error messages for users.

### R3: Implement a common TelemetryInterface that every provider driver must implement
- **Category:** Observability
- **Rule:** Define and implement a `TelemetryInterface` (report token count, latency, model, error) in every provider driver; never rely on provider-specific telemetry collection.
- **Reason:** Cross-provider cost analysis, latency comparison, and error rate tracking require consistent telemetry data. Provider-specific telemetry formats make aggregation impossible.
- **Bad Example:** OpenAI driver records tokens via `$this->client->usage->totalTokens` while Anthropic driver uses `$response->usage->input_tokens + $response->usage->output_tokens`.
- **Good Example:** Both drivers implement `ProviderTelemetry` returning a uniform `UsageMetrics` object: `{inputTokens, outputTokens, latencyMs, model, provider, timestamp}`.
- **Exceptions:** Test or mock drivers that don't make real API calls.
- **Consequences of Violation:** Inconsistent cost tracking, inability to compare provider performance, and gaps in observability that lead to undetected regressions.
