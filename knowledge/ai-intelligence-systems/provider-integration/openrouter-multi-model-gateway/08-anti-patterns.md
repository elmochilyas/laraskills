# ECC Anti-Patterns — OpenRouter Multi-Model Gateway

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | LLM Provider Abstraction & Integration |
| **Knowledge Unit** | OpenRouter Multi-Model Gateway |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Bypassing OpenRouter for Direct Provider Calls
2. Not Using OpenRouter for Provider Failover
3. Ignoring OpenRouter-Specific Response Metadata
4. Hardcoding OpenRouter Model Names Without Fallback Routing
5. Not Validating OpenRouter Response Provider Consistency

---

## Repository-Wide Anti-Patterns

- Assuming OpenRouter has the same API shape as a single provider
- Not caching OpenRouter model availability

---

## Anti-Pattern 1: Bypassing OpenRouter for Direct Provider Calls

### Category
Architecture

### Description
Calling providers directly instead of routing through OpenRouter — losing failover, load balancing, and unified billing.

### Why It Happens
Developers use provider-specific SDKs alongside OpenRouter, creating ad-hoc routing that bypasses gateway features.

### Warning Signs
- Direct API calls to OpenAI in some code paths, OpenRouter in others
- Duplicate API key management
- No unified failover

### Why It Is Harmful
Direct calls bypass OpenRouter's built-in failover, load balancing, and cost tracking. When the directly-called provider fails, the gateway cannot redirect to an alternative. The application ends up managing multiple provider connections, API keys, and error handling strategies, duplicating what OpenRouter provides as a single endpoint.

### Preferred Alternative
Route all provider traffic through OpenRouter. Use direct provider calls only when OpenRouter doesn't support a specific provider feature.

### Detection Checklist
- [ ] Direct provider calls alongside OpenRouter
- [ ] Duplicate provider key management
- [ ] No failover through gateway

### Related Rules
Route All Provider Traffic Through OpenRouter (05-rules.md)

---

## Anti-Pattern 2: Not Using OpenRouter for Provider Failover

### Category
Reliability

### Description
Configuring a single model in OpenRouter instead of a fallback model list — defeats OpenRouter's failover capability.

### Preferred Alternative
Configure an ordered model list in OpenRouter. It automatically falls back when the primary model is rate-limited or down.

### Detection Checklist
- [ ] Single model configured
- [ ] Manual failover logic
- [ ] OpenRouter failover feature unused

---

## Anti-Pattern 3: Ignoring OpenRouter-Specific Response Metadata

### Category
Observability

### Description
Discarding OpenRouter's response metadata (which provider served the request, cost, latency) — losing cost tracking and provider insights.

### Preferred Alternative
Capture and log OpenRouter metadata. Use it for cost allocation, performance monitoring, and provider selection tuning.

### Detection Checklist
- [ ] OpenRouter metadata discarded
- [ ] No cost tracking per provider
- [ ] No visibility into which provider served each request

---

## Anti-Pattern 4: Hardcoding OpenRouter Model Names Without Fallback Routing

### Category
Maintainability

### Description
Model names hardcoded in application code instead of configured in environment or OpenRouter's model routing.

### Preferred Alternative
Use OpenRouter's model routing aliases or configure model names in environment configuration.

### Detection Checklist
- [ ] Model name strings in application code
- [ ] Model change requires code deployment

---

## Anti-Pattern 5: Not Validating OpenRouter Response Provider Consistency

### Category
Reliability

### Description
Assuming the same model over OpenRouter always routes to the same underlying provider.

### Preferred Alternative
Check OpenRouter response metadata for the actual serving provider. Validate capability expectations match.

### Detection Checklist
- [ ] Unexpected provider for requested model
- [ ] Capability mismatch for served model
- [ ] Provider consistency not validated
