# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** ku-06
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Abstract tool schemas at the application layer.
- [ ] Handle parallel tool calls uniformly.
- [ ] Normalize finish reasons.
- [ ] Support tool choice mapping.
- [ ] Test tool calling per provider.
- [ ] Parallel tool calls are handled (returned as array, even if provider returns one at a time).
- [ ] Provider-specific tool calling limits are documented and validated.
- [ ] Streaming with tools is supported (tool call deltas accumulated from stream chunks).
- [ ] Always Return Tool Calls as Uniform Array
- [ ] Cache Translated Tool Schemas
- [ ] Handle Tool Choice Mapping Per Provider
- [ ] Normalize Tool Schemas into Provider-Agnostic Format
- [ ] Stream Tool Calls by Accumulating Deltas
- [ ] Streaming tool call deltas accumulated before processing
- [ ] Tool calls returned as uniform `ToolCall` array
- [ ] Tool choice semantics mapped per provider (auto, required, none)
- [ ] Accumulate tool call deltas from streaming responses (don't process partial arguments)
- [ ] Cache translated tool schemas per provider
- [ ] Define tools using a provider-agnostic schema format
- [ ] Streaming tool calls accumulate correctly without partial argument errors

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Abstract tool schemas at the application layer.
- [ ] Handle parallel tool calls uniformly.
- [ ] Normalize finish reasons.
- [ ] Support tool choice mapping.
- [ ] Test tool calling per provider.
- [ ] Accumulate tool call deltas from streaming responses (don't process partial arguments)
- [ ] Cache translated tool schemas per provider
- [ ] Define tools using a provider-agnostic schema format
- [ ] Implement tool call ID tracking for correlating results to calls
- [ ] Map tool choice semantics to each provider's equivalent values
- [ ] Return tool calls as a uniform array of `ToolCall` objects regardless of provider format
- [ ] Translate to provider-specific formats in adapter/translator layers

---

# Performance Checklist

- [ ] Parallel tool call execution: the adapter should not wait for tool execution â€” it returns the calls, and the application layer executes them.
- [ ] Schema translation adds 0.1-0.5ms per tool. Cache translated schemas where possible.
- [ ] Schema translation caching: tool schemas rarely change within a session. Cache the translated version per provider.
- [ ] Streaming with tools: tool call deltas may be interleaved with content deltas. Accumulate tool calls from the full stream.
- [ ] Tool call ID generation: use UUIDs (fast, unique). Avoid sequential IDs that could collide across parallel calls.
- [ ] Cache translated tool schemas to avoid per-request reprocessing

---

# Security Checklist

- [ ] Provider-specific limits:
- [ ] Tool call replay:
- [ ] Tool call validation:
- [ ] Tool result size:
- [ ] Tool schema validation:
- [ ] Validate and limit tool result size before returning to LLM (context-window protection)

---

# Reliability Checklist

- [ ] Assuming all providers use the same tool schema format â€” they don't. OpenAI uses JSON Schema; Anthropic uses a different structure.
- [ ] Forgetting that tool results need special format handling â€” not all providers use `role: 'tool'`.
- [ ] Ignoring parallel tool call limits â€” some providers only support one tool call per response.
- [ ] Not handling the case where a provider returns zero tool calls (model chose not to call any tool).
- [ ] Not mapping tool choice correctly â€” `tool_choice: 'auto'` in OpenAI is different from `tool_choice: 'any'` in Anthropic.
- [ ] Context-window overflow
- [ ] Corrupted tool arguments in stream
- [ ] Different tool call formats
- [ ] Provider lock-in from tool schemas
- [ ] Slow requests from translation

---

# Testing Checklist

- [ ] Parallel tool calls are handled (returned as array, even if provider returns one at a time).
- [ ] Provider-specific tool calling limits are documented and validated.
- [ ] Streaming tool call deltas accumulated before processing
- [ ] Streaming tool calls accumulate correctly without partial argument errors
- [ ] Streaming with tools is supported (tool call deltas accumulated from stream chunks).
- [ ] Tool call IDs are unique and usable for result correlation.
- [ ] Tool calls returned as uniform `ToolCall` array
- [ ] Tool choice (`auto`, `required`, `none`) maps correctly per provider.
- [ ] Tool choice semantics mapped per provider (auto, required, none)
- [ ] Tool choice semantics work correctly across all supported providers

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Forgetting the Promptable Trait â€” No prompt() Method Available]
- [ ] [Dynamic Runtime Configuration via Method Overrides Instead of Attributes]
- [ ] [Stateless Agent as Transient â€” Repeated Resolution Overhead]
- [ ] [Constructor Injection for Secrets Instead of Config]
- [ ] [Not Registering Agents in Service Container]
- [ ] Global Tool Registry:
- [ ] Ignoring Streaming Tool Calls:
- [ ] One-to-One Schema Copy:
- [ ] Tool Choice Hardcoding:
- [ ] Tool Result Dumping:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


